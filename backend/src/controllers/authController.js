const User = require('../models/userModel');
const RefreshToken = require('../models/refreshTokenModel');
const { comparePassword } = require('../utils/passwordUtils');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../configs/jwt.config');
const crypto = require('crypto');
const ms = require('ms'); 

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, phone: user.phone, userType: user.user_type, fullname: user.fullname },
    jwtConfig.secret,
    { expiresIn: jwtConfig.accessTokenExpiresIn }
  );
};

const generateAndSaveRefreshToken = async (userId) => {
  const tokenValue = crypto.randomBytes(40).toString('hex');
  const expiryDate = new Date(Date.now() + ms(jwtConfig.refreshTokenExpiresIn));

  await RefreshToken.deleteByUserId(userId); 
  const refreshToken = await RefreshToken.create({
    user_id: userId,
    token: tokenValue,
    expires_at: expiryDate,
  });
  return refreshToken.token;
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

    const accessToken = generateAccessToken(createdUser);
    const refreshTokenString = await generateAndSaveRefreshToken(createdUser.id);

    res.status(201).json({
      id: createdUser.id,
      fullname: createdUser.fullname,
      phone: createdUser.phone,
      email: createdUser.email,
      userType: createdUser.user_type,
      accessToken,
      refreshToken: refreshTokenString,
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
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác.' });
    }
    if (!user.status) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa hoặc không hoạt động.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshTokenString = await generateAndSaveRefreshToken(user.id);

    res.json({
      id: user.id,
      fullname: user.fullname,
      phone: user.phone,
      email: user.email,
      userType: user.user_type,
      accessToken,
      refreshToken: refreshTokenString,
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ trong quá trình đăng nhập.' });
  }
};

exports.refreshToken = async (req, res) => {
  const { token: clientRefreshToken } = req.body;

  if (!clientRefreshToken) {
    return res.status(401).json({ message: 'Refresh token là bắt buộc.' });
  }

  try {
    const storedToken = await RefreshToken.findByTokenValue(clientRefreshToken);

    if (!storedToken) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc không tìm thấy.' });
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await RefreshToken.deleteByTokenValue(clientRefreshToken);
      return res.status(403).json({ message: 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.' });
    }

    const user = await User.findById(storedToken.user_id);
    if (!user || !user.status) {
      return res.status(403).json({ message: 'Người dùng không tồn tại hoặc tài khoản bị khóa.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });

  } catch (error) {
    console.error('Lỗi làm mới token:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi làm mới token.' });
  }
};

exports.logoutUser = async (req, res) => {
    const { token: clientRefreshToken } = req.body;

    if (clientRefreshToken) {
        try {
            await RefreshToken.deleteByTokenValue(clientRefreshToken);
        } catch (dbError) {
            console.error("Lỗi khi xóa refresh token khỏi DB khi đăng xuất:", dbError);
        }
    }
    res.status(200).json({ message: 'Đăng xuất thành công.' });
};