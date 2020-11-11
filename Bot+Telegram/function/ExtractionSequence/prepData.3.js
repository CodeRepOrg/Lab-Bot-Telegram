/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
  
 function Text(frase, entidades) {
    if (entidades.length == 1) {
        return frase + ' e ' + entidades.pop()
    }
    else {
        return Text(frase+entidades.pop()+', ', entidades)
    }
}

function main(params) {
    if (params.entities != undefined) {
        let subject = params.entities.map((i) => {
            return i.type
        });
        return {msg: Text('Encontrei as seguintes entidade: ', subject)}
    }
    else {
	    return { msg: 'Não consegui descobrir o assusnto do seu documento' };
    }
}
