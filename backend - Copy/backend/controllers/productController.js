const mongoose = require('mongoose');
const Product = require('../models/productModel');

// Create a new product only admin can create product
const createProduct = async (req, res) => {
  try {
    const { title, price, category } = req.body;

    if (!title || price === undefined || !category) {
      return res.status(400).json({
        status: "error",
        message: "Title, price, and category are required"
      });
    }

    if (price < 0) {
      return res.status(400).json({
        status: "error",
        message: "Price cannot be negative"
      });
    }

    const base = `${req.protocol}://${req.get('host')}`;
    const imagesFromFiles = (req.files || []).map(f => `${base}/uploads/products/${f.filename}`);

    const createData = { ...req.body };

    // معالجة روابط الصور إذا كانت مرسلة كـ JSON string
    if (req.body.images && typeof req.body.images === 'string') {
      try {
        createData.images = JSON.parse(req.body.images);
      } catch (e) {
        console.log('Failed to parse images JSON, treating as regular field');
      }
    }

    // لو فيه ملفات مرفوعة نكتبها في images، وإلا نسيب images اللي جاية من البودي
    if (imagesFromFiles.length > 0) {
      // إذا كان هناك ملفات مرفوعة وروابط أيضاً، ندمجهم
      if (createData.images && Array.isArray(createData.images)) {
        createData.images = [...createData.images, ...imagesFromFiles];
      } else {
        createData.images = imagesFromFiles;
      }
    }

    // thumbnail افتراضيًا أول صورة لو مش متبعتش
    if (!createData.thumbnail) {
      const imgs = createData.images || imagesFromFiles;
      if (Array.isArray(imgs) && imgs.length > 0) {
        createData.thumbnail = imgs[0];
      }
    }

    const product = await Product.create(createData);

    res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: product
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
};

// Get all products for pagination (with filters like category and search) 
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, filter } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    switch (filter) {
      case 'on-sale':
        query.discountPercentage = { $gt: 0 };
        break;
      case 'in-stock':
        query.stock = { $gt: 0 };
        break;
      case 'top-rated':
        query.rating = { $gte: 4.5 };
        break;
      case 'all':
      default:
        break;
    }

    const products = await Product.find(query, { "__v": false })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      status: "success",
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({
      status: "error",
      message: "Failed to get products"
    });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid product ID format"
      });
    }
    
    const product = await Product.findById(id, { "__v": false });
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      });
    }
    res.json({
      status: "success",
      data: product
    });
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({
      status: "error",
      message: "Failed to get product"
    });
  }
};

// Update product details only admin can update product
const updateProduct = async (req, res) => {
  try {
    const { name, price, category, stock } = req.body;

    if (price !== undefined && price < 0) {
      return res.status(400).json({
        status: "error",
        message: "Price cannot be negative"
      });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        status: "error",
        message: "Stock cannot be negative"
      });
    }

    // 🔥 الصور الجديدة لو اترفعت
    const base = `${req.protocol}://${req.get('host')}`;
    const newImages = (req.files || []).map(f => `${base}/uploads/products/${f.filename}`);

    // ندمج الصور الجديدة مع القديمة لو حابب (اختياري)
    const updateData = {
      ...req.body
    };
    if (newImages.length > 0) {
      updateData.images = newImages;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true, 
        runValidators: true,
        select: { "__v": false }
      });
    
    if (!updated) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      });
    }

    res.json({
      status: "success",
      message: "Product updated successfully",
      data: updated
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({
      status: "error",
      message: "Failed to update product"
    });
  }
};

// Delete product only admin can delete product
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      });
    }
    res.json({
      status: "success",
      message: "Product deleted successfully"
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({
      status: "error",
      message: "Failed to delete product"
    });
  }
};

// Get 5 products for the home slider
const getHomeSliderProducts = async (req, res) => {
  try {
    const products = await Product.find({}).limit(5);
    
    if (!products.length) {
      return res.status(404).json({
        status: "error",
        message: "No products found for the slider"
      });
    }

    res.json({
      status: "success",
      data: products
    });
  } catch (err) {
    console.error('Error fetching slider products:', err);
    res.status(500).json({
      status: "error",
      message: "Failed to get products for the slider"
    });
  }
};

// Get all unique categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    // Filter out null/undefined/empty categories and sort
    const validCategories = categories
      .filter(cat => cat && cat.trim() !== '')
      .sort();

    res.json({
      status: "success",
      data: validCategories
    });
  } catch (err) {
    console.error('Error getting categories:', err);
    res.status(500).json({
      status: "error",
      message: "Failed to get categories"
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getHomeSliderProducts,
  getCategories
};
