const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const functions = require('firebase-functions');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: true, // Allow requests from any origin when deployed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// ... rest of your existing routes ...

// Export the Express app as a Firebase Function
exports.app = functions.https.onRequest(app); 