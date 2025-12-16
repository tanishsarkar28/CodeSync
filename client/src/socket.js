import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    
    // Agar environment variable hai toh wo use karo, warna localhost
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; 
    return io(backendUrl, options);
};