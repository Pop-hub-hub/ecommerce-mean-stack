const mongoose = require("mongoose");
const Order = require("../models/orderModels");
const Product = require("../models/productModel"); 
const User = require("../models/userModel");

// Helper: only owner of the order or admin can modify/delete
function canModifyOrder(reqUser, order) {
  if (!reqUser || !order) return false;
  const isOwner = String(order.user) === String(reqUser._id);
  const isAdmin = reqUser.role === 'admin';
  return isOwner || isAdmin;
}

exports.createOrder = async (req, res) => {
  try {
    const { products, totalPrice, shippingInfo, location, payment } = req.body;
    const { address, phone, notes } = shippingInfo || {};

    // Basic input validation
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }
    if (!shippingInfo || !address || !phone) {
      return res.status(400).json({ error: 'Shipping address and phone are required' });
    }
    if (totalPrice === undefined) {
      return res.status(400).json({ error: 'totalPrice is required' });
    }

    // Sanitize products: ensure valid ObjectId and quantity
    const sanitized = [];
    for (const item of products) {
      if (!item || !item.productId) continue;
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ error: `Invalid productId: ${item.productId}` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      sanitized.push({
        productId: item.productId,
        quantity: qty,
        status: 'pending' // status of each product in the order
      });
    }
    if (sanitized.length === 0) {
      return res.status(400).json({ error: 'No valid products to order' });
    }

    // Optional: Recalculate total from DB for safety
    let computedTotal = 0;
    for (const s of sanitized) {
      const p = await Product.findById(s.productId).select('price');
      if (p) computedTotal += (p.price || 0) * s.quantity;
    }

    const eta = '3-5 days';
    const newOrder = new Order({
      user: req.user._id,
      products: sanitized,
      totalPrice: computedTotal || totalPrice,
      address,
      phone,
      notes,
      eta,
      location,
      payment: sanitizePayment(payment)
    });

    await newOrder.save();

    // Update stock for each product in the order
    for (const item of sanitized) {
      const product = await Product.findById(item.productId);
      if (product) {
        const currentStock = Number(product.stock) || 0;
        product.stock = Math.max(currentStock - item.quantity, 0);
        await product.save();
      }
    }

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Error creating order: ' + error.message });
  }
};

function sanitizePayment(payment) {
  if (!payment) return { method: 'cod' };
  const method = payment.method;
  if (method === 'card') {
    // never store full card; keep last4 only
    const last4 = (payment.cardNumber || '').toString().slice(-4);
    return { method: 'card', last4 };
  }
  if (method === 'ewallet') {
    const provider = payment.provider;
    const last4 = (payment.walletNumber || '').toString().slice(-4);
    return { method: 'ewallet', provider, last4 };
  }
  return { method: 'cod' };
}

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("products.productId")
      .populate("user", "firstName lastName email");

    // Defensive fix: some legacy orders may have `user` stored as a string ObjectId, causing populate to miss
    const normalized = await Promise.all(orders.map(async (o) => {
      // If user is missing details or is a string, fetch minimal user profile
      if (!o.user || typeof o.user === 'string' || !o.user.firstName) {
        const userId = typeof o.user === 'string' ? o.user : o.user?._id;
        if (userId) {
          const u = await User.findById(userId).select('firstName lastName email');
          if (u) {
            const obj = o.toObject ? o.toObject() : o;
            obj.user = { _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email };
            return obj;
          }
        }
      }
      return o;
    }));

    res.status(200).json({
      status: "success",
      message: "Orders retrieved successfully",
      orders: normalized
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders: ' + error.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    // Only the owner or an admin can access
    const isOwner = String(req.user._id) === String(userId);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const orders = await Order.find({ user: userId }).populate('products.productId');
    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders: ' + error.message });
  }
};

// Update order status and ETA (admin only)
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, eta } = req.body;
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (status) order.status = status;
    if (eta) order.eta = eta;
    await order.save();
    const populated = await Order.findById(orderId)
      .populate('products.productId')
      .populate('user', 'firstName lastName email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status: ' + error.message });
  }
};

exports.updateOrderItemStatus = async (req, res) => {
  const { orderId } = req.params;
  const { productId, status } = req.body;

  const allowedStatuses = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status: '${status}'. Allowed values are: ${allowedStatuses.join(', ')}` });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const item = order.products.find(p => String(p.productId) === String(productId));
    if (!item) {
      return res.status(404).json({ error: 'Product not found in order' });
    }

    item.status = status;
    await order.save();

    const populatedOrder = await Order.findById(orderId)
      .populate('products.productId')
      .populate('user', 'firstName lastName email');

    res.status(200).json({
      message: 'Product status updated successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error(`Error updating product status in order ${orderId}:`, error);
    res.status(500).json({ error: 'Failed to update item status: ' + error.message });
  }
};




exports.deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!canModifyOrder(req.user, order)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Order.findByIdAndDelete(orderId);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order: ' + error.message });
  }
};

// Replace entire items array for a pending order and recalc totalPrice
exports.updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const { products } = req.body; // [{ productId, quantity }]

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'products array is required' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!canModifyOrder(req.user, order)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not editable' });

    // sanitize and recalc total
    let total = 0;
    const sanitized = [];
    for (const p of products) {
      if (!p || !p.productId || p.quantity === undefined) continue;
      const prod = await Product.findById(p.productId);
      if (!prod) continue;
      const qty = Math.max(0, parseInt(p.quantity, 10) || 0);
      if (qty === 0) continue;
      total += (prod.price || 0) * qty;
      sanitized.push({ productId: prod._id, quantity: qty });
    }

    order.products = sanitized;
    order.totalPrice = total;
    await order.save();
    const populated = await Order.findById(orderId).populate('products.productId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order: ' + error.message });
  }
};

// Update quantity of an item inside an order (only if pending)
exports.updateOrderItemQuantity = async (req, res) => {
  const { orderId } = req.params;
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return res.status(400).json({ error: 'productId and quantity are required' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!canModifyOrder(req.user, order)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not editable' });

    const item = order.products.find(p => String(p.productId) === String(productId));
    if (!item) return res.status(404).json({ error: 'Item not found in order' });

    if (quantity <= 0) {
      // remove item
      order.products = order.products.filter(p => String(p.productId) !== String(productId));
    } else {
      item.quantity = quantity;
    }

    await order.save();
    const populated = await Order.findById(orderId).populate('products.productId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item: ' + error.message });
  }
};

// Remove an item from order (only if pending)
exports.removeOrderItem = async (req, res) => {
  const { orderId, productId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!canModifyOrder(req.user, order)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not editable' });

    order.products = order.products.filter(p => String(p.productId) !== String(productId));
    await order.save();
    const populated = await Order.findById(orderId).populate('products.productId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item: ' + error.message });
  }
};

// Add a new item to order (only if pending)
exports.addOrderItem = async (req, res) => {
  const { orderId } = req.params;
  const { productId, quantity = 1 } = req.body;

  if (!productId) return res.status(400).json({ error: 'productId is required' });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!canModifyOrder(req.user, order)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not editable' });

    const existing = order.products.find(p => String(p.productId) === String(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      order.products.push({ productId, quantity });
    }

    await order.save();
    const populated = await Order.findById(orderId).populate('products.productId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item: ' + error.message });
  }
};
