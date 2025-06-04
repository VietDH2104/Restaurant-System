const { pool } = require('../configs/db');

const Cart = {
  async findByUserId(user_id) {
    const sql = `
      SELECT c.*, p.img_url as product_img_url 
      FROM cart c
      LEFT JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    const [rows] = await pool.query(sql, [user_id]);
    return rows;
  },

  async addOrUpdateItem(item) {
    const [existing] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND note = ?',
      [item.user_id, item.product_id, item.note]
    );

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + item.quantity;
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existing[0].id]
      );
      return { ...existing[0], quantity: newQuantity };
    } else {
      const [result] = await pool.query(
        'INSERT INTO cart SET ?',
        item
      );
      return { id: result.insertId, ...item };
    }
  },

  async updateQuantity(id, user_id, quantity) {
    if (quantity <= 0) {
      await this.removeItem(id, user_id);
      return true;
    }

    const [result] = await pool.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, id, user_id]
    );
    return result.affectedRows > 0;
  },

  async removeItem(id, user_id) {
    const [result] = await pool.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    return result.affectedRows > 0;
  },

  async clearUserCart(user_id) {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [user_id]);
    return true;
  },

  async getCartTotal(user_id) {
    const [rows] = await pool.query(`
      SELECT SUM(c.quantity * c.price) as total
      FROM cart c
      WHERE c.user_id = ?
    `, [user_id]);
    return rows[0].total || 0;
  },

  async getCartItemCount(user_id) {
    const [rows] = await pool.query(`
      SELECT SUM(quantity) as count 
      FROM cart 
      WHERE user_id = ?
    `, [user_id]);
    return rows[0].count || 0;
  }
};

module.exports = Cart;