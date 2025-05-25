const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', productController.getAllProducts);
router.get('/admin/all', protect, isAdmin, productController.getAllProductsAdmin);
router.get('/:id', productController.getProductById);
router.post('/', protect, isAdmin, productController.createProduct);
router.put('/:id', protect, isAdmin, productController.updateProduct);
router.put('/:id/status', protect, isAdmin, productController.updateProductStatus);

module.exports = router;