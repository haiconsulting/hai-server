const OpenAI = require('openai');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Log environment variables for debugging (remove in production)
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('Assistant ID exists:', !!process.env.ASSISTANT_ID);

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
}

if (!process.env.ASSISTANT_ID) {
    throw new Error('ASSISTANT_ID is not set in environment variables');
}

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Test the OpenAI instance
const testOpenAI = async () => {
    try {
        await openai.models.list();
        console.log('OpenAI initialization successful');
    } catch (error) {
        console.error('OpenAI initialization failed:', error);
        throw error;
    }
};

// Run the test
testOpenAI();

module.exports = { openai }; 