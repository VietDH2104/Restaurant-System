const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { testConnection } = require('./configs/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Vy Food Backend API!' });
});

app.use(notFound);
app.use(errorHandler);

testConnection().then(isConnected => {
  if (isConnected) {
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } else {
    console.error('Failed to connect to the database. Server not started.');
    process.exit(1);
  }
}).catch(err => {
    console.error('Critical error during startup or DB connection:', err);
    process.exit(1);
});