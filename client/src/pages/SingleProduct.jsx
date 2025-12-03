import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/especialtySlice";
import Container from "../components/Container";
import { MdStar, MdFavoriteBorder, MdShare } from "react-icons/md";
import { motion } from "framer-motion";
import { serverUrl } from "../../config";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import ProductTitle from "../components/products/ProductTitle";
import { useTranslation } from "react-i18next";

const SingleProduct = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams(); // id giờ là UUID
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const products = useSelector((state) => state.eSpecialtyReducer.products);
  const [productInfo, setProductInfo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Tính số lượng đã đặt trong giỏ hàng
  const cartItem = products.find((item) => item.id === id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  
  const availableStock = productInfo?.stock
    ? Math.max(0, productInfo.stock - cartQuantity)
    : 0;

  // 1. Giá gốc (Lấy từ DB)
  const originalPrice = Number(productInfo?.price || 0);
  
  // 2. Phần trăm giảm
  const discountPercent = productInfo?.discountedPercentage || 0;

  // 3. Giá bán thực tế (Khách phải trả)
  // Nếu có giảm giá: Giá gốc * (1 - %/100)
  // Nếu không: Giữ nguyên giá gốc
  const salePrice = discountPercent > 0 
    ? originalPrice * (1 - discountPercent / 100) 
    : originalPrice;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${serverUrl}/api/products/${id}`);
        const data = await response.json();
        if (data.success || data.product) { // Sửa check success tùy response backend trả về
          setProductInfo(data.product || data); // Handle trường hợp data trả về trực tiếp hoặc bọc trong object
          setQuantity(1);
        } else {
          setError(t("common.productNotFound", "Product not found"));
        }
      } catch (err) {
        setError(t("common.failedToLoad", "Failed to load product"));
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, t]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      // Sửa: Check categoryId thay vì category string
      const categoryId = productInfo?.categoryId || productInfo?.category?.id;
      
      if (categoryId) {
        setLoadingRelated(true);
        try {
          // Sửa: Query theo categoryId và loại trừ sản phẩm hiện tại
          const response = await fetch(
            `${serverUrl}/api/products/list?categoryId=${categoryId}&limit=5`, {
              credentials: 'include'
            }
          );
          const data = await response.json();
          
          // Data trả về từ getPublicProducts có dạng { products: [], meta: {} }
          const productList = data.products || data || [];
          
          if (Array.isArray(productList)) {
            const filtered = productList
              .filter((product) => product.id !== id)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
        } catch (error) {
          console.error("Error fetching related products:", error);
        } finally {
          setLoadingRelated(false);
        }
      }
    };

    if (productInfo) {
      fetchRelatedProducts();
    }
  }, [productInfo, id]);

  const handleQuantityChange = (type) => {
    if (type === "increment" && quantity < availableStock) {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    } else if (type === "increment" && quantity >= availableStock) {
      toast.error(t("common.cannotAddMore"));
    }
  };

const handleAddToCart = () => {
    if (!productInfo?.stock || productInfo.stock === 0) {
      toast.error(t("common.outOfStockError"));
      return;
    }
    if (quantity + cartQuantity > productInfo.stock) {
      toast.error(t("common.onlyAvailable", { count: availableStock }));
      return;
    }
    
    // Dispatch với giá SALE
    dispatch(addToCart({ 
        ...productInfo, 
        price: salePrice, // <--- Dùng giá đã giảm
        quantity 
    }));
    
    toast.success(t("common.addedToCart", { 
      productName: productInfo?.name.substring(0, 10) 
    }));
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !productInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            {error || t("common.productNotFound", "Product not found")}
          </h2>
          <button
            onClick={() => navigate("/")}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            {t("common.goHome")}
          </button>
        </div>
      </div>
    );
  }

  // Sửa: Xử lý mảng images từ Postgre (đã là mảng string[])
  const productImages =
    productInfo?.images && productInfo.images.length > 0
      ? productInfo.images
      : ["/placeholder-image.jpg"];

  // Format currency based on language
  const formatCurrency = (amount) => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const currency = i18n.language === 'vi' ? 'VND' : 'USD';
    
    return new Number(amount).toLocaleString(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: i18n.language === 'vi' ? 0 : 2,
    });
  };

  return (
    <div className="bg-white min-h-screen">
      <Container className="py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <span className="hover:text-gray-700 cursor-pointer" onClick={() => navigate("/")}>
            {t("common.home")}
          </span>
          <span>/</span>
          {/* Sửa: Lấy tên category từ object */}
          <span className="hover:text-gray-700 cursor-pointer capitalize">
            {productInfo?.category?.name || "Product"}
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{productInfo?.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div
              className="aspect-square overflow-hidden bg-gray-50 rounded-lg cursor-zoom-in relative group"
              onClick={() => setIsImageZoomed(!isImageZoomed)}
            >
              <img
                src={productImages[selectedImage] || "/placeholder-image.jpg"}
                alt={productInfo?.name}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isImageZoomed
                    ? "scale-150 cursor-zoom-out"
                    : "hover:scale-105 group-hover:scale-105"
                }`}
                onError={(e) => {
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
              {!isImageZoomed && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {t("common.clickToZoom")}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden bg-gray-50 rounded-lg border-2 transition-all duration-200 ${
                    selectedImage === index
                      ? "border-black"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image || "/placeholder-image.jpg"}
                    alt={`${productInfo?.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                    }}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <ProductTitle name={productInfo?.name} />

            {/* Price Section */}
            <div className="flex items-center gap-4">
              {/* Nếu có giảm giá thì hiện giá gốc bị gạch ngang */}
              {discountPercent > 0 && (
                <span className="text-2xl text-gray-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              
              {/* Giá bán thực tế (Sale Price) */}
              <span className="text-3xl font-light text-gray-900">
                {formatCurrency(salePrice)}
              </span>

              {/* Badge giảm giá */}
              {discountPercent > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  -{discountPercent}%
                </span>
              )}
            </div>
            {/* Ratings - Sửa: Handle trường hợp chưa có reviews */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <MdStar
                    key={index}
                    className={`w-5 h-5 ${
                      // Logic tính sao trung bình (có thể cần tính từ mảng reviews nếu BE ko trả về avg)
                      index < Math.floor(productInfo?.ratings || 5)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {t("common.rated", {
                  rating: productInfo?.ratings?.toFixed(1) || "5.0",
                  count: productInfo?.reviews?.length || 0
                })}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed text-lg">
              {productInfo?.description}
            </p>
            
            {/* Hiển thị Brand nếu có */}
            {productInfo?.brand && (
               <p className="text-sm text-gray-500">
                 Thương hiệu: <span className="font-medium text-black">{productInfo.brand.name}</span>
               </p>
            )}

            <h2>
              - Khối Lượng Sản Phẩm: {productInfo?.weight || "500"} grams*
            </h2>

            <div className="space-y-6">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {t("common.quantity")}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange("decrement")}
                      disabled={quantity <= 1}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value >= 1 && value <= availableStock) {
                          setQuantity(value);
                        } else if (value > availableStock) {
                          toast.error(t("common.onlyAvailable", { count: availableStock }));
                          setQuantity(availableStock);
                        } else {
                          setQuantity(1);
                        }
                      }}
                      className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                      min="1"
                      max={availableStock}
                    />
                    <button
                      onClick={() => handleQuantityChange("increment")}
                      disabled={quantity >= availableStock}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock & Cart Info */}
              <div className="space-y-1">
                <p
                  className={`text-sm font-medium ${
                    productInfo?.stock > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {productInfo?.stock > 0
                    ? t("common.inStock", { count: availableStock })
                    : t("common.outOfStock")}
                </p>
                {cartQuantity > 0 && (
                  <p className="text-sm text-gray-500">
                    {t("common.inCart", { count: cartQuantity })}
                  </p>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!productInfo?.stock || productInfo.stock === 0}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium uppercase tracking-wide transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("common.addToCart")}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <MdFavoriteBorder className="w-5 h-5" />
                {t("common.addToWishlist")}
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <MdShare className="w-5 h-5" />
                {t("common.share")}
              </button>
            </div>

            {/* Product Details */}
            <div className="space-y-2 pt-4 border-t border-gray-200 text-sm">
              <p>
                <span className="font-medium">{t("common.sku")}:</span>{" "}
                <span className="text-gray-600">
                  {productInfo?.id?.slice(0, 8).toUpperCase() || "N/A"}
                </span>
              </p>
              <p>
                <span className="font-medium">{t("common.category")}:</span>{" "}
                <span className="text-gray-600 capitalize">
                  {/* Sửa: Lấy category name */}
                  {productInfo?.category?.name || "Uncategorized"}
                </span>
              </p>
              {productInfo?.tags && productInfo.tags.length > 0 && (
                <p>
                  <span className="font-medium">{t("common.tags")}:</span>{" "}
                  <span className="text-gray-600">
                    {/* Sửa: Xử lý mảng tags */}
                     {Array.isArray(productInfo.tags) 
                        ? productInfo.tags.map(t => t.replace(/[\[\]"]/g, '')).join(", ") 
                        : productInfo.tags}
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-gray-200 pt-12"
        >
          <div className="flex space-x-8 mb-8 border-b border-gray-200">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative ${
                  activeTab === tab
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "reviews"
                  ? `${t(`tabs.${tab}`)} (${productInfo?.reviews?.length || 0})`
                  : t(`tabs.${tab}`)}
              </button>
            ))}
          </div>
          <div className="min-h-[200px]">
            {activeTab === "description" && (
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-light mb-4">{t("common.description")}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {productInfo?.description || t("common.noDescription")}
                </p>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light mb-6">{t("common.customerReviews")}</h3>
                {productInfo?.reviews && productInfo.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {productInfo.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={review.image || "/placeholder-avatar.jpg"}
                            alt={review.reviewerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {review.reviewerName}
                              </h4>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, starIndex) => (
                                  <MdStar
                                    key={starIndex}
                                    className={`w-4 h-4 ${
                                      starIndex < review.rating
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t("common.noReviews")}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="border-t border-gray-200 pt-16 mt-16"
        >
          <h2 className="text-2xl font-light text-center mb-12">
            {t("common.relatedProducts")}
          </h2>
          {loadingRelated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  onClick={() => {
                    navigate(`/product/${product.id}`);
                    window.scrollTo(0, 0); // Scroll lên đầu trang khi chuyển sản phẩm
                  }}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img
                      // Sửa logic lấy ảnh đại diện từ mảng images
                      src={product.images?.[0] || "/placeholder-image.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 group-hover:text-gray-600 transition-colors truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {/* Tính toán giá hiển thị cho Related Products */}
                    <span className="text-lg font-light text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.discountedPercentage > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        -{product.discountedPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {t("common.noRelatedProducts")}
              </p>
            </div>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

// Update PropTypes cho cấu trúc data mới
SingleProduct.propTypes = {
  productInfo: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    // category giờ là object
    category: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
    }),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Có thể là string từ DB
    discountedPercentage: PropTypes.number,
    ratings: PropTypes.number,
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        reviewerName: PropTypes.string,
        rating: PropTypes.number,
        comment: PropTypes.string,
        image: PropTypes.string,
      })
    ),
    description: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    stock: PropTypes.number,
    brand: PropTypes.shape({
        name: PropTypes.string
    })
  }),
};

export default SingleProduct;
