require('dotenv').config();
const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.json());  // Use Express built-in JSON parser

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL Database');
    }
});

// Add School API
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (name === undefined || address === undefined || isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }
        res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    });
});

// List Schools API (Sorted by Distance)
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Query to sort schools by distance using MySQL
    const query = `
        SELECT *, 
            (6371 * ACOS(
                COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                COS(RADIANS(longitude) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(latitude))
            )) AS distance
        FROM schools
        ORDER BY distance ASC
    `;

    db.query(query, [userLat, userLon, userLat], (err, schools) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }
        res.json(schools);
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
