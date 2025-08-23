const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
      status: {
        type: String,
        enum: ['pending', 'packed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
      }
    }
  ],
  address: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: "pending" },
  eta: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    formattedAddress: { type: String }
  },
  payment: {
    method: {
      type: String,
      enum: ['cod', 'card', 'ewallet'],
      default: 'cod'
    },
    provider: { type: String },
    last4: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);