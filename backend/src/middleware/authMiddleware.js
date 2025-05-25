const jwt = require('jsonwebtoken');
const jwtConfig = require('../configs/jwt.config');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, jwtConfig.secret);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Authentication error (token failed):', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }   if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const isAdmin = (req, res, next) => {
   if (req.user && req.user.userType === 1) { 
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, isAdmin };