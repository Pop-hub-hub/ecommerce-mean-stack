const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');
const { upload } = require('../middlewares/upload');
const parseMultipartJson = require('../middlewares/parseMultipartJson');
const {
  validateCreateProduct,
  validateUpdateProduct
} = require('../middlewares/validation');

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getHomeSliderProducts
} = require('../controllers/productController');

// Public routes
router.get('/home-slider', getHomeSliderProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes (admin only)
router.post(
  '/',
  verifyToken,
  checkRole(["admin"]),
  upload.array('images', 5), // ← هنا هنستقبل صور مع البيانات
  parseMultipartJson, // يسمح بإرسال JSON داخل مفتاح data مع form-data
  validateCreateProduct,
  createProduct
);

router.put(
  '/:id',
  verifyToken,
  checkRole(["admin"]),
  upload.array('images', 5), // لو عايز تحدث الصور كمان
  validateUpdateProduct,
  updateProduct
);

router.delete('/:id', verifyToken, checkRole(["admin"]), deleteProduct);

router.post('/upload', verifyToken, checkRole(["admin"]), upload.array('images', 5), (req, res) => {
  try {
    const base = `${req.protocol}://${req.get('host')}`;
    const urls = (req.files || []).map(f => `${base}/uploads/products/${f.filename}`);
    return res.json({ status: 'success', images: urls });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
});

module.exports = router;
