const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const Location = require('./locationSchema'); // constructor schema
const initLocations = require('./initLocations');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
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
            serverLog('Seeding complete. Initial locations added!');
        } else {
            serverLog(`Database already contains ${count} locations. Skipping seed.`);
        }
    } catch (error) {
        serverLog(`Error during database seeding: ${error.message}`);
        throw error;
    }
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

mongoose.connect(mongo_uri)
    .then(() => {
        serverLog('Successfully connected to MongoDB!');
        initDB().then(() => {

            app.listen(port, () => {
            serverLog(`Server is running on port: ${port}`);
        });
    
});
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    });