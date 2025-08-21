// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Get cart for user
router.get('/:userId', cartController.getCart);

// Add to cart
router.post('/add', cartController.addToCart);

// Remove item from cart
router.delete('/:userId/:productId', cartController.removeItemFromCart);

// Update quantity
router.put('/update-quantity', cartController.updateQuantity);

router.delete('/:userId', cartController.clearCart);


module.exports = router;
