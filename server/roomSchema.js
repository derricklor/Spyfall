const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    players: [{
        name: { type: String, required: true },
        playerCode: { type: String, required: true },
        socketID: { type: String, required: true },
        role: { type: String, default: null },
        votedFor: { type: String, default: null },
        isHost: { type: Boolean, default: false },
    }],
    gameState: {
        type: String,
        enum: ['waiting', 'in-progress', 'voting'],
        default: 'waiting',
    },
    voteOffCooldown: { 
        //date when voting can next occur
        type: Date,
        default: null
    },
    voteTimeoutID: { 
        type: Number, 
        default: null 
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        default: null
    },
    gameTimeoutID: { 
        type: Number, 
        default: null 
    },
    gameLength: {
        type: Number,
        default: 8, // default game length in minutes
        min: 1,
        max: 59
    },
    gameEndDate: { 
        type: Date,
        default: null
    },
    gameCreatedDate: { 
        type: Date,
        default: Date.now
    }
});
const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
