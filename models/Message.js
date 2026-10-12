const mongoose = require('mongoose');

const messageItemSchema = new mongoose.Schema({
    senderEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}, { timestamps: true });

const threadSchema = new mongoose.Schema({
    threadId: { type: String, required: true, unique: true },
    productId: { type: String, default: '' },
    productName: { type: String, default: '' },
    productPrice: { type: Number, default: 0 },
    productIcon: { type: String, default: '💬' },
    sellerName: { type: String, default: 'Campus Student' },
    sellerEmail: { type: String, default: '' },
    buyerName: { type: String, default: 'Student' },
    buyerEmail: { type: String, default: '' },
    participants: [{ type: String, required: true }], // Array of user emails
    participantDetails: [{
        email: { type: String, required: true },
        name: { type: String, default: 'Student' }
    }],
    lastMessage: { type: String, default: '' },
    lastSenderEmail: { type: String, default: '' },
    unreadCount: { type: Number, default: 0 },
    messages: [messageItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('MessageThread', threadSchema);
