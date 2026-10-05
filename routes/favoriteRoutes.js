const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// Get all favorites for user
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 'usr_demo';
        const favorites = await Favorite.find({ userId });
        const favProductIds = favorites.map(f => f.productId);

        const products = await Product.find({
            $or: [
                { _id: { $in: favProductIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } },
                { customId: { $in: favProductIds } }
            ]
        });

        res.json({ favorites: favProductIds, products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle favorite
router.post('/toggle', async (req, res) => {
    try {
        const { userId = 'usr_demo', productId } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'ProductId is required' });
        }
        const existing = await Favorite.findOne({ userId, productId });
        let isAdded = false;
        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
        } else {
            await Favorite.create({ userId, productId });
            isAdded = true;
        }
        const allFavs = await Favorite.find({ userId });
        res.json({ success: true, isAdded, favorites: allFavs.map(f => f.productId) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
