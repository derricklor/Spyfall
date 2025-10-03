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

app.post('/api/create/room', async (req, res) => {
    try {
        let roomCode = generateRoomCode();
        let existingRoom = await Room.findOne({ roomCode });
        while (existingRoom) {
            roomCode = generateRoomCode();
            existingRoom = await Room.findOne({ roomCode });
        }

        const newRoom = new Room({ 
            roomCode: roomCode,
            players: [{ name: 'Player 1', role: 'null', votedFor: null }],
            gameState: 'waiting',
            location: req.body.location
            //createdAt will default to Date.now
        });
        const savedRoom = await Room.save();
        serverLog(`Created new room with id: ${savedRoom._id}, and code: ${savedRoom.roomCode}`);
        let name = generateRoomCode();
        res.cookie('name', name, { httpOnly: true, maxAge: 10 * 60 * 1000 }); // 10 minutes
        res.status(201).json({code: savedRoom.roomCode});
    } catch (error) {
        serverLog(`Error creating room: ${error.message}`);
        res.status(500).json({ error: 'Error creating room' });
    }
});

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
                //createdAt will default to Date.now
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
                //only host can start game
                const player = room.players.find(p => p.name === name);
                if (player && player.isHost) {
                    //assign roles to players
                    const location = await Location.findById(room.location);
                    const roles = location.roles; // array of roles for this location
                    const numPlayers = room.players.length;
                    const numSpies = Math.max(1, Math.floor(numPlayers / 4)); // at least 1 spy, 1 spy per 4 players
                    const assignedRoles = roles.slice(0, numPlayers - numSpies).concat(Array(numSpies).fill('Spy'));
                    //shuffle assignedRoles again to randomize spy positions
                    const finalRoles = assignedRoles.sort(() => Math.random() - 0.5);
                    //assign roles to players in room
                    room.players.forEach((p, index) => {
                        p.role = finalRoles[index];
                    });
                    room.gameState = 'in-progress';
                    await room.save();
                    io.to(roomCode).emit('gameStarted', room.players); // notify all players game has started and send player list with roles
                }
                socket.emit('notAuthorized', { message: 'Only the host can start the game.' });
            }
        }
        catch (error) {
            serverLog(`Error starting game: ${error.message}`);
            socket.emit('error', { message: 'Error starting game' });
        }

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