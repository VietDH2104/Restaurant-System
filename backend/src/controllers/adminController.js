const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalCustomers = await User.countUsers(0);
        const totalProducts = await Product.countProducts();
        const totalRevenue = await Order.getTotalRevenue();

        res.json({
            totalCustomers,
            totalProducts,
            totalRevenue: totalRevenue || 0,
        });
    } catch (error) {
        console.error('Lỗi lấy thống kê dashboard:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê dashboard.', error: error.message });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { category, search, dateStart, dateEnd, sortBy } = req.query;
        const filters = {
            category,
            search,
            dateStart,
            dateEnd,
            sortBy: sortBy ? parseInt(sortBy) : undefined
        };
        const salesData = await Order.getSalesStatistics(filters);
        res.json(salesData);
    } catch (error) {
        console.error('Lỗi lấy báo cáo doanh số:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy báo cáo doanh số.', error: error.message });
    }
    
};

exports.getOrdersByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const { dateStart, dateEnd, orderStatus } = req.query;

        if (!productId || isNaN(parseInt(productId))) {
            return res.status(400).json({ message: 'Product ID không hợp lệ.' });
        }

        const filters = {
            productId: parseInt(productId),
            dateStart: dateStart && dateStart !== 'undefined' ? dateStart : undefined,
            dateEnd: dateEnd && dateEnd !== 'undefined' ? dateEnd : undefined,
            status: orderStatus && orderStatus !== 'undefined' && !isNaN(parseInt(orderStatus)) ? parseInt(orderStatus) : undefined
        };

        const orders = await Order.findOrdersContainingProduct(filters);

        res.json(orders);
    } catch (error) {
        console.error(`Lỗi lấy đơn hàng theo sản phẩm ID ${req.params.productId}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy đơn hàng theo sản phẩm.', error: error.message });
    }
};