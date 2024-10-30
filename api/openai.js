const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a new thread
app.post('/api/threads', async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res.json(thread);
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a message to a thread
app.post('/api/threads/:threadId/messages', async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;
  try {
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content
    });
    res.json(message);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run the assistant
app.post('/api/threads/:threadId/runs', async (req, res) => {
  const { threadId } = req.params;
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.ASSISTANT_ID
    });
    res.json(run);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

// Export the app as a serverless function
module.exports = app; 