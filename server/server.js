const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
//const cookieParser = require('cookie-parser')
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const Location = require('./locationSchema'); // constructor schema
const Room = require('./roomSchema');
const initLocations = require('./initLocations');

//const cookieSecret = 'your_cookie_secret_here';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
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

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
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

// app.get('/room/:code', async (req, res) => {
//     try {
//         const room = await Room.findOne({ roomCode: req.params.code });
//         if (room) {
//             serverLog(`Fetched room with code: ${req.params.code}`);
//             //make unique name and give to user as cookie if they don't have one
//             let name = req.signedCookies.name;
//             if (!name) {
//                 let newName;
//                 const existingNames = new Set(room.players.map(p => p.name));
//                 do {
//                     newName = generateRoomCode();
//                 } while (existingNames.has(newName));
//                 name = newName;
//                 res.cookie('name', newName, { signed: true, httpOnly: true, maxAge: 10 * 60 * 1000 }); // 10 minutes
//             }
            
//             //add player to room if not already present
//             if (!room.players.some(p => p.name === name)) { // .some returns true if player with this name already exists
//                 //code block executes if player with this name does not exist
//                 serverLog(`Adding new player: ${name} to room: ${req.params.code}`);
//                 const newPlayer = { name: name, role: 'null', votedFor: null }; //role will be assigned later, so set to null for now
//                 await Room.updateOne({ roomCode: req.params.code }, { $push: { players: newPlayer } });
//             }

//             res.status(200).json(room);// return something meaningful here

//         } else {
//             serverLog(`Room with code: ${req.params.code} not found.`);
//             res.status(404).json({ error: 'Room not found' });
//         }
//     } catch (error) {
//         serverLog(`Error fetching room: ${error.message}`);
//         res.status(500).json({ error: 'Error fetching room' });
//     }
// });

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

// app.post('/api/create/room', async (req, res) => {
//     try {
//         let roomCode = generateRoomCode();
//         let existingRoom = await Room.findOne({ roomCode });
//         while (existingRoom) {
//             roomCode = generateRoomCode();
//             existingRoom = await Room.findOne({ roomCode });
//         }

//         const newRoom = new Room({ 
//             roomCode: roomCode,
//             players: [{ name: 'Player 1', role: 'null', votedFor: null }],
//             gameState: 'waiting',
//             location: req.body.location
//         });
//         const savedRoom = await Room.save();
//         serverLog(`Created new room with id: ${savedRoom._id}, and code: ${savedRoom.roomCode}`);
//         let name = generateRoomCode();
//         res.cookie('name', name, { httpOnly: true, maxAge: 10 * 60 * 1000 }); // 10 minutes
//         res.status(201).json({code: savedRoom.roomCode});
//     } catch (error) {
//         serverLog(`Error creating room: ${error.message}`);
//         res.status(500).json({ error: 'Error creating room' });
//     }
// });

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
    roomDocument.players.forEach(player => {
        if (player.votedFor) {
            voteMap.set(player.votedFor, (voteMap.get(player.votedFor) || 0) + 1);
        }
    });
    for (let [playerName, count] of voteMap.entries()) {
        if (count >= numMajority) {
            return playerName; //player to be eliminated
        }
    }
    return null; //no player has majority votes
}

