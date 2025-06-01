const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/stats', protect, isAdmin, adminController.getDashboardStats);
router.get('/sales-report', protect, isAdmin, adminController.getSalesReport);

router.get('/orders-by-product/:productId', protect, isAdmin, adminController.getOrdersByProductId);

module.exports = router;