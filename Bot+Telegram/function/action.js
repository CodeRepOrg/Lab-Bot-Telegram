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
	    url: 'CLOUDANT_URL',
	    plugins: {
	        iamauth: {
	            iamApiKey: 'CLOUDANT_APIKEY'
	            }
	        }
	    });
    if (params.cadastro) {
        return new Promise((resolve, reject) => {
            cloudant.use('cadastro').insert({
                empresa: params.name,
                cnpj: params.cnpj,
                status: 'Ok'
            }, (err_insert, data) => {
                if (err_insert) reject(err_insert);
                else {
                    resolve({
                        msg: data
                    })
                }
            });
        });
    }
    else {
        return new Promise((resolve, reject) => {
            cloudant.use('cadastro').find({
                selector: {
                    empresa: params.name
                }
            }, (err_query, docs) => {
                // console.log(docs)
                if (err_query) reject(err_query)
                else if (docs.docs.length > 0) resolve({status: docs.docs[0]['status']});
                else resolve({ msg: 'Não existe cadastro' })
            })
        });
    }
}

