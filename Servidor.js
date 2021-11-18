net = require('net');

var tokens, newData, msg;
var sockets = [];

const server = net.createServer()

server.on('connection', (socket)=>{
    //socket.write('Usuario: ' + socket.remoteAddress + ':' + socket.remotePort)
    sockets.push(socket) //hacer un array de socket conectados
    socket.on('data', (data)=>{
        if(data == 'superChat'){
            chat = socket;
        }else{
            newData = data.toString('utf-8');
            newData = newData.replace(/[^A-Za-z0-9.@\^\-\s]/g, "");
            tokens = newData.split('^');
            //console.log(newData)
            for(let i = 0; i < sockets.length; i++){
                if(tokens[0] == 'j'){
                    msg = 'm^Server@127.0.0.1^-^' + tokens[1].split('@')[0] + ' has joined from ' + tokens[1].split('@')[1] + '\n';
                }else if(tokens[0] == 'm'){
                    msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ': ' + tokens[3] + '\n';
                }else if(tokens[0] == 'p'){
                    msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ' has departed from the Server Chat\n';
                }
                sockets[i].write(msg);
            }
            //chat.write(msg);
            console.log(msg);
        }
    })
    socket.on('error', (err)=>{
        msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ' has departed from the Server Chat\n';
        console.log(msg);
    })
    socket.on('close', ()=>{
        msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ' has departed from the Server Chat\n';
        for(let i = 0; i < sockets.length; i++){
            sockets[i].write(msg);
        }
        socket.destroy();
    })
})

server.listen(1234, '127.0.0.1', ()=>{
    console.log('El servidor esta escuchando en la puerta ' + server.address().port + '\n');
})
