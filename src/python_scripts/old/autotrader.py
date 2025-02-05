import time
from datetime import datetime, timedelta, time as dtime
import math
import yfinance as yf
import torch
import torch.nn as nn
import torch.optim as optim
import pytz
import numpy as np

#######################################
# Hyperparameters (easy to edit)
#######################################
# Data and forecasting parameters
WINDOW_SIZE = 10                 # Number of recent price points used as raw input
FORECAST_HORIZON = 5             # Number of future steps to forecast
LEARNING_RATE = 0.001            # Optimizer learning rate
HIDDEN_SIZE = 50                 # Number of neurons in the LSTM’s hidden layer
LSTM_NUM_LAYERS = 1              # Number of LSTM layers

# Live trading parameters
POLLING_INTERVAL = 30            # Seconds between polling cycles

# Trading decision thresholds:
ENTRY_THRESHOLD = 0.005          # For entry: forecasted return must be at least 0.5%
EXIT_THRESHOLD = -0.001          # For exit: forecasted return must fall to -0.1% or lower
STOP_LOSS_PERCENT = 0.10         # Force exit if current price falls 10% below buy price

# Trade frequency control
TRADE_COOLDOWN = 10             # Seconds to wait after a trade before the next one can occur

# Sell trade limits (discretionary sell trades)
SELL_LIMIT_COUNT = 3000             # Maximum discretionary sell trades allowed in a 5-day window

# Pretraining parameters (historical data)
PRETRAIN_PERIOD = '60d'          # Historical period to fetch data for pretraining
PRETRAIN_INTERVAL = '5m'         # Interval for historical data (5-minute intervals)
PRETRAIN_EPOCHS = 5              # Number of epochs for pretraining

# Technical indicator parameters:
TECH_INDICATOR_COUNT = 5         # We'll compute 5 indicators: RSI, MACD, EMA_short, EMA_medium, EMA_long
#######################################

### Technical Indicator Helper Functions ###

def compute_EMA(prices, period):
    """Computes the Exponential Moving Average (EMA) for a list of prices."""
    if not prices:
        return 0
    alpha = 2 / (period + 1)
    ema = prices[0]
    for p in prices[1:]:
        ema = alpha * p + (1 - alpha) * ema
    return ema

def compute_RSI(prices):
    """Computes the Relative Strength Index (RSI) for a list of prices."""
    if len(prices) < 2:
        return 50
    gains = []
    losses = []
    for i in range(1, len(prices)):
        diff = prices[i] - prices[i-1]
        if diff > 0:
            gains.append(diff)
        else:
            losses.append(abs(diff))
    if not gains:
        return 0
    if not losses:
        return 100
    avg_gain = sum(gains) / len(gains)
    avg_loss = sum(losses) / len(losses)
    if avg_loss == 0:
        return 100
    rs = avg_gain / avg_loss
    rsi = 100 - 100 / (1 + rs)
    return rsi

def compute_MACD(prices):
    """Computes MACD as EMA(12) - EMA(26)."""
    ema12 = compute_EMA(prices, 12)
    ema26 = compute_EMA(prices, 26)
    return ema12 - ema26

def get_technical_indicators(window):
    """
    Given a list of prices (the window), returns a list of 5 features:
    [RSI, MACD, EMA_short (period 10), EMA_medium (period 20), EMA_long (period 50)].
    """
    rsi = compute_RSI(window)
    macd = compute_MACD(window)
    ema_short = compute_EMA(window, 10)
    ema_medium = compute_EMA(window, 20)
    ema_long = compute_EMA(window, 50)
    return [rsi, macd, ema_short, ema_medium, ema_long]

### Market Hours Helper Functions ###

def market_is_open():
    """
    Determines whether the US stock market is currently open.
    Assumes market hours Monday–Friday, 9:30–16:00 US/Eastern.
    """
    eastern = pytz.timezone("US/Eastern")
    now_et = datetime.now(eastern)
    if now_et.weekday() >= 5:
        return False
    market_open = dtime(9, 30)
    market_close = dtime(16, 0)
    return market_open <= now_et.time() < market_close

