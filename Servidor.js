/* 
Integrantes:
  - García Vargas Michell Alejandro - 259663
  - Daniel Leon Paulin - 260541
Materia: Sistemas Distribuidos
Fecha: 10 de diciembre del 2021
Grupo: 30
Semestre: 5to
*/

/* Se importan las librerias con las que va a trabajar el servidor*/
const express = require('express'); /* Express para la creación de la API */
const app = express(); /* Creación de la Aplicación */
const bodyParser = require('body-parser'); /* BodyParser para poder acceder de manera sencilla a los datos POST enviados por el usuario */
const sqlite3 = require('sqlite3'); /* SQLite3 para la creación y manejo de la Base de Datos */
const session = require('express-session'); /* Express-Session para crear sesiones donde se almacenan los datos de la sesion de un usuario conectado */

/* Creación y/o conexión con la Base de Datos */
const db = new sqlite3.Database("./public/database/expressDB.db", (err) => {
  if (err) { /* En caso de que no se pueda conectar, se imprime el error en consola */
    console.log('No se puede conectar a la base de datos\n');
    console.log(err)
  } else { /* En caso de que si se pueda conectar, se imprime la validadción en consola */
    console.log('Conectado a la base de datos\n');
  }
});

/* .use para especificar el directorio donde se encuentran los archivos estáticos del servidor */
app.use(express.static(__dirname + '/public'));

/* .set para establecer la ruta/directorio donde se van a encontrar los archivos para las peticiones, y además, se especifica su extensión, renderizar páginas con parámetros */
app.set('view engine', 'ejs');

/* Formato para recibir datos de formularios HTML de manera correcta */
app.use(bodyParser.urlencoded({ extended: false }));

/* Se establece el id para todas las sesiones que se generen dentro del servidor, gracias a esto se pueden almacenar información en variables que se pueden utilizar específicamente del usuario conectado */
app.use(session({
  secret: 'ProySisDist123',
  resave: false,
  saveUninitialized: false,
}));

/* Función para renderizar la página inicial del servidor, en caso de no enviar nada en la petición */
app.get('/', (req, res) => {
  res.render('index.ejs', { validacion: 'N' });
});

/* Función para renderizar la página de registro de usuario, en caso de que se obtenga en la petición /Registro.ejs */
app.get('/Registro.ejs', (req, res) => {
  res.render('Registro.ejs', { validacion: 'N' });
});

/* Función para renderizar la página de incio nuevamente, pero esta vez con el objetivo de cerrar la sesión activa del usuario dentro del servidor */
app.get('/Logout', function (req, res) {
  req.session.destroy();
  res.status(200);
  res.redirect('/');
});

/* Función para validar los datos proporcionados por el usuario en el formulario, además, se consultan los datos del usuario actual y se guardan en variables de sesion para poderse ocupar en otras funciones */
app.post('/Login', (req, res) => {
  /* Variables que almacenen los datos enviados por el usuario en el formulario de index */
  let correo = req.body.correo;
  let contrasena = req.body.contrasena;
  var idusuario;
  var admin;
  var nombre                        
  sql = 'SELECT * FROM Usuarios WHERE Correo = ?;'; /* Se consultan los usuarios que tengan el correo proporcionado */
  db.get(sql, [correo], (err, row) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else {
      if (typeof row === 'undefined') { /* Si no se encuentra ningún usuario con este correo se regresa un estatus inválido y se renderiza la página index con un parámetro inválido */
        res.status(400);
        res.render('index.ejs', { validacion: 'I' });
      } else { /* Si se encuentra el correo */
        if (correo == row.Correo && contrasena == row.Contrasena) { /* Se verifica que la contraseña coincida con el correo proporcionado y se almacenan en variables de sesión los datos del usuario, y se redirecciona a la página principal de la API */
          idusuario = row.IdUsuario;
          admin = row.Administrador;
          nombre = row.Nombre;
          req.session.id_Usuario = idusuario
          req.session.admon = admin;
          req.session.nombre = nombre;
          res.status(200);
          res.redirect('/ExpressChat');
        } else { /* En caso de que no coincidan la contraseña y el correo, o sea que las credenciales no sean válidas, se regresa un estatus inválido y se renderiza la página index con un parámetro inválido */
          res.status(400);
          res.render('index.ejs', { validacion: 'I' });
        }
      }
    }
  });
});

