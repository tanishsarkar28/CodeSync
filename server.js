const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    // Join Event
    socket.on('join', ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        // Sabko naye client list bhejo
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // Code Sync
    socket.on('code-change', ({ roomId, code }) => {
        socket.in(roomId).emit('code-change', { code });
    });

    socket.on('sync-code', ({ socketId, code }) => {
        io.to(socketId).emit('code-change', { code });
    });

    // Cursor Move
    socket.on('cursor-change', ({ roomId, cursor }) => {
        const username = userSocketMap[socket.id];
        socket.in(roomId).emit('cursor-update', {
            socketId: socket.id,
            cursor,
            username 
        });
    });

    // Disconnect
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit('disconnected', {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;

// Deployment
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname1, '/client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname1, 'client', 'build', 'index.html'));
    });
}

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));