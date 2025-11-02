const express = require('express');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

const {
  validateCreateProduct,
  validateUpdateProduct
} = require('../middlewares/validation');

const router = express.Router();

// All admin routes require admin role
router.use(verifyToken, checkRole(['admin']));

// Users management
router.get('/users', userController.getAllUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.delete('/users', userController.deleteAllUsers);

// Products management
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', validateCreateProduct, productController.createProduct);
router.put('/products/:id', validateUpdateProduct, productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Orders management
router.get('/orders', orderController.getAllOrders);
router.patch('/orders/:orderId/status', orderController.updateOrderStatus);
router.put('/orders/:orderId', orderController.updateOrder);
router.delete('/orders/:orderId', orderController.deleteOrder);

module.exports = router;
