const Product = require('../models/productModel');
const path = require('path');
const fs = require('fs');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;
    console.log('Query params:', { category, search, minPrice, maxPrice, sortBy, page, limit }); // Debug log
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const filters = {
        category,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy,
        forCustomerView: true,
        limit: parseInt(limit),
        offset
    };
    const { products, total } = await Product.findAll(filters);
    console.log('Products found:', products.length, 'Total:', total); 
    
    res.json({
        data: products,
        pagination: {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalItems: total,
            totalPages: Math.ceil(total / parseInt(limit))
        }
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm (khách hàng):', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy sản phẩm.', error: error.message });
  }
};

exports.getAllProductsAdmin = async (req, res) => {
    try {
      const { category, search, status, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const filters = {
          category,
          search,
          status: status,
          limit: parseInt(limit),
          offset
      };
      const { products, total } = await Product.findAll(filters);
      res.json({
          data: products,
          pagination: {
              currentPage: parseInt(page),
              limit: parseInt(limit),
              totalItems: total,
              totalPages: Math.ceil(total / parseInt(limit))
          }
      });
    } catch (error) {
      console.error('Lỗi lấy sản phẩm (admin):', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy sản phẩm cho admin.', error: error.message });
    }
  };

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }
    if ((!req.user || req.user.userType !== 1) && product.status !== 1) {
        return res.status(404).json({ message: 'Sản phẩm không tìm thấy hoặc không có sẵn.' });
    }
    res.json(product);
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm.', error: error.message });
  }
};

exports.updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (status === undefined || (status !== 0 && status !== 1)) {
            return res.status(400).json({ message: 'Giá trị trạng thái không hợp lệ. Phải là 0 hoặc 1.' });
        }
        const updated = await Product.updateStatus(req.params.id, status);
        if (!updated) {
            return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
        }
        res.json({ message: `Trạng thái sản phẩm được cập nhật thành ${status === 1 ? 'hiển thị' : 'ẩn'}.` });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật trạng thái sản phẩm.', error: error.message });
    }
};

const saveProductImage = (file, productId) => {
  if (!file) return null;

  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const filename = `product_${productId}${ext}`;
  const filePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving product image:', error);
    return null;
  }
};

exports.createProduct = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file); 
    const { title, category, price, description, status = 1 } = req.body;
    const imageFile = req.file; 

    if (!title || !category || price === undefined) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Tiêu đề, danh mục và giá là bắt buộc.' });
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      console.log('Validation failed: Invalid price');
      return res.status(400).json({ message: 'Giá không hợp lệ.' });
    }

    const productData = { 
      title, 
      img_url: '', // Temporary empty
      category, 
      price: parseFloat(price), 
      description, 
      status 
    };
    
    console.log('Creating product with data:', productData);
    const product = await Product.create(productData);
    
    if (imageFile) {
      console.log('Processing image upload for product ID:', product.id);
      const img_url = saveProductImage(imageFile, product.id);
      if (!img_url) {
        console.error('Failed to save product image');
        throw new Error('Failed to save product image');
      }
      console.log('Updating product with img_url:', img_url);
      const updated = await Product.update(product.id, { img_url });
      if (!updated) {
        console.error('Failed to update product image URL in database');
        throw new Error('Failed to update product image URL in database');
      }
      product.img_url = img_url;
    }

    console.log('Product created successfully:', product);
    res.status(201).json(product);
  } catch (error) {
    console.error('Lỗi tạo sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, description, status } = req.body;
    const imageFile = req.file; // Use req.file

    console.log('Updating product ID:', id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? { 
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    } : 'No file uploaded');

    if (!title && !category && !price && !description && status === undefined && !imageFile) {
      console.log('Validation failed: No data to update');
      return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
    }
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      console.log('Validation failed: Invalid price');
      return res.status(400).json({ message: 'Giá không hợp lệ.' });
    }

    const productData = {
      title,
      category,
      price: price !== undefined ? parseFloat(price) : undefined,
      description,
      status
    };

    if (imageFile) {
      console.log('Processing image for product ID:', id);
      const img_url = saveProductImage(imageFile, id);
      if (!img_url) {
        console.error('Failed to save product image');
        throw new Error('Failed to save product image');
      }
      productData.img_url = img_url;
      console.log('Updated img_url:', img_url);
    }

    console.log('Updating product with data:', productData);
    const updated = await Product.update(id, productData);
    if (!updated) {
      console.log('Product not found or no changes made');
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }

    console.log('Product updated successfully');
    res.json({ message: 'Sản phẩm được cập nhật thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm.', error: error.message });
  }
};