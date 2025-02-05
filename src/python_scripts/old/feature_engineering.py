# feature_engineering.py
import numpy as np
import pandas as pd

def compute_EMA(prices, period):
    prices = np.squeeze(prices)
    return float(pd.Series(prices).ewm(span=period, adjust=False).mean().iloc[-1])

def compute_RSI(prices, period=14):
    prices = np.array(prices).flatten()
    if len(prices) < 2:
        return 50.0
    delta = np.diff(prices)
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)
    avg_gain = np.mean(gain[-period:]) if len(gain) >= period else np.mean(gain)
    avg_loss = np.mean(loss[-period:]) if len(loss) >= period else np.mean(loss)
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)

def compute_MACD(prices, fast=12, slow=26):
    ema_fast = compute_EMA(prices, fast)
    ema_slow = compute_EMA(prices, slow)
    return ema_fast - ema_slow

def construct_daily_feature_vector(data):
    # Ensure that the computed features are pure floats.
    avg_close = float(data['Close'].mean())
    std_close = float(data['Close'].std())
    rsi = float(compute_RSI(data['Close'].values))
    macd = float(compute_MACD(data['Close'].values))
    avg_volume = float(data['Volume'].mean())
    return [avg_close, std_close, rsi, macd, avg_volume]

def construct_intraday_feature_vector(data):
    avg_price = float(data['Close'].mean())
    std_price = float(data['Close'].std())
    rsi = float(compute_RSI(data['Close'].values))
    macd = float(compute_MACD(data['Close'].values))
    avg_volume = float(data['Volume'].mean())
    return [avg_price, std_price, rsi, macd, avg_volume]
