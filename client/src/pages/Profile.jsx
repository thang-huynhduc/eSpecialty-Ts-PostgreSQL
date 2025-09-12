import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { addUser, removeUser, resetOrderCount, setOrderCount } from "../redux/especialtySlice";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
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
  FaTimes 
} from "react-icons/fa";

const Profile = () => {
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
          // Update Redux store with fresh data
          dispatch(addUser(userData));
        
        // Update form data
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || ""
        });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
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
        
        // Update order count in Redux
        dispatch(setOrderCount(orders.length));
        
        // Get recent orders (last 3)
        setRecentOrders(orders.slice(0, 3));
        
        // Calculate order stats
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

  // Check authentication
  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
    }
  }, [userInfo, navigate]);
  
  // Initialize data on component mount
  useEffect(() => {
    if (userInfo) {
      // Initialize form data with user info from Redux
      setFormData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        address: userInfo.address || ""
      });
      
      // Initial data fetch
      fetchUserProfile();
      fetchUserOrders();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(removeUser());
    dispatch(resetOrderCount());
    toast.success("Logged out successfully");
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
        // Update the Redux store with the updated user data
        dispatch(addUser(response.data.user));
        
        // Update form data with the returned user data
        setFormData({
          name: response.data.user.name || "",
          email: response.data.user.email || "",
          phone: response.data.user.phone || "",
          address: response.data.user.address || ""
        });
        
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset form data to current user info
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
                    Welcome back, {userInfo.name}!
                  </h1>
                  <p className="text-gray-600">
                    Manage your account and preferences
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Profile Information */}
            <div className="md:col-span-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-8 mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Profile Information
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
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <FaTimes />
                        Cancel
                      </button>
                      <button 
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </span>
                        ) : (
                          <>
                            <FaSave />
                            Save
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input 
                          type="text" 
                          name="address" 
                          value={formData.address} 
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Enter your address"
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
    </div>
  );
};

export default Profile;
