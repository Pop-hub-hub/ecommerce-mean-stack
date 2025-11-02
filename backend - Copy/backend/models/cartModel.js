// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: String, // You can use ObjectId if users are stored
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
});

cartSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);

