// backend/src/models/productModel.js
const { pool } = require('../configs/db');

const Product = {
  async create(productData) {
    const { title, image_data, category, price, description, status = 1 } = productData;
    // img_url có thể được bỏ qua nếu không dùng nữa
    const sql = 'INSERT INTO products (title, image_data, category, price, description, status) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [title, image_data, category, price, description, status]);
    return { id: result.insertId, title, category, price, description, status }; // Không trả image_data ở đây
  },

  async findImageById(id) {
    const sql = 'SELECT image_data FROM products WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0]; // Trả về { image_data: Buffer } hoặc undefined
  },

  async findById(id) {
    // Không lấy image_data ở đây để tránh dữ liệu lớn
    const sql = 'SELECT id, title, category, price, description, status, created_at, updated_at FROM products WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
  },

  async findAll(filters = {}) {
    let baseSelectSql = 'SELECT id, title, category, price, description, status, created_at, updated_at FROM products'; // Không lấy image_data
    let countSelectSql = 'SELECT COUNT(*) as total FROM products';
    // ... (logic whereClauses, queryParamsForWhere, count, order by như trước) ...
    let whereClauses = [];
    const queryParamsForWhere = [];

    if (filters.forCustomerView) {
        whereClauses.push('status = 1');
    } else if (filters.status !== undefined && !isNaN(filters.status)) {
        whereClauses.push('status = ?');
        queryParamsForWhere.push(filters.status);
    }

    if (filters.category) {
      whereClauses.push('category = ?');
      queryParamsForWhere.push(filters.category);
    }

    if (filters.search) {
      whereClauses.push('title LIKE ?');
      queryParamsForWhere.push(`%${filters.search}%`);
    }

    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
      whereClauses.push('price >= ?');
      queryParamsForWhere.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      whereClauses.push('price <= ?');
      queryParamsForWhere.push(filters.maxPrice);
    }

    const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    countSelectSql += ` ${whereCondition}`;
    const [countRows] = await pool.query(countSelectSql, queryParamsForWhere);
    const total = countRows[0].total;

    baseSelectSql += ` ${whereCondition}`;

    if (filters.sortBy) {
        if (filters.sortBy === 'price_asc') baseSelectSql += ' ORDER BY price ASC';
        else if (filters.sortBy === 'price_desc') baseSelectSql += ' ORDER BY price DESC';
        else baseSelectSql += ' ORDER BY created_at DESC';
    } else {
        baseSelectSql += ' ORDER BY created_at DESC';
    }

    const queryParamsForSelect = [...queryParamsForWhere];

    if (filters.limit !== undefined && !isNaN(filters.limit)) {
        baseSelectSql += ' LIMIT ?';
        queryParamsForSelect.push(parseInt(filters.limit, 10));
        if (filters.offset !== undefined && !isNaN(filters.offset)) {
            baseSelectSql += ' OFFSET ?';
            queryParamsForSelect.push(parseInt(filters.offset, 10));
        }
    }

    const [products] = await pool.query(baseSelectSql, queryParamsForSelect);
    return { products, total };
  },

  async update(id, productData) {
    // Nếu productData có image_data thì sẽ được bao gồm trong fields
    const fields = Object.keys(productData);
    if (fields.length === 0) {
        return false;
    }
    const setClauses = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => productData[field]);
    values.push(id);

    const sql = `UPDATE products SET ${setClauses}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  },

  async updateStatus(id, status) {
    // ... (giữ nguyên) ...
    const sql = 'UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.query(sql, [status, id]);
    return result.affectedRows > 0;
  },

  async countProducts() {
    // ... (giữ nguyên) ...
    const sql = 'SELECT COUNT(*) as count FROM products WHERE status = 1';
    const [rows] = await pool.query(sql);
    return rows[0].count;
  }
};

module.exports = Product;