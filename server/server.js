const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const Location = require('./locationSchema'); // constructor schema
const Room = require('./roomSchema');
const initLocations = require('./initLocations');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

app.use(express.json());
app.use(bodyParser.json());
//app.use(cookieParser(cookieSecret))
app.use(cors());

const port = process.env.PORT || 3000;

const mongo_uri = 'mongodb://localhost:27017/spyfall_db';

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

app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Location.find({});
        serverLog('Fetched locations from database.');
        res.status(200).json(locations);
    } catch (error) {
        serverLog(`Error fetching locations: ${error.message}`);
        res.status(500).json({ error: 'Error fetching locations' });
    }
});

app.get('/api/location/:id', async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (location) {
            serverLog(`Fetched location with ID: ${req.params.id}`);
            res.status(200).json(location);
        } else {
            serverLog(`Location with ID: ${req.params.id} not found.`);
            res.status(404).json({ error: 'Location not found' });
        }
    } catch (error) {
        serverLog(`Error fetching location: ${error.message}`);
        res.status(500).json({ error: 'Error fetching location' });
    }
});


app.post('/api/add/location', async (req, res) => {
    try {
        const location = new Location(req.body);
        const savedLocation = await location.save();
        serverLog(`Added new location to database: ${savedLocation._id}`);
        res.status(201).json(savedLocation);
    } catch (error) {
        serverLog(`Error adding location: ${error.message}`);
        res.status(500).json({ error: 'Error adding location' });
    }
});


// function to check if majority of players have voted for someone
//if so, eliminate that player and the end game
//if the eliminated player is the spy, they have one guess to pick the location
//if they guess right, spies win, else non-spies win
//if the eliminated player is not the spy, the game ends and the spies win
//if all players have voted, end the voting early
//reset votes and return to in-progress state if no one is eliminated
function checkVotes(roomDocument) {
    let voteMap = new Map();
    const numMajority = Math.floor(roomDocument.players.length / 2) + 1; //more than half
    //tally votes
    roomDocument.players.forEach(player => {
        if (player.votedFor) {
            voteMap.set(player.votedFor, (voteMap.get(player.votedFor) || 0) + 1);
        }
    });
    for (let [playerName, count] of voteMap.entries()) {
        if (count >= numMajority) {
            //return first player voted >= half
            return playerName; 
        }
    }
    return null; //no player has majority votes
}

async function finalVote(roomCode) {
    //get latest updated room
    const room = await Room.find({ roomCode });
    if (room) {
        //set all players' votedFor to null
        room.gameState = 'voting';
        room.players.forEach(p => p.votedFor = null);
    }
    await room.save();
    const endDate = new Date(Date.now() + 60*1000); // 60 seconds from now
    // notify all players final vote has started
    // specifically io.to(room), room needs to be a string or array of strings, otherwise it won't work
    io.to(roomCode).emit('message', { type: 'voteCalled', message: 'Final Voting has started. Please vote to eliminate the spy.', endDate: endDate });

    //start timeout to end voting after 60 seconds
    room.voteTimeoutID = setTimeout(async () => {
        //get latest updated room
        const updatedRoom = await Room.findOne({ roomCode });
        
        io.to(roomCode).emit('message', { type: 'annoucenemnt', message: 'The vote has ended.' }); // notify all players voting has ended
        
        const eliminatedPlayerName = checkVotes(updatedRoom);
        if (eliminatedPlayerName) {
            io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `${eliminatedPlayerName} has been voted as the Spy.` });
            //if eliminated player is spy, they get one guess to pick location
            const elimPlayerRole = updatedRoom.players.find(p => p.name === eliminatedPlayerName).role;
            if (elimPlayerRole === 'Spy') {
                io.to(roomCode).emit('message', { type: 'annoucenemnt', message: 'You have correctly guessed the Spy! The Spy has 30 seconds to guess one location to steal the win.' });
                //set timeout for spy to guess location in 30 seconds
                updatedRoom.voteTimeoutID = setTimeout(async () => {
                    //if spy has not guessed yet, non-spies win
                    const endedRoom = await Room.findOne({ roomCode });
                    if (endedRoom) {
                        io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `The Spy did not guess in time. Non-Spies win! The location was ${endedRoom.location.name}.` });
                        endedRoom.gameState = 'waiting';
                        await endedRoom.save();
                        io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
                    }
                }, 0.5 * 60 * 1000); // 30 seconds
                await updatedRoom.save();
            } else {
                //non-spy eliminated, spies win
                //reveal the spies
                let spies = updatedRoom.players.filter(p => p.role === 'Spy').name;
                io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `The eliminated player was not the Spy. The Spy was: ${spies}. The location was ${updatedRoom.location.name}.` });
                updatedRoom.gameState = 'waiting';
                await updatedRoom.save();
                io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
            }
        } else {
            //no one eliminated, spy wins
            io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `No player was eliminated. The Spy wins! The location was ${updatedRoom.location.name}.` });
            updatedRoom.gameState = 'waiting';
            await updatedRoom.save();
            io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
        }
    }, 60 * 1000); // 60 seconds
    await room.save();
}

