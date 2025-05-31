const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

exports.getCart = async (req, res) => {
  try {
    const cartItems = await Cart.findByUserId(req.user.id);
    res.json(cartItems);
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy giỏ hàng.', error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity, note } = req.body;
    
    // Validate product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }

    const cartItem = await Cart.addOrUpdateItem({
      user_id: req.user.id,
      product_id,
      price: product.price,
      title: product.title,
      img_url: product.img_url,
      quantity,
      note: note || 'Không có ghi chú'
    });

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Lỗi thêm vào giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi thêm vào giỏ hàng.', error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const updated = await Cart.updateQuantity(id, req.user.id, quantity);
    if (!updated) {
      return res.status(404).json({ message: 'Mục giỏ hàng không tìm thấy.' });
    }
    res.json({ message: 'Cập nhật giỏ hàng thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật giỏ hàng.', error: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Cart.removeItem(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Mục giỏ hàng không tìm thấy.' });
    }
    res.json({ message: 'Xóa khỏi giỏ hàng thành công.' });
  } catch (error) {
    console.error('Lỗi xóa khỏi giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa khỏi giỏ hàng.', error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.clearUserCart(req.user.id);
    res.json({ message: 'Giỏ hàng đã được xóa.' });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa giỏ hàng.', error: error.message });
  }
};

exports.getCartTotal = async (req, res) => {
  try {
    console.log('Fetching cart total for user:', req.user.id);
    const total = await Cart.getCartTotal(req.user.id);
    console.log('Cart total:', total);
    res.json(total);
  } catch (error) {
    console.error('Lỗi tính tổng giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tính tổng giỏ hàng.', error: error.message });
  }
};

exports.getCartItemCount = async (req, res) => {
  try {
    console.log('Fetching cart item count for user:', req.user.id);
    const count = await Cart.getCartItemCount(req.user.id);
    console.log('Cart item count:', count);
    res.json(count);
  } catch (error) {
    console.error('Lỗi tính số lượng giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tính số lượng giỏ hàng.', error: error.message });
  }
};