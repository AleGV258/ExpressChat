const express = require('express');
const app = express();
//const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const url = require('url');
const session = require('express-session');
const { Console } = require('console');

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

app.use(session({
  secret: 'ProySisDist123',
  resave: false,
  saveUninitialized: false,
}))

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
  //var entro = new Boolean(false);
  var idusuario;

  //autentificacion                                
  sql = 'SELECT * FROM Usuarios WHERE Correo = ?;';
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
          sql = 'SELECT * FROM Chats WHERE IdChat IN (SELECT IdChat FROM Participantes WHERE IdUsuario = ?);'
          db.all(sql, [idusuario], (err, rows) => {
            console.log('Entro al 2 db');
            if (err) {
              res.status(400).json({ "error": err.message });
              return;
            } else {

              req.session.id_Usuario = idusuario

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
  sql = 'SELECT * FROM Usuarios WHERE Nombre LIKE (?);';
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
  var idChat = req.params.idChat;
  var usuarioActual = req.session.id_Usuario;
  sql = 'SELECT * FROM Chats c, Usuarios u, Participantes p WHERE c.IdChat = p.IdChat AND u.IdUsuario = p.IdUsuario AND u.IdUsuario = ? ORDER BY c.IdChat ASC;';
  db.all(sql, [usuarioActual], (err, comprobar) => {
    if(err){
      res.status(400).json({ "error": err.message });
      return;
    }else{
      comprobar.forEach((fila) => {
        if(fila.IdChat == idChat){
          sql = 'SELECT * FROM Mensajes m, Usuarios u WHERE m.IdChat = ? AND m.IdUsuario = u.IdUsuario ORDER BY m.IdMensaje ASC;';
          db.all(sql, [idChat], (err, rows) => {
            console.log('Entro al db');
            if(err){
              res.status(400).json({ "error": err.message });
              return;
            }else{
              sql = 'SELECT * FROM Chats WHERE IdChat = ?;';
              db.all(sql, [idChat], (err, rows2) => {
                if(err){
                  res.status(400).json({ "error": err.message });
                  return;
                }else{
                  sql = 'SELECT * FROM Chats c, Usuarios u, Participantes p WHERE c.IdChat = p.IdChat AND u.IdUsuario = p.IdUsuario AND u.IdUsuario = ? ORDER BY c.IdChat ASC;';
                  db.all(sql, [usuarioActual], (err, chatmenu) => {
                    if(err){
                      res.status(400).json({ "error": err.message });
                      return;
                    }else{
                      res.status(200);
                      res.render('Chat.ejs', { mensajes: rows, actual: usuarioActual, chatActual: rows2, chatMenu: chatmenu });
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
});

app.post('/chat/enviarMensaje/:idChat/:idUsuario', function (req, res) {
  // console.log(req.body.mensajeEscrito);
  // console.log(req.params.idChat);
  // console.log(req.params.idUsuario);
  var mensaje = req.body.mensajeEscrito
  var idChat = req.params.idChat;
  var idUsuario = req.params.idUsuario;

  db.run('INSERT INTO Mensajes (Texto, IdChat, IdUsuario) VALUES(?, ?, ?);', [mensaje, idChat, idUsuario], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

//esto
app.post('/NuevoGrupo', function (req, res) {
  var nombreGrupo = req.body.nombreGrupo;
  var idUsuarioActual = req.session.id_Usuario;

  db.run('INSERT INTO Chats (NombreChat) VALUES (?);', [nombreGrupo], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      setTimeout(function(){
        db.all('SELECT * FROM Chats WHERE NombreChat = ?;', [nombreGrupo], (err, idChat) => {
          if (err) {
            res.status(400).json({ "error": err.message });
            return;
          } else {
            db.all('SELECT * FROM Usuarios WHERE IdUsuario != ?;', [idUsuarioActual], (err, infoUsuarios) => {
              if (err) {
                res.status(400).json({ "error": err.message });
                return;
              } else {
                res.status(200);
                res.render('participantesGrupo.ejs', { users: infoUsuarios, idChatAgregar: idChat });
              }
            })
          }
        })
      },2000);
    }
  })
});

app.post('/agregarUsuario/:idChat/:idUsuario', (req, res) => {
  var idChat = req.params.idChat;
  var idUsuario = req.params.idUsuario;
  var idUsuarioActual = req.session.id_Usuario;
  
  db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [idChat, idUsuarioActual], (err, result2) => {if (err) {}})
  sql = 'INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?,?);';
  db.run(sql, [idChat, idUsuario], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      setTimeout(function(){
        sql = 'SELECT DISTINCT(u.IdUsuario), u.Nombre, u.Correo FROM Usuarios u, Participantes p WHERE u.IdUsuario != ? AND u.IdUsuario = p.IdUsuario AND u.IdUsuario NOT IN (SELECT IdUsuario FROM Participantes WHERE IdChat = ?);';
        db.all(sql, [idUsuarioActual, idChat], (err, infoUsuarios) => {
          if (err) {
            res.status(400).json({ "error": err.message });
            return;
          } else {
            sql = 'SELECT * FROM Chats WHERE IdChat = ?;';
            db.all(sql, [idChat], (err, nombreGrupo) => {
              if (err) {
                res.status(400).json({ "error": err.message });
                return;
              } else {
                res.status(200);
                res.render('participantesGrupo.ejs', { users: infoUsuarios, idChatAgregar: nombreGrupo });
              }
            })
          }
        })
      },2000);
    }
  });
})

// app.get('*', function(req, res){
//   res.status(404);
//   res.render('Error404.ejs');
// });

app.listen(5000, () => { console.log('Servidor Web Iniciado'); });


















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
