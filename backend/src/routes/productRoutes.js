const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or JPG files are allowed'));
    }
    cb(null, true);
  }
});

router.get('/', productController.getAllProducts);
router.get('/admin/all', protect, isAdmin, productController.getAllProductsAdmin);
router.get('/:id', productController.getProductById);
router.post('/', protect, isAdmin, upload.single('imageFile'), productController.createProduct);
router.put('/:id', protect, isAdmin, upload.single('imageFile'), productController.updateProduct);
router.put('/:id/status', protect, isAdmin, productController.updateProductStatus);

module.exports = router;