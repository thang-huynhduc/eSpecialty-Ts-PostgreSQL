import productModel from "../models/productModel.js";

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    // Get all products
    const allProducts = await productModel.find({});
    
    // Calculate stats
    const totalProducts = allProducts.length;
    const inStockProducts = allProducts.filter(product => product.stock > 0 && product.isAvailable).length;
    const outOfStockProducts = allProducts.filter(product => product.stock === 0).length;
    const lowStockProducts = allProducts.filter(product => product.stock > 0 && product.stock <= 10).length;
    
    // Calculate total inventory value
    const totalValue = allProducts.reduce((sum, product) => {
      return sum + (product.price * product.stock);
    }, 0);
    
    // Calculate total sold quantity
    const totalSold = allProducts.reduce((sum, product) => {
      return sum + (product.soldQuantity || 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        lowStockProducts,
        totalValue,
        totalSold
      }
    });
  } catch (error) {
    console.log("Get inventory stats error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const lowStockItems = await productModel.find({
      stock: { $gt: 0, $lte: Number(threshold) },
      isAvailable: true
    }).select('name stock price category images').sort({ stock: 1 });

    res.json({
      success: true,
      lowStockItems: lowStockItems.map(item => ({
        _id: item._id,
        name: item.name,
        stock: item.stock,
        threshold: Number(threshold),
        price: item.price,
        category: item.category,
        image: item.images && item.images.length > 0 ? item.images[0] : ""
      }))
    });
  } catch (error) {
    console.log("Get low stock items error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get out of stock items
const getOutOfStockItems = async (req, res) => {
  try {
    const outOfStockItems = await productModel.find({
      stock: 0
    }).select('name stock price category images soldQuantity').sort({ updatedAt: -1 });

    res.json({
      success: true,
      outOfStockItems: outOfStockItems.map(item => ({
        _id: item._id,
        name: item.name,
        stock: item.stock,
        price: item.price,
        category: item.category,
        soldQuantity: item.soldQuantity || 0,
        image: item.images && item.images.length > 0 ? item.images[0] : ""
      }))
    });
  } catch (error) {
    console.log("Get out of stock items error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Bulk update stock
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {productId, newStock}
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required"
      });
    }

    const results = [];
    
    for (const update of updates) {
      const { productId, newStock } = update;
      
      if (!productId || newStock === undefined || newStock < 0) {
        results.push({
          productId,
          success: false,
          message: "Invalid product ID or stock value"
        });
        continue;
      }
      
      try {
        const product = await productModel.findById(productId);
        if (!product) {
          results.push({
            productId,
            success: false,
            message: "Product not found"
          });
          continue;
        }
        
        const oldStock = product.stock;
        product.stock = Number(newStock);
        product.isAvailable = product.stock > 0;
        
        await product.save();
        
        results.push({
          productId,
          success: true,
          message: "Stock updated successfully",
          oldStock,
          newStock: product.stock
        });
      } catch (error) {
        results.push({
          productId,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: "Bulk update completed",
      results
    });
  } catch (error) {
    console.log("Bulk update stock error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Stock movement history
const getStockMovements = async (req, res) => {
  try {
    const { productId, limit = 20 } = req.query;
    
    let query = {};
    if (productId) {
      query._id = productId;
    }
    
    const products = await productModel.find(query)
      .select('name stock soldQuantity updatedAt')
      .sort({ updatedAt: -1 })
      .limit(Number(limit));
    
    res.json({
      success: true,
      movements: products.map(product => ({
        _id: product._id,
        name: product.name,
        currentStock: product.stock,
        soldQuantity: product.soldQuantity || 0,
        lastUpdated: product.updatedAt
      }))
    });
  } catch (error) {
    console.log("Get stock movements error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Inventory valuation report
const getInventoryValuation = async (req, res) => {
  try {
    const products = await productModel.find({})
      .select('name stock price category soldQuantity');
    
    const categoryValuation = {};
    let totalInventoryValue = 0;
    let totalSoldValue = 0;
    
    products.forEach(product => {
      const inventoryValue = product.stock * product.price;
      const soldValue = (product.soldQuantity || 0) * product.price;
      
      totalInventoryValue += inventoryValue;
      totalSoldValue += soldValue;
      
      if (!categoryValuation[product.category]) {
        categoryValuation[product.category] = {
          category: product.category,
          totalProducts: 0,
          totalStock: 0,
          inventoryValue: 0,
          soldValue: 0
        };
      }
      
      categoryValuation[product.category].totalProducts += 1;
      categoryValuation[product.category].totalStock += product.stock;
      categoryValuation[product.category].inventoryValue += inventoryValue;
      categoryValuation[product.category].soldValue += soldValue;
    });
    
    res.json({
      success: true,
      valuation: {
        totalInventoryValue,
        totalSoldValue,
        totalProducts: products.length,
        categoryBreakdown: Object.values(categoryValuation)
      }
    });
  } catch (error) {
    console.log("Get inventory valuation error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Set stock alert threshold for specific product
const setStockAlert = async (req, res) => {
  try {
    const { productId, threshold } = req.body;
    
    if (!productId || threshold === undefined || threshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid threshold are required"
      });
    }
    
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    // Add threshold field to product schema if not exists
    product.stockThreshold = Number(threshold);
    await product.save();
    
    res.json({
      success: true,
      message: "Stock alert threshold set successfully",
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        stockThreshold: product.stockThreshold
      }
    });
  } catch (error) {
    console.log("Set stock alert error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getInventoryStats,
  getLowStockItems,
  getOutOfStockItems,
  bulkUpdateStock,
  getStockMovements,
  getInventoryValuation,
  setStockAlert
};