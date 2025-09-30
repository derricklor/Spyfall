const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roles: { type: [String], required: true }

});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;