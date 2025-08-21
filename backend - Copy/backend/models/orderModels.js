const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: String, required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 }
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
    method: { type: String, enum: ['cod', 'card', 'ewallet'], default: 'cod' },
    provider: { type: String }, // for ewallet
    last4: { type: String } // last 4 of card or wallet number (masked reference only)
  },
  createdAt: { type: Date, default: Date.now }
});

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);