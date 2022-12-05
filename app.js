const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use( '/static', express.static(__dirname + '/public') )
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})
app.get('/contactame', (req, res) => {
    res.render('contactame')
})
app.get('/ayuda', (req, res) => {
    res.render('ayuda')
})
app.get('/calificar', (req, res) => {
    res.render('calificar')
})


// app.get('/', (req, res) => { 
//     res.sendFile(__dirname + '/public/index.html');
// });

var enPartida = []
io.on('connection', (socket) => {
    socket.on('my-session', async(e) => {
        socket.join(e)
        enPartida.splice(enPartida.indexOf(e),1)
        io.to('sessions').emit('capture-my-session', e)
    })
    socket.on('join-user', (e) => {
        // Pedir permiso para unirse
        if(io.sockets.adapter.rooms.get(e.remoto))
        {
            if(enPartida.includes(e.remoto)){
                socket.emit('partida-ocupada', e)
            }else{
                socket.to(e.remoto).emit('warning-join', e)
            }
        }else{
            socket.emit('sala-no-encontrada', e)
        }
    })
    socket.on('solicitud-ocupada', (e) => {
        socket.to(e.local).emit('solicitud-ocupada', e)
    })
    socket.on('cancelar-solicitud', (e) => {
        socket.to(e.remoto).emit('cancelar-solicitud', e)
    })
    socket.on('to-join', (e) => {
        // io.to(e.local).socketsJoin(e.remoto)
        // socket.to(e.local).emit('joined', e)
        socket.to(e.local).emit('joined', e)
        enPartida.push(e.remoto)
        enPartida.push(e.local)
    })
    socket.on('rechazar-conexion', (e) => {
        socket.to(e.remoto).emit('rechazar-conexion', e)
    })
    socket.on('move', (e) => {
        socket.to(e.remoto).emit('move', e)
    })
    socket.on('crear-bala', (e) => {
        socket.to(e.remoto).emit('crear-bala', e)
    })
    socket.on('tiempo-llamada-agotado', (e) => {
        // socket.emit('tiempo-llamada-agotado', e)
        // Para los dos
        socket.to(e.remoto).emit('tiempo-llamada-agotado', e)
    })
    socket.on('abandonar-partida', (e) => {
        enPartida.splice(enPartida.indexOf(e.local),1)
        enPartida.splice(enPartida.indexOf(e.remoto),1)
        socket.to(e.remoto).emit('abandonar-partida', e)
        io.socketsLeave(e.local)
        io.socketsLeave(e.remoto)
        
    })
    socket.on('reiniciar-partida', (e) => {
        socket.to(e.remoto).emit('reiniciar-partida', e)
    })
    socket.on('abandonar-solicitud-partida', (e) => {
        enPartida.splice(enPartida.indexOf(e.local),1)
        enPartida.splice(enPartida.indexOf(e.remoto),1)
        socket.to(e.remoto).emit('abandonar-solicitud-partida', e)
    })
    socket.on('cerrar-conexion', (e) => {
        io.to(e.local).disconnectSockets(true)
        io.to(e.remoto).emit('cerrar-conexion', true)

        enPartida.splice(enPartida.indexOf(e.local),1)
        enPartida.splice(enPartida.indexOf(e.remoto),1)
    })
});

server.listen(process.env.PORT || 3000, () => {
    console.log('http://localhost:3000/');
});

// https://juego-nave-online.onrender.com/
// Arreglar cuando otro usuario fuera de partida cierra navegador y se recargar la pagina solicitada