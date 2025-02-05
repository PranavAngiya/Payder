# models.py
import torch
import torch.nn as nn
from parameters import INPUT_DIM, OUTPUT_DIM, HIDDEN_SIZE, NUM_LAYERS, INTRADAY_INPUT_DIM, INTRADAY_OUTPUT_DIM, INTRADAY_HIDDEN_SIZE

class TradeWindowPredictor(nn.Module):
    def __init__(self, input_dim=INPUT_DIM, hidden_size=HIDDEN_SIZE, output_dim=OUTPUT_DIM, num_layers=NUM_LAYERS):
        """
        LSTM-based model to predict daily trade windows over a trading cycle.
        Input: sequence of daily feature vectors (batch x cycle_length x input_dim)
        Output: vector of length output_dim (normalized entry/exit times)
        """
        super(TradeWindowPredictor, self).__init__()
        self.lstm = nn.LSTM(input_size=input_dim, hidden_size=hidden_size, num_layers=num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_dim)
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]
        output = self.fc(last_hidden)
        return torch.sigmoid(output)

class IntradayEntryPredictor(nn.Module):
    def __init__(self, input_dim=INTRADAY_INPUT_DIM, hidden_size=INTRADAY_HIDDEN_SIZE, output_dim=INTRADAY_OUTPUT_DIM):
        """
        Feed-forward network for intraday entry prediction.
        Input: intraday feature vector (batch x input_dim)
        Output: normalized optimal entry time (batch x 1)
        """
        super(IntradayEntryPredictor, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_dim)
    
    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return torch.sigmoid(out)

class IntradayExitPredictor(nn.Module):
    def __init__(self, input_dim=INTRADAY_INPUT_DIM, hidden_size=INTRADAY_HIDDEN_SIZE, output_dim=INTRADAY_OUTPUT_DIM):
        """
        Feed-forward network for intraday exit prediction.
        Input: intraday feature vector (batch x input_dim)
        Output: normalized optimal exit time (batch x 1)
        """
        super(IntradayExitPredictor, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_dim)
    
    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return torch.sigmoid(out)
