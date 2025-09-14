import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import PremiumModal from "../components/PremiumModal";
import AddressSelector from "../components/AddressSelector";
import { addToCart, setOrderCount } from "../redux/especialtySlice";
import toast from "react-hot-toast";
import {
  FaShoppingBag,
  FaEye,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaShoppingCart,
} from "react-icons/fa";

const Order = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.eSpecialtyReducer.userInfo);
  const cartProducts = useSelector((state) => state.eSpecialtyReducer.products);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    order: null,
  });
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const fetchUserOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/order/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        // Update order count in Redux
        dispatch(setOrderCount(data.orders.length));
      } else {
        setError(data.message || t("orders.error_loading_orders"));
        toast.error(t("orders.error_loading_orders"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(t("orders.error_loading_orders"));
      toast.error(t("orders.error_loading_orders"));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
      return;
    }
    fetchUserOrders();
  }, [userInfo, navigate, fetchUserOrders]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = React.useMemo(() => {
    let sortableOrders = [...orders];
    if (sortConfig !== null) {
      sortableOrders.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  const openOrderModal = () => {
    // Show premium modal instead of order details
    setIsPremiumModalOpen(true);
  };

  const closeOrderModal = () => {
    setIsPremiumModalOpen(false);
  };

  const handleAddressChange = (addressData) => {
    setSelectedAddressData(addressData);
  };

  const handleAddOrderToCart = async (order, e) => {
    e.stopPropagation(); // Prevent modal from opening

    // Open confirmation modal
    setConfirmModal({
      isOpen: true,
      order: order,
    });
  };

  const confirmAddToCart = async () => {
    const order = confirmModal.order;

    try {
      let addedCount = 0;
      let updatedCount = 0;

      // Add each item to cart
      order.items.forEach((item) => {
        const existingCartItem = cartProducts.find(
          (cartItem) => cartItem._id === (item.productId || item._id)
        );

        const cartItem = {
          _id: item.productId || item._id, // Handle both productId and _id
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          // Add additional fields that might be needed for cart functionality
          description: item.description,
          category: item.category,
          brand: item.brand,
        };

        if (existingCartItem) {
          updatedCount++;
        } else {
          addedCount++;
        }

        dispatch(addToCart(cartItem));
      });

      // Create more descriptive success message
      let message = "";
      if (addedCount > 0 && updatedCount > 0) {
        message = `${addedCount} ${addedCount !== 1 ? t("orders.new_items_added_plural") : t("orders.new_items_added")} ${t("orders.items_added_updated")} ${updatedCount} ${updatedCount !== 1 ? t("orders.existing_items_updated_plural") : t("orders.existing_items_updated")} ${t("orders.updated_in_cart")}`;
      } else if (addedCount > 0) {
        message = `${addedCount} ${addedCount !== 1 ? t("orders.new_items_added_plural") : t("orders.new_items_added")} ${t("orders.items_added_to_cart")}`;
      } else {
        message = `${updatedCount} ${updatedCount !== 1 ? t("orders.existing_items_updated_plural") : t("orders.existing_items_updated")} ${t("orders.items_updated_in_cart")}`;
      }

      toast.success(message, {
        duration: 4000,
        icon: "🛒",
      });

      // Show additional toast with option to view cart
      setTimeout(() => {
          toast(
            (toastInstance) => (
              <div className="flex items-center gap-3">
                <span>{t("orders.view_updated_cart")}</span>
                <button
                  onClick={() => {
                    navigate("/cart");
                    toast.dismiss(toastInstance.id);
                  }}
                  className="bg-gray-900 text-white px-3 py-1 rounded text-sm hover:bg-gray-800"
                >
                  {t("orders.view_cart_button")}
                </button>
                <button
                  onClick={() => toast.dismiss(toastInstance.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            ),
          {
            duration: 6000,
            icon: "👀",
          }
        );
      }, 1000);

      setConfirmModal({ isOpen: false, order: null });
    } catch (error) {
      console.error("Error adding items to cart:", error);
      toast.error(t("orders.failed_add_to_cart"));
      setConfirmModal({ isOpen: false, order: null });
    }
  };

  const cancelAddToCart = () => {
    setConfirmModal({ isOpen: false, order: null });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="w-4 h-4" />;
      case "confirmed":
        return <FaCheckCircle className="w-4 h-4" />;
      case "shipped":
        return <FaTruck className="w-4 h-4" />;
      case "delivered":
        return <FaBox className="w-4 h-4" />;
      case "cancelled":
        return <FaTimes className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t("orders.loading_orders")}</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaTimes className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("orders.error_loading_orders")}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUserOrders}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              {t("orders.try_again")}
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <Container className="py-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaShoppingBag className="w-8 h-8" />
              {t("orders.my_orders")}
            </h1>
            <nav className="flex text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 transition-colors">
                {t("orders.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{t("orders.orders")}</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {orders.length === 0 ? (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <FaShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t("orders.no_orders_yet")}
              </h2>
              <p className="text-gray-600 mb-8">
                {t("orders.no_orders_message")}
              </p>
              <Link to="/shop">
                <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                  {t("orders.start_shopping")}
                </button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {orders.length} {orders.length !== 1 ? t("orders.orders_found_multiple") : t("orders.orders_found_single")}
              </p>
              <button
                onClick={fetchUserOrders}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {t("orders.refresh_button")}
              </button>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("_id")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          {t("orders.order_id_header")}
                          {sortConfig.key === "_id" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("date")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          {t("orders.date_header")}
                          {sortConfig.key === "date" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("orders.items_header")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("amount")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          {t("orders.total_header")}
                          {sortConfig.key === "amount" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          {t("orders.status_header")}
                          {sortConfig.key === "status" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("orders.payment_header")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("orders.actions_header")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOrders.map((order) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openOrderModal(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(order.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex -space-x-2 mr-3">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div
                                  key={index}
                                  className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white overflow-hidden"
                                >
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                                  <span className="text-xs text-gray-600">
                                    +{order.items.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm text-gray-900">
                                {order.items.length} {order.items.length !== 1 ? t("orders.items_count") : t("orders.item_count")}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {order.items[0]?.name}
                                {order.items.length > 1 &&
                                  `, +${order.items.length - 1} ${t("orders.more_items")}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            <PriceFormat amount={order.amount} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                              order.paymentStatus
                            )}`}
                          >
                            {order.paymentMethod === "cod" ? (
                              <FaMoneyBillWave className="w-3 h-3" />
                            ) : (
                              <FaCreditCard className="w-3 h-3" />
                            )}
                            {order.paymentStatus.charAt(0).toUpperCase() +
                              order.paymentStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openOrderModal(order);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title={t("orders.view_details_tooltip")}
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleAddOrderToCart(order, e)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title={t("orders.add_to_cart_tooltip")}
                            >
                              <FaShoppingCart className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/checkout/${order._id}`}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title={t("orders.order_details_tooltip")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaShoppingBag className="w-4 h-4" />
                            </Link>
                            {order.paymentStatus === "pending" && (
                              <Link
                                to={`/checkout/${order._id}`}
                                className="text-orange-600 hover:text-orange-900 transition-colors"
                                title={t("orders.pay_now_tooltip")}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaCreditCard className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Premium Modal with Address Selector */}
        <PremiumModal
          isOpen={isPremiumModalOpen}
          onClose={closeOrderModal}
          title={t("orders.address_modal_title")}
          description={showAddressSelector ? "" : t("orders.address_modal_desc")}
          customContent={
            <div className="mt-4">
              <button 
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                {showAddressSelector ? t("orders.hide_address_selector") : t("orders.add_new_address")}
              </button>
              
              {showAddressSelector && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                  <h3 className="text-lg font-medium mb-4">{t("orders.address_info_title")}</h3>
                  
                  <div className="space-y-4 mb-4">
                    <div>
                      <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("orders.contact_name_label")}
                      </label>
                      <input
                        type="text"
                        id="fullname"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("orders.contact_name_placeholder")}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("orders.phone_label")}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("orders.phone_placeholder")}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("orders.address_label")}
                      </label>
                      <input
                        type="text"
                        id="address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("orders.address_placeholder")}
                      />
                    </div>
                    
                    <AddressSelector onAddressChange={handleAddressChange} />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddressSelector(false)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {t("orders.cancel_address")}
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {t("orders.save_address")}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Display saved addresses here */}
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                  <div className="flex justify-between">
                    <div className="font-medium">{t("orders.home_address")}</div>
                    <div className="text-blue-600">{t("orders.default_address")}</div>
                  </div>
                  <div className="text-gray-600 mt-1">Nguyễn Văn A</div>
                  <div className="text-gray-600">0987654321</div>
                  <div className="text-gray-600 mt-1">123 Đường ABC, Phường XYZ, Quận 1, TP HCM</div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                  <div className="flex justify-between">
                    <div className="font-medium">{t("orders.company_address")}</div>
                    <div></div>
                  </div>
                  <div className="text-gray-600 mt-1">Nguyễn Văn A</div>
                  <div className="text-gray-600">0987654321</div>
                  <div className="text-gray-600 mt-1">456 Đường DEF, Phường UVW, Quận 2, TP HCM</div>
                </div>
              </div>
            </div>
          }
        />

        {/* Add to Cart Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && confirmModal.order && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={cancelAddToCart}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                    <FaShoppingCart className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("orders.order_to_cart_title")}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {t("orders.order_to_cart_desc")}{" "}
                    <span className="font-semibold">
                      #{confirmModal.order._id.slice(-8).toUpperCase()}
                    </span>{" "}
                    {t("orders.order_to_cart_desc2")}{" "}
                    {confirmModal.order.items.length} {confirmModal.order.items.length !== 1 ? t("orders.items_count") : t("orders.item_count")} {t("orders.order_to_cart_desc3")}
                  </p>

                  {/* Order Items Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-6 max-h-40 overflow-y-auto">
                    <div className="text-xs text-gray-500 mb-2 flex justify-between font-medium">
                      <span>{t("orders.items_to_add_label")}</span>
                      <span>{t("orders.qty_price_label")}</span>
                    </div>
                    {confirmModal.order.items.map((item, index) => {
                      const isInCart = cartProducts.find(
                        (cartItem) =>
                          cartItem._id === (item.productId || item._id)
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm py-1 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded mr-2 flex-shrink-0"
                              />
                            )}
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-gray-700 truncate">
                                {item.name}
                              </span>
                              {isInCart && (
                                <span className="text-xs text-blue-600">
                                  {t("orders.already_in_cart_label")} {isInCart.quantity}{t("orders.will_be_updated_label")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-500 ml-2 flex items-center gap-2">
                            <span className="text-xs">x{item.quantity}</span>
                            <span className="text-xs">×</span>
                            <PriceFormat amount={item.price} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 mt-2 border-t border-gray-300">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{t("orders.total_value_label")}</span>
                        <PriceFormat amount={confirmModal.order.amount} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={cancelAddToCart}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {t("orders.cancel_modal")}
                    </button>
                    <button
                      onClick={confirmAddToCart}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaShoppingCart className="w-4 h-4" />
                      {t("orders.add_to_cart_modal")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Order;
