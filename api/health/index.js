module.exports = async function (context, req) {
    context.log('Health check request received');
    
    context.res = {
        status: 200,
        body: { status: 'ok' },
        headers: {
            'Content-Type': 'application/json'
        }
    };
}; 