const { pool } = require('../configs/db');

const Order = {
  async create(orderData, orderItemsData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        id, user_phone, customer_name, customer_phone, delivery_address,
        delivery_type, delivery_date, delivery_time_slot, notes, total_amount, status = 0
      } = orderData;

      const orderSql = `INSERT INTO orders (id, user_phone, customer_name, customer_phone, delivery_address,
                         delivery_type, delivery_date, delivery_time_slot, notes, total_amount, status, order_timestamp)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      await connection.query(orderSql, [
        id, user_phone, customer_name, customer_phone, delivery_address,
        delivery_type, delivery_date, delivery_time_slot, notes, total_amount, status
      ]);

      if (orderItemsData && orderItemsData.length > 0) {
        const itemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, item_notes) VALUES ?';
        const itemValues = orderItemsData.map(item => [
          id, item.product_id, item.quantity, item.price_at_purchase, item.item_notes || null
        ]);
        await connection.query(itemSql, [itemValues]);
      }

      await connection.commit();
      return { orderId: id, ...orderData, items: orderItemsData };
    } catch (error) {
      await connection.rollback();
      console.error("Error in Order.create (Model):", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  async findById(orderId) {
    const orderSql = 'SELECT * FROM orders WHERE id = ?';
    const [orderRows] = await pool.query(orderSql, [orderId]);
    if (orderRows.length === 0) return null;

    const itemsSql = `
        SELECT oi.id as item_id, oi.product_id, oi.quantity, oi.price_at_purchase, oi.item_notes,
               p.title as product_title, p.img_url as product_img_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `;
    const [itemRows] = await pool.query(itemsSql, [orderId]);
    return { ...orderRows[0], items: itemRows };
  },

  async findByUserPhone(userPhone) {
    const sql = 'SELECT * FROM orders WHERE user_phone = ? ORDER BY order_timestamp DESC';
    const [rows] = await pool.query(sql, [userPhone]);
    return rows;
  },

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (filters.status !== undefined && filters.status !== '2' && filters.status !== 2) {
        sql += ' AND status = ?';
        params.push(parseInt(filters.status));
    }

    if (filters.search) {
        sql += ' AND (id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.dateStart) {
        sql += ' AND DATE(order_timestamp) >= ?';
        params.push(filters.dateStart);
    }
    if (filters.dateEnd) {
        sql += ' AND DATE(order_timestamp) <= ?';
        params.push(filters.dateEnd);
    }

    sql += ' ORDER BY order_timestamp DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async updateStatus(orderId, status) {
    const sql = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.query(sql, [status, orderId]);
    return result.affectedRows > 0;
  },

  async getTotalRevenue() {
    const sql = 'SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 1';
    const [rows] = await pool.query(sql);
    return rows[0].total_revenue || 0;
  },

  async getSalesStatistics(filters = {}) {
    let sql = `
        SELECT
            p.id as product_id,
            p.title as product_title,
            p.img_url as product_img_url,
            p.category as product_category,
            SUM(oi.quantity) as total_quantity_sold,
            SUM(oi.quantity * oi.price_at_purchase) as total_revenue_from_product
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 1 `;

    const params = [];

    if (filters.category && filters.category !== 'Tất cả') {
        sql += ' AND p.category = ?';
        params.push(filters.category);
    }
    if (filters.search) {
        sql += ' AND p.title LIKE ?';
        params.push(`%${filters.search}%`);
    }
    if (filters.dateStart) {
        sql += ' AND DATE(o.order_timestamp) >= ?';
        params.push(filters.dateStart);
    }
    if (filters.dateEnd) {
        sql += ' AND DATE(o.order_timestamp) <= ?';
        params.push(filters.dateEnd);
    }

    sql += ' GROUP BY p.id, p.title, p.img_url, p.category';

    if (filters.sortBy) {
        if (filters.sortBy === 'quantity_asc' || filters.sortBy === 1) sql += ' ORDER BY total_quantity_sold ASC, total_revenue_from_product DESC';
        else if (filters.sortBy === 'quantity_desc' || filters.sortBy === 2) sql += ' ORDER BY total_quantity_sold DESC, total_revenue_from_product DESC';
    } else {
        sql += ' ORDER BY total_revenue_from_product DESC, total_quantity_sold DESC';
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findByProductId(productId, filters = {}) {
    let sql = `
        SELECT
            o.id as order_id,
            o.customer_name,
            o.customer_phone,
            o.order_timestamp,
            o.total_amount,
            o.status,
            oi.quantity,
            oi.price_at_purchase
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.product_id = ?`;
    const params = [productId];

    if (filters.status !== undefined && filters.status !== '2' && filters.status !== 2) {
        sql += ' AND o.status = ?';
        params.push(parseInt(filters.status));
    }
    if (filters.dateStart) {
        sql += ' AND DATE(o.order_timestamp) >= ?';
        params.push(filters.dateStart);
    }
    if (filters.dateEnd) {
        sql += ' AND DATE(o.order_timestamp) <= ?';
        params.push(filters.dateEnd);
    }

    sql += ' ORDER BY o.order_timestamp DESC';
    console.log('Executing findByProductId query:', sql, 'with params:', params);
    try {
        const [rows] = await pool.query(sql, params);
        console.log('Query result:', rows);
        return rows;
    } catch (error) {
        console.error('Error executing findByProductId query:', error);
        throw error;
    }
  }
};

module.exports = Order;