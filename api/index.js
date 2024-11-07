const app = require('../openai');
const createHandler = require('./createHandler');

// Create Azure Function handlers for each route
module.exports = {
    health: createHandler(app, '/api/health'),
    createThread: createHandler(app, '/api/threads'),
    addMessage: createHandler(app, '/api/threads/{threadId}/messages'),
    getMessages: createHandler(app, '/api/threads/{threadId}/messages')
}; 