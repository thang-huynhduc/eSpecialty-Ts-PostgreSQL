import { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import toast from "react-hot-toast";
import Input, { Label } from "./ui/input";
import axios from "axios";
import { serverUrl } from "../../config";
import { MdClose } from "react-icons/md";
import PropTypes from "prop-types";

const NewUserForm = ({
  isOpen,
  setIsOpen,
  close,
  selectedUser,
  getUsersList,
  token,
  isReadOnly = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isActive: true,
    avatar: "",
  });

  const [userAddresses, setUserAddresses] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);

  const MAX_VISIBLE_ITEMS = 0; // Ngưỡng tối đa hiển thị khi thu gọn

  useEffect(() => {
    if (selectedUser) {
      console.log("Selected user:", selectedUser); // Log để kiểm tra
      setFormData({
        _id: selectedUser?._id || null,
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        password: "",
        role: selectedUser.role || "user",
        isActive:
          selectedUser.isActive !== undefined ? selectedUser.isActive : true,
        avatar: selectedUser.avatar || "",
      });
      setAvatarPreview(selectedUser.avatar || "");
      setUserAddresses(selectedUser.addresses || []);
      setShowAllAddresses(false); // Reset trạng thái khi đổi user
      setShowAllOrders(false); // Reset trạng thái khi đổi user
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
        avatar: "",
      });
      setUserAddresses([]);
      setAvatarPreview("");
      setAvatarFile(null);
      setShowAllAddresses(false);
      setShowAllOrders(false);
    }
  }, [selectedUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const response = await axios.post(
        `${serverUrl}/api/user/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.avatarUrl;
      } else {
        toast.error(response.data.message);
        return null;
      }
    } catch (error) {
      console.log("Avatar upload error", error);
      toast.error("Failed to upload avatar");
      return null;
    }
  };

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Cannot edit user - Read only mode");
      return;
    }

    if (selectedUser && !selectedUser._id) {
      toast.error("Invalid user ID");
      return;
    }

    try {
      let avatarUrl = formData.avatar;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      let response;
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        avatar: avatarUrl,
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (selectedUser) {
        response = await axios.put(
          `${serverUrl}/api/user/update/${selectedUser._id}`,
          { ...userData, _id: selectedUser._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${serverUrl}/api/user/register`,
          userData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const data = await response?.data;

      if (data?.success) {
        toast.success(data?.message);
        setIsOpen(false);
        getUsersList();
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log("User save error", error);
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-[9999] focus:outline-none"
      onClose={close}
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-[10000] w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4 lg:p-6">
          <DialogPanel
            transition
            className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 
                     rounded-xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 
                     bg-white shadow-2xl border border-gray-200 text-black 
                     max-h-[95vh] sm:max-h-[90vh] overflow-y-auto
                     transform transition-all duration-300 ease-out
                     data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <DialogTitle
                as="h3"
                className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 pr-2"
              >
                {isReadOnly
                  ? "👤 User Details"
                  : selectedUser
                  ? "✏️ Edit User"
                  : "➕ Add New User"}
              </DialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="self-end sm:self-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close modal"
              >
                <MdClose className="text-xl sm:text-2xl" />
              </button>
            </div>

            {isReadOnly && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ This is a read-only view. Only administrators can edit user
                  information.
                </p>
              </div>
            )}

            <form
              onSubmit={handleAddOrUpdateUser}
              className="space-y-4 sm:space-y-6"
            >
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Basic Information
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Enter full name"
                      onChange={handleChange}
                      value={formData.name}
                      required
                      disabled={isReadOnly}
                      className={isReadOnly ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      onChange={handleChange}
                      value={formData.email}
                      required
                      disabled={isReadOnly}
                      className={isReadOnly ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">User Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent ${
                        isReadOnly ? "bg-gray-50" : ""
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="isActive">Account Status</Label>
                    <select
                      id="isActive"
                      name="isActive"
                      value={formData.isActive}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }));
                      }}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent ${
                        isReadOnly ? "bg-gray-50" : ""
                      }`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">
                    {selectedUser ? "New Password (optional)" : "Password *"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    onChange={handleChange}
                    value={formData.password}
                    required={!selectedUser}
                    disabled={isReadOnly}
                    className={isReadOnly ? "bg-gray-50" : ""}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Profile Avatar</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview || formData.avatar ? (
                        <img
                          src={avatarPreview || formData.avatar}
                          alt="Avatar preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                          {formData.name
                            ? formData.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                    </div>

                    {!isReadOnly && (
                      <div className="flex-1">
                        <input
                          type="file"
                          id="avatar"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar"
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg 
                                   hover:bg-gray-50 cursor-pointer transition-colors text-sm font-medium"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          {avatarFile ? "Change Image" : "Upload Image"}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Addresses (View Only)
                    </h4>
                    {userAddresses.length > MAX_VISIBLE_ITEMS && (
                      <button
                        type="button"
                        onClick={() => setShowAllAddresses(!showAllAddresses)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showAllAddresses ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>

                  {userAddresses.length > 0 ? (
                    <div className="space-y-4">
                      {userAddresses
                        .slice(
                          0,
                          showAllAddresses ? undefined : MAX_VISIBLE_ITEMS
                        )
                        .map((addr, index) => (
                          <div
                            key={addr._id || index}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium text-gray-800">
                                {addr.label} {addr.isDefault && "(Default)"}
                              </h5>
                              {addr.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Đường: {addr.street}
                            </p>
                            {addr.ward && (
                              <p className="text-sm text-gray-600">
                                Phường/Xã: {addr.ward}
                              </p>
                            )}
                            {addr.district && (
                              <p className="text-sm text-gray-600">
                                Quận/Huyện: {addr.district}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              Tỉnh/Thành Phố: {addr.city}
                            </p>
                            <p className="text-sm text-gray-600">
                              Zip Code: {addr.zipCode}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quốc Gia: {addr.country}
                            </p>
                            <p className="text-sm text-gray-600">
                              Số Điện Thoại: {addr.phone || "N/A"}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No addresses available for this user.
                    </p>
                  )}
                </div>
              )}

              {selectedUser && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Orders (View Only)
                    </h4>
                    {selectedUser.orders?.length > MAX_VISIBLE_ITEMS && (
                      <button
                        type="button"
                        onClick={() => setShowAllOrders(!showAllOrders)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showAllOrders ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>

                  {selectedUser.orders && selectedUser.orders.length > 0 ? (
                    <div className="space-y-4">
                      {selectedUser.orders
                        .slice(0, showAllOrders ? undefined : MAX_VISIBLE_ITEMS)
                        .map((order, index) => (
                          <div
                            key={order._id || index}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium text-gray-800">
                                Order #{order._id}
                              </h5>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  order.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Date: {new Date(order.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Amount: {order.originalAmount ? `${order.originalAmount.toLocaleString()} ${order.originalCurrency}` : `${order.amount.toLocaleString()} USD`}
                            </p>
                            <p className="text-sm text-gray-600">
                              Payment Method: {order.paymentMethod.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Payment Status: {order.paymentStatus.charAt(0).toUpperCase() +
                                order.paymentStatus.slice(1)}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-800">
                                Shipping Address:
                              </p>
                              <p className="text-sm text-gray-600">
                                {[
                                  order.address.street,
                                  order.address.ward,
                                  order.address.district,
                                  order.address.city,
                                  order.address.state,
                                  order.address.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                              <p className="text-sm text-gray-600">
                                Phone: {order.address.phone || "N/A"}
                              </p>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-800">
                                Items:
                              </p>
                              {order.items.map((item, itemIndex) => (
                                <div
                                  key={item._id || itemIndex}
                                  className="flex items-center gap-2 mt-1"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-md object-cover"
                                  />
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.quantity} x {item.price.toLocaleString()} {order.originalCurrency || "USD"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No orders available for this user.
                    </p>
                  )}
                </div>
              )}

              {selectedUser && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Account Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Label>Account Status</Label>
                      <p
                        className={`font-medium ${
                          selectedUser.isActive
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Label>Member Since</Label>
                      <p className="font-medium text-gray-700">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedUser.lastLogin && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Label>Last Login</Label>
                        <p className="font-medium text-gray-700">
                          {new Date(
                            selectedUser.lastLogin
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedUser.orders && selectedUser.orders.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <Label>Total Orders</Label>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedUser.orders.length}
                        </p>
                      </div>
                      {selectedUser.userCart &&
                        Object.keys(selectedUser.userCart).length > 0 && (
                          <div className="bg-orange-50 rounded-lg p-4">
                            <Label>Cart Items</Label>
                            <p className="text-2xl font-bold text-orange-600">
                              {Object.keys(selectedUser.userCart).length}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 
                         rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 
                         transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  {isReadOnly ? "Close" : "Cancel"}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                           text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 
                           focus:ring-2 focus:ring-blue-300 transition-all duration-200 
                           font-medium text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    {selectedUser ? "💾 Update User" : "➕ Create User"}
                  </button>
                )}
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

NewUserForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  selectedUser: PropTypes.object,
  getUsersList: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  isReadOnly: PropTypes.bool,
};

export default NewUserForm;