io.on('connection', (socket) => {
    serverLog(`A user connected: ${socket.id}`);
    
    function withErrorHandling(handler) {
        return async (...args) => {
            try {
                await handler(...args); //
            } catch (error) {
                serverLog(`Error in ${handler.name}: ${error.message}`);
                socket.emit('message', { type: 'error', message: `An error occurred in ${handler.name}` });
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
            throw new Error(`Player with code ${pCode} not found in room ${roomCode}.`);
        }
        // room and player found, but socketID may have changed, update it
        if (player.socketID !== psocketID) {
            player.socketID = psocketID;
            await Room.updateOne({ roomCode, 'players.playerCode': pCode }, { $set: { 'players.$.socketID': psocketID } });
            //get updated room and player
            room = await Room.findOne({ roomCode });
            player = room.players.find(p => p.playerCode === pCode);
        }
        return { room, player };
    }

    //handle get locations emit from client
    socket.on('getLocations', withErrorHandling(async () => {
        const locations = await Location.find({}, { name: 1}); //get only names of locations
        socket.emit('message', { type: 'locationsList', locations: locations }); //send locations array to client
    }));
    
    //call for a vote
    socket.on('callVote', withErrorHandling(async ({ roomCode }) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
    
        //anyone in room can call for a vote once game is in progress
        if (room.gameState !== 'in-progress') {
            socket.emit('message', { type: 'error', message: 'Game is not in progress.' });
            return;
        }
        //if already in voting state, cannot call another vote
        if (room.gameState === 'voting') {
            socket.emit('message', { type: 'error', message: 'Game is already in voting state.' });
            return;
        }
        //if voteOffCooldown is set and in the future, cannot call another vote yet
        if (room.voteOffCooldown && room.voteOffCooldown > new Date()) {
            //cannot call vote if game ends within 30 seconds
            if (room.gameEndDate && (room.gameEndDate - new Date()) < 30 * 1000) {
                socket.emit('message', { type: 'error', message: 'Cannot call a vote when the game is ending soon.' });
                return;
            }
            const waitTime = Math.ceil((room.voteOffCooldown - new Date()) / 1000); // seconds
            socket.emit('message', { type: 'error', message: `You must wait ${waitTime} seconds before calling another vote.` });
            return;
        }
        room.gameState = 'voting';
        //reset all players' votedFor to null
        room.players.forEach(p => p.votedFor = null);
        await room.save();
        
        let endDate = new Date(Date.now() + 0.5 * 60 * 1000); // 30 seconds from now
        // notify all players in room that a vote has been called
        io.to(roomCode).emit('message', { type: 'voteCalled', message: `${player.name} has called for a vote.`, endDate: endDate  }); 
        //start timeout to end voting after 30 seconds
        room.voteTimeoutID = setTimeout(async () => {
            //after timeout
            const updatedRoom = await Room.findOne({ roomCode });
    
            io.to(roomCode).emit('message', { type: 'annoucenemnt', message: 'The vote has ended.' }); // notify all players voting has ended
    
            const eliminatedPlayerName = checkVotes(updatedRoom);
            if (eliminatedPlayerName) {
                io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `${eliminatedPlayerName} has been voted as the Spy.` });
                //if eliminated player is spy, they get one guess to pick location
                const elimPlayerRole = updatedRoom.players.find(p => p.name === eliminatedPlayerName).role;
                if (elimPlayerRole === 'Spy') {
                    endDate = new Date(Date.now() + 0.5 * 60 * 1000); // 30 seconds from now
                    io.to(roomCode).emit('message', { type: 'annoucenemnt', message: 'You have correctly guessed the Spy! The Spy has 30 seconds to guess one location to steal the win.', endDate: endDate });
                    //set timeout for spy to guess location in 30 seconds
                    updatedRoom.voteTimeoutID = setTimeout(async () => {
                        //if spy has not guessed yet, non-spies win
                        const endedRoom = await Room.findOne({ roomCode });
                        if (endedRoom) {
                            io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `The Spy did not guess in time. Non-Spies win! The location was ${endedRoom.location.name}.` });
                            clearTimeout(endedRoom.gameTimeoutID); //clear game timeout
                            endedRoom.gameState = 'waiting';
                            await endedRoom.save();
                            io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
                        }
                    }, 0.5 * 60 * 1000); // 30 seconds
                    await updatedRoom.save();
                } else {
                    //non-spy eliminated, spies win
                    //reveal the spies
                    let spies = updatedRoom.players.filter(p => p.role === 'Spy').name;
                    io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `The eliminated player was not the Spy. The Spy was: ${spies}. The location was ${updatedRoom.location.name}.` });
                    clearTimeout(updatedRoom.gameTimeoutID); //clear game timeout
                    updatedRoom.gameState = 'waiting';
                    await updatedRoom.save();
                    io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
                }
            } else {
                //no one eliminated, game resumes
                updatedRoom.gameState = 'in-progress';
                updatedRoom.voteOffCooldown = new Date(Date.now() + 1 * 60 * 1000); // set cooldown to 1 minute from end of vote
    
                await updatedRoom.save();
                io.to(roomCode).emit('message', { type: 'annoucenemnt', message: 'The game has resumed.' });
            }
        }, 0.5 * 60 * 1000); // 30 seconds
        await room.save();
    }));

    //create room
    socket.on('createRoom', withErrorHandling(async ({}) => {
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
        //emit annoucement event with room code to host client, client can then emit joinRoom
        socket.emit('message',  { type: 'roomCreated', message: `New room created id: ${newRoomCode}.`, roomCode: newRoomCode});
        serverLog(`Created new room with id: ${newRoom._id}, and code: ${newRoomCode}`);
    }));
    
    //player joins room
    socket.on('joinRoom', withErrorHandling(async ({ roomCode, inputName }) => {
        const room = await Room.findOne({ roomCode });
        if (room) { // Room exists
            //can only join if room is in waiting state
            if (room.gameState !== 'waiting') {
                socket.emit('message', { type: 'error', message: `Cannot join room ${roomCode} as the game is already in progress.` });
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
            let playerCode = generateCode(5);
            // make sure playerCode is unique in room
            const existingCodes = new Set(room.players.map(p => p.playerCode));
            while (existingCodes.has(playerCode)) {
                playerCode = generateCode(5);
            }
            
            // Add player to the room, if players is empty make them host
            if (room.players.length === 0) {
                await Room.updateOne({ roomCode }, { $push: { players: { name: playerName, playerCode: playerCode, socketID: socket.id, isHost: true } } });
            } else {
                await Room.updateOne({ roomCode }, { $push: { players: { name: playerName, playerCode: playerCode, socketID: socket.id } } });
            }
            // non required will be assigned later
            await room.save();
            
            const updatedRoom = await Room.findOne({ roomCode });// get latest room data
            const playerList = updatedRoom.players.map(p => ({ name: p.name, isHost: p.isHost }));// get player list of names and who is host
            
            //make sure roomCode is all caps, as case-sensitivity may cause issues in socket.io rooms
            socket.join(roomCode.toUpperCase());//join socket.io room with room code as string
            //emit joinedRoom event to joining player with room and player info
            socket.emit('message', { type: 'joinedRoom', message: `Joined room: ${roomCode}.`, roomCode: roomCode, playerCode: playerCode, playerList: playerList });
            // Notify all other clients in the room about the joining player
            // specifically socket.to(room), sends to all sockets in room except sender
            socket.to(roomCode).emit('message', { type: 'playerJoined', message: `${playerName} has joined.`, playerName: playerName}); 
            serverLog(`Player ${playerName} joined room ${roomCode}.`);
        } else {
            socket.emit('message', { type: 'error', message: `Room ${roomCode} not found.` });
        }
    }));
    
    

    // start game
    socket.on('startGame', withErrorHandling(async ({ roomCode, playerCode }) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);

        //game already started
        if (room.gameState !== 'waiting') {
            socket.emit('message', { type: 'error', message: 'Game has already started.' });
            return;
        }
        //must have at least 3 players to start game
        if (room.players.length < 3) {
            socket.emit('message', { type: 'error', message: 'At least 3 players are required to start the game.' });
            return;
        }
        //only host can start game
        if (!player.isHost) { // player is not host
            socket.emit('message', { type: 'error', message: 'Only the host can start the game.' });
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
            io.to(roomCode).emit('message', { type: 'gameStarted', message: 'Game has started.', endDate: endDate}); 
            //for each player, emit their role privately
            room.players.forEach(p => {
                io.to(p.socketID).emit('message', { type: 'roleAssigned', location: room.location, role: p.role });
            });
            //set game timeout to enter final voting state after timerMilliseconds
            room.gameTimeoutID = setTimeout(finalVote, timerMilliseconds, roomCode); // last argument to pass roomCode to finalVote
            //set game end date
            room.gameEndDate = endDate;
            await room.save();
        }
    }));

    //player voted for someone
    socket.on('vote', withErrorHandling(async ({ roomCode, name, votedFor }) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);

        //game must be in voting state to vote
        if (room.gameState !== 'voting') {
            socket.emit('message', { type: 'error', message: 'Game is not in voting state.' });
            return;
        }

        //check votedFor is a valid player in room
        if (!room.players.some(p => p.name === votedFor)) { // some returns true if any element matches condition
            socket.emit('message', { type: 'error', message: 'You voted for an invalid player.' });
            return;
        }
        //record vote and increment vote count
        await Room.updateOne({ roomCode, 'players.name': name },
            { $set: { 'players.$.votedFor': votedFor } }); 
            //.$. is positional operator to update matched array element from query
        
        await room.save();

        //io.to(roomCode).emit('playerVoted', updatedRoom.players); // notify all players in room of updated player list with votes
    }));

    
    // receive spy guess location
    socket.on('spyGuessLocation', withErrorHandling(async ({ roomCode, playerCode, guessedLocation }) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);

        //check player is the spy
        if (player.role !== 'Spy') {
            socket.emit('message', { type: 'error', message: 'Only the Spy can guess the location.' });
            return;
        }
        //spy can guess location at any game state, but if incorrect, game ends
        if (room.gameState == 'waiting') {
            socket.emit('message', { type: 'error', message: 'You can only guess the location during voting or in-progress state.' });
            return;
        }
        //clear any existing timeouts
        clearTimeout(room.gameTimeoutID);
        clearTimeout(room.voteTimeoutID);
        room.gameState = 'waiting';
        await room.save();
        let spies = room.players.filter(p => p.role === 'Spy').name;
        //check guessedLocation is valid
        room.location !== guessedLocation ?
            io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `The Spy has guessed incorrectly. Non-Spies win! The location was ${room.location.name}. The Spy was ${spies}.` })
            :
            io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `The Spy has guessed correctly. Spies win! The location was ${room.location.name}. The Spy was ${spies}.` });
        // fall through to reset game
        io.to(roomCode).emit('message', { type: 'resetRoom', message: 'The game has finished.' });
    }));

    //player voluntarily leaves room
    socket.on('leaveRoom', withErrorHandling(async ({ roomCode, playerCode }) => {
        const { room, player } = await getRoomAndPlayer(roomCode, playerCode, socket.id);
        //assign new host if host left and players remain
        let assignNewHost = false;
        if (player.isHost && room.players.length > 1) {
            assignNewHost = true;
        }
        //remove player from room by filtering out their socketID, allows for multiple connections per browser
        room.players = room.players.filter(p => p.socketID !== socket.id);
        if (assignNewHost) {
            room.players[0].isHost = true; // assign first player as new host
        }
        await room.save();
        socket.leave(roomCode.toUpperCase()); // arg needs to be string, case sensitivity matters
        socket.emit('message', { type: 'leftRoom', message: `You have left room: ${roomCode}.` });

        //broadcast to other players in room
        assignNewHost ?
            io.to(roomCode).emit('message', { type: 'playerLeftRoom', message: `${player.name} has left the room. ${room.players[0].name} is the new host.`, playerLeftName: player.name, newHostName: room.players[0].name })
            :
            io.to(roomCode).emit('message', { type: 'playerLeftRoom', message: `${player.name} has left the room.`, playerLeftName: player.name });
        
        serverLog(`Player ${player.name} left room ${roomCode}.`);
    }));

    //player disconnects, treat as leaving room
    socket.on('disconnect', withErrorHandling(async () => {
        serverLog(`A user disconnected: ${socket.id}`);
        const room = await Room.findOne({ 'players.socketID': socket.id });
        //remove player from room they were in
        if (room) {
            const player = room.players.find(p => p.socketID === socket.id);
            //assign new host if host left and players remain
            let assignNewHost = false;
            if (player.isHost && room.players.length > 1) {
                assignNewHost = true;
            }
            //remove player from room
            room.players = room.players.filter(p => p.socketID !== socket.id);
            if (assignNewHost) {
                room.players[0].isHost = true; // assign first player as new host
            }
            await room.save();
            serverLog(`Player ${player.name} disconnected and was removed from room ${room.roomCode}.`);
            //notify other players in room
            assignNewHost ?
                io.to(roomCode).emit('message', { type: 'announcement', message: `${player.name} has left the room. ${room.players[0].name} is the new host.` })
                :
                io.to(roomCode).emit('message', { type: 'annoucenemnt', message: `${player.name} has left the room.` });
            
        }
    }));
});

const GARBAGE_COLLECTION_INTERVAL = 10 * 60 * 1000; // 10 minutes

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
                garbageCollectRooms(); //initial garbage collection on startup
                setInterval(garbageCollectRooms, GARBAGE_COLLECTION_INTERVAL);
            });
        });
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    });