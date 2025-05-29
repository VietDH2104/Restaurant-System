const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, cartController.getCart);
router.post('/', protect, cartController.addToCart);
router.put('/:id', protect, cartController.updateCartItem);
router.delete('/:id', protect, cartController.removeCartItem);
router.delete('/', protect, cartController.clearCart);

module.exports = router;