const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;
const flaskServerUrl = 'http://localhost:5000';

app.use(cors());
app.use(express.json());  // Middleware to parse JSON request bodies

app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  next();
});


app.get('/', (req, res) => {
  res.send('Hello from Express Server!');
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon', 'favicon-96x96.png'));
});

// To serve static files in ./public.
app.use(express.static(path.join(__dirname, 'public')));


app.post('/FinUrl', async (req, res) => {
  const data = req.body;
  console.log(`----------------/FinUrl req: ${data}`);

  try {
    const response = await axios.post(flaskServerUrl+'/FinUrl', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = response.data;
    console.log(`----------------/Flask res: ${result}`);
    res.json(result);
  } catch (error) {
    console.error('Error forwarding request to Flask server:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/AskBua', async (req, res) => {
  const data = req.body;
  console.log(`----------------/AskBua req: ${data}`);

  try {
    const response = await axios.post(flaskServerUrl+'/AskBua', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = response.data;
    console.log(`----------------/AskBua res: ${result}`);
    res.json(result);
  } catch (error) {
    console.error('Error forwarding request to Flask server:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Yahoo Finance price chart route --------------------------------------------
// Check if the requested file available in 'public' directory. 
// if yes, send it.  
// if not, fetch it from Yahoo Finance API before sending it.
app.use('/Minsky/chart', async (req, res) => {
 
  //const outFilePath = path.join(__dirname, 'public', req.url);
  //const Symbol = req.url.slice(1, -5);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;     // /Minsky/chart
  const symbol = url.searchParams.get('symbol');
  const startDate = url.searchParams.get('period1');
  const endDate = url.searchParams.get('period2');

  const outFilePath = path.join(__dirname, `public${pathname}`, `${symbol}-${startDate}-${endDate}.json`);
  const yahooFinanceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
  console.log(`outFilePath: ${outFilePath}, yahooFinanceUrl: ${yahooFinanceUrl}`);

  fs.access(outFilePath, fs.constants.F_OK, (err) => {
    if (err) {	// File does not exist, fetch it
      fetch(yahooFinanceUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok.');
          }
          console.log(`File fetched: ${yahooFinanceUrl}`);
          return response.json();
        })
        .then(data => {
          fs.writeFile(outFilePath, JSON.stringify(data), (err) => {
            if (err) {
              console.error(`Error writing file: ${err}`);
              res.status(500).send('Error writing file');
            } else {
              console.log(`File fetched, sent, and cached to ${outFilePath}`);
              res.sendFile(outFilePath);
            }
          });
        })
        .catch(error => {
          console.error(`Error fetching ${yahooFinanceUrl}: ${error}`);
          res.status(500).send('Error fetching file ${req.url}');
        });
    } else {
      // File exists, serve it
      console.log(`File exists and sent: ${outFilePath}`);
      res.sendFile(outFilePath);
    }
  });
});


// OpenAI route ---------------------------------------------------------------
app.post('/Minsky/OpenAI', async (req, res) => {
  const OpenAI_endpoint = 'https://api.openai.com/v1/chat/completions';
  const { prompt } = req.body;
  console.log(`
    Received prompt: ${prompt}
  `);

  try {
    const response = await axios.post(
      OpenAI_endpoint,
      {
      model: 'gpt-4o-mini',
      messages: [
        {
        role: 'user',
        content: prompt
        }
      ],
      max_tokens: 4096 // Maximum number of tokens allowed for GPT-4
      },
      {
      headers: {
        'Content-Type': 'application/json',
      }
      }
    );

    //console.log('Response:', response.data.choices[0]);
    const aiRes = response.data.choices[0].message.content ? response.data.choices[0].message.content.trim() : '<no answer>';
    res.json({'aiRes': aiRes });
    
  } catch (error) {
      console.error('Error requesting OpenAI: ', error);
      //res.status(500).json({ 'error': 'An error occurred while processing your request.' });
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        if (error.response.status === 429) {
          res.status(429).send('Too Many Requests to OpenAI');
        } else {
          res.status(500).send(`OpenAI Error: ${error.response.data.error.message}`);
        }
      } else {
        res.status(500).send(`Server Internal Error: ${error}`);
      }
  }
});


// Convergence Proxy route ---------------------------------------------------
app.post('/Minsky/ConvProxy', async (req, res) => {
  const ConvProxy_endpoint = 'https://api.convergence.ai/v1/forms/submit';
  //console.log(req);
  console.log(req.body);
  console.log(`
    req.body.task: ${req.body.task}
  `);
  
  const taskDescription = req.body.task;
  const requestBody = {
    task: taskDescription,
    parameters: {
        // Add any necessary parameters for the task here
    }
  };

  try {
    const response = await axios.post(
      ConvProxy_endpoint,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Request to Convergence Proxy failed with status ${response.status}`);
    }

    //console.log('Response:', response.data.choices[0]);
    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Error requesting Convergence Proxy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}/`);
});

