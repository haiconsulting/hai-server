const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Middleware
// More permissive CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Create a new thread
app.post('/threads', async (req, res) => {
    try {
        const thread = await openai.beta.threads.create();
        await openai.beta.threads.messages.create(thread.id, {
            role: "assistant",
            content: "Hello! You got HaiGuy here. Got any questions about HAI Consulting?"
        });
        res.json(thread);
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add message and run assistant
app.post('/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    const { content } = req.body;
    
    try {
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: content
        });

        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID
        });

        let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        }

        if (runStatus.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(threadId);
            res.json(messages);
        } else {
            throw new Error(`Run ended with status: ${runStatus.status}`);
        }
    } catch (error) {
        console.error('Error in message processing:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages
app.get('/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    try {
        const messages = await openai.beta.threads.messages.list(threadId);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
exports.api = functions.https.onRequest(app);
