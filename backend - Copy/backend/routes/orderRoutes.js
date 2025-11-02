const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");

router.post("/", verifyToken, orderController.createOrder);

router.get("/", verifyToken, checkRole(["admin"]), orderController.getAllOrders);

// User-specific operations
router.get('/:userId', verifyToken, orderController.getOrdersByUser);
router.delete('/:orderId', verifyToken, checkRole(["admin"]), orderController.deleteOrder);
router.put('/:orderId', verifyToken, checkRole(["admin"]), orderController.updateOrder);
router.put('/:orderId/item', verifyToken, checkRole(["admin"]), orderController.updateOrderItemQuantity);
router.delete('/:orderId/item/:productId', verifyToken, checkRole(["admin"]), orderController.removeOrderItem);
router.post('/:orderId/item', verifyToken, checkRole(["admin"]), orderController.addOrderItem);

// Update order status and ETA (admin only)
router.patch('/:orderId/status', verifyToken, checkRole(["admin"]), orderController.updateOrderStatus);

module.exports = router;
