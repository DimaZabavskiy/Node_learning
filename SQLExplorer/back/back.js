const express = require('express');
const mysql = require('mysql');
const path = require('path');

const webserver = express();
const port = 6195;

const poolConfig={
    connectionLimit : 10,
    host     : 'localhost',
    user     : 'nodeuser',
    password : 'nodepass',
    // database : 'learning_db',
};

// let pool = mysql.createPool(poolConfig);

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

webserver.options('/sendRequest', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.send("");
});

webserver.post('/sendRequest', async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");

    const {text, database} = req.body;

    if (database) {
        poolConfig.database = database;
    }
    let pool = mysql.createPool(poolConfig);

    let connection=null;
    
    try {
        connection = await newConnectionFactory(pool,res);

        let request = await selectQueryFactory(connection, text, []);
        if (Array.isArray(request)) {
            res.send({
                type: request[0].Database ? 'database' : 'fullInfo',
                body: request
            });
        } else {
            res.send({
                type: 'text',
                body: `Успешно. Затронуто ${request.affectedRows} строк`
            })
        }
    } catch (e) {
        res.send({
            type: 'text',
            body: `Ошибка при отправлении в базу данных: ${e.sqlMessage}`
        })
    }
    finally {
        if ( connection )
            connection.release();
    }

});


// возвращает соединение с БД, взятое из пула соединений
function newConnectionFactory(pool,res) {
    return new Promise( (resolve,reject) => {
        pool.getConnection(function(err,connection){
            if ( err ) {
                if ( res ) {
                    res.status(500);
                    res.send("");
                }
                console.error(err);
            }
            else {
                resolve(connection);
            }
        });
    } );
}

// выполняет SQL-запрос на чтение, возвращает массив прочитанных строк
function selectQueryFactory(connection, queryText, queryValues) {
    return new Promise((resolve,reject)=>{
        connection.query(queryText,queryValues,function(err,rows,fields) {
            if ( err ) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}



webserver.listen(port,()=>{
    console.log(new Date(), " web server running on port "+port);
});