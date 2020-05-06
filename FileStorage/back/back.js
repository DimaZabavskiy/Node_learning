const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const busboy = require('connect-busboy'); // для отслеживания прогресса приёма файла (вариант №2)

const webserver = express();
const port = 5695;

const wsPort = 5665;
const clients = [];
const server = new WebSocket.Server({ port: wsPort });
server.on('connection', connection => {
    const id = clients.length + 1;
    clients.push( { id, connection} );
    connection.send(JSON.stringify({num:id, type: 'registration'}));
});

webserver.use(bodyParser.json());

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


const savedRequestFilePath = path.join(__dirname, '/savedRequest.json');
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

webserver.post('/service6', busboy(), (req, res) => {

    try {

        const id  = +req.query.id;
        const clientArray = clients.find(item => {
            return item.id === id
        });
        const clientConnection = clientArray.connection;
        const totalRequestLength = +req.headers["content-length"]; // общая длина запроса
        clientConnection.send(JSON.stringify({num:totalRequestLength, type:'total'}));
        let totalDownloaded = 0; // сколько байт уже получено

        let storedPFN = null;
        let bodyForSaving = {};

        req.pipe(req.busboy); // перенаправляем поток приёма ответа в busboy

        req.busboy.on('field', function(fieldname, val) { // это событие возникает, когда в запросе обнаруживается "простое" поле, не файл
            bodyForSaving.comment = val || '';
        });

        req.busboy.on('file', (fieldname, file, filename, mimetype) => {  // это событие возникает, когда в запросе обнаруживается файл

            let randomName = Math.random() + filename;
            storedPFN = path.join(__dirname,"upload_files_temp",randomName);  //  полное имя файла
            console.log(Date.now(),'storedPFN: ', storedPFN);
            bodyForSaving.fullPath = "/upload_files_temp/" + randomName;
            bodyForSaving.originName = filename;

            console.log(`Uploading of '${filename}' started`);

            const fstream = fs.createWriteStream(storedPFN);

            file.pipe(fstream);

            file.on('data', function(data) {
                totalDownloaded += data.length;
                // console.log('loaded '+totalDownloaded+' bytes of '+totalRequestLength);
                clientConnection.send(JSON.stringify({num: totalDownloaded, type: 'part'}));
            });

            file.on('end', () => {
                console.log('file '+fieldname+' received');
            });
        });

        req.busboy.on('finish', async () => {
            clientConnection.send(JSON.stringify({num: 0, type: 'happyEnd'}));

            fs.openSync(savedRequestFilePath, 'a+');
            const savedRequests = fs.readFileSync(savedRequestFilePath, "utf8");
            let newSavedRequests = savedRequests ? JSON.parse(savedRequests) : [];
            newSavedRequests.push({...bodyForSaving});
            fs.writeFileSync(savedRequestFilePath,JSON.stringify(newSavedRequests));

            res.send(JSON.stringify({ newSavedRequests }));
        });
    } catch (e) {
        res.status(500).send(e.message);
    }

});


webserver.get('/upload_files_temp/:name', function (req, res) {
    const receivedPath = decodeURIComponent(req.originalUrl).replace(/\?$/,'');
    const fullPath = path.join(__dirname,receivedPath);

    fs.openSync(savedRequestFilePath, 'a+');
    const savedRequests = fs.readFileSync(savedRequestFilePath, "utf8");
    let newSavedRequests = JSON.parse(savedRequests);
    let fileName = newSavedRequests.find( item => item.fullPath === receivedPath).originName;

    try {
        res.setHeader("Content-Disposition","attachment");
        res.download(fullPath, fileName);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

webserver.listen(port,()=>{
    console.log(new Date(), " web server running on port "+port);
});