/* Función para renderizar la página de chats, únicamanete mostrando los chats específicos donde el usuario actual participa */
app.get('/ExpressChat', (req, res) => {
  var idUsuarioActual = req.session.id_Usuario; /* Se almacena el id del usuario actual, extraido de la sesión */
  sql = 'SELECT * FROM Chats WHERE IdChat IN (SELECT IdChat FROM Participantes WHERE IdUsuario = ?);'; /* Se consultan los chats donde el usuario participa y se almacenan en una variable */
  db.all(sql, [idUsuarioActual], (err, rows) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma, se regresa un estatus correcto, y se renderiza en localhost la pagina de chats, en conjunto con los chats donde participa el usuario */
      res.status(200);
      res.render('Chat.ejs', { chats: rows });
    }
  });
});

/* Función para insertar en la base de datos un nuevo usuario en la tabla usuarios */
app.post('/registro', (req, res) => {
  var reqBody = req.body; /* Variable para extraer los datos proporcionados por el formulario de la página registro */
  /* Se inserta, en la tabla usuarios, el nuevo usuario con los parámetros mandados por el formulario de registro */
  db.run('INSERT INTO Usuarios (Nombre, Correo, Contrasena, Administrador) VALUES(?, ?, ?, ?);', [reqBody.nombre, reqBody.correo, reqBody.contrasena, 'U'], (err, result) => {
    if (err) { /* En caso de que la inserción falle se renderiza la página de registro con un parámetro inválido y un estatus de error */
      res.status(400);
      res.render('Registro.ejs', { validacion: 'I' });
      return;
    }else{ /* De otra forma, se regresa un estatus correcto, y se renderiza la página de registro con parámetro válido */
      res.status(200);
      res.render('Registro.ejs', { validacion: 'C' });
    }
  });
});

/* Función para mostrar los resultados de una busqueda específica sobre un usuario */
app.get('/resultadosBusqueda', (req, res) => {
  /* Variables que almacenan los datos enviados por el usuario en el formulario de búsqueda, y de la sesión del usuario actual */
  let usuario = req.query.usuario;
  var admin = req.session.admon
  var IdUsuarioActual = req.session.id_Usuario;
  sql = 'SELECT * FROM Usuarios WHERE Nombre LIKE ? AND IdUsuario <> ?;'; /* Se consultan los usuarios que tengan el mismo nombre buscado por el cliente en cuestión */
  db.all(sql, ['%' + usuario + '%', IdUsuarioActual], (err, rows) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma, se regresa un estatus correcto, y se renderiza la página de la búsqueda con los usuarios encontrados en la consulta */
      res.status(200);
      res.render('resultadosBusqueda.ejs', { users: rows, usuario: usuario, administrador: admin, validacion: 'N' });
    }
  });
});

/* Función para generar nuevos chats en base a los usaurios encontrados con la búsqueda de usuarios al seleccionar un usuario en específico */
app.get('/NuevoChat/:idUsuario/:nombre', function (req, res) {
  /* Variables que almacenan los datos enviados por el usuario al seleccionar a otro usuario y de la sesión del usuario actual */
  var idUsuario = req.params.idUsuario;
  var nombre = req.params.nombre;
  var nombreUsuarioActual = req.session.nombre;
  var idUsuarioActual = req.session.id_Usuario;
  var nombreChat = nombreUsuarioActual + ' - ' + nombre;
  var nombreChat2 = nombre + ' - ' + nombreUsuarioActual;
  /* Se busca que el chat seleccionado no exista ya */
  db.get('SELECT * FROM Chats WHERE NombreChat = ? OR NombreChat = ? ORDER BY IdChat ASC LIMIT 1;', [nombreChat, nombreChat2], (err, row) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else {
      if (typeof row === 'undefined') { /* En caso de que no se encuentre un chat con el usuario actual se genera uno nuevo */
        /* Se inserta un nuevo chat */
        db.run('INSERT INTO Chats (IdChat, NombreChat) VALUES(?, ?);', [, nombreChat], (err, result) => {
          if (err) { /* En caso de que la inserción falle, se regresa un estatus de error y se imprime la falla */
            res.status(400).json({ "error": err.message });
            return;
          } else {
            /* Se busca, el nuevo chat, recien creado */
            db.get('SELECT * FROM Chats WHERE NombreChat = ? ORDER BY IdChat ASC LIMIT 1;', [nombreChat], (err, row) => {
              if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                res.status(400).json({ "error": err.message });
                return;
              } else {
                /* Se inserta en el nuevo chat, el usuario seleccionado */
                db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [row.IdChat, idUsuario], (err, result2) => {
                  if (err) { /* En caso de que la inserción falle, se regresa un estatus de error y se imprime la falla */
                    res.status(400).json({ "error": err.message });
                    return;
                  }
                });
                /* Se inserta en el nuevo chat, el usuario actual */
                db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [row.IdChat, idUsuarioActual], (err, result2) => {
                  if (err) { /* En caso de que la inserción falle, se regresa un estatus de error y se imprime la falla */
                    res.status(400).json({ "error": err.message });
                    return;
                  }
                });
                /* Al terminar la creación del chat nuevo se redirige al usuario al chat con el id del nuevo chat */
                direccion = '/Chat/' + row.IdChat;
                res.redirect(direccion);
              }
            });
          }
        });
      } else { /* de otra forma el chat si existe, entonces únicamnete se redirige al usuario al chat con el id del chat ya creado */
        direccion = '/Chat/' + row.IdChat;
        res.redirect(direccion);
      }
    }
  });
});

