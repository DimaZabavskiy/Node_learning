const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const webserver = express();

const port = 3595;

const logFN = path.join(__dirname, './public/_server.log');
const indexFile = path.join(__dirname, 'index.html');
const jsonFile = path.join(__dirname, './public/votes.json');


function logLineSync2(logFilePath,logLine) {
    const logDT=new Date();
    let time=logDT.toLocaleDateString()+" "+logDT.toLocaleTimeString();
    let fullLogLine=time+" "+logLine;

    console.log(fullLogLine);

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
    fs.closeSync(logFd);
}

webserver.use(express.json());


webserver.use(
    "/public",
    express.static(path.resolve(__dirname,"./public"))
);


webserver.get('/', (req, res) => {
    logLineSync2(logFN,`[${port}] `+' start page service called');
    res.sendFile(indexFile);
});


webserver.get('/variants', (req, res) => {
    logLineSync2(logFN,' /variants service called');
    let fileContent = fs.readFileSync(jsonFile, "utf8");
    logLineSync2(logFN,'fileContent: ' +  fileContent);
    res.send(fileContent);
});

webserver.get('/stat', (req, res) => {
    logLineSync2(logFN,' /stat service called');
    let statContent = fs.readFileSync(jsonFile, "utf8");
    logLineSync2(logFN,'statContent: ' +  statContent);
    res.setHeader("Cache-Control","public, max-age=0");
    let statistics = {};
    JSON.parse(statContent).forEach( item => statistics[item.id] = item.vote);
    logLineSync2(logFN,'statistics: ' +  JSON.stringify(statistics));
    res.send(JSON.stringify(statistics));
});

webserver.post('/vote', (req, res) => {
    logLineSync2(logFN,' /vote service called');
    let body = req.body;
    if (!req.body.teamId) {
        logLineSync2(logFN,'Команда не выбрана');
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
        logLineSync2(logFN,'новая statContent: ' +  statContent);
        fs.writeFileSync(jsonFile, statContent);
        res.send(JSON.stringify({errorCode:0}));
    }
});


webserver.post('/showStat', (req, res) => {
    logLineSync2(logFN,`[${port}] `+"showStat called");

    let statContent = fs.readFileSync(jsonFile, "utf8");

    const clientAccept=req.headers.accept;
    if ( clientAccept==="application/json" ) {
        res.setHeader("Content-Type", "application/json");
        res.send(statContent);
    }
    else if ( clientAccept==="application/xml" ) {
        statContent = JSON.parse(statContent);
        let xmlStat = statContent.map( (item) => `<common>
            <id>${item.id}</id>
            <team>${item.team}</team>
            <vote>${item.vote}</vote>
        </common>`)
        res.setHeader("Content-Type", "application/xml");
        res.send(`<stats>${xmlStat}</stats>`);
    }
    else if ( clientAccept==="application/html" ) {
        statContent = JSON.parse(statContent);
        let htmlStat = statContent.map( (item) => `<div>
            <span>${item.id}</span>
            <span>${item.team}</span>
            <span>${item.vote}</span>
        </div>`)
        res.setHeader("Content-Type", "application/html");
        res.send(`<div>${htmlStat}</div>`);
    }
    else {
        res.setHeader("Content-Type", "text/plain");
        res.send("неизвестный clientAccept: " + clientAccept);
    }
});

webserver.listen(port,()=>{
    logLineSync2(logFN,"web server running on port "+port);
});