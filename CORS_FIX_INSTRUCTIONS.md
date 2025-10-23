# CORS Configuration Fix for Backend

## Problem
The frontend at `https://frontend-lbshsnu3v-doohgles-projects.vercel.app` is being blocked by CORS policy when trying to access the backend at `https://neosharx-backend-1.onrender.com`.

## Solution
You need to configure the backend server to allow requests from your frontend domain.

### For Express.js Backend

1. Install the CORS package:
```bash
npm install cors
```

2. Add CORS middleware to your server (e.g., `server.js` or `app.js`):

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS to allow your frontend domain
const corsOptions = {
  origin: [
    'https://frontend-lbshsnu3v-doohgles-projects.vercel.app',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Your routes here...
```

### Alternative: Allow All Origins (Less Secure)

If you want to allow all origins temporarily for testing:

```javascript
const cors = require('cors');
app.use(cors());
```

### For Other Backend Frameworks

#### Python Flask
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "https://frontend-lbshsnu3v-doohgles-projects.vercel.app",
    "http://localhost:8000"
])
```

#### Python FastAPI
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-lbshsnu3v-doohgles-projects.vercel.app",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Manual Headers (If not using CORS library)

Add these headers to all responses:

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://frontend-lbshsnu3v-doohgles-projects.vercel.app');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// Handle preflight requests
if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}
```

## Testing
After implementing CORS:
1. Deploy your backend changes to Render
2. Wait for deployment to complete
3. Test the frontend again - the CORS errors should be resolved

## Additional Notes
- Make sure your backend server is running and accessible at `https://neosharx-backend-1.onrender.com`
- Check Render logs to ensure there are no server errors
- Verify all API endpoints are working correctly
