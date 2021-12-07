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
    console.log('Conectado a la base de datos\n');
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


app.post('/Login', (req, res) => {
  let correo = req.body.correo;
  let contrasena = req.body.contrasena;

  var idusuario;
  var admin;
  var nombre
  //autentificacion                                
  sql = 'SELECT * FROM Usuarios WHERE Correo = ?;';
  db.get(sql, [correo], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      if (typeof row === 'undefined') {
        res.status(400);
        res.render('index.ejs', { validacion: 'I' })
      } else {
        if (correo == row.Correo && contrasena == row.Contrasena) {
          idusuario = row.IdUsuario;
          admin = row.Administrador;
          nombre = row.Nombre;
          req.session.id_Usuario = idusuario
          req.session.admon = admin;
          req.session.nombre = nombre;
          res.status(200);
          res.redirect('/ExpressChat');
          //res.send('<script>window.location.href="/ExpressChat";</script>');

        } else {
          res.status(400);
          res.render('index.ejs', { validacion: 'I' })
        }
      }

    }
  })
})

app.get('/ExpressChat', (req, res) => {
  var idUsuarioActual = req.session.id_Usuario;
  sql = 'SELECT * FROM Chats WHERE IdChat IN (SELECT IdChat FROM Participantes WHERE IdUsuario = ?);';
  db.all(sql, [idUsuarioActual], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.render('Chat.ejs', { chats: rows });
    }
  })
})

app.post('/registro', (req, res) => {
  var reqBody = req.body;
  db.run('INSERT INTO Usuarios (Nombre, Correo, Contrasena, Administrador) VALUES(?, ?, ?, ?, ?);', [reqBody.nombre, reqBody.correo, reqBody.contrasena, 'U'], (err, result) => {
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
  var IdUsuarioActual = req.session.id_Usuario;
  sql = 'SELECT * FROM Usuarios WHERE Nombre LIKE ? AND IdUsuario <> ?;';
  db.all(sql, ['%' + usuario + '%', IdUsuarioActual], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.render('resultadosBusqueda.ejs', { users: rows, usuario: usuario });
    }
  })
})

app.get('/NuevoChat/:idUsuario/:nombre', function (req, res) {
  console.log('Funciona')
  var idUsuario = req.params.idUsuario;
  var nombre = req.params.nombre;
  var nombreUsuarioActual = req.session.nombre;
  var idUsuarioActual = req.session.id_Usuario;

  var nombreChat = nombreUsuarioActual + ' - ' + nombre;
  var nombreChat2 = nombre + ' - ' + nombreUsuarioActual;
  db.get('SELECT * FROM Chats WHERE NombreChat = ? OR NombreChat = ? ORDER BY IdChat ASC LIMIT 1;', [nombreChat, nombreChat2], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      if (typeof row === 'undefined') {
        console.log('No encontro un chat con el usuario')
        db.run('INSERT INTO Chats (IdChat, NombreChat) VALUES( ?, ?);', [, nombreChat], (err, result) => {
          if (err) {
            res.status(400).json({ "error": err.message });
            return;
          } else {
            db.get('SELECT * FROM Chats WHERE NombreChat = ? ORDER BY IdChat ASC LIMIT 1;', [nombreChat], (err, row) => {
              if (err) {
                res.status(400).json({ "error": err.message });
                return;
              } else {

                db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [row.IdChat, idUsuario], (err, result2) => {
                  if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                  }
                })
                db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [row.IdChat, idUsuarioActual], (err, result2) => {
                  if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                  }
                })
                
                direccion = '/Chat/' + row.IdChat;
                res.redirect(direccion);
              }
            })
          }
        });
      } else {
        console.log('Si encontro ya un chat con el usuario')

        direccion = '/Chat/' + row.IdChat;
        res.redirect(direccion);
      }
    }
  })



});

