import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Title from "../components/ui/title";
import SkeletonLoader from "../components/SkeletonLoader";
import PriceFormat from "../components/PriceFormat";
import { formatVND } from "../utils/currency";
import { serverUrl } from "../../config";
import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaShoppingBag,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaTimes,
  FaSort,
  FaSync,
  FaEye,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBoxOpen,
  FaReceipt,
  FaInfoCircle,
  FaUndo,
} from "react-icons/fa";

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const statusOptions = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const paymentStatusOptions = ["pending", "paid", "failed"];

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/order/admin/all-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message || t("orders.messages.fetchError"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(t("orders.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  };
  // Helper function để dịch status
  const translateStatus = (status) => {
    return t(`orders.status.${status}`, { defaultValue: status });
  };

  const translatePaymentStatus = (status) => {
    return t(`orders.paymentStatus.${status}`, { defaultValue: status });
  };
  // Update order status
  const updateOrderStatus = async (orderId, status, paymentStatus = null) => {
    try {
      const token = localStorage.getItem("token");
      const updateData = { status };

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      const response = await fetch(`${serverUrl}/api/order/admin/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t("orders.messages.updateSuccess"));
        fetchOrders(); // Refresh orders
        setShowEditModal(false);
        setEditingOrder(null);
        // Update selected order if it's currently being viewed
        if (selectedOrder && selectedOrder.id === orderId) {
          const updatedOrder = { ...selectedOrder, status };
          if (paymentStatus) {
            updatedOrder.paymentStatus = paymentStatus;
          }
          setSelectedOrder(updatedOrder);
        }
      } else {
        toast.error(data.message || t("orders.messages.updateError"));
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(t("orders.messages.updateError"));
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    if (!window.confirm(t("orders.messages.confirmDelete"))) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/order/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t("orders.messages.deleteSuccess"));
        fetchOrders(); // Refresh orders
        // Close detail modal if deleted order is currently being viewed
        if (selectedOrder && selectedOrder.id === orderId) {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }
      } else {
        toast.error(data.message || t("orders.messages.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(t("orders.messages.deleteError"));
    }
  };

  // Refund PayPal payment
  const refundPayPalOrder = async (order) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hoàn tiền cho đơn hàng #${order.id}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/payment/paypal/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: "Order cancelled by admin",
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Hoàn tiền thành công! Refund ID: ${data.refundId}`);
        fetchOrders(); // Refresh orders
        // Close detail modal if refunded order is currently being viewed
        if (selectedOrder && selectedOrder.id === order.id) {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }
      } else {
        toast.error(data.message || "Hoàn tiền thất bại");
      }
    } catch (error) {
      console.error("Error refunding PayPal payment:", error);
      toast.error("Hoàn tiền thất bại");
    }
  };

  // Handle view order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Handle edit order
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setShowEditModal(true);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (editingOrder) {
      updateOrderStatus(editingOrder.id, newStatus, newPaymentStatus);
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination calculations
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, sortBy, sortOrder]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Get page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Get status color
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

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="w-3 h-3" />;
      case "confirmed":
        return <FaCheckCircle className="w-3 h-3" />;
      case "shipped":
        return <FaTruck className="w-3 h-3" />;
      case "delivered":
        return <FaBox className="w-3 h-3" />;
      case "cancelled":
        return <FaTimes className="w-3 h-3" />;
      default:
        return <FaClock className="w-3 h-3" />;
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return "N/A";
    const parts = [
      address.street,
      address.ward,
      address.district,
      address.city,
      address.country
    ].filter(Boolean);
    return parts.join(", ");
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div>
        <Title>{t("orders.orders.title")}</Title>
        <div className="mt-6">
          <SkeletonLoader type="orders" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Title>{t("orders.title")}</Title>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          title={t("orders.refresh")}
        >
          <FaSync className="w-4 h-4" />
          {t("orders.refresh")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                {t("orders.stats.totalOrders")}
              </p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {orders.length}
              </p>
            </div>
            <FaShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                {t("orders.stats.pending")}
              </p>
              <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
            <FaClock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
          </div>
        </div>


        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                {t("orders.stats.delivered")}
              </p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">
                {orders.filter((o) => o.status === "delivered").length}
              </p>
            </div>
            <FaBox className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                {t("orders.stats.revenue")}
              </p>
              <p className="text-xl lg:text-2xl font-bold text-purple-600">
                <PriceFormat
                  amount={orders.reduce((sum, order) => sum + ((order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0))), 0)}
                />
              </p>
            </div>
            <FaCreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("orders.filters.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">{t("orders.filters.allStatus")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {translateStatus(status)}
              </option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">{t("orders.filters.allPayments")}</option>
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {translatePaymentStatus(status)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="date">{t("orders.filters.sortByDate")}</option>
              <option value="amount">{t("orders.filters.sortByAmount")}</option>
              <option value="status">{t("orders.filters.sortByStatus")}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              <FaSort className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders per page selector */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t("orders.filters.show")}:</span>
            <select
              value={ordersPerPage}
              onChange={(e) => {
                setOrdersPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">{t("orders.filters.ordersPerPage")}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {t("orders.filters.showing", {
                from: totalOrders > 0 ? startIndex + 1 : 0,
                to: Math.min(endIndex, totalOrders),
                total: totalOrders
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.orderId")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.customer")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.date")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.items")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.amount")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.payment")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("orders.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewOrderDetails(order)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <FaUser className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.length} items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <PriceFormat amount={(Number(order.amount) + (Number(order.shippingFee) || 0))} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrderDetails(order);
                        }}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded"
                        title={t("orders.buttons.view")}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title={t("orders.buttons.edit")}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      {/* Refund button - only show for paid PayPal orders */}
                      {order.paymentMethod === "paypal" && 
                       order.paymentStatus === "paid" && 
                       order.status !== "cancelled" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refundPayPalOrder(order);
                          }}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded"
                          title="Hoàn tiền PayPal"
                        >
                          <FaUndo className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOrder(order.id);
                        }}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title={t("orders.buttons.delete")}
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Try adjusting your filters"
                : "No orders have been placed yet"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination - Desktop */}
      {totalOrders > 0 && (
        <div className="hidden lg:flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-3 mt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalOrders)} of {totalOrders} results
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {getPageNumbers().map((pageNumber, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNumber === 'number' && goToPage(pageNumber)}
                  disabled={pageNumber === '...'}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pageNumber === currentPage
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : pageNumber === '...'
                      ? 'text-gray-400 cursor-default'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Orders Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Try adjusting your filters"
                : "No orders have been placed yet"}
            </p>
          </div>
        ) : (
          <>
            {currentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewOrderDetails(order)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <FaUser className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.userId?.name || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOrderDetails(order);
                      }}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50"
                      title="View Details"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOrder(order);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                      title="Edit Order"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOrder(order.id);
                      }}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                      title="Delete Order"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Customer Email</div>
                  <div className="text-sm font-medium text-gray-900">
                    {order.userId?.email || "N/A"}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date</div>
                    <div className="flex items-center text-sm text-gray-900">
                      <FaCalendarAlt className="w-3 h-3 mr-1 text-gray-400" />
                      {new Date(order.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Items</div>
                    <div className="text-sm text-gray-900">
                      {order.items.length} items
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Amount</div>
                  <div className="text-lg font-bold text-gray-900">
                    <PriceFormat amount={(order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0))} />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
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
                </div>

                {/* Payment Method */}
                <div className="text-xs text-gray-500">
                  Payment Method: {order.paymentMethod?.toUpperCase() || "N/A"}
                </div>
              </div>
            ))}

            {/* Pagination - Mobile */}
            {totalOrders > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-sm text-gray-500">
                    {totalOrders} total orders
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {getPageNumbers().slice(0, 5).map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNumber === 'number' && goToPage(pageNumber)}
                        disabled={pageNumber === '...'}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pageNumber === currentPage
                          ? 'text-blue-600 bg-blue-50 border border-blue-200'
                          : pageNumber === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 mx-auto border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaReceipt className="w-5 h-5 text-blue-600" />
                Order Details - #{selectedOrder.id.slice(-8).toUpperCase()}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditOrder(selectedOrder)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaEdit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Order Status & Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaInfoCircle className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Order Status</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          selectedOrder.paymentStatus
                        )}`}
                      >
                        {selectedOrder.paymentMethod === "cod" ? (
                          <FaMoneyBillWave className="w-3 h-3" />
                        ) : (
                          <FaCreditCard className="w-3 h-3" />
                        )}
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Method:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOrder.paymentMethod?.toUpperCase() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaUser className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Customer</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedOrder.user?.name  || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaEnvelope className="w-3 h-3" />
                      {selectedOrder.user?.email || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPhone className="w-3 h-3" />
                      {selectedOrder.shippingAddress?.phone || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCreditCard className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Payment Info</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium text-gray-900">
                        <PriceFormat amount={Number(selectedOrder.amount)} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="text-sm font-medium text-gray-900">
                        <PriceFormat amount={Number(selectedOrder.shippingFee) || 0} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-sm font-bold text-gray-900">
                        <PriceFormat amount={(Number(selectedOrder.amount) + (Number(selectedOrder.shippingFee) || 0))} />
                      </span>
                    </div>
                    {selectedOrder.originalAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Original (VND):</span>
                        <span className="text-sm text-gray-900">
                          {formatVND(selectedOrder.originalAmount)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.paypalOrderId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">PayPal ID:</span>
                        <span className="text-xs text-gray-900 font-mono">
                          {selectedOrder.paypalOrderId}
                        </span>
                      </div>
                    )}
                    {selectedOrder.paypalCaptureId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Capture ID:</span>
                        <span className="text-xs text-gray-900 font-mono">
                          {selectedOrder.paypalCaptureId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <FaMapMarkerAlt className="w-5 h-5 text-red-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Shipping Address</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Full Name</p>
                      <p className="text-sm text-gray-600">
                        {`${selectedOrder.user?.name}`.trim() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress?.phone || "N/A"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
                      <p className="text-sm text-gray-600">
                        {formatAddress(selectedOrder.shippingAddress)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Zipcode</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress?.zipCode || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FaBoxOpen className="w-5 h-5 text-orange-600" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Order Items ({selectedOrder.items.length})
                  </h4>
                </div>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id || index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item?.name}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                            {item.name}
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Price: </span>
                              <span className="font-medium text-gray-900">
                                <PriceFormat amount={Number(item.price)} />
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity: </span>
                              <span className="font-medium text-gray-900">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total: </span>
                              <span className="font-medium text-gray-900">
                                <PriceFormat amount={item.price * item.quantity} />
                              </span>
                            </div>
                          </div>
                          {item.productId && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">
                                Product ID: {item.productId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Total */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Order Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      <PriceFormat amount={((Number(selectedOrder.amount) + Number(selectedOrder.shippingFee) || 0))} />
                    </span>
                  </div>
                  {selectedOrder.originalAmount && selectedOrder.originalAmount !== selectedOrder.amount && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">Original Amount (VND):</span>
                      <span className="text-gray-900">
                        {formatVND(Number(selectedOrder.amount) + Number(selectedOrder.shippingFee))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                Last updated: {new Date(selectedOrder.updatedAt).toLocaleString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEditOrder(selectedOrder)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Order
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Order
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Order #{editingOrder.id.slice(-8).toUpperCase()}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;