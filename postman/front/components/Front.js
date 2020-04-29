import React, {Fragment, PureComponent} from 'react';

import './Front.scss';

class Front extends PureComponent {

    state = {
        requests: [],   //  сохраненные запросы
        id: null,  //  id выбранного запроса
        method: 'GET',  //  для запросов по умолчанию метод "GET"
        URL: '',
        parameters: [],
        postBody: '',
        headers: [],
        errors: {},
        isResponseReceived: false,
        response: null
    };

    componentDidMount = () => this.requestsPrepare();

    requestsPrepare = async () => { //  функция загрузки данных из файла с сохраненными запросами
        const response = await fetch('/savedRequests', {
            method: 'GET'
        });
        const data = await response.json();
        this.setState({requests: data});
        return data;
    };

    className = 'Front';

    requestHeaders = [
        "Content-type",
        "Accept",
        "Accept-Encoding",
        "Accept-Language",
        "Connection",
        "Content-Length",
        "Host",
        "Origin",
        "Referer",
        "Sec-Fetch-Dest",
        "Sec-Fetch-Mode",
        "Sec-Fetch-Site",
        "User-Agent",
    ];

    setNewValue = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        })
    };

    addParameter = () => {
        this.setState({
            parameters: [...this.state.parameters,{key:'', value:''}]
        })
    };
    setParameters = (e, idx) => {
        let newParameters = [...this.state.parameters];
        newParameters[idx][e.target.name] = e.target.value;
        this.setState({
            parameters: newParameters,
        })
    };
    deleteParameter = (idx) => {
        let newParameters = [...this.state.parameters];
        newParameters.splice(idx,1);
        this.setState({
            parameters: newParameters,
        })
    };

    addHeader = () => {
        this.setState({
            headers: [...this.state.headers,{header:'', value:''}]
        })
    };
    setHeaders = (e,idx) => {
        let newHeaders = [...this.state.headers];
        newHeaders[idx][e.target.name] = e.target.value;
        this.setState({
            headers: newHeaders,
        })
    };
    deleteHeader = (idx) => {
        let newHeaders = [...this.state.headers];
        newHeaders.splice(idx,1);
        this.setState({
            headers: newHeaders,
        })
    };

    saveRequest = async () => {
        const isFormValid = this.checkValidation();
        if (!isFormValid) return;

        const {method, URL, headers, parameters, postBody, id} = this.state;
        const data = {method, URL, headers, parameters, postBody, id};

        let response = await fetch('/addToSavedRequests', {
            method: 'post',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const answer = await response.json();
        this.setState({
            id: answer.id,
            requests: answer.newSavedRequests
        });
    };

    choseRequest = (request) => {
        console.log('request: ', request);
        const {method, URL, headers, parameters, postBody, id} = request;
        this.setState({method, URL, headers, parameters, postBody, id});
    };

    checkValidation = () => {
        const {URL,method,parameters,headers} = this.state;

        let errors = {};
        let isFormValid = true;

        if (!URL) {
            errors.URL = 'Ввод обязателен';
            isFormValid = false;
        }
        if (!/^http[s]?:\/\//.test(URL)) {
            errors.URL = 'Неверный формат URL';
            isFormValid = false;
        }

        if (method === 'GET') {
            errors.parameters = {};
            parameters.forEach((item,idx) => {
                errors.parameters[idx] = {};
                if (!item.key) {
                    errors.parameters[idx].key = 'Ввод обязателен';
                    isFormValid = false;
                }
                if (!item.value) {
                    errors.parameters[idx].value = 'Ввод обязателен';
                    isFormValid = false;
                }
            })
        }

        errors.headers = {};
        headers.forEach((item,idx) => {
            errors.headers[idx] = {};
            if (!item.header) {
                errors.headers[idx].header = 'Ввод обязателен';
                isFormValid = false;
            }
            if (!item.value) {
                errors.headers[idx].value = 'Ввод обязателен';
                isFormValid = false;
            }
        });

        this.setState({errors});

        return isFormValid;
    };

    clearForm = () => {
        this.setState({
            id: null,
            method: 'GET',
            URL: '',
            parameters: [],
            postBody: '',
            headers: [],
            errors: {},
            isResponseReceived: false
        })
    };

    sendRequest = async () => {
        const isFormValid = this.checkValidation();
        if (!isFormValid) return;

        const {method, URL, headers, parameters, postBody} = this.state;
        const data = {method, URL, headers, parameters, postBody};

        let response = await fetch('/sendRequest', {
            method: 'post',
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(data)
        });
        if(response.status === 500) {
            const error = await response.text();
            alert(`Ошибка отправления запроа: ${error}`);
            return;
        }
        response = await response.json();
        this.setState({
            isResponseReceived: true,
            response
        });
    };

    getResponseHeaders = (headers) => {
        let result = [];
        for ( let key in headers ) {
            result.push(<li>{key}: {headers[key]}</li>)
        }
        return result;
    };

    render() {
        console.log('this.state: ', this.state);
        const {
            className,requestHeaders,setNewValue,setParameters,deleteParameter,addParameter,addHeader,setHeaders,deleteHeader,
            saveRequest,choseRequest,clearForm,sendRequest,getResponseHeaders,
            state: {requests,isResponseReceived,method,URL,postBody,parameters,headers,errors,response}
        } = this;

        return (
            <div className={className}>
                <div className={`${className}__requests`}>
                    {requests.length ?
                        requests.map( (item,idx) => (
                            <div key={idx} onClick={()=>choseRequest(item)}
                                 className={`${className}__requests__item ${item.method ==='GET' ? 'getItem' : 'postItem'}`}
                            >
                                <strong>Метод: {item.method}</strong>
                                <br/>
                                <strong>{item.URL}</strong>
                            </div>
                        ))
                        : <span>Сохраненных запросов нет</span>
                    }
                </div>
                <div className={`${className}__requestForm`}>
                    <div className={`${className}__requestForm__filling`}>
                        <div className={`${className}__mainData`}>
                            <div className={`${className}__mainData__method`}>
                                <div className={`${className}__label`}>Метод</div>
                                <select onChange={setNewValue} name={'method'} value={method}>
                                    <option value={'GET'}>GET</option>
                                    <option value={'POST'}>POST</option>
                                </select>
                            </div>
                            <div className={`${className}__mainData__url`}>
                                <div className={`${className}__label`}>URL</div>
                                <input type={'text'} placeholder={'URL'} onChange={setNewValue} name={'URL'} value={URL}/>
                                <span className={`${className}__error`}>{errors.URL}</span>
                            </div>
                        </div>
                        {
                            method === 'GET' ?
                                <div>
                                    {
                                        parameters.length ?
                                        <div>
                                            <h2 className={`${className}__label`}>Параметры</h2>
                                            {parameters.map( (item,idx) => (
                                                <div key={idx} className={`${className}__flexBlock`}>
                                                    <div className={`${className}__flexColumn`}>
                                                        <input type={'text'} value={item.key} placeholder={'Ключ'} name={'key'}
                                                               onChange={(e)=>setParameters(e,idx)}
                                                        />
                                                        <span className={`${className}__error`}>
                                                            {errors.parameters && errors.parameters[idx] ? errors.parameters[idx].key: null}
                                                        </span>
                                                    </div>
                                                    <div className={`${className}__flexColumn`}>
                                                        <input type={'text'} value={item.value} placeholder={'Значение'} name={'value'}
                                                               onChange={(e)=>setParameters(e,idx)}
                                                        />
                                                        <span className={`${className}__error`}>
                                                            {errors.parameters && errors.parameters[idx] ? errors.parameters[idx].value: null}
                                                        </span>
                                                    </div>
                                                    <span onClick={()=>deleteParameter(idx)} className={`${className}__error`}>Удалить</span>
                                                </div>
                                            ))}
                                        </div> : null
                                    }
                                    <div onClick={addParameter} className={`${className}__addOption`}>Добавить параметры</div>
                                </div> :
                                <div>
                                    <div className={`${className}__label`}>Тело запроса</div>
                                    <textarea value={postBody} name={'postBody'} onChange={setNewValue} placeholder={'Тело запроса'}
                                              style={{width: '100%'}}
                                    />
                                </div>
                        }
                    </div>
                    <div className={`${className}__headersBlock`}>
                        {
                            headers.length ?
                                <div>
                                    <h2 className={`${className}__label`}>Заголовки</h2>
                                    {headers.map( (item,idx) => (
                                        <div key={idx} className={`${className}__flexBlock`}>
                                            <div className={`${className}__flexColumn`}>
                                                <select value={item.header} onChange={(e)=>setHeaders(e,idx)}
                                                        name={'header'}
                                                >
                                                    <option value={''}/>
                                                    {requestHeaders.map( (header,id) => (
                                                        <option key={id} value={header}>{header}</option>
                                                    ))}
                                                </select>
                                                <span className={`${className}__error`}>
                                                    {errors.headers && errors.headers[idx] ? errors.headers[idx].header: null}
                                                </span>
                                            </div>
                                            <div className={`${className}__flexColumn`}>
                                                <input type={'text'} placeholder={'Значение'} value={item.value} name={'value'}
                                                       onChange={(e)=>setHeaders(e,idx)}
                                                />
                                                <span className={`${className}__error`}>
                                                    {errors.headers && errors.headers[idx] ? errors.headers[idx].value: null}
                                                </span>
                                            </div>
                                            <span onClick={()=>deleteHeader(idx)} className={`${className}__error`}>Удалить</span>
                                        </div>
                                    ))}
                                </div> :
                                null
                        }
                        <div onClick={addHeader} className={`${className}__addOption`}>Добавить заголовок</div>
                    </div>
                    <div className={`${className}__buttons`}>
                        <span onClick={saveRequest}>Сохранить запрос</span>
                        <span onClick={sendRequest}>Отправить запрос</span>
                        <span onClick={clearForm}>Очистить форму</span>
                    </div>
                    {isResponseReceived && <div className={`${className}__requestForm__answer`}>
                        <h2>Ответ на запрос:</h2>
                        <div className={`${className}__label`}>Статус ответа: <span>{response.status}</span></div>
                        <div className={`${className}__label`}>Заголовки ответа: <br/>
                        {<ul>
                            {getResponseHeaders(response.headers)}
                        </ul>}
                        </div>
                        <div className={`${className}__label`}>Тело ответа:<br/><textarea value={response.data} /></div>
                    </div>}
                </div>
            </div>
        )
    }
}

export default Front;