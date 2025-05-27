module.exports = {
  secret: process.env.JWT_SECRET || 'c8a9f3b7e1d0c7a5b9e3f4a2d8c1b6a0e5f7d2c1b8a3e9f6d4c0a7b5e3f1d2c3a8b5e2f0d7c4b1a6e9f3d8c0b5a2e7f1d4c9a6b3e0f5d2c7b4a1e8f9d6c3',
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
};