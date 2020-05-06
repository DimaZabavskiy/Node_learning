import React, {Fragment, PureComponent} from 'react';

import './Front.scss';

class Front extends PureComponent {

    state = {
        selectedFile: null,
        isUploading: false,
        fileDescription: '',
        total: 0,
        id: null,
        part: 0,
        requests: []
    };

    componentDidMount = async () => {
        this.setWSCoction();
        await this.requestsPrepare();
    };

    requestsPrepare = async () => {
        const response = await fetch('/savedRequests', {
            method: 'GET'
        });
        const data = await response.json();
        this.setState({requests: data});
        return data;
    };
    downLoadFile = async (path, name) => {
        try {
            const response = await fetch('/download', {
                method: 'post',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({path, name})
            });
            const answer = response.text();
            console.log('answer: ', answer);
        } catch (e) {
            alert(`Ошибка при скачивании файла: ${e.message}`)
        }
    };

    className = 'Front';

    setWSCoction = () => {

        const self = this;
        let total = 0;

        const url = 'ws://46.101.98.190:5665/';
        let connection = new WebSocket(url); // это сокет-соединение с сервером

        // connection.onopen = (event) => {
        //     console.log('connection.onopen');
        //     connection.send('hello from client to server!'); // можно послать строку, Blob или ArrayBuffer
        // };

        connection.onmessage = function (event) {
            let data = JSON.parse(event.data);
            switch (data.type) {
                case 'registration':
                    self.setState({
                        id: data.num,
                    });
                    break;
                case 'total':
                    total = data.num;
                    self.setState({
                        total: data.num,
                        isUploading: true
                    });
                    break;
                case 'part':
                    self.setState({
                        part: data.num
                    });
                    break;
                case 'happyEnd':
                    self.setState({
                        part: total
                    });
                    break;
            }
        };

        connection.onerror = error => {
            console.log('WebSocket error:',error);
        };

        connection.onclose = () => {
            console.log("соединение с сервером закрыто");
            connection=null;
        };
    };

    uploadFiles = async () => {
        if (!this.state.selectedFile) return;

        let formData=new FormData();
        formData.append("uploadfile",this.state.selectedFile);
        formData.append("fileDescription",this.state.fileDescription);

        try {
            const fetchOptions = {
                method: "post",
                body: formData,
            };
            let sendFileFetch = await fetch(`/service6?id=${this.state.id}`, fetchOptions);
            let sendFile = await sendFileFetch.json();

            this.setState({
                requests: sendFile.newSavedRequests,
                selectedFile: null,
                isUploading: false,
                fileDescription: '',
            });
        }
        catch ( er ) {
            alert("ошибка загрузки файла на сервер!\n"+er);
        }
    };
    selectFile = (e) => {
        this.setState({
            selectedFile: e.target.files[0]
        })
    };
    setFileDescription = (e) => {
        this.setState({
            fileDescription: e.target.value
        })
    };

    render() {
        const {
            className,uploadFiles,selectFile,setFileDescription,downLoadFile,
            state: {selectedFile,fileDescription,isUploading, total, part, requests}
        } = this;

        const uploadWidth = part && total ? Math.floor(part/total*200) : 0;
        return (
            <div className={className}>
                <div className={`${className}__form`}>
                    <div className={`${className}__form__files`}>
                        {selectedFile && selectedFile.name}
                        <br/>
                        <div className={`${className}__form__addFiles`}>{selectedFile ? 'Заменить файл' : 'Прикрепить файл'}</div>

                        <input className={`${className}__form__files__input`} id="supportUpload" type="file" onChange={selectFile}/>
                        <label className={`${className}__form__files__label`} htmlFor="supportUpload">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="31" height="31" rx="3.5" stroke="#CED4D8"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M17.5057 10.5437L18.9512 11.947L12.5423 18.3628C12.2207 18.6863 12.2207 19.2071 12.5423 19.5307C12.8475 19.8378 13.3573 19.8364 13.6592 19.529L20.7103 12.4674C21.7397 11.4318 21.7397 9.76857 20.7103 8.73294C19.7282 7.74484 17.9904 7.76682 17.0279 8.73482L9.33168 16.437C7.59409 18.1844 7.59409 20.9904 9.33168 22.7378C11.019 24.4346 13.9175 24.407 15.5784 22.7362L24.5544 13.749L26 15.1522L17.0256 24.1378C14.5771 26.6008 10.3719 26.6409 7.88297 24.1379C5.37205 21.6127 5.37205 17.562 7.8847 15.0352L15.5809 7.33301C17.3291 5.57494 20.3735 5.53644 22.1593 7.33316C23.9617 9.14642 23.9617 12.0539 22.1577 13.8688L15.1108 20.9262C14.0207 22.0361 12.197 22.0411 11.0932 20.9304C9.99882 19.8292 9.99882 18.0643 11.095 16.9612L17.5057 10.5437Z" fill="#0C273E" fillOpacity="0.5"/>
                            </svg>
                        </label>
                    </div>
                    <div className={`${className}__form__descr`}>
                        <textarea placeholder={'Описание файла'} value={fileDescription} onChange={setFileDescription}/>
                    </div>
                    {
                        !isUploading ?
                            <div className={`${className}__form__${selectedFile ? 'sendActive' : 'sendDisabled'}`} onClick={uploadFiles}>{selectedFile ? 'Отправить' : "Выберите файл"}</div> :
                            <div className={'upload'}>
                                <div className={'upload__process'} style={{width: `${uploadWidth}px`}} />
                            </div>
                    }
                </div>
                {
                    requests.length ?
                        <div className={`${className}__requests`}>
                            {requests.map( ({comment, fullPath, originName}, idx) =>{
                                console.log('fullPath: ', fullPath);
                                return <div key={idx} className={`${className}__requests__item`}>
                                    <form action={fullPath} method={'GET'} target={'_blank'}>
                                        <input type={'submit'} value={originName} className={`${className}__requests__item__name`}/>
                                    </form>
                                    {/*<div className={`${className}__requests__item__name`} onClick={()=>downLoadFile(fullPath,originName)}>{originName}</div>*/}
                                    <div className={`${className}__requests__item__comment`}>{comment}</div>
                                </div>}
                            )}
                        </div> : null
                }
            </div>
        )
    }
}

export default Front;