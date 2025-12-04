import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  resetCart,
  deleteItem,
  increaseQuantity,
  decreaseQuantity,
  setOrderCount,
} from "../redux/especialtySlice";
import { emptyCart } from "../assets/images";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import { formatPriceShort } from "../utils/currency";
import AddressSelector from "../components/AddressSelector";
import toast from "react-hot-toast";
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaMapMarkerAlt,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaTruck,
  FaSpinner,
} from "react-icons/fa";

const Cart = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux State
  const products = useSelector((state) => state.eSpecialtyReducer.products);
  const userInfo = useSelector((state) => state.eSpecialtyReducer.userInfo);
  const orderCount = useSelector((state) => state.eSpecialtyReducer.orderCount);

  // Local State
  const [totalAmt, setTotalAmt] = useState(0); // Tổng giá gốc (Niêm yết)
  const [discount, setDiscount] = useState(0); // Tổng giá thực tế phải trả (Sau khi trừ KM)
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);
  
  // Form State
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    provinceId: "",
    districtId: "",
    wardCode: "",
    zipCode: "",
    country: "Vietnam",
    phone: "",
    isDefault: false,
  });
  const [addressData, setAddressData] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Shipping State
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingServices, setShippingServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  
  // Config API URL
  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`; 

  // --- 1. TÍNH TOÁN TỔNG TIỀN (LOGIC MỚI) ---
  useEffect(() => {
    let totalOriginal = 0; // Tổng tiền theo giá niêm yết
    let totalSale = 0;     // Tổng tiền thực tế khách phải trả

    products.forEach((item) => {
      const originalPrice = Number(item?.price || 0); // Giá gốc trong DB
      const qty = item?.quantity || 1;
      const discountPercent = item?.discountedPercentage || 0;

      // Tính giá bán của 1 sản phẩm
      const salePrice = discountPercent > 0 
        ? originalPrice * (1 - discountPercent / 100) 
        : originalPrice;

      totalOriginal += originalPrice * qty;
      totalSale += salePrice * qty;
    });

    setTotalAmt(totalOriginal); 
    setDiscount(totalSale); // Lưu ý: Biến discount này giờ mang nghĩa là "Final Total"
  }, [products]);

  // --- 2. FETCH ADDRESSES ---
  useEffect(() => {
    if (userInfo) {
      fetchAddresses();
    }
  }, [userInfo]);

  // --- 3. SHIPPING FEE ---
  useEffect(() => {
    const calculateShipping = async () => {
      // Chỉ tính khi có địa chỉ đầy đủ (Quận + Phường) và có hàng
      if (selectedAddress?.districtId && selectedAddress?.wardCode && products.length > 0) {
        setIsCalculatingShipping(true); // Đại ca nhớ thêm state này vào component: const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
        try {
          const response = await fetch(`${API_URL}/order/calculate-fee`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer ...` (Nếu route yêu cầu login)
            },
            body: JSON.stringify({
              districtId: selectedAddress.districtId,
              wardCode: selectedAddress.wardCode,
              items: products.map(p => ({
                weight: p.weight, // Nếu sản phẩm FE ko có weight thì backend sẽ tự default
                quantity: p.quantity,
                price: p.price
              }))
            })
          });
          
          const data = await response.json();
          if (data.success) {
            setShippingFee(data.data.total);
          } else {
            console.error(data.message);
            setShippingFee(30000); // Fallback nếu lỗi
          }
        } catch (error) {
          console.error("Lỗi tính phí ship:", error);
          setShippingFee(30000); // Fallback
        } finally {
          setIsCalculatingShipping(false);
        }
      } else {
        setShippingFee(0);
      }
    };

    calculateShipping();
  }, [selectedAddress, products]); // Chạy lại khi địa chỉ hoặc giỏ hàng thay đổi

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      // Gọi API lấy danh sách địa chỉ (Endpoint chuẩn backend)
      const response = await fetch(`${API_URL}/user/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });
      const data = await response.json();
      
      // Xử lý data trả về (có thể là mảng trực tiếp hoặc data object)
      const addressList = Array.isArray(data) ? data : data.addresses || [];
      
      setAddresses(addressList);
      
      // Chọn địa chỉ mặc định
      const defaultAddr = addressList.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else if (addressList.length > 0) {
        setSelectedAddress(addressList[0]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsAddingAddress(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/user/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...addressForm,
          // Convert các ID sang number theo đúng schema Prisma
          provinceId: Number(addressData?.provinceId),
          districtId: Number(addressData?.districtId),
          wardCode: addressData?.wardCode,
        }),
      });

      const data = await response.json();
      
      // Check response (Fetch API ko tự throw lỗi 4xx/5xx)
      if (response.ok) {
        toast.success(t("cart.address_added_success"));
        fetchAddresses();
        setShowAddressModal(false);
        // Reset form (Optional)
      } else {
        toast.error(data.message || t("cart.failed_add_address"));
      }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error(t("cart.failed_add_address"));
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!userInfo) {
      toast.error(t("cart.please_login_order"));
      return;
    }

    if (!selectedAddress) {
      toast.error(t("cart.please_select_address"));
      return;
    }

    setIsPlacingOrder(true);

    try {
      const token = localStorage.getItem("token");
      
      // Payload chuẩn cho Backend createOrder
      const orderPayload = {
        items: products.map(p => ({
            productId: p.id,
            quantity: p.quantity
        })),
        shippingAddress: selectedAddress, // Gửi nguyên object để lưu snapshot
        shippingFee: shippingFee,
        paymentMethod: "cod", // Hardcode hoặc lấy từ state payment
      };

      const response = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(t("cart.order_placed_success"));
        dispatch(resetCart());
        dispatch(setOrderCount(orderCount + 1));
        // Điều hướng tới trang Checkout/Success
        navigate(`/checkout/${data.order.id}`); 
      } else {
        toast.error(data.message || t("cart.failed_place_order"));
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(t("cart.failed_place_order"));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleQuantityChange = (id, action) => {
    // Sửa: _id -> id
    const item = products.find((product) => product.id === id);
    if (!item) return;

    if (action === "increase") {
      if (item.quantity >= item.stock) {
        toast.error(t("common.outOfStockError") || "Hết hàng rồi");
        return;
      }
      dispatch(increaseQuantity(id));
    } else if (action === "decrease") {
      dispatch(decreaseQuantity(id));
    }
  };

  const handleRemoveItem = (id, name) => {
    dispatch(deleteItem(id));
    toast.success(`${name} ${t("cart.item_removed_success")}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <Container className="py-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{t("cart.shopping_cart_title")}</h1>
            <nav className="flex text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 transition-colors">
                {t("cart.home_breadcrumb")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{t("cart.cart_breadcrumb")}</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* --- LEFT COLUMN: CART ITEMS --- */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header (Desktop only) */}
                <div className="hidden lg:grid grid-cols-10 gap-4 p-6 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase">
                  <div className="col-span-5">{t("cart.product_header")}</div>
                  <div className="col-span-2 text-center">{t("cart.price_header")}</div>
                  <div className="col-span-2 text-center">{t("cart.quantity_header")}</div>
                  <div className="col-span-1 text-center">{t("cart.total_header")}</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-200">
                  {products.map((item) => {
                    const originalPrice = Number(item.price);
                    const salePrice = item.discountedPercentage > 0 
                        ? originalPrice * (1 - item.discountedPercentage / 100) 
                        : originalPrice;

                    return (
                    <div key={item.id} className="p-4 lg:p-6"> {/* Key dùng id */}
                      
                      {/* Mobile Layout */}
                      <div className="lg:hidden">
                        <div className="flex space-x-4">
                          <Link to={`/product/${item.id}`} className="flex-shrink-0 group">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={item?.images?.[0] || item?.image}
                                alt={item?.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                             <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                                {item?.name}
                             </h3>
                             {/* Mobile Price */}
                             <div className="flex gap-2 items-center mb-2">
                                <span className="font-bold"><PriceFormat amount={salePrice} /></span>
                                {item.discountedPercentage > 0 && (
                                    <span className="text-xs text-gray-500 line-through"><PriceFormat amount={originalPrice} /></span>
                                )}
                             </div>

                             {/* Mobile Controls */}
                             <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button onClick={() => handleQuantityChange(item.id, "decrease")} className="p-2"><FaMinus className="w-3 h-3"/></button>
                                    <span className="px-2">{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item.id, "increase")} className="p-2"><FaPlus className="w-3 h-3"/></button>
                                </div>
                                <button onClick={() => handleRemoveItem(item.id, item.name)}><FaTrash className="text-red-500"/></button>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:grid lg:grid-cols-10 gap-4 items-center">
                        {/* Product */}
                        <div className="lg:col-span-5">
                          <div className="flex items-start space-x-4">
                            <Link to={`/product/${item.id}`} className="flex-shrink-0 group">
                              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={item?.images?.[0] || item?.image}
                                  alt={item?.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/product/${item.id}`} className="block hover:text-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
                                  {item?.name}
                                </h3>
                              </Link>
                              {item?.brand && (
                                <p className="text-sm text-gray-600 mb-1">
                                  {t("cart.brand_label")} {item.brand?.name || item.brand}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price (Hiển thị giá gốc và giá giảm) */}
                        <div className="lg:col-span-2 text-center">
                            <div className="text-base font-semibold text-gray-900">
                                <PriceFormat amount={salePrice} />
                            </div>
                            {item.discountedPercentage > 0 && (
                                <>
                                    <div className="text-sm text-gray-500 line-through">
                                        <PriceFormat amount={originalPrice} />
                                    </div>
                                    <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                        -{item.discountedPercentage}%
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Quantity */}
                        <div className="lg:col-span-2">
                          <div className="flex lg:justify-center">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() => handleQuantityChange(item.id, "decrease")}
                                disabled={(item?.quantity || 1) <= 1}
                                className="p-3 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                              >
                                <FaMinus className="w-3 h-3" />
                              </button>
                              <span className="px-4 py-3 font-medium min-w-[3rem] text-center">
                                {item?.quantity || 1}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, "increase")}
                                className="p-3 hover:bg-gray-50 transition-colors"
                              >
                                <FaPlus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Total (Subtotal của item) */}
                        <div className="lg:col-span-1">
                          <div className="flex lg:justify-center items-center">
                            <div className="lg:text-center font-bold text-gray-900">
                              <PriceFormat amount={salePrice * item.quantity} />
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id, item.name)}
                              className="hidden lg:block ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
              
              {/* Cart Actions */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 flex flex-col sm:flex-row gap-3">
                 <button onClick={() => dispatch(resetCart())} className="flex-1 px-4 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium">
                    {t("cart.clear_cart_button")}
                 </button>
                 <Link to="/shop" className="flex-1">
                    <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
                        {t("cart.continue_shopping_button")}
                    </button>
                 </Link>
              </div>
            </div>

            {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                {/* Address Section */}
                {userInfo && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t("cart.delivery_address_title")}</h3>
                      <button onClick={() => setShowAddressModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        {t("cart.add_new_address")}
                      </button>
                    </div>

                    {addresses.length > 0 ? (
                      <div className="space-y-2">
                        {selectedAddress && (
                          <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-3">
                             <div className="font-medium flex justify-between">
                                <span>{selectedAddress.label}</span>
                                {selectedAddress.isDefault && <span className="text-xs bg-green-200 text-green-800 px-1 rounded">Default</span>}
                             </div>
                             <div className="text-sm text-gray-600 mt-1">
                                {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}
                             </div>
                             <div className="text-sm text-gray-600">{selectedAddress.phone}</div>
                          </div>
                        )}
                        
                        {/* Dropdown for other addresses */}
                        {addresses.length > 1 && (
                           <div className="border border-gray-200 rounded-lg">
                              <button 
                                onClick={() => setIsAddressesExpanded(!isAddressesExpanded)}
                                className="w-full flex justify-between p-3 text-sm"
                              >
                                <span>{t("cart.other_addresses")} ({addresses.length - 1})</span>
                                {isAddressesExpanded ? <FaChevronUp/> : <FaChevronDown/>}
                              </button>
                              {isAddressesExpanded && (
                                <div className="p-2 border-t max-h-40 overflow-y-auto">
                                   {addresses.filter(a => a.id !== selectedAddress?.id).map(addr => (
                                      <div 
                                        key={addr.id} 
                                        onClick={() => { setSelectedAddress(addr); setIsAddressesExpanded(false); }}
                                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0 text-sm"
                                      >
                                         <div className="font-medium">{addr.label}</div>
                                         <div className="text-xs text-gray-500 truncate">{addr.street}</div>
                                      </div>
                                   ))}
                                </div>
                              )}
                           </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm border-dashed border-2 p-4 text-center rounded">
                        {t("cart.no_delivery_address")}
                      </p>
                    )}
                  </div>
                )}

                {/* Summary Details */}
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t("cart.order_summary_title")}</h3>
                <div className="space-y-4 mb-6">
                   {/* Subtotal = Tổng Giá Gốc */}
                   <div className="flex justify-between">
                      <span className="text-gray-600">{t("cart.subtotal_items")}</span>
                      <span className="font-medium"><PriceFormat amount={totalAmt} /></span>
                   </div>

                   {/* Discount = Tiền tiết kiệm được (Gốc - Thực trả) */}
                   {totalAmt > discount && (
                    <div className="flex justify-between text-green-600">
                        <span>{t("cart.discount_label")}</span>
                        <span className="font-medium">-<PriceFormat amount={totalAmt - discount} /></span>
                    </div>
                   )}

                   {/* Shipping */}
                   <div className="flex justify-between">
                      <span className="text-gray-600">{t("cart.shipping_fee")}</span>
                      <span><PriceFormat amount={shippingFee} /></span>
                   </div>

                   {/* Final Total */}
                   <div className="border-t pt-4 flex justify-between">
                      <span className="text-lg font-bold">{t("cart.total_order")}</span>
                      <span className="text-lg font-bold text-blue-600">
                        <PriceFormat amount={discount + shippingFee} />
                      </span>
                   </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={!userInfo || !selectedAddress || isPlacingOrder}
                  className="w-full bg-gray-900 text-white py-4 px-6 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPlacingOrder ? (
                    <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin"/> Processing...
                    </div>
                  ) : !userInfo ? t("cart.login_to_place_order") 
                    : !selectedAddress ? t("cart.select_address_continue") 
                    : t("cart.place_order_button")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Empty Cart State
          <div className="text-center py-16">
             <img className="w-32 h-32 mx-auto mb-6 object-cover" src={emptyCart} alt="Empty Cart" />
             <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("cart.empty_cart_title")}</h2>
             <p className="text-gray-600 mb-8">{t("cart.empty_cart_message")}</p>
             <Link to="/shop">
                <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                    {t("cart.start_shopping_button")}
                </button>
             </Link>
          </div>
        )}
      </Container>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t("cart.add_address_modal_title")}</h3>
                    <button onClick={() => setShowAddressModal(false)}><FaTimes/></button>
                </div>
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("profile.address_label_required")}
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
                        <option value="">{t("profile.select_address_type_placeholder")}</option>
                        <option value="Home">{t("profile.home_option")}</option>
                        <option value="Work">{t("profile.work_option")}</option>
                        <option value="Hometown">{t("profile.hometown_option")}</option>
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
                      {t("profile.street_address_required")}
                    </label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, street: e.target.value })
                      }
                      placeholder={t("profile.house_number_placeholder")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {/* Chỉ cần nhớ AddressSelector trả về data để set vào state */}
                  <AddressSelector onAddressChange={(data) => {
                      setAddressData(data);
                      setAddressForm(prev => ({
                          ...prev,
                          city: data.provinceName,
                          district: data.districtName,
                          ward: data.wardName
                      }));
                  }} />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("profile.zip_code_label")}
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
                      placeholder={t("profile.optional_label")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("profile.phone_number_label_optional")}
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                      placeholder={t("profile.optional_label")}
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
                      {t("profile.set_default_checkbox")}
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">{t("cart.cancel_button")}</button>
                      <button type="submit" disabled={isAddingAddress} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                          {isAddingAddress ? "Saving..." : t("cart.add_address_button")}
                      </button>
                  </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
