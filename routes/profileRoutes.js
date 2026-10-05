const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get profile by email
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                return res.json(user);
            }
        }
        const firstUser = await User.findOne({});
        res.json(firstUser || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile
router.put('/', async (req, res) => {
    try {
        const { email, name, college, department, year, phone } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        const avatar = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CC';
        const user = await User.findOneAndUpdate(
            { email },
            { name, college, department, year, phone, avatar },
            { new: true, upsert: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
