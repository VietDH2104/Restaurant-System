const { pool } = require('../configs/db');
const { hashPassword } = require('../utils/passwordUtils');

const User = {
  async create(userData) {
    const { fullname, phone, password, email, address, user_type = 0, status = 1 } = userData;
    const hashedPassword = await hashPassword(password);
    const sql = 'INSERT INTO users (fullname, phone, password, email, address, user_type, status, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
    const [result] = await pool.query(sql, [fullname, phone, hashedPassword, email, address, user_type, status]);
    return { id: result.insertId, fullname, phone, email, user_type, status };
  },

  async findByPhone(phone) {
    const sql = 'SELECT * FROM users WHERE phone = ?';
    const [rows] = await pool.query(sql, [phone]);
    return rows[0];
  },

  async findById(id) {
    const sql = 'SELECT id, fullname, phone, email, address, status, join_date, user_type FROM users WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
  },

  async updateProfile(phone, profileData) {
    const { fullname, email, address } = profileData;
    const sql = 'UPDATE users SET fullname = ?, email = ?, address = ?, updated_at = NOW() WHERE phone = ?';
    const [result] = await pool.query(sql, [fullname, email, address, phone]);
    return result.affectedRows > 0;
  },

  async updatePassword(phone, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    const sql = 'UPDATE users SET password = ?, updated_at = NOW() WHERE phone = ?';
    const [result] = await pool.query(sql, [hashedPassword, phone]);
    return result.affectedRows > 0;
  },

  async findAll(filters = {}) {
    let sql = 'SELECT id, fullname, phone, email, address, status, join_date, user_type FROM users WHERE 1=1';
    const params = [];

    if (filters.userType !== undefined && !isNaN(filters.userType)) {
        sql += ' AND user_type = ?';
        params.push(filters.userType);
    } else {
        sql += ' AND user_type = ?';
        params.push(0);
    }

    if (filters.status !== undefined && !isNaN(filters.status)) {
        sql += ' AND status = ?';
        params.push(filters.status);
    }

    if (filters.search) {
        sql += ' AND (fullname LIKE ? OR phone LIKE ? OR email LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.joinDateStart) {
        sql += ' AND DATE(join_date) >= ?';
        params.push(filters.joinDateStart);
    }
    if (filters.joinDateEnd) {
        sql += ' AND DATE(join_date) <= ?';
        params.push(filters.joinDateEnd);
    }

    sql += ' ORDER BY join_date DESC';
    console.log("Executing SQL:", sql, "with params:", params); // Debug: Log SQL query and parameters
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async updateUserByAdmin(id, userData) {
    const { fullname, phone, password, email, address, user_type, status } = userData;
    let sql = 'UPDATE users SET fullname = ?, phone = ?, email = ?, address = ?, user_type = ?, status = ?, updated_at = NOW()';
    const params = [fullname, phone, email, address, user_type, status];

    if (password && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      sql += ', password = ?';
      params.push(hashedPassword);
    }
    sql += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
  },

  async deleteById(id) {
    const sql = 'DELETE FROM users WHERE id = ? AND user_type = 0';
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  },

  async countUsers(userType = 0) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE user_type = ? AND status = 1';
    const [rows] = await pool.query(sql, [userType]);
    return rows[0].count;
  }
};

module.exports = User;