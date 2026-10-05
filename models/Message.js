const mongoose = require('mongoose');

const messageItemSchema = new mongoose.Schema({
    sender: { type: String, enum: ['buyer', 'seller'], required: true },
    text: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}, { timestamps: true });

const threadSchema = new mongoose.Schema({
    threadId: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true },
    productIcon: { type: String, default: '📦' },
    sellerName: { type: String, default: 'Campus Student' },
    buyerName: { type: String, default: 'Student' },
    userId: { type: String, required: true },
    lastMessage: { type: String, default: '' },
    unreadCount: { type: Number, default: 0 },
    messages: [messageItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('MessageThread', threadSchema);
