
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const Location = require('./locationSchema'); // constructor schema
const Room = require('./roomSchema');
const initLocations = require('./initLocations');

let port = 3000;
let CORS_ORIGIN = 'http://localhost:5173'; // default to localhost for development
let mongo_uri = 'mongodb://mongo:27017/spyfall_db'; // default to docker compose mongo service or localhost for development
// check process.env.NODE_ENV for production or development
if (process.env.NODE_ENV !== 'production') {
    serverLog('Running in development mode with CORS enabled.');
} else {
    serverLog('Running in production mode.');// no default in production
    port = process.env.PORT;
    CORS_ORIGIN = process.env.CORS_ORIGIN;
    mongo_uri = process.env.MONGO_URI;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,// the backup duration of the sessions and the packets
        skipMiddlewares: true,  // whether to skip middlewares upon successful recovery
    },
    cors: {     //enable CORS during development
        origin: [process.env.CORS_ORIGIN],
        methods: ['GET', 'POST'],
    },
});

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());


// allow serving of static files from public directory
app.use(express.static('public'));


function serverLog(message) {
    console.log(`[SERVER]: ${message}`);
}



async function initDB() {
    try {
        const count = await Location.countDocuments();
        
        if (count === 0) {
            serverLog('Database is empty. Seeding initial Spyfall locations...');
            await Location.insertMany(initLocations);
            await Location.save();
            serverLog('Seeding complete. Initial locations added!');
        } else {
            serverLog(`Database already contains ${count} locations. Skipping seed.`);
        }
    } catch (error) {
        serverLog(`Error during database seeding: ${error.message}`);
        throw error;
    }
}

function generateCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}


// function to check if majority of players have voted for someone
function checkVotes(roomDocument) {
    let voteMap = new Map();
    const numMajority = Math.floor(roomDocument.players.length / 2) + 1; //more than half
    //tally votes
    roomDocument.players.forEach(player => {
        if (player.votedFor) {
            voteMap.set(player.votedFor, (voteMap.get(player.votedFor) || 0) + 1);
        }
    });
    for (let [playerKey, countValue] of voteMap.entries()) {
        if (countValue >= numMajority) {
            return playerKey; //return first player voted >= half
        }
    }
    return null; //no player has majority votes
}

// given a room document, return a string of spy names
function getSpyNames(roomDocument) {
    let spyArr = roomDocument.players.filter(p => p.role === 'Spy'); //subarray of players, who are spies
    let spyNames = spyArr[0].name; // concat spy names togther into one string
    if (spyArr.length == 2)
        spyNames += ` and ${spyArr[1]}`;
    // case for # of spies > 2
    if (spyArr.length > 2){
        for (i=1; i < spyArr.length; i++) {
            if (i == spyArr.length-1) { // on last spy name
                spyNames += `, and ${spyArr[i].name}`;
            } else {
                spyNames += `, ${spyArr[i].name}`;
            }
        }
    }
    return spyNames;
}

