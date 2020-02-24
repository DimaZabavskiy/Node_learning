const express = require('express');

const webserver = express();

// webserver.use(express.urlencoded({extended:true}));

const port = 3050;


function createForm (data, error) {
    return `<form method=get action="/">
                Фамилия: <input type=text name=lastName value="${data ? data.lastName || '' : ''}"><br/>
                Имя: <input type=text name=firstName value="${data ? data.firstName || '' : ''}"><br/>
                Возраст: <input type=number name=age value="${data ? data.age || '': ''}"><br/>
                Логин: <input type=text name=login value="${data ? data.login || '' : ''}"><br/>
                Пароль: <input type=password name=pswrd value="${data ? data.pswrd || '': ''}"><br/>
                Повторите пароль: <input type=password name=pswrdRepeat value="${data ? data.pswrdRepeat || '' : ''}"><br/>
                <input type=submit value="Отправить">
            </form>
            <span style="display: ${error? 'inline' : 'none'}; color: red">${error || ''}</span>`
}

function createSuccess(data) {
    let result = `<b>Форма отправлена успешно</b><br/>`;
    for (let key in data) result += (`${key}: <i>${data[key]}</i><br/>`);
    return result;
}

function checkValidation (data) {
    let message = '';

    for (let key in data) {
        switch (key) {
            case 'lastName':
                if (!data[key]) message += `Ввод фамилии обязателен<br/>`;
                break;
            case 'firstName':
                if (!data[key]) message += `Ввод имени обязателен<br/>`;
                break;
            case 'age':
                if (data[key] < 14) message += `Возраст должен быть не менее 14 лет<br/>`;
                break;
            case 'login':
                if (data[key].length < 3) message += `Логин должен содержать не менее 4-х символов<br/>`;
                break;
            case 'pswrd':
                if ( !data[key] || data[key].length < 3 ) message += `Ввод пароля обязателен (не менее 3-х символов)<br/>`;
                break;
            case 'pswrdRepeat':
                if (data[key] !== data['pswrd']) message += `Введенные пароли не совпадают<br/>`;
                break;
            default:
                message += '';
        }
    }

    return message;
}

webserver.get('/', (req, res) => {
    console.log(new Date(), ` service called, req.query=${req.query.lastName}`);
    if (req.query.lastName === undefined) res.send(createForm());
    else {
        let errorMessage = checkValidation(req.query);

        // if (!errorMessage) res.send(`Форма отправлена успешно<br/>`+req.query);
        if (!errorMessage) res.send(createSuccess(req.query));
        else res.send(createForm(req.query, errorMessage));
    }
});



webserver.listen(port,()=>{
    console.log("web server running on port "+port);
});