const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Proxy API requests to backend
const proxyApi = async (req, res) => {
  try {
    const backendUrl = `http://localhost:3000${req.path}${req.url.includes('?') ? req.url.split('?')[1] : ''}`;
    console.log(`Proxying request to: ${backendUrl}`); // Debug log

    const response = await axios({
      method: req.method,
      url: backendUrl,
      data: req.body,
      headers: { ...req.headers, 'Content-Type': 'application/json', host: 'localhost:3000' },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Proxy error', details: error.message });
  }
};

// Route for all /api/* requests
app.all('/api/:path(*)', proxyApi);

// Serve static HTML files for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, req.path.endsWith('.html') ? req.path : 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Frontend server running on http://localhost:${port}`);
});