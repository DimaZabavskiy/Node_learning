import React, {Fragment, PureComponent} from 'react';

import './Front.scss';

class Front extends PureComponent {

    state = {
        isDataReady: false,
        isAnswerReady: false
    };

    componentDidMount = async () => {
        await this.dataBasePrepare();
    };

    dataBasePrepare = async () => {
        await this.sendRequest('show databases;');
    };

    className = 'Front';

    sendRequest = async (text) => {
        const {sqlDatabase} = this.state;
        let sendingBody = {text,database:sqlDatabase};

        try {
            const response = await fetch(`/sendRequest`, {
                method: 'post',
                body: JSON.stringify(sendingBody),
                headers: {
                    ['Content-Type']: 'application/json;charset=UTF-8',
                }
            });
            const result = await response.json();
            console.log('result: ', result);
            const {type, body} = result;

            switch (type) {
                case 'database':
                    this.setState({
                        database: body,
                        isDataReady: true
                    });
                    break;
                case 'text':
                    this.setState({
                        text: body,
                        isAnswerReady: true
                    });
                    break;
                case 'fullInfo':
                    this.setState({
                        fullInfo: body,
                        isAnswerReady: true
                    });
                    break;
            }

        } catch (e) {
            alert(`Ошибка при отправлении запроса ${e.message}`)
        }
    };

    setValue = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
            isAnswerReady: false,
            text: '',
            fullInfo: [],
        })
    };

    preSendRequest = async () => {
        const {sqlText,sqlDatabase} = this.state;
        if (!sqlText) return alert('Введите SQL-запрос в соответствующее поле');
        if (!sqlDatabase) return alert('Выберите базу данных');
        await this.sendRequest(sqlText);
    };

    renderTableItem = (item, tag) => {
        let result = [];
        for (let key in item) {
            switch (tag) {
                case 'td':
                    result.push(<td key={Math.random()}>{item[key]}</td>)
                    break;
                case 'th':
                    result.push(<th key={Math.random()}>{key}</th>)
                    break;
            }
        }
        return result;
    };

    render() {
        const {
            className,setValue,preSendRequest,
            state: {isDataReady, database, text, fullInfo, isAnswerReady}
        } = this;

        console.log('this.state: ', this.state);

        if (!isDataReady) return null;

        return (
            <div className={className}>
                <div className={`${className}__database`}>
                    <div className={`${className}__database`}>Выберите базу данных:</div>
                    <select onChange={setValue} name={'sqlDatabase'}>
                        <option value={''}/>
                        {database.map( (base, idx) => (
                            <option key={idx} value={base.Database}>{base.Database}</option>
                        ))}
                    </select>
                </div>

                <div className={`${className}__textarea`}>
                    <textarea onChange={setValue} name={'sqlText'} placeholder={'Введите SQL-запрос'}/>
                </div>

                <input type={'button'} value={'Отправить запрос'} className={`${className}__sendButton`} onClick={preSendRequest}/>

                {
                    isAnswerReady &&
                    <div className={`${className}__answer`}>
                        <h2>Результат запроса</h2>
                        {
                            text ?
                            <div>{text}</div> : null
                        }
                        {
                            fullInfo.length ?
                            <table>
                                <tbody>
                                <tr>{this.renderTableItem(fullInfo[0], 'th')}</tr>
                                {fullInfo.map( (itemData, idx) =>(
                                    <tr key={idx}>
                                        {this.renderTableItem(itemData, 'td')}
                                    </tr>
                                ))}
                                </tbody>
                            </table> : null
                        }
                    </div>
                }
            </div>
        )
    }
}

export default Front;