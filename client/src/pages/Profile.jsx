import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { serverUrl } from "../../config";
import { addUser, removeUser, resetOrderCount, setOrderCount } from "../redux/especialtySlice";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import AddressSelector from "../components/AddressSelector";
import { 
  FaSignOutAlt, 
  FaUserCircle, 
  FaEdit, 
  FaHeart, 
  FaShoppingBag, 
  FaShoppingCart, 
  FaBoxOpen, 
  FaHistory, 
  FaSave, 
  FaTimes,
  FaPlus,
  FaMapMarkerAlt,
  FaTrash
} from "react-icons/fa";

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.eSpecialtyReducer.userInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Address management states
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    zipCode: "",
    country: "Vietnam",
    phone: "",
    isDefault: false,
  });
  // eslint-disable-next-line no-unused-vars
  const [addressData, setAddressData] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${serverUrl}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const userData = response.data.user;
        dispatch(addUser(userData));
        
        // Update form data
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || ""
        });

        // Update addresses
        setAddresses(userData.addresses || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
        toast.error(t("common.error"));
    } finally {
      setProfileLoading(false);
    }
  };

  // Function to fetch user orders
  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${serverUrl}/api/order/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const orders = response.data.orders;
        dispatch(setOrderCount(orders.length));
        setRecentOrders(orders.slice(0, 3));
        
        const stats = {
          total: orders.length,
          pending: orders.filter(order => ["pending", "confirmed", "shipped"].includes(order.status)).length,
          delivered: orders.filter(order => order.status === "delivered").length
        };
        
        setOrderStats(stats);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Address management functions
  const fetchUserAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${serverUrl}/api/user/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setAddresses(response.data.addresses);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsAddingAddress(true);
    try {
      const token = localStorage.getItem("token");
      const url = editingAddress 
        ? `${serverUrl}/api/user/addresses/${editingAddress._id}`
        : `${serverUrl}/api/user/addresses`;
      
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: addressForm,
      });

      if (response.data.success) {
        toast.success(editingAddress ? t("profile.update_address") : t("profile.add_address"));
        fetchUserAddresses();
        fetchUserProfile(); // Refresh profile data
        setShowAddressModal(false);
        setEditingAddress(null);
        resetAddressForm();
      } else {
        toast.error(response.data.message || (editingAddress ? t("profile.update_address") : t("profile.add_address")));
      }
    } catch (error) {
      console.error("Error with address:", error);
      toast.error(editingAddress ? t("profile.update_address") : t("profile.add_address"));
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm(t("profile.delete_address"))) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${serverUrl}/api/user/addresses/${addressId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success(t("profile.delete_address"));
        fetchUserAddresses();
        fetchUserProfile();
      } else {
        toast.error(response.data.message || t("profile.delete_address"));
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(t("profile.delete_address"));
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${serverUrl}/api/user/addresses/${addressId}/default`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(t("profile.set_as_default"));
        fetchUserAddresses();
        fetchUserProfile();
      } else {
        toast.error(response.data.message || t("profile.set_as_default"));
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error(t("profile.set_as_default"));
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "",
      street: "",
      ward: "",
      district: "",
      city: "",
      zipCode: "",
      country: "Vietnam",
      phone: "",
      isDefault: false,
    });
    setAddressData(null);
  };

const openAddressModal = (address = null) => {
  if (address) {
    setEditingAddress(address);
    const initialValues = {
      provinceName: address.city,
      districtName: address.district,
      wardName: address.ward,
    };
    setAddressForm({
      label: address.label || "",
      street: address.street || "",
      ward: address.ward || "",
      district: address.district || "",
      city: address.city || "",
      zipCode: address.zipCode || "",
      country: address.country || "Vietnam",
      phone: address.phone || "",
      isDefault: address.isDefault || false,
    });
    // Pass memoized initialValues to AddressSelector
    setInitialValues(initialValues);
  } else {
    setEditingAddress(null);
    resetAddressForm();
    setInitialValues(null);
  }
  setShowAddressModal(true);
};

// Add state for initialValues
const [initialValues, setInitialValues] = useState(null);

  const handleAddressChange = useCallback((data) => {
    setAddressData(data);
    setAddressForm((prev) => {
      // Only update if the values have changed
      if (
        prev.city !== data.provinceName ||
        prev.district !== data.districtName ||
        prev.ward !== data.wardName
      ) {
        return {
          ...prev,
          city: data.provinceName,
          district: data.districtName,
          ward: data.wardName,
        };
      }
      return prev; // Return previous state if no changes
    });
  }, []);

  // Check authentication
  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
    }
  }, [userInfo, navigate]);
  
  // Initialize data on component mount
  useEffect(() => {
    if (userInfo) {
      setFormData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        address: userInfo.address || ""
      });
      
      fetchUserProfile();
      fetchUserOrders();
      fetchUserAddresses();
    }
  }, [fetchUserAddresses]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(removeUser());
    dispatch(resetOrderCount());
    toast.success(t("profile.logout"));
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${serverUrl}/api/user/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        dispatch(addUser(response.data.user));
        
        setFormData({
          name: response.data.user.name || "",
          email: response.data.user.email || "",
          phone: response.data.user.phone || "",
          address: response.data.user.address || ""
        });
        
        toast.success(t("profile.update_profile"));
        fetchUserAddresses();
        setIsEditing(false);
      } else {
        toast.error(response.data.message || t("profile.update_profile"));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("profile.update_profile"));
    } finally {
      setSaveLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: userInfo.name || "",
      email: userInfo.email || "",
      phone: userInfo.phone || "",
      address: userInfo.address || ""
    });
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
                  <FaUserCircle className="text-4xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {t("profile.welcome_back")}, {userInfo.name}!
                  </h1>
                  <p className="text-gray-600">
                    {t("profile.manage_account")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSignOutAlt />
                {t("profile.logout")}
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Profile Information */}
            <div className="md:col-span-2 space-y-8">
              {/* Profile Info Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {t("profile.profile_information")}
                    {profileLoading && (
                      <span className="inline-block ml-2">
                        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      </span>
                    )}
                  </h2>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <FaEdit />
                      {t("profile.edit")}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <FaTimes />
                        {t("profile.cancel")}
                      </button>
                      <button 
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {t("profile.saving")}
                          </span>
                        ) : (
                          <>
                            <FaSave />
                            {t("profile.save")}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.full_name")}</label>
                        <input 
                          type="text" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder={t("profile.enter_name")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.email_address")}</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder={t("profile.enter_email")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.phone_number")}</label>
                        <input 
                          type="text" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder={t("profile.enter_phone")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.address")}</label>
                        <input 
                          type="text" 
                          name="address" 
                          value={formData.address} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder={t("profile.enter_address")}
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                      <p className="text-gray-900">{userInfo.name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                      <p className="text-gray-900">{userInfo.email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                      <p className="text-gray-900">{userInfo.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                      <p className="text-gray-900">{userInfo.address || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Account Type</p>
                      <p className="text-gray-900 capitalize">{userInfo.role || "User"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Member since</p>
                      <p className="text-gray-900">
                        {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : "8/4/2023"}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Address Management Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl shadow-sm p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Delivery Addresses</h2>
                  <button
                    onClick={() => openAddressModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="text-sm" />
                    Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FaMapMarkerAlt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
                    <p className="text-gray-500 mb-4">Add your first delivery address to get started</p>
                    <button
                      onClick={() => openAddressModal()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaPlus className="text-sm" />
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          address.isDefault 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{address.label}</h3>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openAddressModal(address)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit address"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete address"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          <p>{address.street}</p>
                          <p>{address.ward}, {address.district}</p>
                          <p>{address.city} {address.zipCode}</p>
                          <p>{address.country}</p>
                          {address.phone && <p>Phone: {address.phone}</p>}
                        </div>

                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Set as default
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Order History */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Orders
                    {ordersLoading && (
                      <span className="inline-block ml-2">
                        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      </span>
                    )}
                  </h2>
                  <Link 
                    to="/orders" 
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <FaHistory className="text-xs" />
                    View All Orders
                  </Link>
                </div>

                {recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <PriceFormat amount={order.amount} />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                    'bg-yellow-100 text-yellow-800'}`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaBoxOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders yet</p>
                    <Link 
                      to="/shop" 
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <FaShoppingBag className="text-xs" />
                      Start Shopping
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - Quick Actions */}
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-6 mb-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Account Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Items in Cart</span>
                    <span className="font-medium text-gray-900">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-medium text-gray-900">{orderStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending Orders</span>
                    <span className="font-medium text-gray-900">{orderStats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed Orders</span>
                    <span className="font-medium text-gray-900">{orderStats.delivered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Saved Addresses</span>
                    <span className="font-medium text-gray-900">{addresses.length}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/cart" className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaShoppingCart className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Shopping Cart</h4>
                        <p className="text-xs text-gray-500">2 items in cart</p>
                      </div>
                    </div>
                    <span className="text-blue-600">→</span>
                  </Link>

                  <Link to="/orders" className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FaBoxOpen className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">My Orders</h4>
                        <p className="text-xs text-gray-500">View order history</p>
                      </div>
                    </div>
                    <span className="text-green-600">→</span>
                  </Link>

                  <Link to="/wishlist" className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <FaHeart className="text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Wishlist</h4>
                        <p className="text-xs text-gray-500">Saved items</p>
                      </div>
                    </div>
                    <span className="text-red-600">→</span>
                  </Link>

                  <Link to="/shop" className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <FaShoppingBag className="text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Shop Now</h4>
                        <p className="text-xs text-gray-500">Browse products</p>
                      </div>
                    </div>
                    <span className="text-purple-600">→</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Label *
                </label>
                <div className="relative">
                  <select
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select address type</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Hometown">Hometown</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  placeholder="House number and street name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Vietnamese Address Selector */}
              <AddressSelector onAddressChange={handleAddressChange} 
                initialValues={initialValues} 
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={addressForm.zipCode}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      zipCode: e.target.value,
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isDefault"
                  className="ml-2 text-sm text-gray-700"
                >
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddress}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isAddingAddress ? 
                    (editingAddress ? 'Updating...' : 'Adding...') : 
                    (editingAddress ? 'Update Address' : 'Add Address')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;