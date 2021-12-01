const express = require("express");
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("./public/database/expressDB.db", (err)=>{
    if (err) {
        console.log('No se puede conectar a la base de datos');
    } else {
        console.log('Conectado a la base de datos de ExpressChat');
    }
});

const app = express();
app.use(express.json());

//Funciones para obtener todos los datos de las tablas
app.get('/Chats/', function (req, res) {
    db.all("SELECT * FROM Chats;", [], (err, rows) =>{        
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({rows});
    })
});
app.get('/Usuarios/', function (req, res) {
    db.all("SELECT * FROM Usuarios;", [], (err, rows) =>{        
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({rows});
    })
});
app.get('/Participantes/', function (req, res) {
    db.all("SELECT * FROM Participantes;", [], (err, rows) =>{        
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({rows});
    })
});
app.get('/Mensajes/', function (req, res) {
    db.all("SELECT * FROM Mensajes;", [], (err, rows) =>{        
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({rows});
    })
});

//Funciones para obtener datos por id de las tablas
app.get('/Chats/:id', function(req, res){
    db.get('SELECT * FROM Chats WHERE IdChat = ?;', [req.params.id], (err, row) => {
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({row});
    })
});
app.get('/Usuarios/:id', function(req, res){
    db.get('SELECT * FROM Usuarios WHERE IdUsuario = ?;', [req.params.id], (err, row) => {
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({row});
    })
});
app.get('/Participantes/:id', function(req, res){
    db.get('SELECT * FROM Participantes WHERE IdParticipante = ?;', [req.params.id], (err, row) => {
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({row});
    })
});
app.get('/Mensajes/:id', function(req, res){
    db.get('SELECT * FROM Mensajes WHERE IdMensaje = ?;', [req.params.id], (err, row) => {
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({row});
    })
});

//Funciones para eliminar datos por id de cada tabla
app.delete('/Chats/:id', function(req, res){
    db.run('DELETE FROM Chats WHERE IdChat = ?;', [req.params.id], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });    
});
app.delete('/Usuarios/:id', function(req, res){
    db.run('DELETE FROM Usuarios WHERE IdUsuario = ?;', [req.params.id], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });    
});
app.delete('/Participantes/:id', function(req, res){
    db.run('DELETE FROM Participantes WHERE IdParticipante = ?;', [req.params.id], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });    
});
app.delete('/Mensajes/:id', function(req, res){
    db.run('DELETE FROM Mensajes WHERE IdMensaje = ?;', [req.params.id], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });    
});

//Funciones para insertar datos en las tablas
app.post('/Chats/',  function(req,res) {
    var reqBody = req.body;
    db.run('INSERT INTO Chats (NombreChat) VALUES(?);', [reqBody.NombreChat], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });
});
app.post('/Usuarios/',  function(req,res) {
    var reqBody = req.body;
    db.run('INSERT INTO Usuarios (Nombre, Correo, Contrasena, Administrador, Activo) VALUES(?, ?, ?, ?, ?);', [reqBody.Nombre, reqBody.Correo, reqBody.Contrasena, reqBody.Administrador, reqBody.Activo], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });
});
app.post('/Participantes/',  function(req,res) {
    var reqBody = req.body;
    db.run('INSERT INTO Participantes (IdChat, IdUsuario) VALUES(?, ?);', [reqBody.IdChat, reqBody.IdUsuario], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });
});
app.post('/Mensajes/',  function(req,res) {
    var reqBody = req.body;
    db.run('INSERT INTO Mensajes (Texto, IdChat, IdUsuario) VALUES(?, ?, ?);', [reqBody.Texto, reqBody.IdChat, reqBody.IdUsuario], (err, result)=>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.status(200).json({result});
    });
});

//Funciones para actualizar la información de las tablas ---------------- me falta
// app.patch('/artists/', function(req, res){
//     var reqBody = req.body;
//     db.run('UPDATE artists SET Name = ? WHERE ArtistId = ?', [reqBody.name, reqBody.id], (err, result)=>{
//         if (err){
//             res.status(400).json({"error":err.message});
//             return;
//         }
//         res.status(200).json({result});
//     });
// });

app.get('/', function(req, res){
    res.send('Esta es la respuesta de la página raíz');
})

app.listen(5000, () => {
    console.log("Servidor espera peticiones en el puerto 5000");
});

// meter en algun sitio el db.close(); para que no existan multiples conexiones