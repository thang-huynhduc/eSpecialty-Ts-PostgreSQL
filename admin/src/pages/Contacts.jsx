import { useState, useEffect } from 'react';
import { FaSync, FaEye, FaTrash, FaEnvelope, FaEnvelopeOpen, FaReply, FaTimes, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SkeletonLoader from '../components/SkeletonLoader';
import SmallLoader from '../components/SmallLoader';
import { serverUrl } from "../../config";

const ContactAdmin = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0
  });

  // Fetch all contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/contact/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setContacts(data.data);
        setFilteredContacts(data.data);
        setCounts(data.counts);
      } else {
        toast.error(data.message || "Failed to fetch contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts
  useEffect(() => {
    let filtered = contacts;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContacts(filtered);
  }, [contacts, statusFilter, searchTerm]);

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
      unread: { icon: FaEnvelope, color: 'text-red-600 bg-red-50', text: 'Chưa đọc' },
      read: { icon: FaEnvelopeOpen, color: 'text-blue-600 bg-blue-50', text: 'Đã đọc' },
      replied: { icon: FaReply, color: 'text-green-600 bg-green-50', text: 'Đã trả lời' }
    };

    const config = statusConfig[status] || statusConfig.unread;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={10} />
        {config.text}
      </span>
    );
  };

  const handleViewMessage = async (contact) => {
    setSelectedMessage(contact);
    setAdminNotes(contact.adminNotes || '');
    setShowMessagePopup(true);

    // Mark as read if unread
    if (contact.status === 'unread') {
      await updateContactStatus(contact._id, 'read');
    }
  };

  const updateContactStatus = async (contactId, newStatus, notes = '') => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/contact/admin/${contactId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          adminNotes: notes
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setContacts(prev => prev.map(contact => 
          contact._id === contactId 
            ? { ...contact, status: newStatus, adminNotes: notes }
            : contact
        ));
        
        // Update counts
        fetchContacts();
        
        if (selectedMessage && selectedMessage._id === contactId) {
          setSelectedMessage(prev => ({ ...prev, status: newStatus, adminNotes: notes }));
        }
        
        toast.success(`Tin nhắn đã được đánh dấu là ${newStatus === 'read' ? 'đã đọc' : newStatus === 'replied' ? 'đã trả lời' : 'chưa đọc'}`);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/contact/admin/${contactId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setContacts(prev => prev.filter(contact => contact._id !== contactId));
        toast.success("Tin nhắn đã được xóa");
        setShowMessagePopup(false);
      } else {
        toast.error(data.message || "Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

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
              Contact Messages
            </h1>
            <p className="text-gray-600">
              Manage customer inquiries and support requests
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchContacts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <FaSync size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaEnvelope className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Messages</h3>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FaEnvelope className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Unread</h3>
              <p className="text-2xl font-bold text-red-600">{counts.unread}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaEnvelopeOpen className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Read</h3>
              <p className="text-2xl font-bold text-blue-600">{counts.read}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaReply className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Replied</h3>
              <p className="text-2xl font-bold text-green-600">{counts.replied}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, tiêu đề..."
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
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-900">Sender</th>
                <th className="text-left p-4 font-semibold text-gray-900">Subject</th>
                <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                <th className="text-left p-4 font-semibold text-gray-900">Date</th>
                <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="max-w-xs truncate">
                      <span className="text-gray-900">{contact.subject}</span>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(contact.status)}</td>
                  <td className="p-4 text-gray-900">{formatDate(contact.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewMessage(contact)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => deleteContact(contact._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <FaEnvelope size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Message Details Popup */}
      {showMessagePopup && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
              <button
                onClick={() => setShowMessagePopup(false)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Sender Info */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedMessage.name}</h3>
                  <p className="text-gray-600">{selectedMessage.email}</p>
                </div>
              </div>

              <hr className="mb-6" />

              {/* Subject */}
              <div className="mb-4">
                <span className="font-semibold text-gray-900">Subject: </span>
                <span className="text-gray-700">{selectedMessage.subject}</span>
              </div>

              {/* Message */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Message:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Status and Date */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Status: </span>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  <div>
                    <span className="font-semibold">Received: </span>
                    <span className="text-gray-600">{formatDate(selectedMessage.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block font-semibold text-gray-900 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateContactStatus(selectedMessage._id, 'read', adminNotes)}
                  disabled={updatingStatus || selectedMessage.status === 'read'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingStatus ? <SmallLoader /> : 'Mark as Read'}
                </button>
                <button
                  onClick={() => updateContactStatus(selectedMessage._id, 'replied', adminNotes)}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingStatus ? <SmallLoader /> : 'Mark as Replied'}
                </button>
                <button
                  onClick={() => deleteContact(selectedMessage._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactAdmin;