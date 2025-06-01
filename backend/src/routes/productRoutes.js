// backend/src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path'); // Vẫn cần path cho fileFilter

// Sử dụng memoryStorage để Multer giữ file trong bộ nhớ dưới dạng Buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ cho phép file ảnh (jpeg, png, jpg, webp)!'));
};

const upload = multer({
  storage: storage, // Sử dụng memoryStorage
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Giới hạn 5MB
});

router.get('/', productController.getAllProducts);
router.get('/admin/all', protect, isAdmin, productController.getAllProductsAdmin);

// Route GET mới để phục vụ ảnh từ CSDL
router.get('/image/:id', productController.getProductImage); // :id là id của sản phẩm

router.get('/:id', productController.getProductById);


router.post('/', protect, isAdmin, upload.single('imageFile'), productController.createProduct);
router.put('/:id', protect, isAdmin, upload.single('imageFile'), productController.updateProduct);
router.put('/:id/status', protect, isAdmin, productController.updateProductStatus);

module.exports = router;