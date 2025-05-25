const User = require('../models/userModel');
const { comparePassword } = require('../utils/passwordUtils');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPhone(req.user.phone);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
    }
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error('Lỗi lấy profile người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy profile người dùng.', error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { fullname, email, address } = req.body;
    if (fullname && fullname.trim().length < 3) {
        return res.status(400).json({ message: 'Họ tên phải có ít nhất 3 ký tự.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Email không hợp lệ.' });
    }

    const updated = await User.updateProfile(req.user.phone, { fullname, email, address });
    if (!updated) {
      return res.status(400).json({ message: 'Không thể cập nhật profile hoặc không có thay đổi nào.' });
    }
    res.json({ message: 'Profile được cập nhật thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật profile.', error: error.message });
  }
};

exports.updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
    }

    const user = await User.findByPhone(req.user.phone);
    if (!user) return res.status(404).json({ message: 'Người dùng không tìm thấy.' });

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    }

    await User.updatePassword(req.user.phone, newPassword);
    res.json({ message: 'Mật khẩu được cập nhật thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật mật khẩu.', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { status, search, joinDateStart, joinDateEnd, userType } = req.query;
    const filters = {
        status: status,
        search,
        joinDateStart,
        joinDateEnd,
        userType: userType !== undefined ? parseInt(userType) : undefined
    };
    const users = await User.findAll(filters);
    res.json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng (admin):', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách người dùng.', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
        res.json(user);
    } catch (error) {
        console.error('Lỗi lấy chi tiết người dùng (admin):', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết người dùng.', error: error.message });
    }
};

exports.createUserByAdmin = async (req, res) => {
    try {
        const { fullname, phone, password, email, address, user_type = 0, status = 1 } = req.body;
         if (!fullname || !phone || !password) {
            return res.status(400).json({ message: 'Họ tên, số điện thoại và mật khẩu là bắt buộc.' });
        }
        const existingUser = await User.findByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng.' });
        }
        const createdUser = await User.create({ fullname, phone, password, email, address, user_type, status });
        res.status(201).json(createdUser);
    } catch (error) {
        console.error('Lỗi tạo người dùng (admin):', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo người dùng.', error: error.message });
    }
};

exports.updateUserByAdmin = async (req, res) => {
    try {
        const updated = await User.updateUserByAdmin(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy hoặc không có thay đổi nào.' });
        }
        res.json({ message: 'Thông tin người dùng được cập nhật thành công.' });
    } catch (error) {
        console.error('Lỗi cập nhật người dùng (admin):', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật người dùng.', error: error.message });
    }
};

exports.deleteUserByAdmin = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
        }
        if (userToDelete.user_type === 1) {
             return res.status(403).json({ message: 'Không thể xóa tài khoản quản trị viên qua API này.' });
        }

        const deleted = await User.deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy hoặc không thể xóa.' });
        }
        res.json({ message: 'Người dùng đã được xóa thành công.' });
    } catch (error) {
        console.error('Lỗi xóa người dùng (admin):', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa người dùng.', error: error.message });
    }
};