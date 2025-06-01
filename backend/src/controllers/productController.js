const Product = require('../models/productModel');

const transformProductForResponse = (product) => {
  if (!product) return null;
  const { image_data, ...productInfo } = product;
  if (product.id) { 
    productInfo.img_url = `/api/products/image/${product.id}`;
  } else {
    productInfo.img_url = null;
  }
  return productInfo;
};

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

    let imageData = null;
    if (req.file && req.file.buffer) {
      imageData = req.file.buffer;
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
        image_data: imageData,
        category: String(category).trim(),
        price: parsedPrice,
        description: description ? String(description).trim() : null,
        status: status
    };

    const createdProductRaw = await Product.create(productData);
    const newProductWithId = await Product.findById(createdProductRaw.id);
    res.status(201).json(transformProductForResponse(newProductWithId));
  } catch (error) {
    console.error('Lỗi tạo sản phẩm:', error);
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || error.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ hoặc quá dài cho một số trường.'});
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm.', error: error.message });
  }
};

exports.getProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const productWithImage = await Product.findImageById(productId);

    if (productWithImage && productWithImage.image_data) {
      let contentType = 'image/jpeg'; 
      if (productWithImage.image_data[0] === 0xFF && productWithImage.image_data[1] === 0xD8) {
        contentType = 'image/jpeg';
      } else if (productWithImage.image_data[0] === 0x89 && productWithImage.image_data[1] === 0x50) {
        contentType = 'image/png';
      } else if (String(productWithImage.image_data.slice(0,4)) === 'RIFF' && String(productWithImage.image_data.slice(8,12)) === 'WEBP') {
        contentType = 'image/webp';
      }
      res.setHeader('Content-Type', contentType);
      res.send(productWithImage.image_data);
    } else {
      res.status(404).send('Image not found');
    }
  } catch (error) {
    console.error('Lỗi lấy ảnh sản phẩm:', error);
    res.status(500).send('Server error when fetching image');
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
    const transformedProducts = products.map(transformProductForResponse);

    res.json({
        data: transformedProducts,
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
      const transformedProducts = products.map(transformProductForResponse);
      res.json({
          data: transformedProducts,
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
    res.json(transformProductForResponse(product));
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm.', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { title, category, description, status } = req.body;
    const priceFromBody = req.body.price;
    let imageData;

    if (req.file && req.file.buffer) {
        imageData = req.file.buffer;
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
        productDataToUpdate.image_data = imageData;
    } else if (req.body.remove_image === 'true') {
        productDataToUpdate.image_data = null;
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
    const updatedProduct = await Product.findById(req.params.id); 
    res.json(transformProductForResponse(updatedProduct));
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || error.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ hoặc quá dài cho một số trường khi cập nhật.'});
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm.', error: error.message });
  }
};

exports.updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (status === undefined || (status != 0 && status != 1 && status != '0' && status != '1')) {
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