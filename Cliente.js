const net = require('net');
const readline = require('readline-sync');

var msg = "";
var clientData = "";
process.argv.forEach(function (val, index, array) { //función para recuperar parametros desde la consola y almacenarlos en un string y eso mandarselo al server
    clientData = clientData + '~' + val
});
var tokens = clientData.split('~')
//console.log(clientData)
//console.log(tokens)

const options = {
    port: 1234, //se puede sustituir por tokens[4]
    host: '127.0.0.1' //se puede sustituir por tokens[3]
} //opciones de conexión

const client = net.createConnection(options)

client.on('connect', ()=>{
    console.log('\n¡Conexión correcta!')
    console.log('Bienvenido ' + tokens[5])
    sendData() //enviar parametros al server
    sendLine() //enviar mensajes al server y a los clientes por primera vez
})

client.on('data', (data)=>{
    console.log('\n' + data)
    sendLine() //enviar mensajes al server y a los clientes por primera vez
})

client.on('error', (err)=>{
    sendCerrar()
})

client.on('close', ()=>{
    sendCerrar() //enviar salida al server
})

function sendLine(){ //función para enviar mensajes al server y a los otros clientes
    var line = readline.question('\nEscribe>\t')
    if(line == ""){
        client.end()
    }else{
        msg = 'm^' + tokens[5] + '@' + tokens[3] + '^-^' + line + '^'; //formato de mensaje regular
        client.write(msg)
    }
}

function sendData(){ //función para enviar la información del cliente al server
    if(clientData == "" || tokens[3] == "" || tokens[4] == "" || tokens[5] == ""){
        client.end()
    }else{
        msg = 'j^' + tokens[5] + '@' + tokens[3] + '^-^-^'; //formato de mensaje de union
        client.write(msg)
    }
}

function sendCerrar(){ //función para enviar mensajes al server y a los otros clientes
    msg = 'p^' + tokens[5] + '@' + tokens[3] + '^-^-^'; //formato de mensaje de partición
    client.write(msg)
}