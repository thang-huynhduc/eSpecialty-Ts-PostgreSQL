import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PropTypes from "prop-types";
import AddToCartButton from "./AddToCartButton";
import PriceContainer from "./PriceContainer";

const ProductCard = ({ item, viewMode = "grid", className = "" }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleProductDetails = () => {
    navigate(`/product/${item?.id}`, {
      state: {
        item: item,
      },
    });
  };

  if (viewMode === "list") {
    return (
      <div
        className={`w-full bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden ${className}`}
      >
        <div className="flex">
          {/* Image Container */}
          <div className="w-48 h-48 flex-shrink-0 relative overflow-hidden bg-gray-50">
            <div
              onClick={handleProductDetails}
              className="w-full h-full overflow-hidden cursor-pointer bg-white"
            >
              <img
                className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
                src={item?.images?.[0] || item?.image}
                alt={item?.name}
              />
            </div>

            {/* Sale Badge */}
            {item?.offer && (
              <div className="absolute top-3 left-3">
                {item?.discountedPercentage > 0 ? (
                  <span className="bg-black text-white text-xs font-medium px-2 py-1 uppercase tracking-wide">
                    -{item.discountedPercentage}%
                  </span>
                ) : (
                  <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 uppercase tracking-wide">
                    Sale
                  </span>
                )}
              </div>
            )}

            {/* Badge for new items */}
            {item?.badge && (
              <div className="absolute top-3 right-3">
                <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 uppercase tracking-wide">
                  New
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="text-lg font-semibold text-gray-900 uppercase tracking-wide cursor-pointer hover:text-gray-600 transition-colors duration-200 flex-1 mr-4"
                  onClick={handleProductDetails}
                >
                  {item?.name}
                </h3>
                <div className="text-right">
                  <PriceContainer item={item} />
                </div>
              </div>

              {item?.brand.name && (
                <p className="text-sm text-gray-600 mb-2">
                  Brand: {item.brand.name}
                </p>
              )}

              {item?.category.name && (
                <p className="text-sm text-gray-600 mb-3">
                  Category: {item.category.name}
                </p>
              )}

              {item?.description && (
                <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                  {item.description}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className="flex justify-end">
              <AddToCartButton item={item} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className={`w-full relative group bg-white border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out rounded-xl overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-50">
        <div
          onClick={handleProductDetails}
          className="w-full aspect-[4/5] overflow-hidden cursor-pointer bg-white"
        >
          <img
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            src={item?.images?.[0] || item?.image}
            alt={item?.name}
          />
        </div>

        {/* Sale Badge */}
        {item?.offer && (
          <div className="absolute top-3 left-3">
            {item?.discountedPercentage > 0 ? (
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                -{item.discountedPercentage}%
              </span>
            ) : (
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                Sale
              </span>
            )}
          </div>
        )}

        {/* Badge for new items */}
        {item?.badge && (
          <div className="absolute top-3 right-3">
            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
              New
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? "bg-black/40 opacity-100" : "opacity-0"
            }`}
        >
          <button
            onClick={handleProductDetails}
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-100 shadow-md transform transition-transform duration-300 hover:scale-105"
          >
            Quick Look
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-4 pb-5 px-4 text-center">
        <h3
          className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2 cursor-pointer hover:text-gray-600 transition-colors duration-200 line-clamp-1"
          onClick={handleProductDetails}
        >
          {item?.name}
        </h3>

        {/* Price */}
        <div className="mb-4">
          <PriceContainer item={{
            ...item,
            price: Number(item.price),
            discountedPercentage: Number(item.discountedPercentage || 0)
          }} />
        </div>

        {/* Add to Cart Button */}
        <div className="opacity-100 group-hover:opacity-100 transition-opacity duration-300">
          <AddToCartButton item={item} className="w-full py-2 rounded-md font-medium bg-black text-white hover:bg-gray-800 transition" />
        </div>
      </div>
    </div>

  );
};

ProductCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    offer: PropTypes.bool,
    badge: PropTypes.bool,
    discountedPercentage: PropTypes.number,
    brand: PropTypes.object,
    category: PropTypes.object,
    description: PropTypes.string,
  }).isRequired,
  viewMode: PropTypes.oneOf(["grid", "list"]),
  className: PropTypes.string,
};

export default ProductCard;
