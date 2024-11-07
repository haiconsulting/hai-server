const { openai } = require('../openai');

module.exports = async function (context, req) {
    context.log('Create thread request received');

    try {
        context.log('API Key exists:', !!process.env.OPENAI_API_KEY);
        context.log('Assistant ID exists:', !!process.env.ASSISTANT_ID);

        const thread = await openai.beta.threads.create();
        await openai.beta.threads.messages.create(thread.id, {
            role: "assistant",
            content: "Hello! You got HaiGuy here. Got any questions about HAI Consulting?"
        });
        
        context.res = {
            status: 200,
            body: thread,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        context.log.error('Error creating thread:', error);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
}; 