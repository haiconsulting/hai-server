const { openai } = require('../openai');

module.exports = async function (context, req) {
    const threadId = context.bindingData.threadId;
    
    try {
        if (req.method === 'POST') {
            const { content } = req.body;
            
            // Add message
            await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: content
            });

            // Create and monitor run
            const run = await openai.beta.threads.runs.create(threadId, {
                assistant_id: process.env.ASSISTANT_ID
            });

            let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
            
            while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
            }

            if (runStatus.status !== 'completed') {
                throw new Error(`Run ended with status: ${runStatus.status}`);
            }
        }

        // Get messages
        const messages = await openai.beta.threads.messages.list(threadId);
        
        context.res = {
            status: 200,
            body: messages,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        context.log.error('Error processing message:', error);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
}; 