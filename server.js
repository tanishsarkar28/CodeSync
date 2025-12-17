const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    // Map se array convert kar rahe hain
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
    // console.log('socket connected', socket.id);

    socket.on('join', ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // --- FIX IS HERE (Typing Issue) ---
    socket.on('code-change', ({ roomId, code }) => {
        // Hum 'socket.in' use kar rahe hain taaki code sirf 'dusron' ko jaye
        // 'io.to' use karne se code wapas sender ko bhi aa raha tha, jisse atak raha tha
        socket.in(roomId).emit('code-change', { code });
    });

    socket.on('sync-code', ({ socketId, code }) => {
        io.to(socketId).emit('code-change', { code });
    });

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

// --- DEPLOYMENT CODE (Render ke liye zaroori) ---
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === 'production') {
    // Client ke build folder se static files serve karein
    app.use(express.static(path.join(__dirname1, '/client/build')));

    // Koi bhi aur route aaye toh index.html pakda dein (React handle karega)
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname1, 'client', 'build', 'index.html'));
    });
}
// ------------------------------------------------

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));