app.get('/Chat/:idChat', function (req, res) {
  var idChat = req.params.idChat;
  var usuarioActual = req.session.id_Usuario;
  sql = 'SELECT * FROM Chats c, Usuarios u, Participantes p WHERE c.IdChat = p.IdChat AND u.IdUsuario = p.IdUsuario AND u.IdUsuario = ? ORDER BY c.IdChat ASC;';
  db.all(sql, [usuarioActual], (err, comprobar) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      comprobar.forEach((fila) => {
        if (fila.IdChat == idChat) {
          sql = 'SELECT * FROM Mensajes m, Usuarios u WHERE m.IdChat = ? AND m.IdUsuario = u.IdUsuario ORDER BY m.IdMensaje ASC;';
          db.all(sql, [idChat], (err, rows) => {
            if (err) {
              res.status(400).json({ "error": err.message });
              return;
            } else {
              sql = 'SELECT * FROM Chats WHERE IdChat = ?;';
              db.all(sql, [idChat], (err, rows2) => {
                if (err) {
                  res.status(400).json({ "error": err.message });
                  return;
                } else {
                  sql = 'SELECT * FROM Chats c, Usuarios u, Participantes p WHERE c.IdChat = p.IdChat AND u.IdUsuario = p.IdUsuario AND u.IdUsuario = ? ORDER BY c.IdChat ASC;';
                  db.all(sql, [usuarioActual], (err, chatmenu) => {
                    if (err) {
                      res.status(400).json({ "error": err.message });
                      return;
                    } else {
                      res.status(200);
                      res.render('Chat.ejs', { mensajes: rows, actual: usuarioActual, chatActual: rows2, chatMenu: chatmenu, idChatActual: idChat, administrador: comprobar });
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



app.post('/NuevoGrupo', function (req, res) {
  var nombreGrupo = req.body.nombreGrupo;
  var idUsuarioActual = req.session.id_Usuario;
  db.run('INSERT INTO Chats (NombreChat) VALUES (?);', [nombreGrupo], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      setTimeout(function () {
        db.get('SELECT * FROM Chats WHERE NombreChat = ? ORDER BY IdChat ASC;', [nombreGrupo], (err, idChat) => {
          if (err) {
            res.status(400).json({ "error": err.message });
            return;
          } else {
            db.all('SELECT * FROM Chats WHERE NombreChat = ? ORDER BY IdChat ASC;', [nombreGrupo], (err, chats) => {
              if (err) {
                res.status(400).json({ "error": err.message });
                return;
              } else {
                db.all('SELECT * FROM Usuarios WHERE IdUsuario != ?;', [idUsuarioActual], (err, infoUsuarios) => {
                  if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                  } else {
                    db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [idChat.IdChat, idUsuarioActual], (err, result2) => {
                      if (err) {
                        res.status(400).json({ "error": err.message });
                        return;
                      } else {
                        res.render('participantesGrupo.ejs', { users: infoUsuarios, idChatAgregar: chats, nombreNuevoGrupo: nombreGrupo });
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }, 2000);
    }
  })
});

app.post('/agregarUsuario/:idChat/:idUsuario', (req, res) => {
  var idChat = req.params.idChat;
  var idUsuario = req.params.idUsuario;
  var idUsuarioActual = req.session.id_Usuario;

  sql = 'INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?,?);';
  db.run(sql, [idChat, idUsuario], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      setTimeout(function () {
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
      }, 2000);
    }
  });
})

app.get('/Chat/EliminarMensaje/:IdMensaje', function (req, res) {
  var IdMensaje = req.params.IdMensaje;
  sql = 'DELETE FROM Mensajes WHERE IdMensaje = ?;';
  db.run(sql, [IdMensaje], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

app.get('/Chat/ModificarMensaje/:IdMensaje', function (req, res) {
  var IdMensaje = req.params.IdMensaje;
  var Texto = req.query.TextoMensajeModificar
  console.log('El nuevo mensaje es : ' + req.query.TextoMensajeModificar)
  sql = "UPDATE Mensajes  SET Texto = ? WHERE IdMensaje= ?";
  db.run(sql, [Texto, IdMensaje], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

app.get('/Chat/EliminarChat/:IdChat', function (req, res) {
  var IdChat = req.params.IdChat;
  sql = 'DELETE FROM Chats WHERE IdChat = ?;';
  db.run(sql, [IdChat], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.redirect('/ExpressChat');
    }
  });
});

app.get('/Chat/ModificarChat/:IdChat', function (req, res) {
  var IdChat = req.params.IdChat;
  var Texto = req.query.TextoChatModificar
  console.log('El nuevo chat es : ' + req.query.TextoChatModificar)
  sql = "UPDATE Chats SET NombreChat = ? WHERE IdChat= ?";
  db.run(sql, [Texto, IdChat], (err, result) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    } else {
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

app.get('*', function (req, res) {
  res.status(404);
  res.render('Error404.ejs');
});

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
