const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    customId: { type: String }, // e.g. default-1, default-2
    name: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['books', 'electronics', 'lab', 'stationery', 'hostel', 'accessories']
    },
    condition: {
        type: String,
        required: true,
        enum: ['new', 'good', 'used']
    },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    location: {
        type: String,
        default: 'college',
        enum: ['college', 'library', 'canteen', 'hostel']
    },
    imageUrl: { type: String, default: '' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerName: { type: String, default: 'Campus Student' },
    status: {
        type: String,
        default: 'available',
        enum: ['available', 'reserved', 'sold']
    },
    reservedBy: { type: String, default: '' },
    reservedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
