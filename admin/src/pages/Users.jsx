import Title from "../components/ui/title";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { IoMdAdd, IoMdTime, IoMdSearch } from "react-icons/io";
import {
  FaEdit,
  FaTrash,
  FaCrown,
  FaUser,
  FaEye,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import NewUserForm from "../components/NewUserForm";
import SkeletonLoader from "../components/SkeletonLoader";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";

const Users = ({ token }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const initializeUser = async () => {
      if (!currentUser && token) {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser) {
          dispatch(setUser(storedUser));
          return;
        }

        try {
          const response = await axios.get(serverUrl + "/api/user/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.success) {
            dispatch(setUser(response.data.user));
          } else {
            console.log("❌ Profile fetch failed:", response.data.message);
          }
        } catch (error) {
          console.log(
            "🚨 Failed to fetch user profile:",
            error?.response?.data || error?.message
          );
        }
      }
    };

    initializeUser();
  }, [currentUser, token, dispatch]);

  const getUsersList = useCallback(async () => {
    try {
      setLoading(true);

      const params = { page: currentPage, limit };
      if (roleFilter !== "all") params.role = roleFilter;

      const response = await axios.get(serverUrl + "/api/user/users", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response?.data;

      if (data?.success) {
        setUsersList(data?.users);
        setFilteredUsers(data?.users);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data?.message || "Failed to fetch users");
        console.log("❌ API Error:", data);
      }
    } catch (error) {
      console.log(
        "🚨 Request failed:",
        error?.response?.data || error?.message
      );
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to connect to server"
      );
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, roleFilter]);

  useEffect(() => {
    getUsersList();
  }, [getUsersList]);

  useEffect(() => {
    let filtered = usersList;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [usersList, searchTerm]);

  const handleRemoveUser = async (_id) => {
    const confirmRemoval = window.confirm(
      "Are you sure you want to remove this user?"
    );
    if (confirmRemoval) {
      try {
        setLoading(true);
        const response = await axios.post(
          serverUrl + "/api/user/remove",
          { _id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response?.data;
        if (data?.success) {
          toast.success(data?.message);
          await getUsersList();
        } else {
          toast.error(data?.message);
        }
      } catch (error) {
        console.log("User remove error", error);
        toast.error(error?.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setIsOpen(true);
  };

  const UserSkeleton = () => (
    <>
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
        <div className="bg-gray-50 px-6 py-3">
          <div className="grid grid-cols-6 gap-4">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-2 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="flex gap-2 justify-end">
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                  <div className="h-6 bg-gray-200 rounded w-14"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:hidden">
        <SkeletonLoader type="user" count={6} />
      </div>
    </>
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Title className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Users Management
              </Title>
              <p className="text-gray-600">
                Manage system users and their permissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={getUsersList}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                title="Refresh Users"
              >
                <FaSync className="text-sm" />
                Refresh
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setIsOpen(true);
                  }}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  <IoMdAdd className="text-lg" />
                  Add User
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoMdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <UserSkeleton />
        ) : filteredUsers?.length > 0 ? (
          <>
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Since
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {user.role === "admin" && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <FaCrown className="text-xs text-white" />
                                </div>
                              )}
                              {user.isActive && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {user.role === "admin" ? (
                                <FaCrown className="text-xs" />
                              ) : (
                                <FaUser className="text-xs" />
                              )}
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1 text-sm">
                            {user.lastLogin && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <IoMdTime />
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {user.orders && user.orders.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                                  {user.orders.length} orders
                                </span>
                              )}
                              {user.userCart &&
                                Object.keys(user.userCart).length > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-800">
                                    {Object.keys(user.userCart).length} cart
                                  </span>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.addresses && user.addresses.length > 0 ? (
                            <div>
                              {user.addresses
                                .filter((addr) => addr.isDefault)
                                .map((addr) => (
                                  <div key={addr._id || addr.label}>
                                    <div className="font-medium text-gray-900">
                                      {addr.label}
                                    </div>
                                    <div>
                                      {[addr.street, addr.city, addr.country]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </div>
                                    {addr.phone && (
                                      <div className="text-xs text-gray-500">
                                        {addr.phone}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {user.addresses.length > 1 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  +{user.addresses.length - 1} more address
                                  {user.addresses.length > 2 ? "es" : ""}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No addresses</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(user);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                  <FaEdit />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveUser(user._id);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                                >
                                  <FaTrash />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(user);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <FaEye />
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleRowClick(user)}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {user.role === "admin" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <FaCrown className="text-xs text-white" />
                          </div>
                        )}
                        {user.isActive && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-base sm:text-lg">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                        <div className="sm:hidden mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <FaCrown className="text-xs" />
                            ) : (
                              <FaUser className="text-xs" />
                            )}
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="hidden sm:flex items-center justify-between">
                        <span className="text-sm text-gray-500">Role:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <FaCrown className="text-xs" />
                          ) : (
                            <FaUser className="text-xs" />
                          )}
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {user.lastLogin && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Last Login:
                          </span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <IoMdTime />
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {user.orders && user.orders.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Orders:</span>
                          <span className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded-full">
                            {user.orders.length}
                          </span>
                        </div>
                      )}

                      {user.userCart &&
                        Object.keys(user.userCart).length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Cart Items:
                            </span>
                            <span className="text-sm font-medium text-gray-900 bg-orange-50 px-2 py-1 rounded-full">
                              {Object.keys(user.userCart).length}
                            </span>
                          </div>
                        )}

                      {user.addresses && user.addresses.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Location:
                          </span>
                          <div className="text-xs text-gray-600 truncate max-w-32">
                            {user.addresses
                              .filter((addr) => addr.isDefault)
                              .map((addr) =>
                                [addr.street, addr.city, addr.country]
                                  .filter(Boolean)
                                  .join(", ")
                              )[0] ||
                              [
                                user.addresses[0].street,
                                user.addresses[0].city,
                                user.addresses[0].country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            {user.addresses.length > 1 && (
                              <div className="text-blue-600">
                                +{user.addresses.length - 1} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {user.addresses &&
                        user.addresses.some((addr) => addr.phone) && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Phone:
                            </span>
                            <span className="text-xs text-gray-600">
                              {user.addresses.find((addr) => addr.isDefault)
                                ?.phone ||
                                user.addresses.find((addr) => addr.phone)
                                  ?.phone}
                            </span>
                          </div>
                        )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Member Since:
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(user);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                          >
                            <FaEdit />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveUser(user._id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(user);
                          }}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        >
                          <FaEye />
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || roleFilter !== "all"
                ? "No users match your search"
                : "No users found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || roleFilter !== "all"
                ? "Try adjusting your search criteria or filters"
                : isAdmin
                ? "Start by creating your first user account"
                : "No users available to display"}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsOpen(true)}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Add User
              </button>
            )}
          </div>
        )}

        <NewUserForm
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          close={() => setIsOpen(false)}
          getUsersList={getUsersList}
          selectedUser={selectedUser}
          token={token}
          isReadOnly={!isAdmin && selectedUser}
        />
      </div>
    </div>
  );
};

Users.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Users;