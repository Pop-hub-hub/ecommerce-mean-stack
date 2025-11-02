const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('../models/productModel'); 
const connectDB = require('../db/connection'); 

// Connect to DB
connectDB();

async function importProducts() {
  try {
    const jsonData = JSON.parse(fs.readFileSync('products.json', 'utf8'));
    console.log('Data from JSON file:', jsonData); 

    // Extract products array from the JSON structure
    const productsData = jsonData.products;

    if (!Array.isArray(productsData) || productsData.length === 0) {
      console.log('No valid products found in the JSON file.');
      return;
    }

    const invalidProducts = productsData.filter(product => !product.title || !product.category || !product.price);

    if (invalidProducts.length > 0) {
      console.log('The following products are missing required fields (title, category, or price):');
      console.log(invalidProducts);
      return;
    }

    await Product.insertMany(productsData);
    console.log(`${productsData.length} products imported successfully.`);
    mongoose.disconnect();
  } catch (err) {
    console.error('Error importing products:', err);
    mongoose.disconnect();
  }
}

importProducts();