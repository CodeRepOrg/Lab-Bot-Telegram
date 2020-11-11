/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
  
 const ibm = require('ibm-cos-sdk');
 const fs = require('fs');
 const NLU = require('ibm-watson/natural-language-understanding/v1');
 const { IamAuthenticator } = require('ibm-watson/auth');
 
 const config = {
     endpoint: 'ENDPOINT COS',
     apiKeyId: 'APIKEY COS',
     serviceInstanceId: 'SERVICE INSTANCE ID COS'
 }
 
 const nlu = new NLU({
     version: '2020-04-01',
     authenticator: new IamAuthenticator({
         apikey: 'APIKEY NLU'
     }),
     serviceUrl: 'URL NLU'
 });
 
 function getDocs(name) {
     const cos = new ibm.S3(config);
     return cos.getObject({
         Key: name,
         Bucket: 'BUCKET'
     }).promise();
 }
 
 function main(params) {
     return new Promise((resolve, reject) => {
         console.log(JSON.stringify(params))
         getDocs(params.name)
             .then(data => {
                 console.log(data);
                 fs.writeFileSync('./x.txt', data.Body, { encoding: 'utf-8'})
                 const x = fs.readFileSync('./x.txt', { encoding: 'utf-8'}).replace(/\n/g, ' ')
                 console.log(x)
                 nlu.analyze({
                     text: x,
                     features: {
                         entities: {
                             mentions: true
                         }
                     }
                 }).then(extract => {
                     resolve(extract.result)
                 }).catch(err_nlu => {
                     reject({ msg: err_nlu })
                 })
             })
             .catch(err => {
                 console.error(err);
                 reject({ message: err });
             })
     });
 }
 