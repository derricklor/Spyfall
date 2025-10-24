import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

export const socket = io(URL);

// Functions to emit events to the server
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

// Functions to handle events from the server
export const onRoomCreated = (callback) => {
  socket.on('roomCreated', callback);
};

export const onPlayerJoined = (callback) => {
  socket.on('playerJoined', callback);
};

export const onRoomNotFound = (callback) => {
  socket.on('roomNotFound', callback);
};

export const onGameAlreadyStarted = (callback) => {
  socket.on('gameAlreadyStarted', callback);
};

export const onNotEnoughPlayers = (callback) => {
  socket.on('notEnoughPlayers', callback);
};

export const onGameStarted = (callback) => {
  socket.on('gameStarted', callback);
};

export const onRoleAssigned = (callback) => {
  socket.on('roleAssigned', callback);
};

export const onFinalVotingStarted = (callback) => {
  socket.on('finalVotingStarted', callback);
};

export const onNotAuthorized = (callback) => {
  socket.on('notAuthorized', callback);
};

export const onNotInVotingState = (callback) => {
  socket.on('notInVotingState', callback);
};

export const onInvalidVote = (callback) => {
  socket.on('invalidVote', callback);
};

export const onVotingEnded = (callback) => {
  socket.on('votingEnded', callback);
};

export const onNotInProgressState = (callback) => {
  socket.on('notInProgressState', callback);
};

export const onAlreadyInVotingState = (callback) => {
  socket.on('alreadyInVotingState', callback);
};

export const onVoteCooldownActive = (callback) => {
  socket.on('voteCooldownActive', callback);
};

export const onVoteCalled = (callback) => {
  socket.on('voteCalled', callback);
};

export const onPlayerEliminated = (callback) => {
  socket.on('playerEliminated', callback);
};

export const onSpyGuessCorrect = (callback) => {
  socket.on('spyGuessCorrect', callback);
};

export const onGameEnded = (callback) => {
  socket.on('gameEnded', callback);
};

export const onGameResumed = (callback) => {
  socket.on('gameResumed', callback);
};

export const onNotInCorrectState = (callback) => {
  socket.on('notInCorrectState', callback);
};

export const onSpyGuessLocationIncorrect = (callback) => {
  socket.on('spyGuessLocationIncorrect', callback);
};

export const onSpyGuessLocationCorrect = (callback) => {
  socket.on('spyGuessLocationCorrect', callback);
};

export const onPlayerLeft = (callback) => {
  socket.on('playerLeft', callback);
};

export const onError = (callback) => {
  socket.on('error', callback);
};