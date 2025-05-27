const { pool } = require('../configs/db');

const RefreshToken = {
  async create({ user_id, token, expires_at }) {
    const sql = 'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [user_id, token, expires_at]);
    return { id: result.insertId, user_id, token, expires_at };
  },

  async findByTokenValue(token) {
    const sql = 'SELECT * FROM refresh_tokens WHERE token = ?';
    const [rows] = await pool.query(sql, [token]);
    return rows[0];
  },

  async findByUserId(user_id) {
    const sql = 'SELECT * FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, [user_id]);
    return rows;
  },

  async deleteByTokenValue(token) {
    const sql = 'DELETE FROM refresh_tokens WHERE token = ?';
    const [result] = await pool.query(sql, [token]);
    return result.affectedRows > 0;
  },

  async deleteByUserId(user_id) {
    const sql = 'DELETE FROM refresh_tokens WHERE user_id = ?';
    const [result] = await pool.query(sql, [user_id]);
    return result.affectedRows > 0;
  }
};

module.exports = RefreshToken;