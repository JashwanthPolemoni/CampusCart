const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products (with optional search and category filters)
router.get('/', async (req, res) => {
    try {
        const { category, search, condition, maxPrice } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (condition) {
            const conditions = Array.isArray(condition) ? condition : condition.split(',');
            query.condition = { $in: conditions };
        }
        if (maxPrice) {
            query.price = { $lte: Number(maxPrice) };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single product by Mongo ID or customId
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id);
        }
        if (!product) {
            product = await Product.findOne({ customId: id });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create product listing
router.post('/', async (req, res) => {
    try {
        const { name, category, condition, price, description, location, imageUrl, sellerName } = req.body;
        if (!name || !category || !condition || !price || !description) {
            return res.status(400).json({ error: 'Please provide all required product details.' });
        }
        const product = new Product({
            customId: 'prod_' + Date.now(),
            name,
            category,
            condition,
            price: Number(price),
            description,
            location: location || 'college',
            imageUrl: imageUrl || '',
            sellerName: sellerName || 'Campus Student'
        });
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update product listing
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        } else {
            product = await Product.findOneAndUpdate({ customId: id }, req.body, { new: true });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product listing
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findByIdAndDelete(id);
        } else {
            product = await Product.findOneAndDelete({ customId: id });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Listing deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reserve a product
router.post('/:id/reserve', async (req, res) => {
    try {
        const id = req.params.id;
        const { reservedBy } = req.body;

        if (!reservedBy) {
            return res.status(400).json({ error: 'Please log in to reserve an item.' });
        }

        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id);
        } else {
            product = await Product.findOne({ customId: id });
        }

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.status === 'reserved') {
            return res.status(409).json({ error: 'This item has already been reserved by someone else.' });
        }

        if (product.status === 'sold') {
            return res.status(409).json({ error: 'This item has already been sold.' });
        }

        product.status = 'reserved';
        product.reservedBy = reservedBy;
        product.reservedAt = new Date();
        await product.save();

        res.json({ success: true, message: 'Item reserved successfully!', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel reservation for a product
router.post('/:id/unreserve', async (req, res) => {
    try {
        const id = req.params.id;
        const { reservedBy } = req.body;

        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id);
        } else {
            product = await Product.findOne({ customId: id });
        }

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.status !== 'reserved' || product.reservedBy !== reservedBy) {
            return res.status(403).json({ error: 'You cannot cancel this reservation.' });
        }

        product.status = 'available';
        product.reservedBy = '';
        product.reservedAt = null;
        await product.save();

        res.json({ success: true, message: 'Reservation cancelled.', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
