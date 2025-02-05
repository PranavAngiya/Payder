# parameters.py
from datetime import time
import pytz

# -----------------------
# General Settings
# -----------------------
TIMEZONE = pytz.timezone("US/Eastern")

# -----------------------
# Data & Pretraining (Daily) Parameters
# -----------------------
HISTORICAL_PERIOD = "1y"         # One year of historical daily data
HISTORICAL_INTERVAL = "1d"       # Daily candles for pretraining
FEATURE_WINDOW_DAYS = 5          # Each trading cycle spans 5 business days
TRADING_CYCLE_DAYS = FEATURE_WINDOW_DAYS  # Trading cycle length
MAX_TRADES_PER_CYCLE = 3         # Up to 3 trades per cycle
SETTLEMENT_DELAY_DAYS = 1        # Cash from a sale is available the next business day

# -----------------------
# Market Hours (US/Eastern)
# -----------------------
MARKET_OPEN_TIME = time(9, 30)
MARKET_CLOSE_TIME = time(16, 0)

# -----------------------
# Feature Engineering (Daily)
# We compute these 5 features: average close, std deviation of close, RSI, MACD, and average volume.
FEATURE_NAMES = ["avg_close", "std_close", "RSI", "MACD", "avg_volume"]

# -----------------------
# Model Parameters (Daily Trade Window Prediction)
# -----------------------
INPUT_DIM = len(FEATURE_NAMES)                # e.g., 5
OUTPUT_DIM = MAX_TRADES_PER_CYCLE * 2           # 6 numbers: entry and exit for each trade
HIDDEN_SIZE = 64
NUM_LAYERS = 2
LEARNING_RATE = 0.001
PRETRAIN_EPOCHS = 20

# -----------------------
# Trading Thresholds for Daily Predictions
# (Adjust these if the model outputs are not in the expected range.)
DAILY_ENTRY_THRESHOLD = 0.2   # Normalized entry must be ≤ 0.2
DAILY_EXIT_THRESHOLD = 0.1    # Normalized exit must be ≥ 0.4

# -----------------------
# Intraday (Hourly) Parameters for Entry & Exit Predictions
# -----------------------
INTRADAY_INTERVAL = "60m"       # Use hourly candles for intraday prediction
INTRADAY_CYCLE_HOURS = 6        # Approximately 6 hourly candles during market hours
INTRADAY_FEATURE_NAMES = ["avg_price", "std_price", "RSI", "MACD", "avg_volume"]
INTRADAY_INPUT_DIM = len(INTRADAY_FEATURE_NAMES)  # e.g., 5
INTRADAY_OUTPUT_DIM = 1                         # Predict a normalized time (0 to 1)
INTRADAY_HIDDEN_SIZE = 32
INTRADAY_PRETRAIN_EPOCHS = 20
INTRADAY_LEARNING_RATE = 0.001

# -----------------------
# Live Trading (Daily Cycle) Parameters
# -----------------------
TRADING_CHECK_INTERVAL = 60     # Check market conditions every 60 seconds
