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
        role: { type: String, required: true },
        votedFor: { type: String, default: null }
    }],
    gameState: {
        type: String,
        enum: ['waiting', 'in-progress', 'voting', 'finished'],
        default: 'waiting'
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m' // Rooms will be automatically deleted after 10 minutes
    }
});
const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
