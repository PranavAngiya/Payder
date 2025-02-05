# trader.py
"""
This module defines the AutoTrader class for live trading.
It pretrains a daily trade window predictor and two intraday predictors (for entry and exit).
It enforces a 5-day trading cycle with settlement delays using real market times (US/Eastern).
A background thread listens for the "stop" command for graceful shutdown.
"""

import time
import threading
import sys
import math
import numpy as np
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta, time as dtime
import pytz
import torch

from parameters import (HISTORICAL_PERIOD, HISTORICAL_INTERVAL, FEATURE_WINDOW_DAYS, TRADING_CYCLE_DAYS,
                        MAX_TRADES_PER_CYCLE, SETTLEMENT_DELAY_DAYS, MARKET_OPEN_TIME, MARKET_CLOSE_TIME,
                        TIMEZONE, TRADING_CHECK_INTERVAL, DAILY_ENTRY_THRESHOLD, DAILY_EXIT_THRESHOLD,
                        INTRADAY_INTERVAL, INTRADAY_CYCLE_HOURS, PRETRAIN_EPOCHS, LEARNING_RATE,
                        INTRADAY_PRETRAIN_EPOCHS, INTRADAY_LEARNING_RATE)
from data_preprocessing import fetch_daily_data, fetch_intraday_data
from feature_engineering import construct_daily_feature_vector, construct_intraday_feature_vector
from models import TradeWindowPredictor, IntradayEntryPredictor, IntradayExitPredictor

