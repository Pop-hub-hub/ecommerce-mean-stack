const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: Number,
  comment: String,
  date: String,
  reviewerName: String,
  reviewerEmail: String
});

const dimensionsSchema = new mongoose.Schema({
  width: Number,
  height: Number,
  depth: Number
});

const metaSchema = new mongoose.Schema({
  createdAt: String,
  updatedAt: String,
  barcode: String,
  qrCode: String
});

const productSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  category: String,
  price: Number,
  discountPercentage: Number,
  rating: Number,
  stock: Number,
  tags: [String],
  brand: String,
  sku: String,
  weight: Number,
  dimensions: dimensionsSchema,
  warrantyInformation: String,
  shippingInformation: String,
  availabilityStatus: String,
  reviews: [reviewSchema],
  returnPolicy: String,
  minimumOrderQuantity: Number,
  meta: metaSchema,
  images: [String],
  thumbnail: String
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;



