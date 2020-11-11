const TG = require('telegram-bot-api');
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

const fetch = require('node-fetch');
const fs = require('fs');

const ibm = require('ibm-cos-sdk');

require('dotenv').config();

const config = {
    endpoint: process.env.COS_ENDPOINT,
    apiKeyId: process.env.COS_APIKEY,
    serviceInstanceId: process.env.COS_RESOURCE
}

const cos = new ibm.S3(config);

const assistant = new AssistantV2({
    version: '2020-04-01',
    authenticator: new IamAuthenticator({
        apikey: process.env.ASSISTANT_APIKEY
    }),
    serviceUrl: process.env.ASSISTANT_URL
});

const api = new TG({
    token: process.env.TELEGRAM_TOKEN
});

let session = null;
let sessionRenew = true;

api.setMessageProvider(new TG.GetUpdateMessageProvider())
api.start()
    .then(() => {
        console.log('API started');
    })
    .catch(err => console.error(err));

api.on('update', (update) => {
    console.log(JSON.stringify(update));
    const chat_id = update.message.chat.id

    if (update.message.document != undefined) {
        console.log('yup')
        api.getFile({
            file_id: update.message.document.file_id
        })
        .then(a => {
            console.log(JSON.stringify(a));
            fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${a.file_path}`)
            .then(res => res.buffer())
            .then(buffer_data => {
                // fs.writeFileSync('./a.pdf', buffer_data)
                doCreateObject(buffer_data, update.message.document.file_name)
                    .then(ok => {
                        api.sendMessage({
                            chat_id: chat_id,
                            text: 'Upload realizado com sucesso'
                        });
                        fetch(process.env.API_URL, {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ name: update.message.document.file_name }),
                            json: true
                        })
                        .then(send => send.json())
                        .then(resp_api => {
                            console.log(JSON.stringify(resp_api))
                            api.sendMessage({
                                chat_id: chat_id,
                                text: resp_api.msg
                            });
                        })
                        .catch(err_api => {
                            console.error(JSON.stringify(err_api));
                            api.sendMessage({
                                chat_id: chat_id,
                                text: 'Não foi possivel extrair informações do documento'
                            });
                        })
                    })
                    .catch(not_ok => console.error(not_ok))
            })
            .catch(error_fetch => console.error(error_fetch));
        })
        .catch(error => console.error(error))
    }

    else {
        if (sessionRenew) {
            assistant.createSession({
                assistantId: process.env.ASSISTANT_ASSISTANT_ID,
            })
            .then(sessionO => {
                console.log(sessionO)
                session = sessionO.result.session_id
                sessionRenew = false
    
                assistant.message({
                    assistantId: process.env.ASSISTANT_ASSISTANT_ID,
                    sessionId: sessionO.result.session_id,
                    input: {
                        message_type: 'text',
                        text: update.message.text
                    }
                })
                .then(resp => {
                    console.log(JSON.stringify(resp))
                    api.sendMessage({
                        chat_id: chat_id,
                        text: resp.result.output.generic[0].text
                    });
                })
                .catch(err => {
                    console.log(err)
                    sessionRenew = true
                    api.sendMessage({
                        chat_id: chat_id,
                        text: "Nope"
                    });
                })
            })
            .catch(err => console.error(err))
        }
        else {
            assistant.message({
                assistantId: process.env.ASSISTANT_ASSISTANT_ID,
                sessionId: session,
                input: {
                    message_type: 'text',
                    text: update.message.text
                }
            })
            .then(resp => {
                console.log(JSON.stringify(resp))
                api.sendMessage({
                    chat_id: chat_id,
                    text: resp.result.output.generic[0].text
                });
            })
            .catch(err => {
                console.log(err)
                sessionRenew = true
                api.sendMessage({
                    chat_id: chat_id,
                    text: "Nope"
                });
            })
        }
    }
});


function doCreateObject(data, name) {
    console.log('Creating object');
    return cos.putObject({
        Bucket: process.env.COS_BUCKET,
        Key: name,
        Body: data
    }).promise();
}