module.exports = {
  secret: process.env.JWT_SECRET || 'your_default_VERY_secret_key_for_development_only_PLEASE_CHANGE_IN_ENV',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d', 
};