async function finalVote(roomCode) {
    //get latest updated room
    let room = await Room.findOne({ roomCode });
    if (room) {
        room.gameState = 'voting';
        room.players.forEach(p => p.votedFor = null);
    }
    await room.save();
    const location = await Location.findById(room.location);
    let endDate = new Date(Date.now() + 60*1000); // 60 seconds from now
    // notify all players final vote has started
    io.to(roomCode).emit('message', { type: 'voteCalled', message: 'Final Voting has started. Please vote to eliminate the spy.', endDate: endDate });

    //start timeout to end voting after 60 seconds
    room.voteTimeoutID = setTimeout(async () => {
        //after timeout, get latest updated room
        const updatedRoom = await Room.findOne({ roomCode });
        const spyNames = getSpyNames(updatedRoom);
        const eliminatedPlayerID = checkVotes(updatedRoom);
        if (eliminatedPlayerID) {
            const eliminatedPlayer = updatedRoom.players.find(p => p.playerCode === eliminatedPlayerID);
            io.to(roomCode).emit('message', { type: 'announcement', message: `${eliminatedPlayer.name} has been voted as the Spy.` });
            
            //if eliminated player is spy, they get one guess to pick location
            if (eliminatedPlayer.role === 'Spy') {
                endDate = new Date(Date.now() + 0.5 * 60 * 1000); // 30 seconds from now
                io.to(roomCode).emit('message', { type: 'voteEnded', message: 'You have correctly guessed the Spy! The Spy has 30 seconds to guess one location to steal the win.', endDate: endDate });
                //set timeout for spy to guess location in 30 seconds
                clearTimeout(updatedRoom.voteTimeoutID); //clear previous timeout and set new one
                clearTimeout(updatedRoom.gameTimeoutID); // also clear game timeout
                updatedRoom.voteTimeoutID = setTimeout(async () => {
                    //if spy has not guessed yet, non-spies win
                    const endedRoom = await Room.findOne({ roomCode });
                    if (endedRoom) {
                        io.to(roomCode).emit('message', { type: 'announcement', message: `The Spy did not guess in time. Non-Spies win! The Spy was ${spyNames}. The location was ${location.name}.` });
                        await resetRoom(endedRoom);
                        io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
                    }
                }, 0.5 * 60 * 1000); // 30 seconds
                await updatedRoom.save();
            } else {
                //non-spy eliminated, spies win
                io.to(roomCode).emit('message', { type: 'announcement', message: `The eliminated player was not the Spy. The Spy was ${spyNames}. The location was ${location.name}.` });
                await resetRoom(updatedRoom);
                io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
            }
        } else {
            //no one eliminated, spies win
            io.to(roomCode).emit('message', { type: 'announcement', message: `The vote has ended. No one was voted as Spy. The Spy wins! The Spy was ${spyNames}. The location was ${location.name}.` });
            await resetRoom(updatedRoom);
            io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
        }
    }, 60 * 1000); // 60 seconds
    await room.save();
}

async function handleLeaveRoom(room, player, socketID) {
    let assignNewHost = false;
    let isSpy = false;
    // 00, 01, 10, 11

    //assign new host if host left and players remain
    if (player.isHost && room.players.length > 1) {
        assignNewHost = true;
    }
    //player leaving is spy, reset room
    if (player.role === 'Spy') {
        isSpy = true;
    }

    //remove player from room by filtering out their socketID, allows for multiple connections per browser
    room.players = room.players.filter(p => p.socketID !== socketID);
    if (assignNewHost) {
        room.players[0].isHost = true; // assign first player as new host
    }
    await room.save();
    //broadcast to other players in room
    if (assignNewHost && isSpy) {// 11
        io.to(room.roomCode).emit('message', { type: 'playerLeftRoom', message: `${player.name} has left the room. ${room.players[0].name} is the new host.`, playerLeftID: player.playerCode, newHostID: room.players[0].playerCode })
        io.to(room.roomCode).emit('message', { type: 'resetRoom', message: `Game has ended. ${player.name} was the Spy.` })
        await resetRoom(room);
    } else if (assignNewHost && !isSpy) {// 10
        io.to(room.roomCode).emit('message', { type: 'playerLeftRoom', message: `${player.name} has left the room. ${room.players[0].name} is the new host.`, playerLeftID: player.playerCode, newHostID: room.players[0].playerCode })
    } else if (!assignNewHost && isSpy) { // 01
        io.to(room.roomCode).emit('message', { type: 'playerLeftRoom', message: `${player.name} has left the room.`, playerLeftID: player.playerCode });
        io.to(room.roomCode).emit('message', { type: 'resetRoom', message: `Game has ended. ${player.name} was the Spy.` })
        await resetRoom(room);
    } else { //00
        io.to(room.roomCode).emit('message', { type: 'playerLeftRoom', message: `${player.name} has left the room.`, playerLeftID: player.playerCode });
    }
}

async function resetRoom(room) {
    //clear any existing timeouts
    clearTimeout(room.gameTimeoutID);
    clearTimeout(room.voteTimeoutID);
    //reset room states
    room.gameState = 'waiting';
    room.voteOffCooldown = null;
    room.voteTimeoutID = null;
    room.location = null;
    room.gameTimeoutID = null;
    room.gameEndDate = null;
    await room.save();
}