class AutoTrader:
    def __init__(self, ticker, initial_balance):
        self.ticker = ticker
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.position = None  # dict: {"shares", "buy_price", "entry_day"}
        self.settlement_available = True
        self.last_sale_day = None  # integer day index when a sale occurred
        self.predicted_trade_windows = []  # list of (entry_day, exit_day) tuples
        self.stop_signal = False
        self.current_cycle_day = 0  # index from 0 to TRADING_CYCLE_DAYS - 1

        # Daily model
        self.daily_model = TradeWindowPredictor()
        self.daily_optimizer = torch.optim.Adam(self.daily_model.parameters(), lr=LEARNING_RATE)
        self.daily_criterion = torch.nn.MSELoss()
        self.daily_pretrained = False

        # Intraday models
        self.intraday_entry_model = IntradayEntryPredictor()
        self.intraday_entry_optimizer = torch.optim.Adam(self.intraday_entry_model.parameters(), lr=INTRADAY_LEARNING_RATE)
        self.intraday_entry_criterion = torch.nn.MSELoss()
        self.intraday_entry_pretrained = False

        self.intraday_exit_model = IntradayExitPredictor()
        self.intraday_exit_optimizer = torch.optim.Adam(self.intraday_exit_model.parameters(), lr=INTRADAY_LEARNING_RATE)
        self.intraday_exit_criterion = torch.nn.MSELoss()
        self.intraday_exit_pretrained = False

        # Start background thread for stop command.
        self.input_thread = threading.Thread(target=self._listen_for_stop, daemon=True)
        self.input_thread.start()

    def _listen_for_stop(self):
        while True:
            if input().strip().lower() == "stop":
                print("Stop command received.")
                self.stop_signal = True
                break

    def pretrain_daily_model(self):
        print("Pretraining daily model...")
        data = fetch_daily_data(self.ticker)
        n = len(data)
        X, Y = [], []
        for i in range(n - FEATURE_WINDOW_DAYS + 1):
            cycle_data = data.iloc[i:i+FEATURE_WINDOW_DAYS]
            features = construct_daily_feature_vector(cycle_data)
            features = [float(x) for x in features]
            daily_returns = []
            for idx, row in cycle_data.iterrows():
                ret = float(row['Close'].iloc[0] - row['Open'].iloc[0]) / float(row['Open'].iloc[0])
                daily_returns.append(ret)
            candidates = [j for j, r in enumerate(daily_returns) if r > 0]
            filtered = []
            for j in candidates:
                entry_norm = j / FEATURE_WINDOW_DAYS
                exit_norm = (j + 1) / FEATURE_WINDOW_DAYS
                if entry_norm <= DAILY_ENTRY_THRESHOLD and exit_norm >= DAILY_EXIT_THRESHOLD:
                    filtered.append(j)
            candidates = sorted(filtered)[:MAX_TRADES_PER_CYCLE]
            target = []
            for j in candidates:
                entry_norm = j / FEATURE_WINDOW_DAYS
                exit_norm = (j + 1) / FEATURE_WINDOW_DAYS
                target.extend([entry_norm, exit_norm])
            while len(target) < MAX_TRADES_PER_CYCLE * 2:
                target.extend([0, 0])
            try:
                seq = np.tile(np.array(features, dtype=np.float32), (TRADING_CYCLE_DAYS, 1))
            except Exception as e:
                print("Error in tiling features:", features)
                raise e
            X.append(seq)
            Y.append(np.array(target, dtype=np.float32))
        if not X:
            print("Not enough data for daily pretraining.")
            return
        X = np.array(X, dtype=np.float32)
        Y = np.array(Y, dtype=np.float32)
        X_tensor = torch.from_numpy(X)
        Y_tensor = torch.from_numpy(Y)
        for epoch in range(PRETRAIN_EPOCHS):
            total_loss = 0.0
            for i in range(X_tensor.size(0)):
                inp = X_tensor[i].unsqueeze(0)
                target = Y_tensor[i].unsqueeze(0)
                self.daily_optimizer.zero_grad()
                output = self.daily_model(inp)
                loss = self.daily_criterion(output, target)
                loss.backward()
                self.daily_optimizer.step()
                total_loss += loss.item()
            avg_loss = total_loss / X_tensor.size(0)
            print(f"Daily pretraining epoch {epoch+1}/{PRETRAIN_EPOCHS}, Avg Loss: {avg_loss:.6f}")
        self.daily_pretrained = True
        print("Daily model pretraining complete.\n")
    
    def pretrain_intraday_entry_model(self):
        print("Pretraining intraday entry model...")
        data = fetch_intraday_data(self.ticker)
        grouped = data.groupby(data.index.date)
        X, Y = [], []
        for day, group in grouped:
            group = group.sort_index()
            if len(group) < INTRADAY_CYCLE_HOURS:
                continue
            prices = group['Close'].values
            best_idx = int(np.argmin(prices))
            target = best_idx / (INTRADAY_CYCLE_HOURS - 1)
            features = construct_intraday_feature_vector(group)
            features = [float(x) for x in features]
            # Debug: print one sample
            # print(f"Intraday entry sample for {day}: features = {features}, target = {target}")
            if np.isnan(np.array(features)).any() or np.std(features) == 0:
                continue
            X.append(features)
            Y.append([target])
        if not X:
            print("Not enough intraday data for entry pretraining.")
            return
        X = np.array(X, dtype=np.float32)
        Y = np.array(Y, dtype=np.float32)
        X_tensor = torch.from_numpy(X)
        Y_tensor = torch.from_numpy(Y)
        for epoch in range(INTRADAY_PRETRAIN_EPOCHS):
            total_loss = 0.0
            for i in range(X_tensor.size(0)):
                inp = X_tensor[i].unsqueeze(0)
                target = Y_tensor[i].unsqueeze(0)
                self.intraday_entry_optimizer.zero_grad()
                output = self.intraday_entry_model(inp)
                loss = self.intraday_entry_criterion(output, target)
                loss.backward()
                self.intraday_entry_optimizer.step()
                total_loss += loss.item()
            avg_loss = total_loss / X_tensor.size(0)
            print(f"Intraday Entry pretraining epoch {epoch+1}/{INTRADAY_PRETRAIN_EPOCHS}, Avg Loss: {avg_loss:.6f}")
        self.intraday_entry_pretrained = True
        print("Intraday Entry model pretraining complete.\n")
    
    def pretrain_intraday_exit_model(self):
        print("Pretraining intraday exit model...")
        data = fetch_intraday_data(self.ticker)
        grouped = data.groupby(data.index.date)
        X, Y = [], []
        for day, group in grouped:
            group = group.sort_index()
            if len(group) < INTRADAY_CYCLE_HOURS:
                continue
            open_price = group.iloc[0]['Open']
            profits = []
            for idx, row in group.iterrows():
                profit = (row['Close'] - open_price) / open_price
                profits.append(profit)
            best_idx = int(np.argmax(profits))
            target = best_idx / (INTRADAY_CYCLE_HOURS - 1)
            features = construct_intraday_feature_vector(group)
            features = [float(x) for x in features]
            if np.isnan(np.array(features)).any() or np.std(features) == 0:
                continue
            X.append(features)
            Y.append([target])
        if not X:
            print("Not enough intraday data for exit pretraining.")
            return
        X = np.array(X, dtype=np.float32)
        Y = np.array(Y, dtype=np.float32)
        X_tensor = torch.from_numpy(X)
        Y_tensor = torch.from_numpy(Y)
        for epoch in range(INTRADAY_PRETRAIN_EPOCHS):
            total_loss = 0.0
            for i in range(X_tensor.size(0)):
                inp = X_tensor[i].unsqueeze(0)
                target = Y_tensor[i].unsqueeze(0)
                self.intraday_exit_optimizer.zero_grad()
                output = self.intraday_exit_model(inp)
                loss = self.intraday_exit_criterion(output, target)
                loss.backward()
                self.intraday_exit_optimizer.step()
                total_loss += loss.item()
            avg_loss = total_loss / X_tensor.size(0)
            print(f"Intraday Exit pretraining epoch {epoch+1}/{INTRADAY_PRETRAIN_EPOCHS}, Avg Loss: {avg_loss:.6f}")
        self.intraday_exit_pretrained = True
        print("Intraday Exit model pretraining complete.\n")
    
    def _is_market_open(self, now):
        market_open = now.replace(hour=MARKET_OPEN_TIME.hour, minute=MARKET_OPEN_TIME.minute, second=0, microsecond=0)
        market_close = now.replace(hour=MARKET_CLOSE_TIME.hour, minute=MARKET_CLOSE_TIME.minute, second=0, microsecond=0)
        return market_open <= now < market_close
    
    def wait_until_market_open(self):
        eastern = TIMEZONE
        now = datetime.now(eastern)
        if now.time() < MARKET_OPEN_TIME:
            next_open = now.replace(hour=MARKET_OPEN_TIME.hour, minute=MARKET_OPEN_TIME.minute, second=0, microsecond=0)
        elif now.time() >= MARKET_CLOSE_TIME:
            next_day = now + timedelta(days=1)
            while next_day.weekday() >= 5:
                next_day += timedelta(days=1)
            next_open = next_day.replace(hour=MARKET_OPEN_TIME.hour, minute=MARKET_OPEN_TIME.minute, second=0, microsecond=0)
        else:
            return
        sleep_seconds = (next_open - now).total_seconds()
        print(f"[{now}] Market is closed. Sleeping for {sleep_seconds/60:.2f} minutes until market opens at {next_open}.")
        time.sleep(sleep_seconds)
    
    def _get_live_daily_features(self):
        data = yf.download(self.ticker, period=f"{FEATURE_WINDOW_DAYS}d", interval="1d")
        if data.empty:
            raise Exception("No live daily data available.")
        data.dropna(inplace=True)
        if len(data) < FEATURE_WINDOW_DAYS:
            last_row = data.iloc[-1]
            pad = pd.DataFrame([last_row] * (FEATURE_WINDOW_DAYS - len(data)), columns=data.columns)
            data = pd.concat([data, pad])
        return construct_daily_feature_vector(data)
    
    def _get_live_intraday_features(self):
        data = fetch_intraday_data(self.ticker, period="1d")
        return construct_intraday_feature_vector(data)
    
    def _get_live_price(self):
        data = yf.download(self.ticker, period="1d", interval="1m")
        if data.empty:
            raise Exception("No live price data available.")
        return float(data['Close'].iloc[-1])
    
    def predict_daily_trade_windows(self, feature_vector):
        print("Live daily features:", feature_vector)
        seq = np.tile(np.array(feature_vector, dtype=np.float32), (TRADING_CYCLE_DAYS, 1))
        seq = np.expand_dims(seq, axis=0)
        inp = torch.from_numpy(seq)
        self.daily_model.eval()
        with torch.no_grad():
            output = self.daily_model(inp).squeeze().numpy()
        normalized = np.clip(output, 0, 0.999)
        print("Daily model raw output:", normalized)
        windows = []
        for i in range(0, len(normalized), 2):
            entry = int(normalized[i] * TRADING_CYCLE_DAYS)
            exit = int(normalized[i+1] * TRADING_CYCLE_DAYS)
            if exit <= entry:
                exit = min(entry + 1, TRADING_CYCLE_DAYS - 1)
            windows.append((entry, exit))
        print("Raw predicted windows:", windows)
        valid_windows = []
        for entry, exit in windows:
            entry_norm = entry / TRADING_CYCLE_DAYS
            exit_norm = exit / TRADING_CYCLE_DAYS
            print("Window:", (entry, exit), "Normalized:", (entry_norm, exit_norm))
            if entry_norm <= DAILY_ENTRY_THRESHOLD and exit_norm >= DAILY_EXIT_THRESHOLD:
                valid_windows.append((entry, exit))
        print("Valid windows after threshold filtering:", valid_windows)
        return valid_windows[:MAX_TRADES_PER_CYCLE]
    
    def predict_intraday_entry(self, intraday_feature_vector):
        inp = torch.from_numpy(np.array(intraday_feature_vector, dtype=np.float32)).unsqueeze(0)
        self.intraday_entry_model.eval()
        with torch.no_grad():
            output = self.intraday_entry_model(inp).item()
        norm = np.clip(output, 0, 0.999)
        hour_index = int(norm * (INTRADAY_CYCLE_HOURS - 1))
        print("Predicted intraday entry value:", norm, "Hour index:", hour_index)
        return hour_index
    
    def predict_intraday_exit(self, intraday_feature_vector):
        inp = torch.from_numpy(np.array(intraday_feature_vector, dtype=np.float32)).unsqueeze(0)
        self.intraday_exit_model.eval()
        with torch.no_grad():
            output = self.intraday_exit_model(inp).item()
        norm = np.clip(output, 0, 0.999)
        hour_index = int(norm * (INTRADAY_CYCLE_HOURS - 1))
        print("Predicted intraday exit value:", norm, "Hour index:", hour_index)
        return hour_index
    
    def execute_trade(self, action, price):
        now = datetime.now(TIMEZONE)
        if action == "buy":
            if not self.settlement_available:
                print(f"[{now}] Cash not settled; cannot buy.")
                return
            shares = math.floor(self.balance / price)
            if shares <= 0:
                print(f"[{now}] Insufficient funds to buy at {price:.2f}.")
                return
            cost = shares * price
            self.balance -= cost
            self.position = {"shares": shares, "buy_price": price, "entry_day": self.current_cycle_day}
            print(f"[{now}] BUY: Bought {shares} shares at {price:.2f} (Cost: {cost:.2f}). New balance: {self.balance:.2f}")
        elif action == "sell":
            if self.position is None:
                print(f"[{now}] No position to sell.")
                return
            shares = self.position["shares"]
            proceeds = shares * price
            self.balance += proceeds
            profit = proceeds - (shares * self.position["buy_price"])
            print(f"[{now}] SELL: Sold {shares} shares at {price:.2f} (Proceeds: {proceeds:.2f}). Profit: {profit:.2f}. New balance: {self.balance:.2f}")
            self.position = None
            self.settlement_available = False
            self.last_sale_day = self.current_cycle_day
    
    def run_trading_cycle(self):
        eastern = TIMEZONE
        cycle_start = datetime.now(eastern)
        print(f"Starting trading cycle on {cycle_start.date()} for {TRADING_CYCLE_DAYS} business days.")
        daily_features = self._get_live_daily_features()
        self.predicted_trade_windows = self.predict_daily_trade_windows(daily_features)
        print(f"Predicted daily trade windows for this cycle: {self.predicted_trade_windows}")
        self.current_cycle_day = 0
        while self.current_cycle_day < TRADING_CYCLE_DAYS and not self.stop_signal:
            now = datetime.now(eastern)
            print(f"\n--- Trading Day {self.current_cycle_day+1} ({now.date()}) ---")
            if not self._is_market_open(now):
                self.wait_until_market_open()
            if (not self.settlement_available) and (self.current_cycle_day >= ((self.last_sale_day or -1) + SETTLEMENT_DELAY_DAYS)):
                self.settlement_available = True
                print("Cash has settled and is now available.")
            if self.position is None:
                for (entry, exit_) in self.predicted_trade_windows:
                    if entry == self.current_cycle_day and self.settlement_available:
                        intraday_features = self._get_live_intraday_features()
                        entry_hour = self.predict_intraday_entry(intraday_features)
                        print(f"Predicted optimal intraday entry hour: {entry_hour} (0=market open, {INTRADAY_CYCLE_HOURS-1}=market close)")
                        intraday_data = fetch_intraday_data(self.ticker, period="1d")
                        current_intraday_index = len(intraday_data) - 1
                        if current_intraday_index >= entry_hour:
                            price = self._get_live_price()
                            print("Optimal intraday entry reached. Executing BUY trade.")
                            self.execute_trade("buy", price)
                        else:
                            print("Waiting for optimal intraday entry time.")
                        break
            else:
                price = self._get_live_price()
                if price <= self.position["buy_price"] * (1 - 0.10):
                    print("STOP LOSS triggered. Executing SELL trade.")
                    self.execute_trade("sell", price)
                else:
                    for (entry, exit_) in self.predicted_trade_windows:
                        if self.position.get("entry_day") == entry and exit_ == self.current_cycle_day:
                            intraday_features = self._get_live_intraday_features()
                            exit_hour = self.predict_intraday_exit(intraday_features)
                            print(f"Predicted optimal intraday exit hour: {exit_hour} (0=market open, {INTRADAY_CYCLE_HOURS-1}=market close)")
                            intraday_data = fetch_intraday_data(self.ticker, period="1d")
                            current_intraday_index = len(intraday_data) - 1
                            if current_intraday_index >= exit_hour:
                                print("Optimal intraday exit reached. Executing SELL trade.")
                                self.execute_trade("sell", price)
                            else:
                                print("Waiting for optimal intraday exit time.")
                            break
            print(f"End of Trading Day {self.current_cycle_day+1}. Balance: {self.balance:.2f}")
            time.sleep(TRADING_CHECK_INTERVAL)
            self.current_cycle_day += 1
        print("Trading cycle complete.\n")
    
    def run(self):
        if not self.daily_pretrained:
            self.pretrain_daily_model()
        if not self.intraday_entry_pretrained:
            self.pretrain_intraday_entry_model()
        if not self.intraday_exit_pretrained:
            self.pretrain_intraday_exit_model()
        print("Starting live trading...\n")
        cycle = 1
        while not self.stop_signal:
            print(f"===== Trading Cycle {cycle} =====")
            self.run_trading_cycle()
            cycle += 1
        if self.position is not None:
            price = self._get_live_price()
            print("Stop signal received. Liquidating open position.")
            self.execute_trade("sell", price)
        print("Final balance: {:.2f}".format(self.balance))
        sys.exit(0)

# End of trader.py