/* Función para renderizar la página de chats con los mensajes y usuarios específicos de un chat seleccionado */
app.get('/Chat/:idChat', function (req, res) {
  /* Variables que almacenan los datos enviados por el usuario al seleccionar un chat en específico y de la sesión del usuario actual */
  var idChat = req.params.idChat;
  var usuarioActual = req.session.id_Usuario;
  sql = 'SELECT * FROM Chats c, Usuarios u, Participantes p WHERE c.IdChat = p.IdChat AND u.IdUsuario = p.IdUsuario AND u.IdUsuario = ? ORDER BY c.IdChat ASC;'; /* Se buscan los chats a los que el usuario pertenece */
  db.all(sql, [usuarioActual], (err, comprobar) => {
    if(err){ /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    }else{
      comprobar.forEach((fila) => { /* Se selecciona cada chat del usuario en cuestión */
        if(fila.IdChat == idChat) { /* Se valida que el usuario en realidad pertenezca a ese chat y no solo quiera entrar por url, y que el id del chat seleccionado si coincida con los chats donde el usuario participa */
          sql = 'SELECT * FROM Mensajes m, Usuarios u WHERE m.IdChat = ? AND m.IdUsuario = u.IdUsuario ORDER BY m.IdMensaje ASC;'; /* Se busca y seleccionan todos los mensajes y usuarios que pertenecen al chat en específico seleccionado */
          db.all(sql, [idChat], (err, rows) => {
            if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
              res.status(400).json({ "error": err.message });
              return;
            } else {
              sql = 'SELECT * FROM Chats WHERE IdChat = ?;'; /* Se seleccionan los datos del chat seleccionado */
              db.all(sql, [idChat], (err, rows2) => {
                if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                  res.status(400).json({ "error": err.message });
                  return;
                } else {
                  sql = 'SELECT * FROM Chats c, Usuarios u, Participantes p WHERE c.IdChat = p.IdChat AND u.IdUsuario = p.IdUsuario AND u.IdUsuario = ? ORDER BY c.IdChat ASC;'; /* Se seleccionan los chats del usuario, para seguir mostrandoselos en la página */
                  db.all(sql, [usuarioActual], (err, chatmenu) => {
                    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                      res.status(400).json({ "error": err.message });
                      return;
                    } else { /* De otra forma se envía un estatus válido y se renderiza la página chat con todos los mensajes y usaarios del chat seleccionado */
                      res.status(200);
                      res.render('Chat.ejs', { mensajes: rows, actual: usuarioActual, chatActual: rows2, chatMenu: chatmenu, idChatActual: idChat, administrador: comprobar });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

/* Función para enviar mensajes a un chat en específico seleccionado */
app.post('/chat/enviarMensaje/:idChat/:idUsuario', function (req, res) {
  /* Variables que almacenan los datos enviados por el usuario al escribir dentro del input del chat y que almacenan los datos y id del usuario que envia el mensaje y el id del chat a donde se envían */
  var mensaje = req.body.mensajeEscrito
  var idChat = req.params.idChat;
  var idUsuario = req.params.idUsuario;
  /* Se inserta el nuevo mensaje en la tabla de mensaje, especificando el chat a donde se envía y el usuario que lo envía */
  db.run('INSERT INTO Mensajes (Texto, IdChat, IdUsuario) VALUES(?, ?, ?);', [mensaje, idChat, idUsuario], (err, result) => {
    if (err) { /* En caso de que la inserción falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma se manda un estatus correcto y se redirige a la misma página */
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

 /* Función para crear nuevos chats y que posteriormente se puedan seleccionar los usuarios que van a participar en ese chat */
app.post('/NuevoGrupo', function (req, res) {
  /* Variables que almacenan los datos enviados por el usuario al crear un chat nuevo y de la sesión del usuario actual */
  var nombreGrupo = req.body.nombreGrupo;
  var idUsuarioActual = req.session.id_Usuario;
  /* Variables que almacenan los datos enviados por el usuario en el formulario de búsqueda, y de la sesión del usuario actual */
  let usuario = req.query.usuario;
  var admin = req.session.admon
  sql = 'SELECT * FROM Usuarios WHERE Nombre LIKE ? AND IdUsuario <> ?;'; /* Se consultan los usuarios que tengan el mismo nombre buscado por el cliente en cuestión */
  db.all(sql, ['%' + usuario + '%', idUsuarioActual], (err, rows) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { 
      /* Se inserta en la tabla chats el nuevo chat creado */
      db.run('INSERT INTO Chats (NombreChat) VALUES (?);', [nombreGrupo], (err, result) => {
        if (err) { /* En caso de que la inserción falle, se regresa un estatus de error y se envía un parámetro inválido */
          res.status(400);
          res.render('resultadosBusqueda.ejs', { users: rows, usuario: usuario, administrador: admin, validacion: 'I' });
          return;
        } else {
          setTimeout(function () { /* Se detiene la ejecución del código para que la base de datos alcance a crear el nuevo chat antes de proseguir con el código */
            /* Se selecciona el nuevo chat creado */
            db.get('SELECT * FROM Chats WHERE NombreChat = ? ORDER BY IdChat ASC;', [nombreGrupo], (err, idChat) => {
              if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                res.status(400).json({ "error": err.message });
                return;
              } else {
                /* Se selecciona el nuevo chat creado */
                db.all('SELECT * FROM Chats WHERE NombreChat = ? ORDER BY IdChat ASC;', [nombreGrupo], (err, chats) => {
                  if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                    res.status(400).json({ "error": err.message });
                    return;
                  } else {
                    /* Se seleccionan todos los usuarios menos el que creo el chat */
                    db.all('SELECT * FROM Usuarios WHERE IdUsuario != ?;', [idUsuarioActual], (err, infoUsuarios) => {
                      if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                        res.status(400).json({ "error": err.message });
                        return;
                      } else {
                        /* Se inserta en el nuevo chat creado, al usuario que creo el chat */
                        db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);', [idChat.IdChat, idUsuarioActual], (err, result2) => {
                          if (err) { /* En caso de que la inserción falle, se regresa un estatus de error y se imprime la falla */
                            res.status(400).json({ "error": err.message });
                            return;
                          } else { /* De otra forma se envía un estatus correcto y se renderiza a los participantes del chat nuevo, para que el usuario que creo el chat pueda seleccionar quien puede participar */
                            res.status(200);
                            res.render('participantesGrupo.ejs', { users: infoUsuarios, idChatAgregar: chats, nombreNuevoGrupo: nombreGrupo });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }, 2000);
        }
      });
    }
  });
});

/* Función para agregar participantes a un chat */
app.post('/agregarUsuario/:idChat/:idUsuario', (req, res) => {
  /* Variables que almacenan los datos enviados por el usuario al seleccionar a un participante y de la sesión del usuario actual */
  var idChat = req.params.idChat;
  var idUsuario = req.params.idUsuario;
  var idUsuarioActual = req.session.id_Usuario;
  sql = 'INSERT INTO Participantes (IdChat, IdUsuario) VALUES (?, ?);'; /* Se inserta en la tabla participantes, al nuevo usuario seleccionado que será parte del chat en específico */
  db.run(sql, [idChat, idUsuario], (err, result) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else {
      setTimeout(function () { /* Se detiene la ejecución del código para que la base de datos alcance a insertar al nuevo participante antes de proseguir con el código */
        sql = 'SELECT DISTINCT(u.IdUsuario), u.Nombre, u.Correo FROM Usuarios u, Participantes p WHERE u.IdUsuario != ? AND u.IdUsuario = p.IdUsuario AND u.IdUsuario NOT IN (SELECT IdUsuario FROM Participantes WHERE IdChat = ?);'; /* Se seleccionan a todos los usuarios que no pertenezcan a el chat en específico y que no sean el usaurio que creo el chat */
        db.all(sql, [idUsuarioActual, idChat], (err, infoUsuarios) => {
          if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
            res.status(400).json({ "error": err.message });
            return;
          } else {
            sql = 'SELECT * FROM Chats WHERE IdChat = ?;'; /* Se seleccionan todos los datos del chat en cuestión */
            db.all(sql, [idChat], (err, nombreGrupo) => {
              if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
                res.status(400).json({ "error": err.message });
                return;
              } else { /* De otra forma se renderiza la misma página, la de agregar usuarios, con los usuarios que aun estan disponible para poder agregar al chat y se envía un estatus de válido o correcto */
                res.status(200);
                res.render('participantesGrupo.ejs', { users: infoUsuarios, idChatAgregar: nombreGrupo });
              }
            });
          }
        });
      }, 2000);
    }
  });
});

/* Función para eliminar mensajes del usuario en cuestión */
app.get('/Chat/EliminarMensaje/:IdMensaje', function (req, res) {
  var IdMensaje = req.params.IdMensaje; /* Variable para seleccioanr el mensaje que se desea eliminar */
  sql = 'DELETE FROM Mensajes WHERE IdMensaje = ?;'; /* Se elimina el mensaje con un id específico */
  db.run(sql, [IdMensaje], (err, result) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma se manda un estatus correcto y se redirige a la misma página con el mensaje ya eliminado */
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

/* Función para modificar el texto de un mensaje en específico del usuario en cuestión */
app.get('/Chat/ModificarMensaje/:IdMensaje', function (req, res) {
  /* Variables para seleccionar el mensaje que se debe modificar y el texto nuevo */
  var IdMensaje = req.params.IdMensaje;
  var Texto = req.query.TextoMensajeModificar
  sql = "UPDATE Mensajes SET Texto = ? WHERE IdMensaje= ?"; /* Se modifica el texto de un mensaje en específico */
  db.run(sql, [Texto, IdMensaje], (err, result) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma se manda un estatus correcto y se redirige a la misma página con el mensaje ya modificado */
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

/* Función para eliminar chats del usuario en cuestión */
app.get('/Chat/EliminarChat/:IdChat', function (req, res) {
  var IdChat = req.params.IdChat; /* Variable para seleccioanr el chat que se desea eliminar */
  sql = 'DELETE FROM Chats WHERE IdChat = ?;'; /* Se elimina el chat con un id específico */
  db.run(sql, [IdChat], (err, result) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma se redirige a la página principal donde se encuentran todos los demas chats, que aun tiene el usaurio en cuestión */
      res.status(200);
      res.redirect('/ExpressChat');
    }
  });
});

/* Función para modificar el nombre de un chat en específico del usuario en cuestión */
app.get('/Chat/ModificarChat/:IdChat', function (req, res) {
  /* Variables para seleccionar el chat que se debe modificar y el nombre nuevo */
  var IdChat = req.params.IdChat;
  var Texto = req.query.TextoChatModificar
  sql = "UPDATE Chats SET NombreChat = ? WHERE IdChat= ?"; /* Se modifica el nombre de un chat en específico */
  db.run(sql, [Texto, IdChat], (err, result) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma se manda un estatus correcto y se redirige a la misma página con el nuevo nombre del chat */
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

/* Función para eliminar usuarios */
app.get('/EliminarUsuario/:IdUsuario', function (req, res) {
  var IdUsuario = req.params.IdUsuario; /* Variable para seleccioanr el usuario que se desea eliminar */
  sql = 'DELETE FROM Usuarios WHERE IdUsuario = ?;'; /* Se elimina el usuario con un id específico */
  db.run(sql, [IdUsuario], (err, result) => {
    if (err) { /* En caso de que la consulta falle, se regresa un estatus de error y se imprime la falla */
      res.status(400).json({ "error": err.message });
      return;
    } else { /* De otra forma se manda un estatus correcto y se redirige a la misma página */
      res.status(200);
      res.redirect(req.get('referer'));
    }
  });
});

/* Funcion para renderizar al usuario, el estatus incorrecto o no encontrado, con la página Error404, en caso de que escriba un url o haga una petición que no se específico dentro del servidor */
app.get('*', function (req, res) {
  res.status(404);
  res.render('Error404.ejs');
});

/* Se establece el puerto de conexión del servidor en el localhost:5000, y se imprime un mensaje de conexión correcta al servidor */
app.listen(5000, () => { console.log('Servidor Web Iniciado'); });