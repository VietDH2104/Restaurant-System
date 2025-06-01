const dotenv = require('dotenv');
dotenv.config();

// const multer = require('multer');
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
// const storage = multer.memoryStorage(); // Store file in memory as buffer

// const storage = multer.memoryStorage({
//   destination: (req, file, cb) => {
//     cb(null, null); // Not used with memoryStorage
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error('Only JPEG, PNG, or JPG files are allowed'));
//     }
//     cb(null, true);
//   }
// });

// const upload = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
//     if (extname && mimetype) {
//       return cb(null, true);
//     } else {
//       console.error('File rejected:', file.originalname, file.mimetype); // Debug log
//       cb(new Error('Chỉ chấp nhận file ảnh JPEG hoặc PNG!'));
//     }
//   },
//   limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
// });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/products', upload.fields([{ name: 'imageFile', maxCount: 1 }]), productRoutes);

// app.post('/api/products', upload.single('imageFile'), productController.createProduct);
// app.put('/api/products/:id', upload.single('imageFile'), productController.updateProduct);
app.use('/api/products', productRoutes);

app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

app.use('/assets', express.static(path.join(__dirname, '../frontend/assets'))); // Serve static files
// Serve static files from backend/public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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