const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    college: { type: String, default: 'College of Engineering' },
    department: { type: String, default: 'Computer Science & Engineering' },
    year: { type: String, default: '3rd Year' },
    phone: { type: String, default: '+91 98765 43210' },
    avatar: { type: String, default: 'CC' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