io.on('connection', (socket) => {
    serverLog('a user connected');

    //create room
    socket.on('createRoom', async () => {
        try{
            let newRoomCode = generateRoomCode();
            let existingRoom = await Room.findOne({ roomCode: newRoomCode });
            while (existingRoom) {
                //if room code already exists, generate a new one
                newRoomCode = generateRoomCode();
                existingRoom = await Room.findOne({ roomCode: newRoomCode });
            }
            //add host as first player in room
            let hostName = generateRoomCode(); // generate random name for host
            //create room in db
            const newRoom = new Room({ 
                roomCode: newRoomCode,
                players: [{ name: hostName, socketID: socket.id, isHost: true }], // role will be assigned later, so set to null for now
                gameState: 'waiting',
                location: null, // location will be set later
            });
            const savedRoom = await newRoom.save(); //save newRoom to db collection
            socket.join(newRoomCode);//join socket.io room with room code
            socket.emit('roomCreated', { roomCode: savedRoom.roomCode });//emit roomCreated event with room code to host client
            serverLog(`Created new room with id: ${savedRoom._id}, and code: ${savedRoom.roomCode}`);
        }
        catch (error) {
            serverLog(`Error creating room: ${error.message}`);
            socket.emit('error', { message: 'Error creating room' });
        }
    });

    //join room
    socket.on('joinRoom', async ({ roomCode }) => {
        try {
            const room = await Room.findOne({ roomCode });
            if (room) { // Room exists
                let playerName; // generate unique name for player
                const existingNames = new Set(room.players.map(p => p.name)); // get set of existing player names in room
                do {
                    playerName = generateRoomCode();
                } while (existingNames.has(playerName)); // ensure name is unique in this room

                // Add player to the room
                await Room.updateOne({ roomCode }, { $push: { players: { name: playerName, socketID: socket.id } } });
                // non required will be assigned later
                await Room.save();
                
                socket.join(roomCode);
                serverLog(`Player ${playerName} joined room ${roomCode}.`);

                io.to(roomCode).emit('playerJoined', room.players); // Notify all clients in the room about the new player list
            } else {
                socket.emit('roomNotFound', { message: `Room with code ${roomCode} not found.` });
            }
        } catch (error) {
            serverLog(`Error joining room: ${error.message}`);
            //socket.emit('error', { message: 'Error joining room' });
        }
    });
    // start game
    socket.on('startGame', async ({ roomCode, name }) => {
        try {
            const room = await Room.find({ roomCode });
            if (room) {
                //game already started
                if (room.gameState !== 'waiting') {
                    socket.emit('gameAlreadyStarted', { message: 'Game has already started.' });
                    return;
                }
                //must have at least 3 players to start game
                if (room.players.length < 3) {
                    socket.emit('notEnoughPlayers', { message: 'At least 3 players are required to start the game.' });
                    return;
                }
                //only host can start game
                const player = room.players.find(p => p.name === name);
                if (player && player.isHost && socket.id === player.socketID) {
                    //assign roles to players
                    const location = await Location.findById(room.location);
                    const roles = location.roles; // array of roles for this location
                    const numPlayers = room.players.length;
                    const multi = Math.ceil(numPlayers / roles.length);
                    //create array of roles with enough roles for all players
                    const extendedRoles = [];
                    for (let i = 0; i < multi; i++) {
                        extendedRoles.push(...roles);
                    }
                    const numSpies = Math.max(1, Math.floor(numPlayers / 4)); // at least 1 spy, 1 spy per 4 players
                    const assignedRoles = extendedRoles.slice(0, numPlayers - numSpies).concat(Array(numSpies).fill('Spy'));
                    //shuffle assignedRoles again to randomize spy positions
                    const finalRoles = assignedRoles.sort(() => Math.random() - 0.5);
                    //assign roles to players in room
                    room.players.forEach((p, index) => {
                        p.role = finalRoles[index];
                    });
                    room.gameState = 'in-progress';
                    await room.save();
                    io.to(roomCode).emit('gameStarted', {message: "Game has started."}); // notify all players game has started
                    //for each player, emit their role privately
                    room.players.forEach(p => {
                        io.to(p.socketID).emit('roleAssigned', { location: room.location, role: p.role });
                    });
                    //set timeout to enter final voting state after room.gameLength minutes
                    setTimeout(async () => {
                        const endedRoom = await Room.find({ roomCode });
                        if (endedRoom && endedRoom.gameState === 'in-progress') {
                            endedRoom.gameState = 'voting';
                            endedRoom.voteCount = 0;
                        }
                        await endedRoom.save();
                        io.to(roomCode).emit('finalVotingStarted', { message: 'Final Voting has started. Please vote to eliminate the spy.' });
                    }, room.gameLength * 60 * 1000); // convert minutes to milliseconds
                }
                socket.emit('notAuthorized', { message: 'Only the host can start the game.' });
            } else {
                socket.emit('roomNotFound', { message: `Room with code ${roomCode} not found.` });
            }
        }
        catch (error) {
            serverLog(`Error starting game: ${error.message}`);
            socket.emit('error', { message: 'Error starting game' });
        }
    });

    //player voted for someone
    socket.on('vote', async ({ roomCode, name, votedFor }) => {
        try {
            let room = await Room.find({roomCode});
            if (room) {
                //game must be in voting state to vote
                if (room.gameState !== 'voting') {
                    socket.emit('notInVotingState', { message: 'Game is not in voting state.' });
                    return;
                }
                //check socket id matches player name
                const player = room.players.find(p => p.name === name);
                if (player && player.socketID === socket.id) {
                    //check votedFor is a valid player in room
                    if (!room.players.some(p => p.name === votedFor)) {
                        socket.emit('invalidVote', { message: 'You voted for an invalid player.' });
                        return;
                    }
                    //record vote and increment vote count
                    await Room.updateOne({ roomCode, 'players.name': name },
                        { $set: { 'players.$.votedFor': votedFor }, $inc: { voteCount: 1 } }); 
                        //.$. is positional operator to update matched array element from query
                    
                    await Room.save();

                    //if player is last to vote, end voting early
                    if (room.voteCount >= room.players.length - 1) {
                        //all players have voted, end voting early
                        io.to(roomCode).emit('votingEnded', { message: "Voting has ended."}); // notify all players voting has ended
                        const eliminatedPlayerName = checkVotes(room);
                    }
                    //io.to(roomCode).emit('playerVoted', updatedRoom.players); // notify all players in room of updated player list with votes
                    
                   
                } else {
                    socket.emit('notAuthorized', { message: 'You are not authorized to vote for this player.' });
                }
            } else {
                socket.emit('roomNotFound', { message: `Room with code ${roomCode} not found.` });
            }
        }
        catch (error) {

            socket.emit('error', { message: 'Error voting' });
        }
    });

    //call for a vote
    socket.on('callVote', async ({ roomCode, name }) => {
        try {
            const room = await Room.findOne({ roomCode });
            if (room) {
                //anyone in room can call for a vote once game is in progress
                if (room.gameState !== 'in-progress') {
                    socket.emit('notInProgressState', { message: 'Game is not in progress.' });
                    return;
                }
                //if already in voting state, cannot call another vote
                if (room.gameState === 'voting') {
                    socket.emit('alreadyInVotingState', { message: 'Game is already in voting state.' });
                    return;
                }
                //if voteOffCooldown is set and in the future, cannot call another vote yet
                if (room.voteOffCooldown && room.voteOffCooldown > new Date()) {
                    const waitTime = Math.ceil((room.voteOffCooldown - new Date()) / 1000); // seconds
                    socket.emit('voteCooldownActive', { message: `You must wait ${waitTime} seconds before calling another vote.` });
                    return;
                }
                const player = room.players.find(p => p.name === name);
                if (player && player.socketID === socket.id) {
                    room.gameState = 'voting';
                    //reset all players' votedFor to null
                    room.players.forEach(p => p.votedFor = null);
                    await room.save();
                    io.to(roomCode).emit('voteCalled', { message: 'A vote has been called.' }); // notify all players in room that voting has started
                    //start timeout to end voting after 30 seconds
                    setTimeout(async () => {
                        const updatedRoom = await Room.findOne({ roomCode });
                        if (updatedRoom && updatedRoom.gameState === 'voting') {
                            updatedRoom.gameState = 'in-progress';
                            updatedRoom.voteCount = 0;
                            updatedRoom.voteOffCooldown = new Date(Date.now() + 1 * 60 * 1000); // set cooldown to 1 minute from end of vote
                        }
                        await updatedRoom.save();
                        io.to(roomCode).emit('votingEnded', { message: 'The vote has ended.' }); // notify all players voting has ended
                        const eliminatedPlayerName = checkVotes(updatedRoom);
                        if (eliminatedPlayerName) {
                            const eliminatedPlayer = updatedRoom.players.find(p => p.name === eliminatedPlayerName);
                            io.to(roomCode).emit('playerEliminated', { message: `${eliminatedPlayerName} has been voted as the Spy.`});
                            //if eliminated player is spy, they get one guess to pick location
                            if (eliminatedPlayer.role === 'Spy') {
                                io.to(roomCode).emit('spyGuessCorrect', { message: 'You have correctly guessed the Spy! The Spy has one guess to pick the correct location.' });
                            } else {
                                //non-spy eliminated, spies win
                                io.to(roomCode).emit('gameEnded', { message: 'You have guessed incorrectly. Spies win!' });
                                updatedRoom.gameState = 'finished';
                                await updatedRoom.save();
                            }
                        }
                        io.to(roomCode).emit('gameResumed', { message: 'The game has resumed.' });
                    }, 0.5 * 60 * 1000); // 30 seconds
                } else {
                    socket.emit('notAuthorized', { message: 'You are not authorized to call a vote.' });
                }
            } else {
                socket.emit('roomNotFound', { message: `Room with code ${roomCode} not found.` });
            }
        } catch (error) {
            socket.emit('error', { message: 'Error calling vote' });
        }
    });
    
    
    //leave room
    socket.on('disconnect', async () => {
        serverLog(`user disconnected: ${socket.id}`);
        //remove player from room they were in
        const room = await Room.findOne({ 'players.socketID': socket.id });
        room.players = room.players.filter(p => p.socketID !== socket.id);
        await room.save();
        //notify other players in room
        io.to(room.roomCode).emit('playerLeft', room.players);
    });
});

mongoose.connect(mongo_uri)
    .then(() => {
        serverLog('Successfully connected to MongoDB!');
        initDB().then(() => {
            server.listen(port, () => {
                serverLog(`Server is running on port: ${port}`);
            });
        });
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    });