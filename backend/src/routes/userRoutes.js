const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.put('/password', protect, userController.updateUserPassword);

router.get('/', protect, isAdmin, userController.getAllUsers);
router.post('/admin-create', protect, isAdmin, userController.createUserByAdmin);
router.get('/:id', protect, isAdmin, userController.getUserById);
router.put('/:id', protect, isAdmin, userController.updateUserByAdmin);
router.delete('/:id', protect, isAdmin, userController.deleteUserByAdmin);

module.exports = router;