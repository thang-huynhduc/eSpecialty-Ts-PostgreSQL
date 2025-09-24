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
import { MdOutlineInventory, MdLowPriority } from "react-icons/md";
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Inventory = () => {
  const { t } = useTranslation();
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

  const API_TOKEN = localStorage.getItem('token');

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
        toast.success(t('inventory.messages.stockUpdated'));
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(t('inventory.messages.errorUpdating'));
    }
    setLoading(false);
  }, [bulkUpdateItems, API_TOKEN, fetchInventoryStats, fetchLowStockItems, fetchOutOfStockItems, t]);

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

  useEffect(() => {
    fetchInventoryStats();
    fetchLowStockItems();
    fetchOutOfStockItems();
    fetchStockMovements();
    fetchInventoryValuation();
  }, [fetchInventoryStats, fetchLowStockItems, fetchOutOfStockItems, fetchStockMovements, fetchInventoryValuation, stockThreshold]);

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

  const StockEditRow = ({ item, isEditing, onEdit, onSave, onCancel }) => (
    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-500 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        {item.image && (
          <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
        )}
        <div>
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.category}</p>
          <p className="text-sm text-gray-500">{item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
          <p className='text-green-600'> {t('inventory.product.sold')}: {item.soldQuantity}</p>
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
              <FaSave /> {t('inventory.buttons.save')}
            </button>
            <button
              onClick={() => onCancel(item)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTimes /> {t('inventory.buttons.cancel')}
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
              {t('inventory.buttons.restock')}
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
    onCancel: PropTypes.func.isRequired
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('inventory.title')}
        </h1>
        <p className="text-gray-600">
          {t('inventory.subtitle')}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <TabButton
          id="overview"
          label={t('inventory.tabs.overview')}
          icon={<MdOutlineInventory />}
          active={activeTab === 'overview'}
          onClick={setActiveTab}
        />
        <TabButton
          id="low-stock"
          label={t('inventory.tabs.low-stock')}
          icon={<FaExclamationTriangle />}
          active={activeTab === 'low-stock'}
          onClick={setActiveTab}
        />
        <TabButton
          id="out-of-stock"
          label={t('inventory.tabs.out-of-stock')}
          icon={<MdLowPriority />}
          active={activeTab === 'out-of-stock'}
          onClick={setActiveTab}
        />
        <TabButton
          id="movements"
          label={t('inventory.tabs.movements')}
          icon={<FaHistory />}
          active={activeTab === 'movements'}
          onClick={setActiveTab}
        />
        <TabButton
          id="valuation"
          label={t('inventory.tabs.valuation')}
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
              title={t('inventory.stats.totalProducts')}
              value={inventoryStats.totalProducts}
              icon={<FaBoxes />}
              color="blue"
            />
            <StatCard
              title={t('inventory.stats.lowStockProducts')}
              value={inventoryStats.lowStockProducts}
              icon={<FaExclamationTriangle />}
              color="yellow"
            />
            <StatCard
              title={t('inventory.stats.outOfStockProducts')}
              value={inventoryStats.outOfStockProducts}
              icon={<MdLowPriority />}
              color="red"
            />
            <StatCard
              title={t('inventory.stats.inStockProducts')}
              value={inventoryStats.inStockProducts}
              icon={<FaCheckCircle />}
              color="green"
            />
          </div>

          {/* Value Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('inventory.stats.inventoryValue')}</h3>
              <div className="text-3xl font-bold text-green-600">
                {inventoryStats.totalValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
              </div>
              <p className="text-gray-600 text-sm mt-2">{t('inventory.stats.totalInventoryValue')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('inventory.stats.totalSold')}</h3>
              <div className="text-3xl font-bold text-blue-600">
                {inventoryStats.totalSold?.toLocaleString()}
              </div>
              <p className="text-gray-600 text-sm mt-2">{t('inventory.stats.totalUnitsSold')}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('inventory.quickActions.title')}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('low-stock')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                >
                  <FaBell className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">{t('inventory.quickActions.checkAlerts')}</p>
                </button>
                <button
                  // onClick={exportInventoryReport}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <FaDownload className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">{t('inventory.quickActions.exportReport')}</p>
                </button>
                <button
                  onClick={() => setActiveTab('movements')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FaHistory className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">{t('inventory.quickActions.viewHistory')}</p>
                </button>
                <button
                  onClick={() => setActiveTab('valuation')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <FaChartBar className="text-2xl text-gray-400 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-600">{t('inventory.quickActions.valuationReport')}</p>
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
                <label className="text-sm font-medium text-gray-700">{t('inventory.lowStock.threshold')}</label>
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
                  placeholder={t('inventory.lowStock.search')}
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
                {t('inventory.lowStock.saveChanges')} ({bulkUpdateItems.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('inventory.lowStock.title')} ({filteredLowStock.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              {filteredLowStock.length === 0 ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">{t('inventory.lowStock.noItems')}</p>
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
                placeholder={t('inventory.outOfStock.search')}
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
                {t('inventory.lowStock.saveChanges')} ({bulkUpdateItems.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MdLowPriority className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('inventory.outOfStock.title')} ({filteredOutOfStock.length})
                </h3>
              </div>
            </div>
            <div className="p-6">
              {filteredOutOfStock.length === 0 ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-4xl text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600">{t('inventory.outOfStock.noItems')}</p>
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
                {t('inventory.movements.title')}
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
                      {t('inventory.movements.lastUpdated')} {new Date(movement.lastUpdated).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">{t('inventory.movements.stock')}</p>
                    <div className="text-xl font-bold text-gray-900">{movement.currentStock}</div>
                    <p className="text-sm text-blue-600">{t('inventory.movements.sold')} {movement.soldQuantity}</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('inventory.valuation.totalValuation')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('inventory.valuation.inventoryValue')}</span>
                  <span className="font-semibold text-green-600">
                    {inventoryValuation.totalInventoryValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('inventory.valuation.salesValue')}</span>
                  <span className="font-semibold text-blue-600">
                    {inventoryValuation.totalSoldValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-900 font-medium">{t('inventory.valuation.totalProducts')}</span>
                  <span className="font-semibold">{inventoryValuation.totalProducts}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('inventory.valuation.topCategories')}</h3>
              <div className="space-y-3">
                {inventoryValuation.categoryBreakdown?.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <p className="text-sm text-gray-600">{category.totalProducts} {t('inventory.valuation.products')}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {category.inventoryValue?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </span>
                      <p className="text-sm text-gray-600">{category.totalStock} {t('inventory.valuation.units')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('inventory.valuation.categoryAnalysis')}</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('inventory.valuation.category')}</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">{t('inventory.valuation.productsCount')}</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">{t('inventory.valuation.totalStock')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">{t('inventory.valuation.inventoryValueCol')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">{t('inventory.valuation.salesValueCol')}</th>
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">{t('inventory.messages.updatingStock')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;