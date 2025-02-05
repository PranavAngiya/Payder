# main.py
from trader import AutoTrader

def main():
    ticker = "SPY"  # Example ticker; change as desired.
    initial_balance = 10000.00
    trader = AutoTrader(ticker, initial_balance)
    trader.run()

if __name__ == '__main__':
    main()
