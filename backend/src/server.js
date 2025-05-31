const dotenv = require('dotenv');
dotenv.config();

const multer = require('multer');
const path = require('path');

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

// Configure multer storage
const storage = multer.memoryStorage(); // Store file in memory as buffer
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh JPEG hoặc PNG!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
app.use('/api/products', upload.fields([{ name: 'imageFile', maxCount: 1 }]), productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

app.use('/assets', express.static(path.join(__dirname, '../frontend/assets'))); // Serve static files

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Dining Verse Backend API!' });
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