def sleep_until_market_open():
    """
    Computes the exact time until the next market open and sleeps for that duration.
    """
    eastern = pytz.timezone("US/Eastern")
    now_et = datetime.now(eastern)
    if now_et.weekday() >= 5:
        days_until_monday = 7 - now_et.weekday()
        next_open_date = now_et + timedelta(days=days_until_monday)
        next_open = eastern.localize(datetime.combine(next_open_date.date(), dtime(9, 30)))
    else:
        market_open = eastern.localize(datetime.combine(now_et.date(), dtime(9, 30)))
        market_close = eastern.localize(datetime.combine(now_et.date(), dtime(16, 0)))
        if now_et < market_open:
            next_open = market_open
        elif now_et >= market_close:
            next_day = now_et + timedelta(days=1)
            while next_day.weekday() >= 5:
                next_day += timedelta(days=1)
            next_open = eastern.localize(datetime.combine(next_day.date(), dtime(9, 30)))
        else:
            next_open = now_et  # Market is open (should not occur here)
    sleep_seconds = (next_open - now_et).total_seconds()
    print(f"[{datetime.now()}] Market is closed. Sleeping for {sleep_seconds/60:.2f} minutes until market opens at {next_open.astimezone(pytz.utc)} UTC.")
    time.sleep(max(sleep_seconds, 0))

### LSTM-Based Neural Network Model ###

class TradingLSTM(nn.Module):
    def __init__(self, hidden_size, forecast_horizon, num_layers=1):
        """
        LSTM-based model that takes a sequence of raw prices and, together with technical indicators,
        outputs a forecast vector of future returns.
        - The LSTM processes the raw price sequence (each price as a one-dimensional feature).
        - Technical indicators (5 features) are computed from the entire window and concatenated with the last hidden state.
        - A fully connected layer then produces the forecast vector.
        :param hidden_size: Hidden layer size of the LSTM.
        :param forecast_horizon: Length of forecast vector.
        :param num_layers: Number of LSTM layers.
        """
        super(TradingLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size=1, hidden_size=hidden_size, num_layers=num_layers, batch_first=True)
        tech_indicator_size = TECH_INDICATOR_COUNT  # We have 5 technical indicators.
        self.fc = nn.Linear(hidden_size + tech_indicator_size, forecast_horizon)
    
    def forward(self, price_sequence, tech_indicators):
        """
        :param price_sequence: Tensor of shape (batch_size, seq_len, 1)
        :param tech_indicators: Tensor of shape (batch_size, 5)
        :return: Forecast vector of shape (batch_size, forecast_horizon)
        """
        lstm_out, _ = self.lstm(price_sequence)      # lstm_out shape: (batch_size, seq_len, hidden_size)
        last_hidden = lstm_out[:, -1, :]               # shape: (batch_size, hidden_size)
        combined = torch.cat((last_hidden, tech_indicators), dim=1)  # shape: (batch_size, hidden_size+5)
        forecast = self.fc(combined)                   # shape: (batch_size, forecast_horizon)
        return forecast

### AutoTrader Class with LSTM Integration and Technical Indicators ###

