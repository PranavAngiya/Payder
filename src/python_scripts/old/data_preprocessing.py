# data_preprocessing.py
import yfinance as yf
import pandas as pd
from parameters import HISTORICAL_PERIOD, HISTORICAL_INTERVAL, INTRADAY_INTERVAL

def fetch_daily_data(ticker):
    data = yf.download(ticker, period=HISTORICAL_PERIOD, interval=HISTORICAL_INTERVAL)
    if data.empty:
        raise Exception(f"No daily data found for ticker: {ticker}")
    data.dropna(inplace=True)
    data.index = pd.to_datetime(data.index)
    return data

def fetch_intraday_data(ticker, period="5d"):
    data = yf.download(ticker, period=period, interval=INTRADAY_INTERVAL)
    if data.empty:
        raise Exception(f"No intraday data found for ticker: {ticker}")
    data.dropna(inplace=True)
    data.index = pd.to_datetime(data.index)
    return data
