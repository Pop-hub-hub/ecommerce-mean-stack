const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");

router.post("/", verifyToken, orderController.createOrder);

router.get("/", verifyToken, checkRole(["admin"]), orderController.getAllOrders);

// User-specific operations
router.get('/:userId', verifyToken, orderController.getOrdersByUser);
// Allow owners to manage their own pending orders; controller enforces ownership
router.delete('/:orderId', verifyToken, orderController.deleteOrder);
router.put('/:orderId', verifyToken, orderController.updateOrder);
router.patch('/:orderId', verifyToken, orderController.updateOrder);
router.put('/:orderId/item', verifyToken, orderController.updateOrderItemQuantity);
router.delete('/:orderId/item/:productId', verifyToken, orderController.removeOrderItem);
router.post('/:orderId/item', verifyToken, orderController.addOrderItem);

// Update order status and ETA (admin only)
router.patch('/:orderId/status', verifyToken, checkRole(["admin"]), orderController.updateOrderStatus);

// ✅ New: Update status of a specific product inside an order
router.put('/:orderId/item-status', verifyToken, checkRole(["admin"]), orderController.updateOrderItemStatus);

module.exports = router;