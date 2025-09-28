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
  const { id } = useParams();
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
  const cartItem = products.find((item) => item._id === id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const availableStock = productInfo?.stock
    ? Math.max(0, productInfo.stock - cartQuantity)
    : 0;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${serverUrl}/api/product/single?_id=${id}`);
        const data = await response.json();
        if (data.success) {
          setProductInfo(data.product);
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
      if (productInfo?.category) {
        setLoadingRelated(true);
        try {
          const response = await fetch(
            `${serverUrl}/api/products?category=${productInfo.category}&_perPage=8`
          );
          const data = await response.json();
          if (data.success && data.products) {
            const filtered = data.products
              .filter((product) => product._id !== id)
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
    dispatch(addToCart({ ...productInfo, quantity }));
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

  const productImages =
    productInfo?.images && productInfo.images.length > 0
      ? productInfo.images
      : [
          productInfo?.image,
          productInfo?.image,
          productInfo?.image,
          productInfo?.image,
        ].filter((img) => img);

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
          <span className="hover:text-gray-700 cursor-pointer capitalize">
            {productInfo?.category}
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

            {/* Price */}
            <div className="flex items-center gap-4">
              {productInfo?.oldPrice && (
                <span className="text-2xl text-gray-400 line-through">
                  {formatCurrency(productInfo.oldPrice)}
                </span>
              )}
              <span className="text-3xl font-light text-gray-900">
                {formatCurrency(productInfo?.price)}
              </span>
              {productInfo?.oldPrice && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  {t("common.save", { 
                    amount: formatCurrency(productInfo.oldPrice - productInfo.price) 
                  })}
                </span>
              )}
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <MdStar
                    key={index}
                    className={`w-5 h-5 ${
                      index < Math.floor(productInfo?.ratings || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {t("common.rated", {
                  rating: productInfo?.ratings?.toFixed(1) || "0.0",
                  count: productInfo?.reviews?.length || 0
                })}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed text-lg">
              {productInfo?.description}
            </p>

            <h2>
              - Khối Lượng Sản Phẩm: {productInfo?.weight || "500 grams"}
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
                  {productInfo?._id?.slice(-6) || "N/A"}
                </span>
              </p>
              <p>
                <span className="font-medium">{t("common.category")}:</span>{" "}
                <span className="text-gray-600 capitalize">
                  {productInfo?.category}
                </span>
              </p>
              {productInfo?.tags && (
                <p>
                  <span className="font-medium">{t("common.tags")}:</span>{" "}
                  <span className="text-gray-600">{productInfo.tags}</span>
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
                {productInfo?.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {productInfo.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={review.image}
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
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((product) => (
                <div
                  key={product._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img
                      src={product.image || product.images?.[0] || "/placeholder-image.jpg"}
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
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <MdStar
                          key={starIndex}
                          className={`w-4 h-4 ${
                            starIndex < Math.floor(product.ratings || 4)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.ratings?.toFixed(1) || "4.0"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {product.discountedPercentage > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(product.price / (1 - product.discountedPercentage / 100))}
                      </span>
                    )}
                    <span className="text-lg font-light text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.discountedPercentage > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        {product.discountedPercentage}% off
                      </span>
                    )}
                  </div>
                  <button
                    className="w-full mt-3 py-2 border border-gray-300 text-gray-700 hover:border-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-medium uppercase tracking-wider transform hover:scale-[1.02]"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!product?.stock || product.stock === 0) {
                        toast.error(t("common.outOfStockError"));
                        return;
                      }
                      const cartItem = products.find((item) => item._id === product._id);
                      const cartQty = cartItem ? cartItem.quantity : 0;
                      if (cartQty >= product.stock) {
                        toast.error(t("common.cannotAddMore"));
                        return;
                      }
                      dispatch(addToCart({ ...product, quantity: 1 }));
                      toast.success(t("common.addedToCart", { 
                        productName: product.name.substring(0, 10) 
                      }));
                    }}
                  >
                    {t("common.addToCart")}
                  </button>
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

SingleProduct.propTypes = {
  productInfo: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.number,
    oldPrice: PropTypes.number,
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
    image: PropTypes.string,
    tags: PropTypes.string,
    stock: PropTypes.number,
  }),
};

export default SingleProduct;