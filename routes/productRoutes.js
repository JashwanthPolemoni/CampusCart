const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products (with optional search, category filters, and seller filter)
router.get('/', async (req, res) => {
    try {
        const { category, search, condition, maxPrice, sellerEmail, sellerName } = req.query;
        let query = {};

        if (sellerEmail) {
            query.sellerEmail = sellerEmail.trim().toLowerCase();
        } else if (sellerName) {
            query.sellerName = sellerName.trim();
        }

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
        const { name, category, condition, price, description, location, imageUrl, sellerName, sellerEmail, seller } = req.body;
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
            sellerName: sellerName || 'Campus Student',
            sellerEmail: (sellerEmail || '').toLowerCase(),
            seller: seller || undefined
        });
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update product listing - only the creator/seller can update
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const requesterEmail = (req.body.userEmail || req.body.sellerEmail || '').toLowerCase().trim();
        const requesterName = (req.body.userName || '').toLowerCase().trim();

        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id);
        } else {
            product = await Product.findOne({ customId: id });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Ownership enforcement — email is the primary key, name is fallback for legacy products
        const prodEmail = (product.sellerEmail || '').toLowerCase().trim();
        const prodName = (product.sellerName || '').toLowerCase().trim();
        const isMatch = prodEmail
            ? (requesterEmail && prodEmail === requesterEmail)
            : (requesterName && prodName && prodName === requesterName);

        if (!isMatch) {
            return res.status(403).json({ error: 'Permission denied: You can only edit your own listings.' });
        }

        const allowedFields = ['name', 'category', 'condition', 'price', 'description', 'location', 'imageUrl', 'status'];
        allowedFields.forEach(f => {
            if (req.body[f] !== undefined) product[f] = req.body[f];
        });
        await product.save();

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product listing - only the creator/seller can delete
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const requesterEmail = (req.body.userEmail || req.query.userEmail || '').toLowerCase().trim();
        const requesterName = (req.body.userName || req.query.userName || '').toLowerCase().trim();

        let product = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id);
        } else {
            product = await Product.findOne({ customId: id });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Ownership enforcement — email is the primary key, name is fallback for legacy products
        const prodEmail = (product.sellerEmail || '').toLowerCase().trim();
        const prodName = (product.sellerName || '').toLowerCase().trim();
        const isMatch = prodEmail
            ? (requesterEmail && prodEmail === requesterEmail)
            : (requesterName && prodName && prodName === requesterName);

        if (!isMatch) {
            return res.status(403).json({ error: 'Permission denied: You can only delete your own listings.' });
        }

        await Product.deleteOne({ _id: product._id });
        res.json({ success: true, message: 'Listing deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reserve a product
router.post('/:id/reserve', async (req, res) => {
    try {
        const id = req.params.id;
        const { reservedBy, reservedByName } = req.body;

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
        product.reservedByName = reservedByName || reservedBy;
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

        const isMatch = (product.reservedBy && product.reservedBy === reservedBy) ||
                        (product.reservedByName && product.reservedByName === reservedBy);

        if (product.status !== 'reserved' || !isMatch) {
            return res.status(403).json({ error: 'You cannot cancel this reservation.' });
        }

        product.status = 'available';
        product.reservedBy = '';
        product.reservedByName = '';
        product.reservedAt = null;
        await product.save();

        res.json({ success: true, message: 'Reservation cancelled.', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
