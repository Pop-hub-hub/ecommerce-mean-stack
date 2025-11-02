
const express = require('express')
const userController = require('../controllers/userController')
const resetPasswordController = require('../controllers/resetPasswordController');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');
const verifyResetCode = require('../middlewares/verifyResetCode');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../middlewares/validation');

const router = express.Router()

// Admin-only routes
router.get('/', verifyToken, checkRole(["admin"]), userController.getAllUser)
router.get('/:id', verifyToken, checkRole(["admin"]), userController.getUserById)
router.post('/register', validateRegister, userController.register)
router.post('/login', validateLogin, userController.login)

// Password reset routes
router.post('/forgot-password', validateForgotPassword, resetPasswordController.forgotPassword);
router.post('/verify-reset-code', verifyResetCode, resetPasswordController.verifyResetCode);
router.post('/reset-password', validateResetPassword, resetPasswordController.resetPassword);

// Refresh token route (no auth required)
router.post('/refresh-token', userController.refreshToken);

// Protected routes
router.put('/:id', verifyToken, userController.updateUser)
router.delete('/:id', verifyToken, checkRole(["admin"]), userController.deleteUser)

module.exports = router


