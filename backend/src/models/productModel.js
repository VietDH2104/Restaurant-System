const { pool } = require('../configs/db'); 

const Product = {
  async create(productData) {
    const { title, img_url, category, price, description, status = 1 } = productData;
    const sql = 'INSERT INTO products (title, img_url, category, price, description, status) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [title, img_url, category, price, description, status]);
    return { id: result.insertId, title, img_url, category, price, description, status };
  },

  async findById(id) {
    const sql = 'SELECT * FROM products WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0]; 
  },

  async findAll(filters = {}) {
      let baseSelectSql = 'SELECT * FROM products';
      let countSelectSql = 'SELECT COUNT(*) as total FROM products';
      let whereClauses = [];
      const queryParams = [];

      if (filters.forCustomerView) {
          whereClauses.push('status = 1');
      } else if (filters.status !== undefined && filters.status !== 'all' && filters.status !== '2') {
          whereClauses.push('status = ?');
          queryParams.push(parseInt(filters.status));
      }

      if (filters.category && filters.category !== 'Tất cả' && filters.category !== 'undefined' && filters.category.trim()) {
          whereClauses.push('LOWER(category) = LOWER(?)');
          queryParams.push(filters.category.trim());
      }

      if (filters.search && filters.search.trim() && filters.search !== 'undefined') {
          whereClauses.push('LOWER(title) LIKE LOWER(?)');
          queryParams.push(`%${filters.search.trim()}%`);
      }

      if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
          whereClauses.push('price >= ?');
          queryParams.push(parseFloat(filters.minPrice));
      }
      if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
          whereClauses.push('price <= ?');
          queryParams.push(parseFloat(filters.maxPrice));
      }

      const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      baseSelectSql += ` ${whereCondition}`;
      countSelectSql += ` ${whereCondition}`;

      if (filters.sortBy) {
          if (filters.sortBy === 'price_asc') baseSelectSql += ' ORDER BY price ASC';
          else if (filters.sortBy === 'price_desc') baseSelectSql += ' ORDER BY price DESC';
      } else {
          baseSelectSql += ' ORDER BY created_at DESC';
      }

      if (filters.limit) {
          baseSelectSql += ' LIMIT ?';
          queryParams.push(parseInt(filters.limit));
          if (filters.offset !== undefined) {
              baseSelectSql += ' OFFSET ?';
              queryParams.push(parseInt(filters.offset));
          }
      }

      console.log('Executing SQL Query:', baseSelectSql, 'Params:', queryParams);

      const [countRows] = await pool.query(countSelectSql, queryParams.slice(0, queryParams.length - (filters.offset !== undefined ? 2 : 1)));
      const total = countRows[0].total;

      const [products] = await pool.query(baseSelectSql, queryParams);
      return { products, total };
  },

  async update(id, productData) {
    const fields = [];
    const values = [];
    const { title, img_url, category, price, description, status } = productData;

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (img_url !== undefined) { fields.push('img_url = ?'); values.push(img_url); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) return false;

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  },

  async updateStatus(id, status) {
    const sql = 'UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.query(sql, [status, id]);
    return result.affectedRows > 0;
  },

  async countProducts() { 
    const sql = 'SELECT COUNT(*) as count FROM products WHERE status = 1';
    const [rows] = await pool.query(sql);
    return rows[0].count;
  }
};

module.exports = Product;