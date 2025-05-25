const User = require('../models/userModel');
const { comparePassword } = require('../utils/passwordUtils'); 
const jwt = require('jsonwebtoken');
const jwtConfig = require('../configs/jwt.config');

const generateToken = (id, phone, userType, fullname) => {
  return jwt.sign({ id, phone, userType, fullname }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

exports.registerUser = async (req, res) => {
  const { fullname, phone, password, email, address } = req.body;
  if (!fullname || !phone || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp họ tên, số điện thoại và mật khẩu.' });
  }
  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  try {
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký.' });
    }

    const newUserInfo = { fullname, phone, password, email, address, user_type: 0, status: 1 };
    const createdUser = await User.create(newUserInfo);

    res.status(201).json({
      id: createdUser.id,
      fullname: createdUser.fullname,
      phone: createdUser.phone,
      email: createdUser.email,
      userType: createdUser.user_type,
      token: generateToken(createdUser.id, createdUser.phone, createdUser.user_type, createdUser.fullname),
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi máy chủ trong quá trình đăng ký.' });
  }
};

exports.loginUser = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mật khẩu.' });
  }

  try {
    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác.' });
    }

    if (!user.status) {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa hoặc không hoạt động.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác.' });
    }

    res.json({
      id: user.id,
      fullname: user.fullname,
      phone: user.phone,
      email: user.email,
      userType: user.user_type,
      token: generateToken(user.id, user.phone, user.user_type, user.fullname),
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ trong quá trình đăng nhập.' });
  }
};