/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
 const Cloudant = require('@cloudant/cloudant');
 function main(params) {
     const cloudant = new Cloudant({
         url: 'CLOUDANT URL',
         plugins: {
             iamauth: {
                 iamApiKey: 'CLOUDANT APIKEY'
                 }
             }
         });
     return new Promise((resolve, reject) => {
         cloudant.use('CLOUDANT DB').insert(params, (err_insert, data) => {
             if (err_insert) reject(err_insert);
             else {
                 resolve(params)
             }
         });
     });
 }
 
 