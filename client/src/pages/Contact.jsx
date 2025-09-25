import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import MainLoader from '../components/MainLoader';
import { serverUrl } from "../../config";

const ContactClient = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [user, setUser] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = parseJwt(token);
        setUser(payload);
        setFormData(prev => ({
          ...prev,
          name: payload.name || '',
          email: payload.email || ''
        }));
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

  const fetchUserMessages = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/contact/my-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUserMessages(data.data);
      } else {
        toast.error(data.message || "Không thể tải tin nhắn");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && showMessageHistory) {
      fetchUserMessages();
    }
  }, [user, showMessageHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi tin nhắn');
      return;
    }
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Tin nhắn đã được gửi thành công!');
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
        if (showMessageHistory) {
          fetchUserMessages();
        }
      } else {
        toast.error(data.message || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    try {
      setDeletingMessage(messageId);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/contact/admin/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Tin nhắn đã được xóa thành công!');
        setUserMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        toast.error(data.message || "Không thể xóa tin nhắn");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Không thể xóa tin nhắn");
    } finally {
      setDeletingMessage(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      unread: { color: 'text-yellow-600 bg-yellow-50', text: 'Chưa đọc' },
      read: { color: 'text-blue-600 bg-blue-50', text: 'Đã đọc' },
      replied: { color: 'text-green-600 bg-green-50', text: 'Đã trả lời' }
    };
    const config = statusConfig[status] || statusConfig.unread;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Liên Hệ Với Chúng Tôi</h1>
          <p className="text-xl opacity-90">
            Chúng tôi rất mong nhận được phản hồi từ bạn. Hãy gửi tin nhắn và chúng tôi sẽ trả lời sớm nhất có thể.
          </p>
        </div>
      </div>

      {/* Quick Contact Info */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Ghé Thăm Cửa Hàng</h3>
            <p className="text-sm text-gray-600">123 Nguyễn Huệ<br />Quận 1, TP. HCM</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Gọi Chúng Tôi</h3>
            <p className="text-sm text-gray-600">+84 28 1234 5678<br />Thứ 2 - Thứ 6, 9h-18h</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-sm text-gray-600">info@especialty.vn<br />thang.huynhduc.25@gmail.com</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Giờ Mở Cửa</h3>
            <p className="text-sm text-gray-600">T2 - T7: 9h-21h<br />CN: 10h-20h</p>
          </div>
        </div>

        {/* Main Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {user ? `Xin chào, ${user.name}` : 'Chào mừng bạn'}
              </h2>
              <p className="text-gray-600">
                {user ? 'Bạn có thể gửi tin nhắn cho chúng tôi ngay bây giờ' : 'Vui lòng đăng nhập để gửi tin nhắn'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!user}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!user}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chủ Đề *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={!user}
                  placeholder="Ví dụ: Hỏi về sản phẩm, Đặt hàng,..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tin Nhắn *
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={!user}
                  placeholder="Hãy mô tả chi tiết vấn đề của bạn..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Gửi Tin Nhắn
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Thông Tin Liên Hệ</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900">Địa Chỉ</h4>
                  <p className="text-gray-600">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900">Số Điện Thoại</h4>
                  <p className="text-gray-600">+84 28 1234 5678</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-purple-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900">Email</h4>
                  <p className="text-gray-600">info@especialty.vn</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900">Giờ Mở Cửa</h4>
                  <p className="text-gray-600">Thứ 2 - Thứ 7: 9h - 21h<br />Chủ Nhật: 10h - 20h</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Tính Năng & Sứ Mệnh</h4>
              <p className="text-gray-600">
                eSpecialty cam kết mang đến sản phẩm công nghệ chất lượng cao, dịch vụ khách hàng tuyệt vời và trải nghiệm mua sắm liền mạch.
              </p>
            </div>
          </div>
        </div>

        {/* Message History */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Lịch Sử Tin Nhắn Của Bạn</h2>
              <div className="flex gap-3">
                <button
                  onClick={fetchUserMessages}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Làm mới
                </button>
                <button
                  onClick={() => setShowMessageHistory(!showMessageHistory)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {showMessageHistory ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Ẩn Lịch Sử
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Xem Lịch Sử
                    </>
                  )}
                </button>
              </div>
            </div>
            {showMessageHistory && (
              <>
                {loading ? (
                  <MainLoader />
                ) : userMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Bạn chưa gửi tin nhắn nào</p>
                    <p className="text-sm">Gửi tin nhắn đầu tiên của bạn ngay bây giờ!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userMessages.map((message) => (
                      <div key={message._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(message.status)}
                            {deletingMessage === message._id && (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{message.message}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Gửi vào: {formatDate(message.createdAt)}</span>
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            disabled={deletingMessage === message._id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Xóa tin nhắn"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {message.adminNotes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="bg-green-50 p-3 rounded">
                              <p className="text-sm text-gray-800 italic">
                                <strong>Phản hồi từ eSpecialty:</strong> {message.adminNotes}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Trả lời vào: {formatDate(message.updatedAt)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {userMessages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Tổng cộng: <span className="font-medium">{userMessages.length}</span> tin nhắn
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Join Our Team */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tham Gia Đội Ngũ Của Chúng Tôi</h2>
          <p className="text-gray-600 mb-6">
            Bạn đam mê công nghệ và muốn trở thành một phần của eSpecialty? Hãy gửi CV của bạn về careers@especialty.vn để gia nhập đội ngũ của chúng tôi!
          </p>
          <a
            href="mailto:careers@especialty.vn"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Gửi CV Ngay
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactClient;