const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

// --- LANGUAGE RUNTIMES (Piston API versions) ---
const RUNTIMES = {
    'c++': '10.2.0',
    'java': '15.0.2',
    'python': '3.10.0',
    'c': '10.2.0'
};

app.post('/compile', async (req, res) => {
    // Frontend se 'code' aur 'language' aayega
    const { code, language } = req.body;

    // Default version uthana
    const version = RUNTIMES[language] || '10.2.0';

    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            "language": language,
            "version": version,
            "files": [
                {
                    "content": code
                }
            ]
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Failed to execute code' });
    }
});

io.on('connection', (socket) => {
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

    socket.on('code-change', ({ roomId, code }) => {
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

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname1, '/client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname1, 'client', 'build', 'index.html'));
    });
}
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));