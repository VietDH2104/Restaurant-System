const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path'); 
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
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } 
});

router.get('/', productController.getAllProducts);
router.get('/admin/all', protect, isAdmin, productController.getAllProductsAdmin);

router.get('/image/:id', productController.getProductImage); 

router.get('/:id', productController.getProductById);


router.post('/', protect, isAdmin, upload.single('imageFile'), productController.createProduct);
router.put('/:id', protect, isAdmin, upload.single('imageFile'), productController.updateProduct);
router.put('/:id/status', protect, isAdmin, productController.updateProductStatus);

module.exports = router;