import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import { setOrderCount } from "../redux/especialtySlice";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FaShoppingBag,
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
  FaExclamationTriangle,
  FaSyncAlt
} from "react-icons/fa";
const API_URL = import.meta.env.VITE_BACKEND_URL;

const Order = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.eSpecialtyReducer.userInfo);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    order: null,
  });
  const [cancelling, setCancelling] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const fetchUserOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/order/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        dispatch(setOrderCount(data.orders.length));
      } else {
        setError(data.message || "Lỗi khi tải danh sách đơn hàng");
        toast.error("Lỗi khi tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Lỗi khi tải danh sách đơn hàng");
      toast.error("Lỗi khi tải danh sách đơn hàng");
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

  // 1. Xử lý click vào hàng để chuyển đến checkout
  const handleRowClick = (orderId) => {
    navigate(`/checkout/${orderId}`);
  };

  // 2. Xử lý hủy đơn hàng - chỉ cho phép khi status = "pending"
  const handleCancelOrder = (order, e) => {
    e.stopPropagation();
    setCancelModal({
      isOpen: true,
      order: order,
    });
  };

  const confirmCancelOrder = async () => {
    const order = cancelModal.order;
    if (!order) return;

    try {
      setCancelling(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/order/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order._id,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Đơn hàng đã được hủy thành công");
        // Cập nhật state local
        setOrders(orders.map(o =>
          o._id === order._id
            ? { ...o, status: "cancelled", paymentStatus: data.order.paymentStatus, updatedAt: data.order.updatedAt }
            : o
        ));
      } else {
        toast.error(data.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Không thể hủy đơn hàng");
    } finally {
      setCancelling(false);
      setCancelModal({ isOpen: false, order: null });
    }
  };

  const cancelCancelOrder = () => {
    setCancelModal({ isOpen: false, order: null });
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

  const getStatusLabel = (status) => {
    return t(`order.${status}`, status);
  };
  const getPaymentStatusLabel = (status) => {
    return t(`order.${status}`, status);
  };
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
      case "refunded":
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
            <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
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
              Lỗi khi tải danh sách đơn hàng
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUserOrders}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Thử lại
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
                {orders.length} {t("orders.order_found")}
              </p>
              <button
                onClick={fetchUserOrders}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                <FaSyncAlt className="w-4 h-4" /> {t("orders.refresh")}
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
                          {t("orders.order_id")}
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
                          {t("orders.date")}
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
                        {t("orders.items")}
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
                        onClick={() => handleRowClick(order._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(order.date).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleTimeString("vi-VN", {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
                                {order.items.length} {t("orders.items")}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {order.items[0]?.name}
                                {order.items.length > 1 &&
                                  `, +${order.items.length - 1} ${t("orders.others")}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            <PriceFormat amount={order.amount + order.shippingFee} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
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
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {/* Chỉ hiển thị nút hủy khi trạng thái là pending */}
                            {order.status === "pending" && (
                              <button
                                onClick={(e) => handleCancelOrder(order, e)}
                                className="text-red-600 hover:text-red-900 transition-colors flex flex-row gap-2 justify-center items-center"
                                title="Hủy đơn hàng"
                              >
                                <FaTimes className="w-4 h-4" /> {t("orders.cancel")}
                              </button>
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

        {/* Cancel Order Confirmation Modal */}
        <AnimatePresence>
          {cancelModal.isOpen && cancelModal.order && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={cancelCancelOrder}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Xác nhận hủy đơn hàng
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Bạn có chắc chắn muốn hủy đơn hàng{" "}
                    <span className="font-semibold">
                      #{cancelModal.order._id.slice(-8).toUpperCase()}
                    </span>?
                    <br />
                    Hành động này không thể hoàn tác.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={cancelCancelOrder}
                      disabled={cancelling}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Không hủy
                    </button>
                    <button
                      onClick={confirmCancelOrder}
                      disabled={cancelling}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {cancelling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang hủy...
                        </>
                      ) : (
                        <>
                          <FaTimes className="w-4 h-4" />
                          Hủy đơn hàng
                        </>
                      )}
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