class AutoTrader:
    def __init__(self, ticker, initial_balance):
        """
        :param ticker: Stock ticker symbol (string)
        :param initial_balance: Starting cash balance (float)
        """
        self.ticker = ticker
        self.initial_balance = initial_balance
        self.balance = initial_balance  # Available cash
        self.position = None            # If in a trade, a dict: {"shares": int, "buy_price": float}
        self.sell_timestamps = []       # List of datetime objects for discretionary sells
        
        # Data window for online training & prediction (raw prices only).
        self.data_window = []           # Will store WINDOW_SIZE raw prices.
        self.window_size = WINDOW_SIZE
        
        self.forecast_horizon = FORECAST_HORIZON
        
        # Trading thresholds.
        self.entry_threshold = ENTRY_THRESHOLD
        self.exit_threshold = EXIT_THRESHOLD
        self.stop_loss_percent = STOP_LOSS_PERCENT
        self.polling_interval = POLLING_INTERVAL
        
        # Trade control.
        self.trade_cooldown = TRADE_COOLDOWN
        self.last_trade_time = None
        
        # Sell trade limit.
        self.sell_limit_count = SELL_LIMIT_COUNT
        
        # Initialize the LSTM model.
        self.model = TradingLSTM(hidden_size=HIDDEN_SIZE, forecast_horizon=self.forecast_horizon, num_layers=LSTM_NUM_LAYERS)
        self.optimizer = optim.Adam(self.model.parameters(), lr=LEARNING_RATE)
        self.criterion = nn.MSELoss()
    
    def fetch_data(self):
        """
        Fetches the latest available price using yfinance.
        """
        ticker_obj = yf.Ticker(self.ticker)
        data = ticker_obj.history(period="1d", interval="1m")
        if not data.empty:
            price = data['Close'].iloc[-1]
            return float(price)
        else:
            raise Exception("No data returned for ticker.")
    
    def update_data_window(self, price):
        """
        Appends the latest price to the data window (maintaining a fixed length).
        """
        self.data_window.append(price)
        if len(self.data_window) > self.window_size:
            self.data_window.pop(0)
        return len(self.data_window) == self.window_size
    
    def train_model(self, price_sequence, tech_indicators, target_vector, verbose=False):
        """
        Performs one training step.
        :param price_sequence: List of raw prices (length = WINDOW_SIZE). Will be converted to tensor shape (1, WINDOW_SIZE, 1).
        :param tech_indicators: List of 5 technical indicator values.
        :param target_vector: List of length forecast_horizon (target future returns).
        """
        self.model.train()
        price_tensor = torch.FloatTensor(price_sequence).unsqueeze(0).unsqueeze(-1)  # Shape: (1, WINDOW_SIZE, 1)
        tech_tensor = torch.FloatTensor(tech_indicators).unsqueeze(0)                 # Shape: (1, 5)
        target_tensor = torch.FloatTensor(target_vector).unsqueeze(0)                 # Shape: (1, forecast_horizon)
        prediction = self.model(price_tensor, tech_tensor)
        loss = self.criterion(prediction, target_tensor)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        if verbose:
            print(f"[{datetime.now()}] Training loss: {loss.item():.6f}")
        return loss.item()
    
    def pretrain_model(self):
        """
        Pretrains the LSTM network on historical data.
        For each sample:
          - Input: raw price window (of length WINDOW_SIZE) and technical indicators computed from that window.
          - Target: forecast vector of future returns over FORECAST_HORIZON steps.
        """
        ticker_obj = yf.Ticker(self.ticker)
        data = ticker_obj.history(period=PRETRAIN_PERIOD, interval=PRETRAIN_INTERVAL)
        if data.empty:
            raise Exception("No historical data returned for pretraining.")
        prices = data['Close'].tolist()
        print(f"[{datetime.now()}] Pretraining on {len(prices)} data points for ticker {self.ticker}.")
        
        dataset = []
        # Ensure we have enough data: WINDOW_SIZE + FORECAST_HORIZON steps.
        for i in range(len(prices) - self.window_size - self.forecast_horizon + 1):
            window = prices[i : i + self.window_size]
            base_price = window[-1]
            target_vector = []
            for j in range(1, self.forecast_horizon + 1):
                future_price = prices[i + self.window_size + j - 1]
                ret = (future_price - base_price) / base_price
                target_vector.append(ret)
            tech = get_technical_indicators(window)
            dataset.append((window, tech, target_vector))
        if not dataset:
            print(f"[{datetime.now()}] Not enough historical data to pretrain.")
            return
        
        for epoch in range(PRETRAIN_EPOCHS):
            total_loss = 0.0
            for window, tech, target_vector in dataset:
                loss = self.train_model(window, tech, target_vector, verbose=False)
                total_loss += loss
            avg_loss = total_loss / len(dataset)
            print(f"[{datetime.now()}] Pretraining epoch {epoch+1}/{PRETRAIN_EPOCHS}, average loss: {avg_loss:.6f}")
        
        # Initialize the live trading window with the most recent WINDOW_SIZE prices.
        self.data_window = prices[-self.window_size:]
        print(f"[{datetime.now()}] Pretraining complete. Data window initialized.")
    
    def predict_forecast(self):
        """
        Uses the current data window to predict a forecast vector.
        Constructs the input from the raw prices and technical indicators.
        Returns a list of length FORECAST_HORIZON.
        """
        if len(self.data_window) < self.window_size:
            raise Exception("Insufficient data in window for prediction.")
        price_tensor = torch.FloatTensor(self.data_window).unsqueeze(0).unsqueeze(-1)  # (1, WINDOW_SIZE, 1)
        tech = get_technical_indicators(self.data_window)
        tech_tensor = torch.FloatTensor(tech).unsqueeze(0)  # (1, 5)
        self.model.eval()
        with torch.no_grad():
            forecast = self.model(price_tensor, tech_tensor).squeeze().tolist()
        if isinstance(forecast, float):
            forecast = [forecast]
        return forecast
    
    def can_sell(self):
        """
        Checks whether a discretionary sell is allowed (i.e. fewer than SELL_LIMIT_COUNT in the past 5 days).
        """
        now = datetime.now()
        recent_sells = [t for t in self.sell_timestamps if (now - t) < timedelta(days=5)]
        return len(recent_sells) < self.sell_limit_count
    
    def execute_trade(self, action, current_price, forced=False):
        """
        Executes a trade.
        :param action: "buy" or "sell"
        :param current_price: Price at which to trade.
        :param forced: If True (e.g., stop loss), bypass exit restrictions.
        """
        if action == "buy":
            shares = math.floor(self.balance / current_price)
            if shares <= 0:
                print(f"[{datetime.now()}] Insufficient funds to buy at {current_price:.2f}.")
                return
            cost = shares * current_price
            self.balance -= cost
            self.position = {"shares": shares, "buy_price": current_price}
            print(f"[{datetime.now()}] BUY: Bought {shares} shares at {current_price:.2f} (Cost: {cost:.2f}). New balance: {self.balance:.2f}")
        elif action == "sell":
            if self.position is None:
                print(f"[{datetime.now()}] No position to sell.")
                return
            if not forced and not self.can_sell():
                print(f"[{datetime.now()}] Sell limit reached for the 5-day period. Holding position.")
                return
            shares = self.position["shares"]
            proceeds = shares * current_price
            self.balance += proceeds
            buy_price = self.position["buy_price"]
            profit = proceeds - (shares * buy_price)
            print(f"[{datetime.now()}] SELL: Sold {shares} shares at {current_price:.2f} (Proceeds: {proceeds:.2f}). Profit: {profit:.2f}. New balance: {self.balance:.2f}")
            self.position = None
            if not forced:
                self.sell_timestamps.append(datetime.now())
    
    def start(self):
        """
        Main execution loop:
          1. Pretrain the LSTM network on historical data.
          2. While the market is open, each cycle:
             - Update the data window with the latest price.
             - Construct the augmented input (raw prices + technical indicators) and obtain the forecast vector.
             - If not in a trade, determine if the best forecasted return is "now" (index 0) and exceeds the entry threshold.
               • If yes (and trade cooldown has elapsed), execute a BUY trade.
               • Otherwise, report that the optimal entry is in the future and wait.
             - If in a trade, first check for a stop loss (if current price falls 10% below buy price) and force an exit if so.
               Otherwise, scan the forecast vector for the first time step where the forecast falls below the exit threshold.
               • If that occurs at index 0 (and trade cooldown and sell limits allow), execute a SELL trade.
               • Otherwise, report that the optimal exit is in the future and hold.
             - Perform online training using the observed return between the last two prices (replicated over the forecast horizon).
        """
        print(f"Starting AutoTrader for {self.ticker} with initial balance: {self.balance:.2f}")
        print("Beginning pretraining...")
        try:
            self.pretrain_model()
        except Exception as e:
            print(f"[{datetime.now()}] Pretraining failed: {e}")
            return
        
        while True:
            try:
                if not market_is_open():
                    sleep_until_market_open()
                    continue
                
                now = datetime.now()
                current_price = self.fetch_data()
                print(f"[{now}] Current price for {self.ticker}: {current_price:.2f}")
                
                if not self.update_data_window(current_price):
                    print(f"[{now}] Building data window... {len(self.data_window)}/{self.window_size}")
                    time.sleep(self.polling_interval)
                    continue
                
                forecast_vector = self.predict_forecast()
                print(f"[{now}] Forecast vector (next {self.forecast_horizon} steps): {forecast_vector}")
                
                cooldown_elapsed = (self.last_trade_time is None or (now - self.last_trade_time).total_seconds() >= self.trade_cooldown)
                
                if self.position is None:
                    # Not in a trade: Look for optimal entry.
                    best_index = int(np.argmax(forecast_vector))
                    best_value = forecast_vector[best_index]
                    print(f"[{now}] Best forecast entry: {best_value:.4f} at index {best_index} (0 = now).")
                    if best_value >= self.entry_threshold:
                        if best_index == 0 and cooldown_elapsed:
                            print(f"[{now}] Optimal entry is now. Executing BUY trade.")
                            self.execute_trade("buy", current_price)
                            self.last_trade_time = now
                        else:
                            wait_seconds = best_index * self.polling_interval
                            print(f"[{now}] Optimal entry predicted in ~{wait_seconds} seconds. Waiting...")
                    else:
                        print(f"[{now}] Entry signal not strong enough (max forecast {best_value:.4f} < threshold {self.entry_threshold}).")
                else:
                    # In a trade: Check for stop loss.
                    buy_price = self.position["buy_price"]
                    stop_loss_price = buy_price * (1 - self.stop_loss_percent)
                    if current_price <= stop_loss_price:
                        print(f"[{now}] STOP LOSS triggered: current price {current_price:.2f} <= {stop_loss_price:.2f}. Forcing SELL trade.")
                        self.execute_trade("sell", current_price, forced=True)
                        self.last_trade_time = now
                    else:
                        exit_index = None
                        for idx, value in enumerate(forecast_vector):
                            if value <= self.exit_threshold:
                                exit_index = idx
                                break
                        if exit_index is not None:
                            print(f"[{now}] Optimal exit forecast at index {exit_index} with value {forecast_vector[exit_index]:.4f}.")
                            if exit_index == 0 and cooldown_elapsed and self.can_sell():
                                print(f"[{now}] Optimal exit is now. Executing SELL trade.")
                                self.execute_trade("sell", current_price)
                                self.last_trade_time = now
                            else:
                                wait_seconds = exit_index * self.polling_interval
                                print(f"[{now}] Optimal exit predicted in ~{wait_seconds} seconds. Holding position.")
                        else:
                            print(f"[{now}] No clear exit signal in forecast. Holding position.")
                
                # Online training: use the observed return between the last two prices.
                if len(self.data_window) >= 2:
                    last_price = self.data_window[-2]
                    observed_return = (current_price - last_price) / last_price if last_price != 0 else 0
                    target_vector = [observed_return] * self.forecast_horizon
                    tech = get_technical_indicators(self.data_window)
                    self.train_model(self.data_window, tech, target_vector)
                
                time.sleep(self.polling_interval)
            except Exception as e:
                print(f"[{datetime.now()}] Error in main loop: {e}")
                time.sleep(self.polling_interval)

# Example usage:
if __name__ == '__main__':
    # For example, trading SPY with an initial balance of $10,000.
    trader = AutoTrader(ticker="SPY", initial_balance=10000.00)
    trader.start()
