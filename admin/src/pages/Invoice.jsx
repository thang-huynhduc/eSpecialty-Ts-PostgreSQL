import { useState, useEffect } from 'react';
import { FaSync , FaFileInvoice, FaDownload, FaPrint, FaShare, FaTimes, FaCheck, FaClock, FaTruck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SkeletonLoader from '../components/SkeletonLoader';
import SmallLoader from '../components/SmallLoader';
import { serverUrl } from "../../config";
import {useTranslation} from "react-i18next";
const Invoice = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/order/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        
        switch (timeFilter) {
          case 'today':
            return orderDate >= today;
          case 'week':
            { const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo; }
          case 'month':
            { const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo; }
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
    // Clear selected orders if they're not in filtered results
    setSelectedOrders(prev => prev.filter(id => 
      filtered.some(order => order._id === id)
    ));
  }, [orders, statusFilter, timeFilter, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      delivered: { icon: FaCheck, color: 'text-green-600 bg-green-50', text: 'Đã giao' },
      pending: { icon: FaClock, color: 'text-yellow-600 bg-yellow-50', text: 'Chờ xử lý' },
      confirmed: { icon: FaTruck, color: 'text-blue-600 bg-blue-50', text: 'Đã xác nhận' },
      shipped: { icon: FaTruck, color: 'text-purple-600 bg-purple-50', text: 'Đang giao' },
      cancelled: { icon: FaTimes, color: 'text-red-600 bg-red-50', text: 'Đã hủy' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={10} />
        {/* {config.text} */}
        {status.charAt(0).toUpperCase() +
          status.slice(1)}
      </span>
    );
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTimeFilter('all');
    setSearchTerm('');
  };

  const generateInvoice = () => {
    const selectedOrdersData = filteredOrders.filter(order => 
      selectedOrders.includes(order._id)
    );
    
    if (selectedOrdersData.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một đơn hàng để tạo hóa đơn');
      return;
    }

    // Create invoice data
    const invoice = {
      id: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString('vi-VN'),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
      orders: selectedOrdersData,
      customer: selectedOrdersData[0].address,
      totalItems: selectedOrdersData.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
      totalAmount: selectedOrdersData.reduce((sum, order) => sum + ((order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0))), 0)
    };

    setInvoiceData(invoice);
    setShowInvoicePopup(true);
  };

  const generatePDF = async () => {
    if (!invoiceData) return;

    try {
      setGeneratingPdf(true);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 15;
      const marginRight = 15;
      let y = 20;

      // ===== COMPANY HEADER =====
      doc.setFont("helvetica", "bold").setFontSize(20);
      doc.text("eSpecialty VIETNAM", marginLeft, y);

      doc.setFontSize(10).setFont(undefined, "normal");
      doc.text("123 Nguyen Hue Street, Ho Chi Minh City", marginLeft, y + 7);
      doc.text("Phone: +84 28 1234 5678 | Email: info@especialty.vn", marginLeft, y + 12);

      // Invoice info
      doc.setFontSize(18).setFont(undefined, "bold");
      doc.text("INVOICE", pageWidth - marginRight - 60, y);

      doc.setFontSize(10).setFont(undefined, "normal");
      doc.text(`Invoice No: ${invoiceData.id}`, pageWidth - marginRight - 60, y + 8);
      doc.text(`Date: ${invoiceData.date}`, pageWidth - marginRight - 60, y + 14);
      doc.text(`Due Date: ${invoiceData.dueDate}`, pageWidth - marginRight - 60, y + 20);

      // Divider
      y += 25;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;

      // ===== CUSTOMER INFORMATION =====
      doc.setFontSize(12).setFont(undefined, "bold");
      doc.text("CUSTOMER INFORMATION", marginLeft, y);

      y += 7;
      doc.setFontSize(10).setFont(undefined, "normal");
      doc.text(`Name: ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, marginLeft, y);
      y += 5;
      doc.text(`Address: ${invoiceData.customer.street}`, marginLeft, y);
      y += 5;
      doc.text(`City: ${invoiceData.customer.city}`, marginLeft, y);
      y += 5;
      doc.text(`Phone: ${invoiceData.customer.phone}`, marginLeft, y);
      y += 5;
      doc.text(`Email: ${invoiceData.customer.email}`, marginLeft, y);

      // Divider
      y += 5;
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;

      // ===== INVOICE SUMMARY =====
      const summaryX = pageWidth - marginRight - 60;
      doc.setFontSize(12).setFont(undefined, "bold");
      doc.text("INVOICE SUMMARY", summaryX, y - 40);

      doc.setFontSize(10).setFont(undefined, "normal");
      doc.text(`Number of Orders: ${invoiceData.orders.length}`, summaryX, y - 35);
      doc.text(`Total Items: ${invoiceData.totalItems}`, summaryX, y - 30);
      doc.text(`Total Amount: ${invoiceData.totalAmount} VND`, summaryX, y - 25);

      // ===== ORDER DETAILS TABLE =====
      y += 10;
      doc.setFontSize(12).setFont(undefined, "bold");
      doc.text("ORDER DETAILS", marginLeft, y);
      y += 7;

      const orderTableData = invoiceData.orders.map(o => [
        `#${o._id.slice(-8)}`,
        formatDate(o.date),
        o.items.length.toString(),
        o.status.charAt(0).toUpperCase() + o.status.slice(1),
        `${(o.totalAmount && o.totalAmount > 0) ? o.totalAmount : (o.amount + (o.shippingFee || 0))} VND`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Order ID", "Date", "Items", "Status", "Amount"]],
        body: orderTableData,
        theme: "grid",
        headStyles: {
          fillColor: [61, 128, 234],
          textColor: 255,
          fontStyle: "bold"
        },
        styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
        margin: { left: marginLeft, right: marginRight },
      });

      y = doc.lastAutoTable.finalY + 10;

      // Divider
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;

      // ===== ITEM DETAILS =====
      doc.setFontSize(12).setFont(undefined, "bold");
      doc.text("ITEM DETAILS", marginLeft, y);
      y += 7;

      for (const order of invoiceData.orders) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10).setFont(undefined, "bold");
        doc.text(`Order #${order._id.slice(-8)} - ${formatDate(order.date)}`, marginLeft, y);
        y += 6;

        const itemsData = order.items.map(i => [
          i.name || "N/A",
          i.quantity?.toString() || "1",
          `${i.price || 0} VND`,
          `${(i.price || 0) * (i.quantity || 1)} VND`,
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Product Name", "Qty", "Unit Price", "Total"]],
          body: itemsData,
          theme: "grid",
          headStyles: { fillColor: [221, 221, 221], textColor: 0, fontStyle: "bold" },
          styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
          margin: { left: marginLeft, right: marginRight },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      // Divider
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;

      // ===== FINAL SUMMARY =====
      doc.setFontSize(11).setFont(undefined, "bold");
      doc.text("INVOICE SUMMARY", marginLeft, y);
      y += 10;

      doc.setFont(undefined, "normal");
      doc.text("Subtotal:", pageWidth - marginRight - 50, y);
      doc.text(`${invoiceData.totalAmount} VND`, pageWidth - marginRight - 10, y, { align: "right" });
      y += 6;

      doc.text("Tax (0%):", pageWidth - marginRight - 50, y);
      doc.text("0 VND", pageWidth - marginRight - 10, y, { align: "right" });
      y += 6;

      doc.text("Shipping:", pageWidth - marginRight - 50, y);
      doc.text("Included", pageWidth - marginRight - 10, y, { align: "right" });
      y += 8;

      // Divider line above total
      doc.setDrawColor(0, 0, 0);
      doc.line(pageWidth - marginRight - 60, y, pageWidth - marginRight, y);
      y += 5;

      doc.setFont("helvetica", "bold").setFontSize(12);
      doc.text("GRAND TOTAL:", pageWidth - marginRight - 65, y);
      doc.text(`${invoiceData.totalAmount} VND`, pageWidth - marginRight - 10, y, { align: "right" });
      y += 15;

      // ===== FOOTER =====
      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 8;

      doc.setFontSize(9).setFont(undefined, "italic");
      doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });
      y += 5;
      doc.text("This invoice was generated automatically and serves as a transaction confirmation.", pageWidth / 2, y, { align: "center" });

      // Save
      doc.save(`Invoice-${invoiceData.id}.pdf`);
      toast.success("PDF invoice exported successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Error generating PDF!");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Hoa don ${invoiceData.id}`,
          text: `Hoa don cho ${invoiceData.customer.firstName} ${invoiceData.customer.lastName} - Tong: ${formatCurrency(invoiceData.totalAmount)}`,
          url: window.location.href
        });
      } else {
        const shareText = `Hoa don ${invoiceData.id} - ${formatCurrency(invoiceData.totalAmount)}`;
        await navigator.clipboard.writeText(shareText);
        toast.success('Da sao chep thong tin hoa don!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Khong the chia se hoa don');
    }
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + ((order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0))), 0);
  const selectedRevenue = orders.filter(order => selectedOrders.includes(order._id))
    .reduce((sum, order) => sum + ((order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0))), 0);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="mb-6 bg-white rounded-lg p-6 shadow-sm">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("invoice.title")}
            </h1>
            <p className="text-gray-600">
              {t("invoice.subtitle")}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <FaSync  size={14} className={loading ? 'animate-spin' : ''} />
              {t("invoice.refresh")}
            </button>
            <button 
              onClick={generateInvoice}
              disabled={selectedOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FaFileInvoice size={14} />
              {t("invoice.generate_invoice")} ({selectedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t("invoice.total_orders")}</h3>
          <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t("invoice.total_revenue")}</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t("invoice.selected")}</h3>
          <p className="text-2xl font-bold text-blue-600">{selectedOrders.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t("invoice.selected_amount")}</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("invoice.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t("invoice.filter.all_status")}</option>
              <option value="pending">{t("invoice.filter.pending")}</option>
              <option value="confirmed">{t("invoice.filter.confirmed")}</option>
              <option value="shipped">{t("invoice.filter.shipped")}</option>
              <option value="delivered">{t("invoice.filter.delivered")}</option>
              <option value="cancelled">{t("invoice.filter.cancelled")}</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t("invoice.filter.all_time")}</option>
              <option value="today">{t("invoice.filter.today")}</option>
              <option value="week">{t("invoice.filter.week")}</option>
              <option value="month">{t("invoice.filter.month")}</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("invoice.filter.clear")}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left p-4 font-semibold text-gray-900">{t("invoice.table.order_id")}</th>
                <th className="text-left p-4 font-semibold text-gray-900">{t("invoice.table.customer")}</th>
                <th className="text-left p-4 font-semibold text-gray-900">{t("invoice.table.date")}</th>
                <th className="text-left p-4 font-semibold text-gray-900">{t("invoice.table.amount")}</th>
                <th className="text-left p-4 font-semibold text-gray-900">{t("invoice.table.status")}</th>
                <th className="text-left p-4 font-semibold text-gray-900">{t("invoice.table.items")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-blue-600">#{order._id.slice(-8)}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{order.userId?.name || order.address?.firstName + ' ' + order.address?.lastName}</div>
                      <div className="text-sm text-gray-500">{order.userId?.email || order.address?.email}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-900">{formatDate(order.date)}</td>
                  <td className="p-4">
                    <span className="font-semibold text-green-600">{formatCurrency((order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0)))}</span>
                  </td>
                  <td className="p-4">{getStatusBadge(order.status)}</td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">
                      {order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0} items
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <FaFileInvoice size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Invoice Popup */}
      {showInvoicePopup && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Invoice #{invoiceData.id}</h2>
                <p className="text-sm text-gray-600">Created: {invoiceData.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generatePDF}
                  disabled={generatingPdf}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title={t("invoice:popup.download_pdf")}
                >
                  {generatingPdf ? <SmallLoader /> : <FaDownload size={16} />}
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t("invoice:popup.print")}
                >
                  <FaPrint size={16} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t("invoice:popup.share")}
                >
                  <FaShare size={16} />
                </button>
                <button
                  onClick={() => setShowInvoicePopup(false)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                 title={t("invoice:popup.close")}
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-6 print:p-0">
              {/* Company & Invoice Info */}
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">eSpecialty Vietnam</h3>
                  <p className="text-gray-600">123 Nguyen Hue Street</p>
                  <p className="text-gray-600">Ho Chi Minh City, Vietnam</p>
                  <p className="text-gray-600">Phone: +84 28 1234 5678</p>
                  <p className="text-gray-600">Email: info@eSpecialty.vn</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Hóa Đơn</h2>
                  <p className="text-gray-600">Số hóa đơn: {invoiceData.id}</p>
                  <p className="text-gray-600">Ngày tạo: {invoiceData.date}</p>
                  <p className="text-gray-600">Ngày đến hạn: {invoiceData.dueDate}</p>
                </div>
              </div>

              <hr />
              <br />
              {/* Bill To & Invoice Summary */}
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Thông Tin Khách Hàng:</h3>
                  <p className="text-gray-600">{invoiceData.customer.firstName} {invoiceData.customer.lastName}</p>
                  <p className="text-gray-600">{invoiceData.customer.street}, {invoiceData.customer.ward}, {invoiceData.customer.district}</p>
                  <p className="text-gray-600">{invoiceData.customer.city}, {invoiceData.customer.state}</p>
                  <p className="text-gray-600">{invoiceData.customer.zipcode}, {invoiceData.customer.country}</p>
                  <p className="text-gray-600">Phone: {invoiceData.customer.phone}</p>
                  <p className="text-gray-600">Email: {invoiceData.customer.email}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 mb-2">Tổng Quan Hóa Đơn:</h3>
                  <p className="text-gray-600">Số đơn hàng: {invoiceData.orders.length}</p>
                  <p className="text-gray-600">Tổng sản phẩm: {invoiceData.totalItems}</p>
                  <p className="text-gray-600 font-semibold">Tổng tiền: {formatCurrency(invoiceData.totalAmount)}</p>
                </div>
              </div>
              <hr />
              <br />
              {/* Order Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">CHI TIẾT ĐƠN HÀNG</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-b border-gray-200">Order ID</th>
                        <th className="text-left p-3 border-b border-gray-200">Ngày</th>
                        <th className="text-left p-3 border-b border-gray-200">Sản phẩm</th>
                        <th className="text-left p-3 border-b border-gray-200">Trạng thái</th>
                        <th className="text-right p-3 border-b border-gray-200">Số tiền</th>
                      </tr>
                    </thead>
                      <tbody>
                        {invoiceData.orders.map((order) => (
                          <tr key={order._id}>
                            <td className="p-3 border-b border-gray-100">#{order._id.slice(-8)}</td>
                            <td className="p-3 border-b border-gray-100">{formatDate(order.date)}</td>
                            <td className="p-3 border-b border-gray-100">
                              {order.items?.map((item, idx) => (
                                <span key={item._id || idx}>
                                  {item.name} x {item.quantity}
                                  {idx < order.items.length - 1}
                                  <br />
                                </span>
                              ))}
                            </td>
                            <td className="p-3 border-b border-gray-100">{getStatusBadge(order.status)}</td>
                            <td className="p-3 border-b border-gray-100 text-right">{formatCurrency(order.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                </div>
              </div>

              <hr />
              <br />
              {/* Items Breakdown */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">CHI TIẾT SẢN PHẨM</h3>
                {invoiceData.orders.map((order) => (
                  <div key={order._id} className="mb-4">
                    <div className="bg-gray-50 p-3 rounded-t-lg">
                      <span className="font-medium">Đơn Hàng #{order._id.slice(-8)} - {formatDate(order.date)}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 border-b border-gray-200">Sản Phẩm</th>
                            <th className="text-center p-3 border-b border-gray-200">Số Lượng</th>
                            <th className="text-right p-3 border-b border-gray-200">Đơn Giá</th>
                            <th className="text-right p-3 border-b border-gray-200">Thành Tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items?.map((item, index) => (
                            <tr key={index}>
                              <td className="p-3 border-b border-gray-100">{item.name || 'N/A'}</td>
                              <td className="p-3 border-b border-gray-100 text-center">{item.quantity || 1}</td>
                              <td className="p-3 border-b border-gray-100 text-right">{formatCurrency(item.price || 0)}</td>
                              <td className="p-3 border-b border-gray-100 text-right">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan="4" className="p-3 border-b border-gray-100 text-center text-gray-500">Không Có Sản Phẩm</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              <hr />
              <br />
              {/* Total Summary */}
              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tạm Tính:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Thuế (0%):</span>
                    <span className="font-medium">{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Phí ship:</span>
                    <span className="font-medium">Miễn phí</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-lg">Tổng Cộng:</span>
                      <span className="font-bold text-lg text-blue-600">{formatCurrency(invoiceData.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200 print:hidden">
                <div>
                  <span className="text-xl font-bold text-gray-900">Grand Total: {formatCurrency(invoiceData.totalAmount)}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInvoicePopup(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Print
                  </button>
                  <button
                    onClick={generatePDF}
                    disabled={generatingPdf}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {generatingPdf ? 'Đang tạo PDF...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice