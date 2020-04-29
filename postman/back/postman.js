const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');


const webserver = express();
const port = 4095;
const savedRequestFilePath = path.join(__dirname, '/savedRequest.json');

webserver.use(express.json()); // мидлварь, умеющая обрабатывать тело запроса в формате JSON

webserver.use("/index.html",
    express.static(path.resolve(__dirname,"../front/public/index.html"))
);
webserver.use("/bundle.min.js",
    express.static(path.resolve(__dirname,"../front/public/bundle.min.js"))
);
webserver.use("/main.bundle.css",
    express.static(path.resolve(__dirname,"../front/public/main.bundle.css"))
);

webserver.options('/savedRequests', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.send("");
});
webserver.get('/savedRequests', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    fs.openSync(savedRequestFilePath, 'a+');
    const fileData = fs.readFileSync(savedRequestFilePath, "utf8");
    res.send(fileData || JSON.stringify([]));
});

webserver.options('/addToSavedRequests', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.send("");
});
webserver.post('/addToSavedRequests', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    const newRequest = req.body;
    fs.openSync(savedRequestFilePath, 'a+');
    const savedRequests = fs.readFileSync(savedRequestFilePath, "utf8");
    let newSavedRequests = savedRequests ? JSON.parse(savedRequests) : [];
    if(newRequest.id !== null) {
        for (let i = 0; i < newSavedRequests.length; i++) {
            if (newSavedRequests[i].id === newRequest.id) {
                newSavedRequests[i] = newRequest;
                break;
            }
        }
    } else newSavedRequests.push({...newRequest, id: newSavedRequests.length + 1});

    fs.writeFileSync(savedRequestFilePath,JSON.stringify(newSavedRequests));

    res.send(JSON.stringify({
        id: newRequest.id || newSavedRequests.length + 1,
        newSavedRequests
    }));
});

webserver.options('/sendRequest', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.send("");
});
webserver.post('/sendRequest', async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const {method, URL, headers, parameters, postBody} = req.body;

    let fullURL;
    if (parameters.length) {
        let paramStr = parameters.map( item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`).join('&');
        fullURL = URL + '?' + paramStr;
    } else fullURL = URL;

    let fullHeaders = {};
    headers.forEach ( item => {
        fullHeaders[item.header] = item.value;
    });

    let options = {method, fullHeaders};

    if (method === 'POST' && postBody) options.body = postBody;

    try {
        let response = await fetch(fullURL, options);
        let result = {};
        result.status = response.status;

        const headersRow = response.headers.raw();
        result.headers = {};
        for (let key in headersRow) {
            result.headers[key] = response.headers.get(key);
        }

        result.data = await response.text();

        res.send(JSON.stringify(result));
    } catch (e) {
        res.status(500).send(e.message);
    }
});



webserver.listen(port,()=>{
    console.log(new Date(), " web server running on port "+port);
});