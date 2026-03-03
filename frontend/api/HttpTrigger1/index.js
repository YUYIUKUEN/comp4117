const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    try {
        const parsedUrl = new URL(req.url);
        const url = new URL(`https://fypmanagementbackend.azurewebsites.net${parsedUrl.pathname}${parsedUrl.search}`);

        const options = {
            method: req.method,
            headers: req.headers
        };

        options.headers.host = url.host;

        if (req.method !== 'GET') {
            options.body = req.bufferBody;
        } else if (req.bufferBody) {
            context.res = {
                status: 400,
                body: 'GET requests cannot have a body',
            };
            return;
        }

        const fetchResp = await fetch(url, options);
        const responseMessage = await fetchResp.text();

        context.res = {
            status: fetchResp.status,
            body: responseMessage,
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: err.message,
        };
    }
};
