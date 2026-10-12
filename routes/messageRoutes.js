const express = require('express');
const router = express.Router();
const MessageThread = require('../models/Message');
const Product = require('../models/Product');
const User = require('../models/User');

// Get all threads for a user (by email or userId)
router.get('/', async (req, res) => {
    try {
        const email = (req.query.email || req.query.userId || '').trim().toLowerCase();
        if (!email) {
            return res.json([]);
        }

        // Find threads where user is in participants list or matching legacy userId
        const threads = await MessageThread.find({
            $or: [
                { participants: email },
                { buyerEmail: email },
                { sellerEmail: email },
                { userId: email }
            ]
        }).sort({ updatedAt: -1 });

        res.json(threads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single thread by threadId (for auto-polling updates)
router.get('/thread/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await MessageThread.findOne({ threadId });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search registered students to start a direct chat
router.get('/search-users', async (req, res) => {
    try {
        const query = (req.query.query || '').trim();
        const currentEmail = (req.query.currentEmail || '').trim().toLowerCase();

        if (!query || query.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const regex = new RegExp(query, 'i');
        const users = await User.find({
            $and: [
                { email: { $ne: currentEmail } },
                { $or: [{ name: regex }, { email: regex }] }
            ]
        }).limit(8).select('name email college department avatar');

        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start or retrieve a chat thread
router.post('/start', async (req, res) => {
    try {
        let {
            senderEmail,
            senderName,
            targetEmail,
            targetName,
            productId,
            initialMessage
        } = req.body;

        // Legacy payload support
        if (!senderEmail && req.body.userId) {
            senderEmail = req.body.userId;
            senderName = req.body.buyerName || 'Student';
        }

        senderEmail = (senderEmail || '').trim().toLowerCase();
        targetEmail = (targetEmail || '').trim().toLowerCase();

        let product = null;
        if (productId) {
            if (productId.match(/^[0-9a-fA-F]{24}$/)) {
                product = await Product.findById(productId);
            }
            if (!product) {
                product = await Product.findOne({ customId: productId });
            }
            if (product) {
                if (!targetEmail) {
                    targetEmail = (product.sellerEmail || '').toLowerCase();
                }
                if (!targetName) {
                    targetName = product.sellerName || 'Campus Student';
                }
            }
        }

        // If targetEmail is still empty, fallback to product seller or error
        if (!targetEmail) {
            return res.status(400).json({ error: 'Recipient email is required to start a chat.' });
        }

        if (senderEmail && senderEmail === targetEmail) {
            return res.status(400).json({ error: 'You cannot message your own account.' });
        }

        // Check if an existing thread already exists between these two users
        let query = {
            participants: { $all: [senderEmail, targetEmail] }
        };
        if (productId) {
            query.productId = String(productId);
        }

        let thread = await MessageThread.findOne(query);

        if (!thread) {
            const threadId = 'thread_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const iconMap = { books: '📚', electronics: '💻', lab: '🔬', stationery: '✏️', hostel: '🏠', accessories: '🎒' };
            const defaultMsg = initialMessage || (product
                ? `Hi ${targetName}! I am interested in buying ${product.name}. Is it still available?`
                : `Hi ${targetName}! I would like to connect with you.`);

            thread = await MessageThread.create({
                threadId,
                productId: productId ? String(productId) : '',
                productName: product ? product.name : (targetName ? `Chat with ${targetName}` : 'Direct Conversation'),
                productPrice: product ? product.price : 0,
                productIcon: product ? (iconMap[product.category] || '📦') : '💬',
                sellerName: targetName || 'Campus Student',
                sellerEmail: targetEmail,
                buyerName: senderName || 'Student',
                buyerEmail: senderEmail,
                participants: [senderEmail, targetEmail],
                participantDetails: [
                    { email: senderEmail, name: senderName || 'Student' },
                    { email: targetEmail, name: targetName || 'Campus Student' }
                ],
                lastMessage: defaultMsg,
                lastSenderEmail: senderEmail,
                unreadCount: 0,
                messages: [{
                    senderEmail,
                    senderName: senderName || 'Student',
                    text: defaultMsg,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]
            });
        }

        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send message in thread
router.post('/send', async (req, res) => {
    try {
        const { threadId, text } = req.body;
        let { senderEmail, senderName } = req.body;

        if (!threadId || !text || !text.trim()) {
            return res.status(400).json({ error: 'ThreadId and text are required.' });
        }

        senderEmail = (senderEmail || '').trim().toLowerCase();
        senderName = senderName || 'Student';

        const thread = await MessageThread.findOne({ threadId });
        if (!thread) {
            return res.status(404).json({ error: 'Conversation thread not found.' });
        }

        // Ensure sender is added to participants if not present
        if (senderEmail && !thread.participants.includes(senderEmail)) {
            thread.participants.push(senderEmail);
        }

        const newMsg = {
            senderEmail,
            senderName,
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        thread.messages.push(newMsg);
        thread.lastMessage = text.trim();
        thread.lastSenderEmail = senderEmail;
        thread.unreadCount = 0;
        await thread.save();

        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
