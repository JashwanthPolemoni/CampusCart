const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, college, department, year, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }
        const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        user = new User({ name, email, password, college, department, year, phone, avatar });
        await user.save();
        res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, college: user.college, department: user.department, year: user.year, phone: user.phone, avatar: user.avatar } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, college: user.college, department: user.department, year: user.year, phone: user.phone, avatar: user.avatar } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
