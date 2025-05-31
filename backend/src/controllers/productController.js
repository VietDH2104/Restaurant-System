const Product = require('../models/productModel');

exports.createProduct = async (req, res) => {
  try {
    const { title, category, price: priceFromBody, description, status: statusFromBody } = req.body;

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc.' });
    }
    if (!category || String(category).trim() === "") {
      return res.status(400).json({ message: 'Loại sản phẩm là bắt buộc.' });
    }
    if (priceFromBody === undefined || priceFromBody === null || String(priceFromBody).trim() === "") {
      return res.status(400).json({ message: 'Giá sản phẩm là bắt buộc.' });
    }

    let img_url = null;
    if (req.file) {
      img_url = `/uploads/${req.file.filename}`;
    }

    let parsedPrice;
    const tempPrice = parseFloat(priceFromBody);
    if (!isNaN(tempPrice) && tempPrice >= 0) {
      parsedPrice = tempPrice;
    } else {
      return res.status(400).json({ message: 'Giá sản phẩm không hợp lệ.' });
    }

    const status = (statusFromBody !== undefined && !isNaN(parseInt(statusFromBody, 10)))
                     ? parseInt(statusFromBody, 10)
                     : 1;

    const productData = {
        title: String(title).trim(),
        img_url: img_url,
        category: String(category).trim(),
        price: parsedPrice,
        description: description ? String(description).trim() : null,
        status: status
    };

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Lỗi tạo sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.', error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    let { category, search, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;

    if (category === 'undefined') category = undefined;
    if (search === 'undefined') search = undefined;
    if (minPrice === 'undefined') minPrice = undefined;
    if (maxPrice === 'undefined') maxPrice = undefined;
    if (sortBy === 'undefined') sortBy = undefined;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let parsedMinPrice;
    if (minPrice !== undefined && minPrice !== null && String(minPrice).trim() !== '') {
      const tempMin = parseFloat(minPrice);
      if (!isNaN(tempMin) && tempMin >= 0) {
        parsedMinPrice = tempMin;
      }
    }

    let parsedMaxPrice;
    if (maxPrice !== undefined && maxPrice !== null && String(maxPrice).trim() !== '') {
      const tempMax = parseFloat(maxPrice);
      if (!isNaN(tempMax) && tempMax >= 0) {
        parsedMaxPrice = tempMax;
      }
    }

    if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
        parsedMinPrice = undefined;
        parsedMaxPrice = undefined;
    }

    const filters = {
        category: (category === 'Tất cả' || category === undefined) ? undefined : category,
        search: search || undefined,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        sortBy: sortBy || undefined,
        forCustomerView: true,
        limit: parseInt(limit, 10),
        offset
    };
    const { products, total } = await Product.findAll(filters);
    res.json({
        data: products,
        pagination: {
            currentPage: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalItems: total,
            totalPages: Math.ceil(total / parseInt(limit, 10))
        }
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm (khách hàng):', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy sản phẩm.', error: error.message });
  }
};

exports.getAllProductsAdmin = async (req, res) => {
    try {
      let { category, search, status, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      if (category === 'undefined') category = undefined;
      if (search === 'undefined') search = undefined;
      if (status === 'undefined') status = undefined;

      let parsedStatus;
      if (status !== undefined && status !== null && status !== 'all' && status !== '') {
        parsedStatus = parseInt(status, 10);
        if (isNaN(parsedStatus)) {
            parsedStatus = undefined;
        }
      } else if (status === 'all' || status === '') {
        parsedStatus = undefined;
      }

      const filters = {
          category: (category === 'Tất cả' || category === undefined) ? undefined : category,
          search: search || undefined,
          status: parsedStatus,
          limit: parseInt(limit, 10),
          offset
      };
      const { products, total } = await Product.findAll(filters);
      res.json({
          data: products,
          pagination: {
              currentPage: parseInt(page, 10),
              limit: parseInt(limit, 10),
              totalItems: total,
              totalPages: Math.ceil(total / parseInt(limit, 10))
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

exports.updateProduct = async (req, res) => {
  try {
    const { title, category, description, status } = req.body;
    const priceFromBody = req.body.price;
    let new_img_url;

    if (req.file) {
        new_img_url = `/uploads/${req.file.filename}`;
    }

    let parsedPrice;
    if (priceFromBody !== undefined && priceFromBody !== null && String(priceFromBody).trim() !== '') {
        const tempPrice = parseFloat(priceFromBody);
        if (!isNaN(tempPrice) && tempPrice >= 0) {
            parsedPrice = tempPrice;
        } else {
             return res.status(400).json({ message: 'Giá cung cấp không hợp lệ.'});
        }
    }

    const productDataToUpdate = {};

    if (title !== undefined) productDataToUpdate.title = String(title).trim() === "" ? null : String(title).trim();
    if (category !== undefined) productDataToUpdate.category = String(category).trim() === "" ? null : String(category).trim();
    if (parsedPrice !== undefined) productDataToUpdate.price = parsedPrice;
    if (description !== undefined) productDataToUpdate.description = String(description).trim() === "" ? null : String(description).trim();
    if (status !== undefined && !isNaN(parseInt(status,10))) productDataToUpdate.status = parseInt(status,10);

    if (req.file) {
        productDataToUpdate.img_url = new_img_url;
    } else if (req.body.img_url_hidden === 'null' || req.body.remove_image === 'true') {
        productDataToUpdate.img_url = null;
    } else if (req.body.img_url_hidden) {
        productDataToUpdate.img_url = req.body.img_url_hidden;
    }

    if (Object.keys(productDataToUpdate).length === 0 ) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
    }
    
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
        return res.status(404).json({ message: 'Sản phẩm không tìm thấy để cập nhật.' });
    }

    const finalTitle = productDataToUpdate.title !== undefined ? productDataToUpdate.title : existingProduct.title;
    const finalCategory = productDataToUpdate.category !== undefined ? productDataToUpdate.category : existingProduct.category;
    const finalPrice = productDataToUpdate.price !== undefined ? productDataToUpdate.price : existingProduct.price;

    if (finalTitle === null || String(finalTitle).trim() === "") {
        return res.status(400).json({ message: 'Tên sản phẩm không được để trống khi cập nhật.' });
    }
    if (finalCategory === null || String(finalCategory).trim() === "") {
        return res.status(400).json({ message: 'Loại sản phẩm không được để trống khi cập nhật.' });
    }
     if (finalPrice === undefined || finalPrice === null || finalPrice < 0) {
        return res.status(400).json({ message: 'Giá sản phẩm không được để trống hoặc âm khi cập nhật.' });
    }

    const updated = await Product.update(req.params.id, productDataToUpdate);
    if (!updated) {
      return res.status(404).json({ message: 'Sản phẩm không tìm thấy hoặc không có thay đổi nào được thực hiện.' });
    }
    res.json({ message: 'Sản phẩm được cập nhật thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm.', error: error.message });
  }
};

exports.updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (status === undefined || (status !== 0 && status !== 1 && status !== '0' && status !== '1')) {
            return res.status(400).json({ message: 'Giá trị trạng thái không hợp lệ. Phải là 0 hoặc 1.' });
        }
        const numericStatus = parseInt(status, 10);
        const updated = await Product.updateStatus(req.params.id, numericStatus);
        if (!updated) {
            return res.status(404).json({ message: 'Sản phẩm không tìm thấy.' });
        }
        res.json({ message: `Trạng thái sản phẩm được cập nhật thành ${numericStatus === 1 ? 'hiển thị' : 'ẩn'}.` });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật trạng thái sản phẩm.', error: error.message });
    }
};