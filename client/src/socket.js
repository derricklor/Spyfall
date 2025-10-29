import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

export const socket = io(URL);

// Functions that allow us to emit events to the server (with arguments as needed)
export const createRoom = () => {
    socket.emit('createRoom');
};

export const joinRoom = (roomCode) => {
    socket.emit('joinRoom', { roomCode });
};

export const startGame = (roomCode, name) => {
    socket.emit('startGame', { roomCode, name });
};

export const vote = (roomCode, name, votedFor) => {
    socket.emit('vote', { roomCode, name, votedFor });
};

export const callVote = (roomCode, name) => {
    socket.emit('callVote', { roomCode, name });
};

export const spyGuessLocation = (roomCode, name, guessedLocation) => {
    socket.emit('spyGuessLocation', { roomCode, name, guessedLocation });
};

// Functions (binded to the socket) to handle events from the server automatically
// on announcement handler will be created in app.jsx

socket.on('error', (data) => {
    console.log('An error occurred. ' + data.message);
});