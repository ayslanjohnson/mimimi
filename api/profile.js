// API profile functionality

const express = require('express');
const router = express.Router();

// Sample data for profiles
const profiles = {
    1: { name: "User1", score: 100 },
    2: { name: "User2", score: 95 },
};

// Get profile by ID
router.get('/:id', (req, res) => {
    const profile = profiles[req.params.id];
    if (profile) {
        res.json(profile);
    } else {
        res.status(404).send('Profile not found');
    }
});

module.exports = router;
