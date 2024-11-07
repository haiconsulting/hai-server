const createHandler = (app, route) => {
    return async function (context, req) {
        // Create mock express response
        const res = {
            status: function (code) {
                context.res = { ...context.res, status: code };
                return this;
            },
            json: function (data) {
                context.res = {
                    ...context.res,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: data
                };
            }
        };

        // Route the request through express app
        await new Promise((resolve) => {
            app._router.handle({ ...req, url: route, params: context.bindingData }, res, resolve);
        });

        return context.res;
    };
};

module.exports = createHandler; 