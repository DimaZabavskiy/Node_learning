const express = require('express');
﻿const path = require('path');
const fs = require('fs');
const os = require('os');

const webserver = express();

const port = 3095;

const logFN = path.join(__dirname, '_server.log');
const indexFile = path.join(__dirname, 'index.html');
const jsonFile = path.join(__dirname, 'votes.json');


function logLineSync(logFilePath,logLine) {
    const logDT=new Date();
    let time=logDT.toLocaleDateString()+" "+logDT.toLocaleTimeString();
    let fullLogLine=time+" "+logLine;

    console.log(fullLogLine);

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
    fs.closeSync(logFd);
}


webserver.use(express.json());

webserver.get('/', (req, res) => {
    logLineSync(logFN,`[${port}] `+' start page service called');
    res.sendFile(indexFile);
});


webserver.get('/variants', (req, res) => {
    logLineSync(logFN,' /variants service called');
    let fileContent = fs.readFileSync(jsonFile, "utf8");
    logLineSync(logFN,'fileContent: ' +  fileContent);
    res.send(fileContent);
});

webserver.post('/stat', (req, res) => {
    logLineSync(logFN,' /stat service called');
    let statContent = fs.readFileSync(jsonFile, "utf8");
    logLineSync(logFN,'statContent: ' +  statContent);
    res.send(statContent);
});

webserver.post('/vote', (req, res) => {
    logLineSync(logFN,' /vote service called');
    let body = req.body;
    if (!req.body.teamId) {
        logLineSync(logFN,'Команда не выбрана');
        res.send(JSON.stringify({
            errorCode:1,
            description: 'Вы не выбрали команду'
        }));
    }
    else {
        let statContent = fs.readFileSync(jsonFile, "utf8");
        statContent = JSON.parse(statContent);
        for (let i = 0; i < statContent.length; i++) {
            if (statContent[i].id == body.teamId) {
                statContent[i].vote += 1;
            };
        }
        statContent = JSON.stringify(statContent);
        logLineSync(logFN,'новая statContent: ' +  statContent);
        fs.writeFileSync(jsonFile, statContent);
        res.send(JSON.stringify({errorCode:0}));
    }
});


webserver.listen(port,()=>{
    logLineSync(logFN,"web server running on port "+port);
});