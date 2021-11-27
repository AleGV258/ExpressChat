const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

//especificamos el subdirectorio donde se encuentran las páginas estáticas
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs'); //renderizar paginas con parametros
//extended: false significa que parsea solo string (no archivos de imagenes por ejemplo)

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/ExpressChat', (req, res) => {
  //autentificacion

  //tokens para identificar usuario en toda la API

      //code servible para otras cosas
      // let correo =req.body.correo;
      // let contrasena = req.body.contrasena;
      // let pagina='<!doctype html><html><head></head><body>';
      //   pagina += `<a href="/mostrartabla?valor=${5}">El correo es ${correo} y la contraseña es ${contrasena}</a> - `;
      //   pagina += '</body></html>';
      //res.send(pagina);	

    var users = [  //algo asi es lo que se obtiene de la bd, ya que obtenemos un json
      {
        'name': 'Edinson', 
        'email': 'edinsoncode@example.com',
        'job': 'developer',
        'age': 24 
      },
      {
        'name': 'Richard', 
        'email': 'richard@example.com',
        'job': 'developer',
        'age': 24 
      },
      {
        'name': 'Luis', 
        'email': 'luis@example.com',
        'job': 'developer',
        'age': 24 
      },    
      {
        'name': 'Edinson', 
        'email': 'edinsoncode@example.com',
        'job': 'developer',
        'age': 24 
      },
      {
        'name': 'Richard', 
        'email': 'richard@example.com',
        'job': 'developer',
        'age': 24 
      },
      {
        'name': 'Luis', 
        'email': 'luis@example.com',
        'job': 'developer',
        'age': 24 
      },   
      {
        'name': 'Edinson', 
        'email': 'edinsoncode@example.com',
        'job': 'developer',
        'age': 24 
      },
      {
        'name': 'Richard', 
        'email': 'richard@example.com',
        'job': 'developer',
        'age': 24 
      },
      {
        'name': 'Luis', 
        'email': 'luis@example.com',
        'job': 'developer',
        'age': 24 
      },   
  ]
  res.render('chat.ejs',{users: users})    
  
  //se pueden agregar parametros res.render('chat.ejs',{algo: algo});
        //http://expressjs.com/en/api.html#res.render
})

app.get('/resultadosBusqueda', (req, res) => {
  let usuario = req.query.usuario;
  let pagina = '<!doctype html><html><head></head><body>';
          // let num = req.query.valor;
          // num = parseInt(num);
          // let pagina = '<!doctype html><html><head></head><body>';
          // for (let x = 1; x <= 10; x++) {
          //   let tabla = num * x;
          //   pagina += `${num} * ${x} = ${tabla} <br>`;
          // }
          // pagina += '<a href="index.html">Retornar</a>';
          // pagina += '</body></html>';
  pagina += `El usuario es ${usuario}`;
  pagina += '</body></html>';
  res.send(pagina);
})

var server = app.listen(5000, () => {
  console.log('Servidor Web Iniciado');
});










// net = require('net');

// var tokens, newData, msg;
// var sockets = [];

// const server = net.createServer()

// server.on('connection', (socket)=>{
//     //socket.write('Usuario: ' + socket.remoteAddress + ':' + socket.remotePort)
//     sockets.push(socket) //hacer un array de socket conectados
//     socket.on('data', (data)=>{
//         if(data == 'superChat'){
//             chat = socket;
//         }else{
//             newData = data.toString('utf-8');
//             newData = newData.replace(/[^A-Za-z0-9.@\^\-\s]/g, "");
//             tokens = newData.split('^');
//             //console.log(newData)
//             for(let i = 0; i < sockets.length; i++){
//                 if(tokens[0] == 'j'){
//                     msg = 'm^Server@127.0.0.1^-^' + tokens[1].split('@')[0] + ' has joined from ' + tokens[1].split('@')[1] + '\n';
//                 }else if(tokens[0] == 'm'){
//                     msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ': ' + tokens[3] + '\n';
//                 }else if(tokens[0] == 'p'){
//                     msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ' has departed from the Server Chat\n';
//                 }
//                 sockets[i].write(msg);
//             }
//             //chat.write(msg);
//             console.log(msg);
//         }
//     })
//     socket.on('error', (err)=>{
//         msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ' has departed from the Server Chat\n';
//         console.log(msg);
//     })
//     socket.on('close', ()=>{
//         msg = 'm^Server@127.0.01^-^' + tokens[1].split('@')[0] + ' has departed from the Server Chat\n';
//         for(let i = 0; i < sockets.length; i++){
//             sockets[i].write(msg);
//         }
//         socket.destroy();
//     })
// })

// server.listen(1234, '127.0.0.1', ()=>{
//     console.log('El servidor esta escuchando en la puerta ' + server.address().port + '\n');
// })
