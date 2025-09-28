import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from "../../config";
import { 
  FaBoxes, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaSave, 
  FaTimes,
  FaSearch,
  FaDownload,
  FaChartBar,
  FaHistory,
  FaBell
} from "react-icons/fa";
import { IoMdClose, IoMdCloudUpload } from "react-icons/io";
import { MdOutlineInventory, MdLowPriority } from "react-icons/md";
import toast from 'react-hot-toast';
import axios from "axios";

const Inventory = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    totalSold: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [inventoryValuation, setInventoryValuation] = useState({
    totalInventoryValue: 0,
    totalSoldValue: 0,
    totalProducts: 0,
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(false);
  const [editingStock, setEditingStock] = useState({});
  const [bulkUpdateItems, setBulkUpdateItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockThreshold, setStockThreshold] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [formData, setFormData] = useState({
    _type: "",
    name: "",
    description: "",
    brand: "",
    price: "",
    discountedPercentage: 10,
    stock: "",
    category: "",
    offer: false,
    isAvailable: true,
    badge: false,
    tags: [],
  });

  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  const API_TOKEN = token || localStorage.getItem('token');

  // Fetch categories and brands
  const fetchCategoriesAndBrands = useCallback(async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${serverUrl}/api/category`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }),
        fetch(`${serverUrl}/api/brand`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        }),
      ]);

      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
      if (brandsData.success) {
        setBrands(brandsData.brands);
      }
    } catch (error) {
      console.error("Error fetching categories and brands:", error);
      toast.error("Error fetching categories and brands");
    }
  }, [API_TOKEN]);

  // Fetch product details
  const fetchProductDetails = useCallback(async (productId) => {
    try {
      const response = await axios.get(`${serverUrl}/api/product/single`, {
        params: { _id: productId },
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      });
      const data = response.data;
      if (data.success) {
        setSelectedProduct(data.product);
        setShowDetailsModal(true);
      } else {
        toast.error(data.message || "Error fetching product details");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast.error("Error fetching product details");
    }
  }, [API_TOKEN]);

  // API calls wrapped in useCallback
  const fetchInventoryStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/inventory/stats`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInventoryStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      toast.error("Error fetching inventory stats");
    }
    setLoading(false);
  }, [API_TOKEN]);

  const fetchLowStockItems = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/api/inventory/low-stock?threshold=${stockThreshold}`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLowStockItems(data.lowStockItems);
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      toast.error("Error fetching low stock items");
    }
  }, [API_TOKEN, stockThreshold]);

  const fetchOutOfStockItems = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/api/inventory/out-of-stock`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOutOfStockItems(data.outOfStockItems);
      }
    } catch (error) {
      console.error('Error fetching out of stock items:', error);
      toast.error("Error fetching out of stock items");
    }
  }, [API_TOKEN]);

  const fetchStockMovements = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/api/inventory/movements`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStockMovements(data.movements);
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      toast.error("Error fetching stock movements");
    }
  }, [API_TOKEN]);

  const fetchInventoryValuation = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/api/inventory/valuation`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInventoryValuation(data.valuation);
      }
    } catch (error) {
      console.error('Error fetching inventory valuation:', error);
      toast.error("Error fetching inventory valuation");
    }
  }, [API_TOKEN]);

  const handleBulkStockUpdate = useCallback(async () => {
    if (bulkUpdateItems.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/inventory/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          updates: bulkUpdateItems.map(item => ({
            productId: item._id,
            newStock: item.newStock
          }))
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setBulkUpdateItems([]);
        fetchInventoryStats();
        fetchLowStockItems();
        fetchOutOfStockItems();
        toast.success("Stock updated successfully");
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error("Error updating stock");
    }
    setLoading(false);
  }, [bulkUpdateItems, API_TOKEN, fetchInventoryStats, fetchLowStockItems, fetchOutOfStockItems]);

  const handleStockEdit = useCallback((item) => {
    setEditingStock({
      ...editingStock,
      [item._id]: item.stock
    });
  }, [editingStock]);

  const handleStockSave = useCallback((item) => {
    const newStock = editingStock[item._id];
    const existingItem = bulkUpdateItems.find(i => i._id === item._id);
    
    if (existingItem) {
      existingItem.newStock = newStock;
    } else {
      setBulkUpdateItems([...bulkUpdateItems, { ...item, newStock }]);
    }
    
    const newEditingStock = { ...editingStock };
    delete newEditingStock[item._id];
    setEditingStock(newEditingStock);
  }, [editingStock, bulkUpdateItems]);

  const handleStockCancel = useCallback((item) => {
    const newEditingStock = { ...editingStock };
    delete newEditingStock[item._id];
    setEditingStock(newEditingStock);
  }, [editingStock]);

  // Open edit modal
  const openEditModal = useCallback((product) => {
    setEditingProduct(product);
    setFormData({
      _type: product._type || "",
      name: product.name || "",
      description: product.description || "",
      brand: product.brand || "",
      price: product.price || "",
      discountedPercentage: product.discountedPercentage || 10,
      stock: product.stock || 0,
      category: product.category || "",
      offer: product.offer || false,
      isAvailable: product.isAvailable !== false,
      badge: product.badge || false,
      tags: product.tags || [],
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
    setShowEditModal(true);
  }, []);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingProduct(null);
    setFormData({
      _type: "",
      name: "",
      description: "",
      brand: "",
      price: "",
      discountedPercentage: 10,
      stock: "",
      category: "",
      offer: false,
      isAvailable: true,
      badge: false,
      tags: [],
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
  }, []);

  // Close details modal
  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  }, []);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (
      type === "select-one" &&
      (name === "offer" || name === "isAvailable" || name === "badge")
    ) {
      setFormData({
        ...formData,
        [name]: value === "true",
      });
    } else if (
      name === "price" ||
      name === "discountedPercentage" ||
      name === "stock"
    ) {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  }, [formData]);

  // Handle individual image upload
  const handleImageChange = useCallback((e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      setImageFiles((prev) => ({
        ...prev,
        [imageKey]: file,
      }));
    }
  }, []);

  // Remove an image
  const removeImage = useCallback((imageKey) => {
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }));
  }, []);

  // Handle product update
  const handleUpdateProduct = useCallback(async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.category
    ) {
      toast.error("Missing required fields: name, price, category, and description are mandatory");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      // Append form fields
      data.append("_type", formData._type);
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("brand", formData.brand);
      data.append("price", formData.price);
      data.append("discountedPercentage", formData.discountedPercentage);
      data.append("stock", formData.stock);
      data.append("category", formData.category);
      data.append("offer", formData.offer);
      data.append("isAvailable", formData.isAvailable);
      data.append("badge", formData.badge);
      data.append("tags", JSON.stringify(formData.tags));

      // Append image files only if new images are selected
      Object.keys(imageFiles).forEach((key) => {
        if (imageFiles[key]) {
          data.append(key, imageFiles[key]);
        }
      });

      const response = await axios.put(
        `${serverUrl}/api/product/update/${editingProduct._id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success("Product updated successfully");
        await Promise.all([
          fetchInventoryStats(),
          fetchLowStockItems(),
          fetchOutOfStockItems(),
        ]);
        closeEditModal();
      } else {
        toast.error(responseData?.message || "Error updating product");
      }
    } catch (error) {
      console.error("Product update error", error);
      toast.error(error?.response?.data?.message || "Error updating product");
    } finally {
      setSubmitting(false);
    }
  }, [formData, imageFiles, editingProduct, API_TOKEN, fetchInventoryStats, fetchLowStockItems, fetchOutOfStockItems, closeEditModal]);

  useEffect(() => {
    fetchCategoriesAndBrands();
    fetchInventoryStats();
    fetchLowStockItems();
    fetchOutOfStockItems();
    fetchStockMovements();
    fetchInventoryValuation();
  }, [fetchCategoriesAndBrands, fetchInventoryStats, fetchLowStockItems, fetchOutOfStockItems, fetchStockMovements, fetchInventoryValuation, stockThreshold]);

  // Filter items based on search term
  const filteredLowStock = lowStockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOutOfStock = outOfStockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600 text-xl`}>
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-gray-600 text-sm">{title}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    icon: PropTypes.element.isRequired,
    color: PropTypes.string.isRequired,
    trend: PropTypes.number
  };

  const TabButton = ({ id, label, icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  TabButton.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    active: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired
  };

  const StockEditRow = ({ item, isEditing, onEdit, onSave, onCancel, onViewDetails }) => (
    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-500 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        {item.image && (
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-20 h-20 object-cover rounded-lg cursor-pointer" 
            onClick={() => onViewDetails(item._id)}
          />
        )}
        <div>
          <h4 
            className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => onViewDetails(item._id)}
          >
            {item.name}
          </h4>
          <p className="text-sm text-gray-600">{item.category}</p>
          <p className="text-sm text-gray-500">{item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
          <p className='text-green-600'>Sold: {item.soldQuantity}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            <input
              type="number"
              defaultValue={editingStock[item._id] ?? item.stock}
              onBlur={(e) =>
                setEditingStock({
                  ...editingStock,
                  [item._id]: parseInt(e.target.value) || 0,
                })
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <button
              onClick={() => onSave(item)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <FaSave /> Save
            </button>
            <button
              onClick={() => onCancel(item)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTimes /> Cancel
            </button>
          </>
        ) : (
          <>
            <span className={`font-bold text-lg ${
              item.stock <= item.threshold ? 'text-red-600' : 
              item.stock <= (item.threshold * 1.5) ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {item.stock}
            </span>
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-white bg-red-500 hover:bg-red-400 rounded-lg transition-colors"
            >
              Restock
            </button>
          </>
        )}
      </div>
    </div>
  );

  StockEditRow.propTypes = {
    item: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      image: PropTypes.string,
      name: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      stock: PropTypes.number.isRequired,
      threshold: PropTypes.number.isRequired,
      soldQuantity: PropTypes.number
    }).isRequired,
    isEditing: PropTypes.bool.isRequired,
    onEdit: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onFullEdit: PropTypes.func.isRequired,
    onViewDetails: PropTypes.func.isRequired
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Monitor and manage your inventory, stock levels, and product details
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <TabButton
          id="overview"
          label="Overview"
          icon={<MdOutlineInventory />}
          active={activeTab === 'overview'}
          onClick={setActiveTab}
        />
        <TabButton
          id="low-stock"
          label="Low Stock Alerts"
          icon={<FaExclamationTriangle />}
          active={activeTab === 'low-stock'}
          onClick={setActiveTab}
        />
        <TabButton
          id="out-of-stock"
          label="Out of Stock"
          icon={<MdLowPriority />}
          active={activeTab === 'out-of-stock'}
          onClick={setActiveTab}
        />
        <TabButton
          id="movements"
          label="Stock Movements"
          icon={<FaHistory />}
          active={activeTab === 'movements'}
          onClick={setActiveTab}
        />
        <TabButton
          id="valuation"
          label="Inventory Valuation"
          icon={<FaChartBar />}
          active={activeTab === 'valuation'}
          onClick={setActiveTab}
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Products"
              value={inventoryStats.totalProducts}
              icon={<FaBoxes />}
              color="blue"
            />
            <StatCard
              title="Low Stock Products"
              value={inventoryStats.lowStockProducts}
              icon={<FaExclamationTriangle />}
              color="yellow"
            />
            <StatCard
              title="Out of Stock Products"
              value={inventoryStats.outOfStockProducts}
              icon={<MdLowPriority />}
              color="red"
            />
            <StatCard
              title="In Stock Products"
              value={inventoryStats.inStockProducts}
              icon={<FaCheckCircle />}
              color="green"
            />
          </div>

          {/* Value Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Value</h3>
              <div className="text-3xl font-bold text-green-600">
                {inventoryStats.totalValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
              </div>
              <p className="text-gray-600 text-sm mt-2">Total Inventory Value</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Sold</h3>
              <div className="text-3xl font-bold text-blue-600">
                {inventoryStats.totalSold?.toLocaleString()}
              </div>
              <p className="text-gray-600 text-sm mt-2">Total Units Sold</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('low-stock')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                >
                  <FaBell className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">Check Alerts</p>
                </button>
                <button
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <FaDownload className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">Export Report</p>
                </button>
                <button
                  onClick={() => setActiveTab('movements')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FaHistory className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">View History</p>
                </button>
                <button
                  onClick={() => setActiveTab('valuation')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <FaChartBar className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">Valuation Report</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'low-stock' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Stock Threshold</label>
                <input
                  type="number"
                  defaultValue={stockThreshold}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setStockThreshold(parseInt(e.target.value) || 10);
                      e.target.blur();
                    }
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search low stock items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {bulkUpdateItems.length > 0 && (
              <button
                onClick={handleBulkStockUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FaSave />
                Save Changes ({bulkUpdateItems.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Low Stock Items ({filteredLowStock.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              {filteredLowStock.length === 0 ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No low stock items found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLowStock.map((item) => (
                    <StockEditRow
                      key={item._id}
                      item={item}
                      isEditing={Object.prototype.hasOwnProperty.call(editingStock, item._id)}
                      onEdit={handleStockEdit}
                      onSave={handleStockSave}
                      onCancel={handleStockCancel}
                      onFullEdit={openEditModal}
                      onViewDetails={fetchProductDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock Tab */}
      {activeTab === 'out-of-stock' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search out of stock items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {bulkUpdateItems.length > 0 && (
              <button
                onClick={handleBulkStockUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FaSave />
                Save Changes ({bulkUpdateItems.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MdLowPriority className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Out of Stock Items ({filteredOutOfStock.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              {filteredOutOfStock.length === 0 ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-4xl text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600">No out of stock items found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOutOfStock.map((item) => (
                    <StockEditRow
                      key={item._id}
                      item={item}
                      isEditing={Object.prototype.hasOwnProperty.call(editingStock, item._id)}
                      onEdit={handleStockEdit}
                      onSave={handleStockSave}
                      onCancel={handleStockCancel}
                      onFullEdit={openEditModal}
                      onViewDetails={fetchProductDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Movements Tab */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FaHistory className="text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Stock Movements
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stockMovements.map((movement, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{movement.name}</h4>
                    <p className="text-sm text-gray-600">
                      Last Updated: {new Date(movement.lastUpdated).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">Stock</p>
                    <div className="text-xl font-bold text-gray-900">{movement.currentStock}</div>
                    <p className="text-sm text-blue-600">Sold: {movement.soldQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Valuation Tab */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Valuation</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Inventory Value</span>
                  <span className="font-semibold text-green-600">
                    {inventoryValuation.totalInventoryValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sales Value</span>
                  <span className="font-semibold text-blue-600">
                    {inventoryValuation.totalSoldValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-900 font-medium">Total Products</span>
                  <span className="font-semibold">{inventoryValuation.totalProducts}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
              <div className="space-y-3">
                {inventoryValuation.categoryBreakdown?.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <p className="text-sm text-gray-600">{category.totalProducts} products</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {category.inventoryValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </span>
                      <p className="text-sm text-gray-600">{category.totalStock} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Category Analysis</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Products Count</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Total Stock</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Inventory Value</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Sales Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryValuation.categoryBreakdown?.map((category, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{category.category}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{category.totalProducts}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{category.totalStock}</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">
                          {category.inventoryValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                          {category.soldValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDetailsModal();
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Product Details</h2>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoMdClose size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.images?.map((image, index) => (
                      image && (
                        <img
                          key={index}
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-40 object-cover rounded-md"
                        />
                      )
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedProduct.name}</p>
                    <p><strong>Type:</strong> {selectedProduct._type || 'N/A'}</p>
                    <p><strong>Description:</strong> {selectedProduct.description}</p>
                    <p><strong>Brand:</strong> {selectedProduct.brand || 'N/A'}</p>
                    <p><strong>Category:</strong> {selectedProduct.category}</p>
                    <p><strong>Price:</strong> {selectedProduct.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
                    <p><strong>Discount:</strong> {selectedProduct.discountedPercentage}%</p>
                    <p><strong>Stock:</strong> {selectedProduct.stock}</p>
                    <p><strong>Sold:</strong> {selectedProduct.soldQuantity}</p>
                    <p><strong>Available:</strong> {selectedProduct.isAvailable ? 'Yes' : 'No'}</p>
                    <p><strong>Special Offer:</strong> {selectedProduct.offer ? 'Yes' : 'No'}</p>
                    <p><strong>Badge:</strong> {selectedProduct.badge ? 'Yes' : 'No'}</p>
                    <p><strong>Tags:</strong> {selectedProduct.tags?.join(', ') || 'None'}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={closeDetailsModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeDetailsModal();
                    openEditModal(selectedProduct);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Product</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {["image1", "image2", "image3", "image4"].map(
                    (imageKey, index) => (
                      <div key={imageKey} className="relative">
                        <label htmlFor={`edit-${imageKey}`} className="block">
                          <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors duration-200 min-h-[120px] flex flex-col items-center justify-center bg-white">
                            {imageFiles[imageKey] ? (
                              <>
                                <img
                                  src={URL.createObjectURL(imageFiles[imageKey])}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-md mb-2"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    removeImage(imageKey);
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                                <span className="text-xs text-gray-600">
                                  Change Image
                                </span>
                              </>
                            ) : editingProduct?.images?.[index] ? (
                              <>
                                <img
                                  src={editingProduct.images[index]}
                                  alt={`Current ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-md mb-2"
                                />
                                <span className="text-xs text-gray-600">
                                  Replace Image
                                </span>
                              </>
                            ) : (
                              <>
                                <IoMdCloudUpload className="text-3xl text-gray-400 mb-2" />
                                <span className="text-xs text-gray-600">
                                  Upload Image {index + 1}
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              id={`edit-${imageKey}`}
                              hidden
                              accept="image/*"
                              onChange={(e) => handleImageChange(e, imageKey)}
                            />
                          </div>
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="discountedPercentage" className="block text-sm font-medium text-gray-700">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="discountedPercentage"
                    value={formData.discountedPercentage}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="_type" className="block text-sm font-medium text-gray-700">Product Type</label>
                  <select
                    name="_type"
                    value={formData._type}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="new_arrivals">New Arrivals</option>
                    <option value="best_sellers">Best Sellers</option>
                    <option value="special_offers">Special Offers</option>
                    <option value="promotions">Promotions</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="isAvailable" className="block text-sm font-medium text-gray-700">Availability</label>
                  <select
                    name="isAvailable"
                    value={formData.isAvailable.toString()}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Available</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="offer" className="block text-sm font-medium text-gray-700">Special Offer</label>
                  <select
                    name="offer"
                    value={formData.offer.toString()}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="badge" className="block text-sm font-medium text-gray-700">Show Badge</label>
                  <select
                    name="badge"
                    value={formData.badge.toString()}
                    onChange={handleInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                  {["Fashion", "Electronics", "Sports", "Accessories", "Others"].map(
                    (tag) => (
                      <div className="flex items-center space-x-2" key={tag}>
                        <input
                          id={`edit-${tag.toLowerCase()}`}
                          type="checkbox"
                          value={tag}
                          checked={formData.tags.includes(tag)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prevData) => ({
                                ...prevData,
                                tags: [...prevData.tags, tag],
                              }));
                            } else {
                              setFormData((prevData) => ({
                                ...prevData,
                                tags: prevData.tags.filter((t) => t !== tag),
                              }));
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-${tag.toLowerCase()}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {tag}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Updating stock...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Inventory.propTypes = {
  token: PropTypes.string
};

export default Inventory;