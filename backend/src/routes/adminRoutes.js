const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 
const userController = require('../controllers/userController');   
const productController = require('../controllers/productController'); 
const orderController = require('../controllers/orderController');   
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/stats', protect, isAdmin, adminController.getDashboardStats);
router.get('/sales-report', protect, isAdmin, adminController.getSalesReport);

module.exports = router;