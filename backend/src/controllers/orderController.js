const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { pool } = require('../configs/db');

async function generateOrderId() {
    const [lastOrder] = await pool.query("SELECT id FROM orders ORDER BY CAST(SUBSTRING(id, 3) AS UNSIGNED) DESC, id DESC LIMIT 1");
    let nextIdNumber = 1;
    if (lastOrder && lastOrder.length > 0 && lastOrder[0].id.startsWith('DH')) {
        try {
            const lastIdNumber = parseInt(lastOrder[0].id.substring(2));
            if (!isNaN(lastIdNumber)) {
                nextIdNumber = lastIdNumber + 1;
            }
        } catch (e) {
            const [countResult] = await pool.query("SELECT COUNT(*) as count FROM orders");
            nextIdNumber = (countResult[0].count || 0) + 1;
        }
    } else {
        const [countResult] = await pool.query("SELECT COUNT(*) as count FROM orders");
        nextIdNumber = (countResult[0].count || 0) + 1;
    }
    return `DH${nextIdNumber}`;
}

exports.createOrder = async (req, res) => {
    try {
        const {
            customer_name, customer_phone, delivery_address,
            delivery_type, delivery_date, delivery_time_slot, notes,
            items, subtotal, shipping_fee, total
        } = req.body;

        if (!customer_name || !customer_phone || !delivery_address || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Thông tin đơn hàng hoặc sản phẩm không hợp lệ.' });
        }

        let calculated_total_amount = 0;
        const orderItemsData = [];

        for (const item of items) {
            if (!item.product_id || !item.quantity || parseInt(item.quantity) <= 0) {
                return res.status(400).json({ message: `Dữ liệu sản phẩm không hợp lệ cho product_id: ${item.product_id}` });
            }
            const product = await Product.findById(item.product_id);
            if (!product || product.status !== 1) {
                return res.status(400).json({ message: `Sản phẩm với ID ${item.product_id} không tìm thấy hoặc không có sẵn.` });
            }
            const price_at_purchase = parseFloat(product.price);
            calculated_total_amount += price_at_purchase * parseInt(item.quantity);
            orderItemsData.push({
                product_id: item.product_id,
                quantity: parseInt(item.quantity),
                price_at_purchase,
                item_notes: item.item_notes || null
            });
        }

        // Validate frontend-provided subtotal and total
        if (subtotal !== calculated_total_amount) {
            return res.status(400).json({ message: 'Tổng tiền hàng không khớp với dữ liệu sản phẩm.' });
        }
        const finalTotal = total || (calculated_total_amount + (shipping_fee || 0));
        if (finalTotal < calculated_total_amount) {
            return res.status(400).json({ message: 'Tổng tiền đơn hàng không hợp lệ.' });
        }

        const orderId = await generateOrderId();

        const orderData = {
            id: orderId,
            user_phone: req.user ? req.user.phone : null,
            customer_name, customer_phone, delivery_address,
            delivery_type, delivery_date, delivery_time_slot, notes,
            total_amount: finalTotal,
            status: 0
        };

        const newOrder = await Order.create(orderData, orderItemsData);
        res.status(201).json({ orderId: orderId, ...newOrder });
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo đơn hàng.', error: error.message });
    }
};

// exports.getMyOrders = async (req, res) => {
//   try {
//     if (!req.user || !req.user.phone) {
//         return res.status(401).json({ message: 'Người dùng chưa được xác thực.' });
//     }
//     const ordersFromDb = await Order.findByUserPhone(req.user.phone);
//     const ordersWithItems = await Promise.all(ordersFromDb.map(async (order) => {
//         const orderDetails = await Order.findById(order.id);
//         return orderDetails;
//     }));
//     res.json(ordersWithItems);
//   } catch (error) {
//     console.error('Lỗi lấy đơn hàng của tôi:', error);
//     res.status(500).json({ message: 'Lỗi máy chủ khi lấy đơn hàng.', error: error.message });
//   }
// };

exports.getMyOrders = async (req, res) => {
  try {
    // Check if user is authenticated and has a phone number
    if (!req.user || !req.user.phone) {
      return res.status(401).json({ message: 'Người dùng chưa được xác thực hoặc thiếu thông tin số điện thoại.' });
    }

    // Fetch orders for the authenticated user
    const ordersFromDb = await Order.findByUserPhone(req.user.phone);
    
    // If no orders found, return an empty array
    if (!ordersFromDb || ordersFromDb.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch detailed order information including items
    const ordersWithItems = await Promise.all(
      ordersFromDb.map(async (order) => {
        try {
          const orderDetails = await Order.findById(order.id);
          if (!orderDetails) {
            console.warn(`Order with ID ${order.id} not found during detailed fetch.`);
            return null; // Skip invalid orders
          }
          return orderDetails;
        } catch (err) {
          console.error(`Error fetching details for order ${order.id}:`, err);
          return null; // Skip orders that fail to fetch
        }
      })
    );

    // Filter out any null entries (failed fetches)
    const validOrders = ordersWithItems.filter(order => order !== null);

    // Return the valid orders
    res.status(200).json(validOrders);
  } catch (error) {
    console.error('Lỗi lấy đơn hàng của tôi:', error);
    res.status(500).json({ 
      message: 'Lỗi máy chủ khi lấy đơn hàng.', 
      error: error.message || 'Unknown error' 
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tìm thấy.' });
    }
    if (req.user.userType !== 1 && order.user_phone !== req.user.phone) {
        return res.status(403).json({ message: 'Không có quyền xem đơn hàng này.' });
    }
    res.json(order);
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết đơn hàng.', error: error.message });
  }
};

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, search, dateStart, dateEnd } = req.query;
    const filters = {
        status: status !== undefined ? (status === '2' ? undefined : parseInt(status)) : undefined,
        search,
        dateStart,
        dateEnd
    };
    const orders = await Order.findAll(filters);
    res.json(orders);
  } catch (error) {
    console.error('Lỗi lấy tất cả đơn hàng (admin):', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy tất cả đơn hàng.', error: error.message });
  }
};

exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (status === undefined || ![0, 1].includes(parseInt(status))) {
        return res.status(400).json({ message: 'Giá trị trạng thái không hợp lệ. Phải là 0 hoặc 1.' });
    }
    const updated = await Order.updateStatus(orderId, parseInt(status));
    if (!updated) {
      return res.status(404).json({ message: 'Đơn hàng không tìm thấy hoặc không có thay đổi trạng thái.' });
    }
    res.json({ message: 'Trạng thái đơn hàng được cập nhật thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn hàng (admin):', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật trạng thái đơn hàng.', error: error.message });
  }
};

exports.getOrdersByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const { dateStart, dateEnd, status } = req.query;

        // Validate productId
        const productIdNum = parseInt(productId);
        if (isNaN(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({ message: 'ID sản phẩm không hợp lệ.' });
        }

        const orders = await Order.findByProductId(productId, { dateStart, dateEnd, status });
        res.json(orders);
    } catch (error) {
        console.error('Lỗi lấy đơn hàng theo sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy đơn hàng theo sản phẩm.', error: error.message });
    }
};