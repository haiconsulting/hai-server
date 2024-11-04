// Note: Download the service account key from Firebase Console:
// Project Settings > Service Accounts > Generate New Private Key
// Save as 'hai-home-server-firebase-adminsdk.json' in this directory
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin with a service account
const serviceAccount = require('./hai-home-server-firebase-adminsdk.json'); // You'll need to download this
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "hai-home-server",
  storageBucket: "hai-home-server.firebasestorage.app",
  messagingSenderId: "702209050024",
  appId: "1:702209050024:web:568dabf4957db75851c99d",
  measurementId: "G-V42JHDG17J"
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['https://www.haiconsultingservices.com', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add Firebase Analytics logging middleware
app.use((req, res, next) => {
    const analytics = admin.analytics();
    analytics.logEvent({
        name: 'api_request',
        params: {
            path: req.path,
            method: req.method
        }
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Create a new thread
app.post('/api/threads', async (req, res) => {
    try {
        const thread = await openai.beta.threads.create();
        
        // Create initial message
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

// Add this helper function at the top
const sanitizeMessage = (text) => {
  return text
    // Remove source markers with more specific pattern
    .replace(/\d+:\d+source|\d+source|【\d+:\d+†source】/g, '')
    // Convert numbered lists to proper format
    .replace(/(\d+)\.\s+/g, '<strong>$1.</strong> ')
    // Convert **text** to proper HTML/markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Remove other problematic Unicode characters
    .replace(/[\u{0080}-\u{FFFF}]/gu, '')
    // Clean up any double spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
};

// Add a message and run assistant
app.post('/api/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    const { content } = req.body;
    
    try {
        // Add the user's message
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: sanitizeMessage(content)
        });

        // Create a run
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID
        });

        // Poll for completion
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        }

        if (runStatus.status === 'completed') {
            // Get the latest messages and sanitize them
            const messages = await openai.beta.threads.messages.list(threadId);
            const sanitizedMessages = {
                ...messages,
                data: messages.data.map(msg => ({
                    ...msg,
                    content: msg.content.map(c => ({
                        ...c,
                        text: { ...c.text, value: sanitizeMessage(c.text.value) }
                    }))
                }))
            };
            res.json(sanitizedMessages);
        } else {
            throw new Error(`Run ended with status: ${runStatus.status}`);
        }
    } catch (error) {
        console.error('Error in message processing:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages from a thread
app.get('/api/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    try {
        const messages = await openai.beta.threads.messages.list(threadId);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    // Log errors to Firebase
    const analytics = admin.analytics();
    analytics.logEvent({
        name: 'api_error',
        params: {
            error: err.message,
            path: req.path,
            method: req.method
        }
    });

    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Only start the server if we're running this file directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the Express app as a Firebase Cloud Function
exports.api = functions.region('us-central1').https.onRequest(app);