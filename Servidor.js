const express = require('express');
const app = express();
//const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const url = require('url');
var usuarioActual = 0;

const db = new sqlite3.Database("./public/database/expressDB.db", (err) => {
  if (err) {
    console.log('No se puede conectar a la base de datos');
    console.log(err)
  } else {
    console.log('Conectado a la base de datos');
  }
});

//especificamos el subdirectorio donde se encuentran las páginas estáticas
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs'); //renderizar paginas con parametros
//extended: false significa que parsea solo string (no archivos de imagenes por ejemplo)

app.use(bodyParser.urlencoded({ extended: false }));

//app.use(express.json());

app.get('/', (req, res) => {
  res.render('index.ejs', { validacion: 'N' });
})
app.get('/Registro.ejs', (req, res) => {
  res.render('Registro.ejs', { validacion: 'N' });
})

app.post('/ExpressChat', (req, res) => {

  let correo = req.body.correo;
  let contrasena = req.body.contrasena;
  console.log(req.body)

  console.log(correo + " y " + contrasena);
  var entro = new Boolean(false);
  var idusuario;

  //autentificacion                                 falta hacer sessiones
  sql = 'SELECT * FROM usuarios WHERE correo = ?';
  db.get(sql, [correo], (err, row) => {
    if (err) {
      //res.status(400).json({ "error": err.message });
      console.log('error ' + err)
      return;
    } else {
      console.log(row)
      if (typeof row === 'undefined') {
        res.status(400);
        res.render('index.ejs', { validacion: 'I' })
      } else {
        if (correo == row.Correo && contrasena == row.Contrasena) {
          idusuario = row.IdUsuario;
          sql = 'SELECT * FROM Chats WHERE IdChat IN (SELECT IdChat FROM Participantes WHERE IdUsuario = ?)'
          db.all(sql, [idusuario], (err, rows) => {
            console.log('Entro al 2 db');
            if (err) {
              res.status(400).json({ "error": err.message });
              return;
            } else {
              usuarioActual = idusuario
              console.log(rows)
              res.status(200);
              res.render('Chat.ejs', { chats: rows });
            }
          })
        } else {
          res.status(400);
          res.render('index.ejs', { validacion: 'I' })
        }
      }

    }
  })
})

//este de registro ya sirve
app.post('/registro', (req, res) => {
  var reqBody = req.body;
  db.run('INSERT INTO Usuarios (Nombre, Correo, Contrasena, Administrador, Activo) VALUES(?, ?, ?, ?, ?);', [reqBody.nombre, reqBody.correo, reqBody.contrasena, 'U', 'S'], (err, result) => {
    if (err) {
      res.status(400);
      res.render('Registro.ejs', { validacion: 'I' });
      return;
    }
    res.status(200);
    res.render('Registro.ejs', { validacion: 'C' });
  });
})

app.get('/resultadosBusqueda', (req, res) => {
  let usuario = req.query.usuario;
  sql = 'SELECT * FROM Usuarios WHERE Nombre LIKE (?)';
  db.all(sql, ['%' + usuario + '%'], (err, rows) => {
    console.log('Entro al db');
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      console.log(rows);
      res.status(200);
      res.render('resultadosBusqueda.ejs', { users: rows, usuario: usuario });
    }
  })
})

app.get('/Chat/:idChat', function (req, res) {
  console.log(req.params.idChat);
  var idChat = req.params.idChat;
  sql = 'SELECT * FROM Mensajes WHERE IdChat = ?';
  db.all(sql, [idChat], (err, rows) => {
    console.log('Entro al db');
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      sql = 'SELECT * FROM Usuarios WHERE IdUsuario = ?';
      db.all(sql, [usuarioActual], (err, fila) => {
        if (err) {
          res.status(400).json({ "error": err.message });
          return;
        } else {
          sql = 'SELECT * FROM Usuarios u, Mensajes m WHERE u.IdUsuario != ? AND m.IdUsuario = u.IdUsuario';
          db.all(sql, [usuarioActual], (err, fila2) => {
            if (err) {
              res.status(400).json({ "error": err.message });
              return;
            } else {
              console.log(rows);
              console.log(fila);
              console.log(fila2);
              console.log(usuarioActual);
              res.status(200);
              res.render('Chat.ejs', { mensajes: rows, usuarios: fila, usuarios2: fila2 });
            }
          })
        }
      })
    }
  })
});


app.post('/chat/enviarMensaje', function (req, res) {
  console.log(req.body.mensajeEscrito);
  //obtener idchat
  //obtener id usuario


  // db.run('INSERT INTO Mensajes (Texto, IdChat, IdUsuario) VALUES(?, ?, ?);', [req.body.mensajeEscrito, IdChat, IdUsuario], (err, result)=>{
  //     if (err){
  //         res.status(400).json({"error":err.message});
  //         return;
  //     }else{

  //     }
  //     
  // });
});


app.listen(5000, () => { console.log('Servidor Web Iniciado'); });










// var users = [  //algo asi es lo que se obtiene de la bd, ya que obtenemos un json
    //     {
    //       'name': 'Edinson',
    //       'email': 'edinsoncode@example.com',
    //       'job': 'developer',
    //       'age': 24
    //     },
    //     {
    //       'name': 'Richard',
    //       'email': 'richard@example.com',
    //       'job': 'developer',
    //       'age': 24
    //     },
    // ]
    // res.render('chat.ejs', { users: users })








  //code servible para otras cosas
  // let correo =req.body.correo;
  // let contrasena = req.body.contrasena;
  // let pagina='<!doctype html><html><head></head><body>';
  //   pagina += `<a href="/mostrartabla?valor=${5}">El correo es ${correo} y la contraseña es ${contrasena}</a> - `;
  //   pagina += '</body></html>';
  //res.send(pagina);	




  // let usuario = req.query.usuario;                //code servible para otras cosas
  // let pagina = '<!doctype html><html><head></head><body>';
  //         // let num = req.query.valor;
  //         // num = parseInt(num);
  //         // let pagina = '<!doctype html><html><head></head><body>';
  //         // for (let x = 1; x <= 10; x++) {
  //         //   let tabla = num * x;
  //         //   pagina += `${num} * ${x} = ${tabla} <br>`;
  //         // }
  //         // pagina += '<a href="index.html">Retornar</a>';
  //         // pagina += '</body></html>';
  // pagina += `El usuario es ${usuario}`;
  // pagina += '</body></html>';
  // res.send(pagina);







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
