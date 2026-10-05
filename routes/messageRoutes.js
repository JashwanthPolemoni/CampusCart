const express = require('express');
const router = express.Router();
const MessageThread = require('../models/Message');
const Product = require('../models/Product');

// Get all threads for user
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 'guest';
        const threads = await MessageThread.find({ userId }).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start or get chat thread for product
router.post('/start', async (req, res) => {
    try {
        const { userId = 'guest', buyerName = 'Student', productId } = req.body;
        let product = null;
        if (productId.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(productId);
        }
        if (!product) {
            product = await Product.findOne({ customId: productId });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let thread = await MessageThread.findOne({ userId, productId: String(productId) });
        if (!thread) {
            const threadId = 'thread_' + Date.now();
            const iconMap = { books: '📚', electronics: '💻', lab: '🔬', stationery: '✏️', hostel: '🏠', accessories: '🎒' };
            thread = await MessageThread.create({
                threadId,
                productId: String(productId),
                productName: product.name,
                productPrice: product.price,
                productIcon: iconMap[product.category] || '📦',
                sellerName: product.sellerName || 'Campus Student',
                buyerName: buyerName,
                userId,
                lastMessage: `Hi! I am interested in ${product.name}`,
                unreadCount: 0,
                messages: [{
                    sender: 'buyer',
                    text: `Hi! I am interested in buying ${product.name}. Is it available?`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]
            });
        }
        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send message
router.post('/send', async (req, res) => {
    try {
        const { threadId, text, sender = 'buyer' } = req.body;
        if (!threadId || !text) {
            return res.status(400).json({ error: 'ThreadId and text are required' });
        }
        const thread = await MessageThread.findOne({ threadId });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        const newMsg = {
            sender,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        thread.messages.push(newMsg);
        thread.lastMessage = text;
        thread.unreadCount = 0;
        await thread.save();

        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
