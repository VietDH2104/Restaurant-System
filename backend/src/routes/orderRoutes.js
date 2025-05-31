const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/admin/all', protect, isAdmin, orderController.getAllOrdersAdmin);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/status', protect, isAdmin, orderController.updateOrderStatusAdmin);
router.get('/product/:productId', protect, isAdmin, orderController.getOrdersByProductId);

module.exports = router;