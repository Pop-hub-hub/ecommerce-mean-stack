// controllers/cartController.js
const Cart = require('../models/cartModel');

// Helper function to get cart for a user
const getCartForUser = async (userId) => {
  return await Cart.findOne({ userId }).populate('items.productId');
};

exports.getCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const cart = await getCartForUser(userId);
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cart' });
  }
};

exports.addToCart = async (req, res) => {
  const { userId, product, quantity } = req.body;

  if (!product || !product._id) {
    return res.status(400).json({ error: 'Product is required' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId: product._id, quantity }],
      });
    } else {
      const index = cart.items.findIndex(i => i.productId.toString() === product._id.toString());
      if (index > -1) {
        cart.items[index].quantity += quantity;
      } else {
        cart.items.push({ productId: product._id, quantity });
      }
    }

    await cart.save();
    const populated = await cart.populate('items.productId');
    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Error adding to cart' });
  }
};

exports.removeItemFromCart = async (req, res) => {
  const { userId, productId } = req.params;

  if (!productId) {
    return res.status(400).json({ error: 'ProductId is required' });
  }

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    ).populate('items.productId');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Error removing item from cart' });
  }
};

exports.clearCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await Cart.findOneAndDelete({ userId });
    if (!result) return res.status(404).json({ message: 'Cart not found' });
    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting cart' });
  }
};

exports.updateQuantity = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return res.status(400).json({ error: 'ProductId and quantity are required' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(i => i.productId.toString() === productId.toString());
    if (item) {
      item.quantity = quantity;
      await cart.save();
      const populated = await cart.populate('items.productId');
      return res.json(populated);
    } else {
      return res.status(404).json({ message: 'Product not in cart' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error updating quantity' });
  }
};


