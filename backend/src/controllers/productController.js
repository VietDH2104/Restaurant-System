const Product = require('../models/productModel');
const path = require('path');
const fs = require('fs');

// exports.createProduct = async (req, res) => {
//   try {
//     const { title, img_url, category, price, description, status = 1 } = req.body;
//     if (!title || !category || price === undefined) {
//         return res.status(400).json({ message: 'Tiêu đề, danh mục và giá là bắt buộc.' });
//     }
//     if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
//         return res.status(400).json({ message: 'Giá không hợp lệ.'});
//     }
//     const productData = { title, img_url, category, price: parseFloat(price), description, status };
//     const product = await Product.create(productData);
//     res.status(201).json(product);
//   } catch (error) {
//     console.error('Lỗi tạo sản phẩm:', error);
//     res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.', error: error.message });
//   }
// };

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;
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

// exports.updateProduct = async (req, res) => {
//   try {
//     const { title, img_url, category, price, description, status } = req.body;
//     if (title === undefined && img_url === undefined && category === undefined && price === undefined && description === undefined && status === undefined) {
//         return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
//     }
//     if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
//         return res.status(400).json({ message: 'Giá không hợp lệ.'});
//     }
//     const productData = { title, img_url, category, price: price !== undefined ? parseFloat(price) : undefined, description, status };

//     const updated = await Product.update(req.params.id, productData);
//     if (!updated) {
//       return res.status(404).json({ message: 'Sản phẩm không tìm thấy hoặc không có thay đổi nào được thực hiện.' });
//     }
//     res.json({ message: 'Sản phẩm được cập nhật thành công.' });
//   } catch (error) {
//     console.error('Lỗi cập nhật sản phẩm:', error);
//     res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm.', error: error.message });
//   }
// };

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

// Add this helper function
const saveProductImage = (file, productId) => {
  if (!file) return null;
  
  const uploadDir = path.join(__dirname, '../../frontend/assets/img/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const filename = `product_${productId}${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, file.buffer);
  return `/assets/img/products/${filename}`;
};

// Modify createProduct
// exports.createProduct = async (req, res) => {
//   try {
//     const { title, category, price, description, status = 1 } = req.body;
//     const imageFile = req.files?.imageFile;

//     if (!title || !category || price === undefined) {
//       return res.status(400).json({ message: 'Tiêu đề, danh mục và giá là bắt buộc.' });
//     }

//     // First create product to get ID
//     const productData = { 
//       title, 
//       img_url: '', // Temporary empty
//       category, 
//       price: parseFloat(price), 
//       description, 
//       status 
//     };
    
//     const product = await Product.create(productData);
    
//     // Handle image upload
//     // if (imageFile) {
//     //   const img_url = saveProductImage(imageFile, product.id);
//     //   await Product.update(product.id, { img_url });
//     //   product.img_url = img_url;
//     // }

//     if (imageFile) {
//       const img_url = saveProductImage(imageFile, product.id);
//       const updated = await Product.update(product.id, { img_url });
//       if (!updated) {
//         throw new Error('Failed to update product image URL in database');
//       }
//       product.img_url = img_url;
//     }

//     res.status(201).json(product);
//   } catch (error) {
//     console.error('Lỗi tạo sản phẩm:', error);
//     res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.', error: error.message });
//   }
// };

exports.createProduct = async (req, res) => {
  try {
    console.log('req.body:', req.body); // Debug log
    console.log('req.files:', req.files); // Debug log
    const { title, category, price, description, status = 1 } = req.body;
    const imageFile = req.files?.imageFile;

    if (!title || !category || price === undefined) {
      return res.status(400).json({ message: 'Tiêu đề, danh mục và giá là bắt buộc.' });
    }

    const productData = { 
      title, 
      img_url: '', // Temporary empty
      category, 
      price: parseFloat(price), 
      description, 
      status 
    };
    
    const product = await Product.create(productData);
    
    if (imageFile) {
      const img_url = saveProductImage(imageFile, product.id);
      const updated = await Product.update(product.id, { img_url });
      if (!updated) {
        throw new Error('Failed to update product image URL in database');
      }
      product.img_url = img_url;
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Lỗi tạo sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.', error: error.message });
  }
};

// Modify updateProduct similarly
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, description, status } = req.body;
    const imageFile = req.files?.imageFile;

    const productData = { title, category, price, description, status };
    
    if (imageFile) {
      const img_url = saveProductImage(imageFile, id);
      productData.img_url = img_url;
    }

    const updated = await Product.update(id, productData);
    if (!updated) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
    }
    res.json({ message: 'Sản phẩm được cập nhật thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm.', error: error.message });
  }
};