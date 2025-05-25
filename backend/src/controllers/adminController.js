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