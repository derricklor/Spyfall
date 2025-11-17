import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

export const socket = io(URL);

// Functions that allow us to emit events to the server (with arguments as needed)
export const createRoom = () => {
    socket.emit('createRoom', {});
};

//sendChatMessage function moved to app.jsx for easier callback handling


export const joinRoom = (roomCode, inputName) => {
    socket.emit('joinRoom', { roomCode, inputName });
};

export const leaveRoom = (roomCode, playerCode) => {
    socket.emit('leaveRoom', { roomCode, playerCode });
}

export const startGame = (roomCode, name) => {
    socket.emit('startGame', { roomCode, name });
};

export const vote = (roomCode, playerCode, votedFor) => {
    socket.emit('vote', { roomCode, playerCode, votedFor });
};

export const callVote = (roomCode, name) => {
    socket.emit('callVote', { roomCode, name });
};

export const spyGuessLocation = (roomCode, playerCode, guessedLocation) => {
    socket.emit('spyGuessLocation', { roomCode, playerCode, guessedLocation });
};

export const getLocations = () => {
    socket.emit('getLocations');
};

// Functions (binded to the socket) to handle events from the server automatically
// such as socket.on announcement will be created in app.jsx