io.on('connection', (socket) => {
    if ( socket.recovered ) {
        serverLog(`A user reconnected: ${socket.id}`);
    } else {
        serverLog(`A user connected: ${socket.id}`);
    }
    
    function withErrorHandling(handler) {
        return async (...args) => {
            try {
                await handler(...args); //run the handler with any provided args
            } catch (error) { //catch any errors
                serverLog(`Error in ${handler}: ${error.message}`);
                socket.emit('message', { type: 'error', message: `An error occurred in ${handler}` });
                if (args.length > 0) {
                    const lastArg = args[args.length - 1];
                    if (typeof lastArg === 'function') {
                        lastArg({ status: 'error', message: error.message}); //send error acknowledgement if callback provided
                    }
                }
            }
        };
    }
    
    async function getRoomAndPlayer(roomCode, pCode, psocketID) {
        let room = await Room.findOne({ roomCode });
        if (!room) {
            throw new Error(`Room with code ${roomCode} not found.`);
        }
        let player = room.players.find(p => p.playerCode === pCode);
        if (!player) {
            throw new Error(`Player with code ${pCode} not found in room ${roomCodeUpper}.`);
        }
        // room and player found
        return { room, player };
    }

    //handle get locations emit from client
    socket.on('getLocations', withErrorHandling(async (callback) => {
        const locations = await Location.find({}, { name: 1, _id: 1 }); //get names and IDs of locations
        callback({ status: 'success', locations: locations }); //send locations array to client
    }));

    //handle chat message from room
    socket.on('chatMessage', withErrorHandling(async ({roomCode, playerCode, message}, callback) => {
        //check if roomCode and player exists if no room or player is found, getroomAndPlayer will 
        //throw an error and be caught by withErrorHandling, which sends error message to client using the callback
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        //broadcast emits to everyone in room except sender, use generic annoucement type
        socket.broadcast.to(roomCode).emit('message', { type: 'announcement', message: `${player.name}: ${message}`});
        //send callback acknowledgement success or error
        callback({status: 'success'});
    }));
    
    //call for a vote
    socket.on('callVote', withErrorHandling(async ({roomCode, playerCode}, callback) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
    
        //anyone in room can call for a vote once game is in progress
        if (room.gameState !== 'in-progress') {
            callback({ status: 'error', message: 'Cannot call vote at this time.' });
            return;
        }
        //if already in voting state, cannot call another vote
        if (room.gameState === 'voting') {
            callback({ status: 'error', message: 'Game is already in voting state.' });
            return;
        }
        //if voteOffCooldown is set and in the future, cannot call another vote yet
        if (room.voteOffCooldown && room.voteOffCooldown > new Date()) {
            //cannot call vote if game ends within 30 seconds
            if (room.gameEndDate && (room.gameEndDate - new Date()) < 30 * 1000) {
                callback({ status: 'error', message: 'Cannot call a vote when the game is ending soon.' });
                return;
            }
            const waitTime = Math.ceil((room.voteOffCooldown - new Date()) / 1000); // seconds
            
            callback({ status: 'error', message: `You must wait ${waitTime} seconds before calling another vote.` });
            return;
        }
        //reset all players' votedFor to null
        room.gameState = 'voting';
        room.players.forEach(p => p.votedFor = null);
        await room.save();
        const location = await Location.findById(room.location);
        let endDate = new Date(Date.now() + 0.5 * 60 * 1000); // 30 seconds from now
        // notify all players in room that a vote has been called
        io.to(roomCode).emit('message', { type: 'voteCalled', message: `${player.name} has called for a vote.`, endDate: endDate  });
        callback({ status: 'success'});
        
        //start timeout to end voting after 30 seconds
        room.voteTimeoutID = setTimeout(async () => {
            //after timeout, get latest updated room
            const updatedRoom = await Room.findOne({ roomCode });
    
            const eliminatedPlayerID = checkVotes(updatedRoom);
            if (eliminatedPlayerID) {
                const eliminatedPlayer = updatedRoom.players.find(p => p.playerCode === eliminatedPlayerID);
                io.to(roomCode).emit('message', { type: 'announcement', message: `${eliminatedPlayer.name} has been voted as the Spy.` });
                const spyNames = getSpyNames(updatedRoom);
                //if eliminated player is spy, they get one guess to pick location
                if (eliminatedPlayer.role === 'Spy') {
                    endDate = new Date(Date.now() + 0.5 * 60 * 1000); // 30 seconds from now
                    io.to(roomCode).emit('message', { type: 'voteEnded', message: 'You have correctly guessed the Spy! The Spy has 30 seconds to guess one location to steal the win.', endDate: endDate });
                    //set timeout for spy to guess location in 30 seconds
                    clearTimeout(updatedRoom.voteTimeoutID); //clear previous timeout and set new one
                    clearTimeout(updatedRoom.gameTimeoutID); // also clear game timeout
                    updatedRoom.voteTimeoutID = setTimeout(async () => {
                        //if spy has not guessed yet, non-spies win
                        const endedRoom = await Room.findOne({ roomCode });
                        if (endedRoom) {
                            io.to(roomCode).emit('message', { type: 'announcement', message: `The Spy did not guess in time. Non-Spies win! The Spy was ${spyNames}. The location was ${location.name}.` });
                            await resetRoom(endedRoom);
                            io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
                        }
                    }, 0.5 * 60 * 1000); // 30 seconds
                    await updatedRoom.save();
                } else {
                    //non-spy eliminated, spies win
                    io.to(roomCode).emit('message', { type: 'announcement', message: `The eliminated player was not the Spy. The Spy was ${spyNames}. The location was ${location.name}.` });
                    await resetRoom(updatedRoom);
                    io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
                }
            } else {
                //no one eliminated, game resumes
                updatedRoom.gameState = 'in-progress';
                updatedRoom.voteOffCooldown = new Date(Date.now() + 1 * 60 * 1000); // set cooldown to 1 minute from end of vote
                await updatedRoom.save();
                io.to(roomCode).emit('message', { type: 'voteEnded', message: 'The vote has ended. No one was voted as Spy. The game has resumed.' });
            }
        }, 0.5 * 60 * 1000); // 30 seconds
        await room.save();
    }));

    //create room
    socket.on('createRoom', withErrorHandling(async (callback) => {
        let newRoomCode = generateCode(4);
        let existingRoom = await Room.findOne({ roomCode: newRoomCode });
        while (existingRoom) {
            //if room code already exists, generate a new one
            newRoomCode = generateCode(4);
            existingRoom = await Room.findOne({ roomCode: newRoomCode });
        }
        //add host as first player in room
        //create room in db
        const newRoom = new Room({ 
            roomCode: newRoomCode
            //other fields will use default values
        });
        await newRoom.save();
        // Does not join room yet, only creates room
        //send room code back to client through callback
        callback({ status: 'success', message: `New room created id: ${newRoomCode}.`, roomCode: newRoomCode });
        serverLog(`Created new room with id: ${newRoom._id}, and code: ${newRoomCode}`);
    }));
    
    //player joins room
    socket.on('joinRoom', withErrorHandling(async ({ roomCode, inputName }, callback) => {
        const room = await Room.findOne({ roomCode });
        if (room) { // Room exists
            //can only join if room is in waiting state
            if (room.gameState !== 'waiting') {
                callback({ status: 'error', message: `Cannot join room ${roomCode} as the game is already in progress.` });
                return;
            }
            
            let playerName = inputName;
            const existingNames = new Set(room.players.map(p => p.name));
            if (existingNames.has(playerName)) {
                const baseName = playerName.replace(/ \(\d+\)$/, '').trim();
                let suffix = 1;
                while (existingNames.has(`${baseName} (${suffix})`)) {
                    suffix++;
                }
                playerName = `${baseName} (${suffix})`;
            }
            // generate player code
            let playerCode = generateCode(4);
            // make sure playerCode is unique in room
            const existingCodes = new Set(room.players.map(p => p.playerCode));
            while (existingCodes.has(playerCode)) {
                playerCode = generateCode(4);
            }
            
            // Add player to the room, if players is empty make them host
            if (room.players.length === 0) {
                await Room.updateOne({ roomCode }, { $push: { players: { name: playerName, playerCode: playerCode, socketID: socket.id, isHost: true } } });
            } else {
                await Room.updateOne({ roomCode }, { $push: { players: { name: playerName, playerCode: playerCode, socketID: socket.id } } });
            }
            // non required will be assigned later
            
            const updatedRoom = await Room.findOne({ roomCode });// get latest room data
            // map returns new array populated by values returned from function, which is object with name, playerCode, isHost
            const playerList = updatedRoom.players.map(p => ({ name: p.name, playerID: p.playerCode, isHost: p.isHost }));
            
            socket.join(roomCode);//join socket.io room with room code as string
            //callback event to joining player with room and playerList info
            callback({ status: 'success', message: `Joined room: ${roomCode}.`, roomCode: roomCode, playerName: playerName, playerCode: playerCode, playerList: playerList });
            // Notify all other clients in the room about the joining player, their name and ID
            // specifically .broadcast, sends to all sockets in .to(room) except sender
            socket.broadcast.to(roomCode).emit('message', { type: 'playerJoined', message: `${playerName} has joined.`, playerName: playerName, playerID: playerCode }); 
            serverLog(`Player ${playerName} joined room ${roomCode}.`);
        } else {
            //handle room not found
            callback({ status: 'error', message: `Room ${roomCode} not found.` });
        }
    }));
    

    // end game
    socket.on('endGame', withErrorHandling(async ({roomCode, playerCode}, callback) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        //only host can end game
        if (!player.isHost) { // player is not host
            callback({ status: 'error', message: 'Only the host can end the game.' });
            return;
        }
        //room must be in-progress
        if (room.gameState !== 'in-progress') {
            callback({ status: 'error', message: 'Room must be in-progress to end.' });
            return;
        }
        await resetRoom(room);
        callback({ status: 'success'});
        // broadcast to everyone in room including sender
        io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The host has ended the game.' });

    }));

    // start game
    socket.on('startGame', withErrorHandling(async ({roomCode, playerCode}, callback) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        //game already started
        if (room.gameState !== 'waiting') {
            callback({ status: 'error', message: 'Game has already started.' });
            return;
        }
        //must have at least 3 players to start game
        if (room.players.length < 3) {
            callback({ status: 'error', message: 'At least 3 players are required to start the game.' });
            return;
        }
        //only host can start game
        if (!player.isHost) { // player is not host
            callback({ status: 'error', message: 'Only the host can start the game.' });
            return;
        } else {
            // assign roles to players based on location
            // if no location assigned yet, pick a random location
            if (!room.location) {
                const locationCount = await Location.countDocuments();
                const randomIndex = Math.floor(Math.random() * locationCount);
                const randomLocation = await Location.findOne().skip(randomIndex);
                room.location = randomLocation._id;
            }
            const location = await Location.findById(room.location);
            const roles = location.roles; // array of roles for this location
            const numPlayers = room.players.length;
            const multi = Math.ceil(numPlayers / roles.length);
            //create array of roles with enough roles for all players
            const extendedRoles = [];
            for (let i = 0; i < multi; i++) {
                extendedRoles.push(...roles);
            }
            const numSpies = 1 //Math.max(1, Math.floor(numPlayers / 4)); // always at least 1 spy, uncomment to allow 1 spy per 4 players
            const assignedRoles = extendedRoles.slice(0, numPlayers - numSpies).concat(Array(numSpies).fill('Spy'));
            //shuffle assignedRoles again to randomize spy positions
            const finalRoles = assignedRoles.sort(() => Math.random() - 0.5);
            //assign roles to players in room
            room.players.forEach((p, index) => {
                p.role = finalRoles[index];
            });
            room.gameState = 'in-progress';
            await room.save();
            // calculate date time when game will end
            const timerMilliseconds = room.gameLength * 60 * 1000;// convert minutes to milliseconds
            const endDate = new Date(Date.now() + timerMilliseconds);
            // notify all players game has started
            callback({ status: 'success'});
            io.to(roomCode).emit('message', { type: 'gameStarted', message: 'Game has started.', endDate: endDate}); 
            //for each player, emit their role privately
            room.players.forEach(p => {
                //if role is spy, location is unknown
                io.to(p.socketID).emit('message', { type: 'roleAssigned', location: p.role === 'Spy' ? 'Unknown' : location.name, role: p.role });
            });
            //set game timeout to enter final voting state after timerMilliseconds
            room.gameTimeoutID = setTimeout(finalVote, timerMilliseconds, roomCode); // last argument to pass roomCode to finalVote
            //set game end date
            room.gameEndDate = endDate;
            await room.save();
        }
    }));

    //player voted for someone
    socket.on('vote', withErrorHandling(async ({roomCode, playerCode, votedForID}, callback) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        //game must be in voting state to vote
        if (room.gameState !== 'voting') {
            callback({ status: 'error', message: 'Game is not in voting state.' });
            return;
        }
        //check votedForID is a valid player in room
        if (!room.players.some(p => p.playerCode === votedForID)) { // some returns true if any element matches condition
            callback({ status: 'error', message: 'You voted for an invalid player.' });
            return;
        }
        //record vote and increment vote count
        await Room.updateOne({ roomCode, 'players.playerCode': player.playerCode },
            { $set: { 'players.$.votedFor': votedForID } }); 
            //.$. is positional operator to update matched array element from query
        
        callback({ status: 'success'});
    }));

    
    // receive spy guess location
    socket.on('spyGuessLocation', withErrorHandling(async ({roomCode, playerCode, guessedLocationID}, callback) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        //check player is the spy
        if (player.role !== 'Spy') {
            callback({ status: 'error', message: 'Only the Spy can guess the location.' });
            return;
        }
        //spy can guess location at any game state, but if incorrect, game ends
        if (room.gameState == 'waiting') {
            callback({ status: 'error', message: 'Cannot guess location when game is not in-progress and voting state.' });
            return;
        }
        callback({ status: 'success'});
        const spyNames = getSpyNames(room);
        //check guessedLocation is valid
        const guessLocation = await Location.findById(guessedLocationID);
        const location = await Location.findById(room.location);
        let msg = ``;
        if (location._id.toString() == guessLocation._id.toString()) { // not strict equality, different object references
            msg += `Spies win! `;
        } else {
            msg += `Non-Spies win! `;
        }
        msg += `The Spy has guessed ${guessLocation.name}. The location was ${location.name}. The Spy was ${spyNames}.`;
        io.to(roomCode).emit('message', { type: 'announcement', message: msg });
        // fall through to reset game
        await resetRoom(room);
        io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
    }));

    
    

    //player voluntarily leaves room
    socket.on('leaveRoom', withErrorHandling(async ({roomCode, playerCode}, callback) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        await handleLeaveRoom(room, player, socket.id);
        socket.leave(roomCode); // arg needs to be string, case sensitivity matters
        serverLog(`Player ${player.name} left room ${room.roomCode}.`);
        callback({ status: 'success', message: `You have left room: ${roomCode}.` });
    }));

    //player disconnects, treat as leaving room
    socket.on('disconnect', withErrorHandling(async (reason) => {
        serverLog(`A user disconnected: ${socket.id} due to ${reason}`);
        //find room of player by socket id
        let room = await Room.findOne({ 'players.socketID': socket.id });
        //remove player from room they were in
        if (room) {
            const player = room.players.find(p => p.socketID === socket.id);
            await handleLeaveRoom(room, player, socket.id);
            serverLog(`Player ${player.name} disconnected and was removed from room ${room.roomCode}.`);
        }
    }));
});

const GARBAGE_COLLECTION_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function zeroOutRooms() {
    try {
        const result = await Room.deleteMany({});
        serverLog(`Zeroed out rooms collection. Deleted ${result.deletedCount} rooms.`);
    } catch (error) {
        serverLog(`Error zeroing out rooms: ${error.message}`);
    }
}

async function garbageCollectRooms() {
    serverLog('Garbage collecting finished rooms...');
    try {
        //delete all rooms with no players and older than 10 minutes
        const result2 = await Room.deleteMany({ $and: [ { players: { $size: 0 }}, { gameCreatedDate: { $lt: new Date(Date.now() - 10 * 60 * 1000) }} ] });
        serverLog(`Garbage collection complete. Deleted ${result2.deletedCount} empty rooms.`);
    } catch (error) {
        serverLog(`Error during garbage collection: ${error.message}`);
    }
}

const conn = mongoose.connect(mongo_uri)
    .then(() => {
        serverLog('Successfully connected to MongoDB!');
        initDB().then(() => {
            server.listen(port, () => {
                serverLog(`Server is running on port: ${port}`);
                zeroOutRooms(); // delete all rooms on server start
                setInterval(garbageCollectRooms, GARBAGE_COLLECTION_INTERVAL);
            });
        });
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    });


    /*
    for reference
    io.to(room)	Emits an event to all sockets within the specified room, including the sender.
    socket.broadcast.to(room)	Emits an event to all sockets within the specified room, except the sender.
    */