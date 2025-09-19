import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { getData } from "../../helpers";
import { config } from "../../../config";
import { debounce } from "lodash";

const ProductsSideNav = ({ onFilterChange, filters, onClearFilters }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  useEffect(() => {
    // Fetch categories and brands from products
    const fetchFilterOptions = async () => {
      try {
        const data = await getData(`${config?.baseUrl}/api/products`);
        const products = data?.products || [];

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(products.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);

        // Extract unique brands
        const uniqueBrands = [
          ...new Set(products.map((p) => p.brand).filter(Boolean)),
        ];
        setBrands(uniqueBrands);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    // Sync local state with filters prop
    setSearchTerm(filters.search || "");
    setPriceRange({
      min: filters.minPrice || "",
      max: filters.maxPrice || "",
    });
  }, [filters]);

  // Debounce search filter
  const handleSearchChange = useCallback(
    debounce((value) => {
      onFilterChange({ search: value });
    }, 1000),
    [onFilterChange]
  );

  // Debounce price filter
  const handlePriceChangeDebounced = useCallback(
    debounce((min, max) => {
      onFilterChange({
        minPrice: min,
        maxPrice: max,
      });
    }, 1000),
    [onFilterChange]
  );

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearchChange(value);
  };

  const handlePriceChange = (min, max) => {
    setPriceRange({ min, max });
    handlePriceChangeDebounced(min, max);
  };

  const handleCategoryChange = (category) => {
    onFilterChange({
      category: filters.category === category ? "" : category,
    });
  };

  const handleBrandChange = (brand) => {
    onFilterChange({
      brand: filters.brand === brand ? "" : brand,
    });
  };

  // Cleanup debounces on unmount
  useEffect(() => {
    return () => {
      handleSearchChange.cancel();
      handlePriceChangeDebounced.cancel();
    };
  }, [handleSearchChange, handlePriceChangeDebounced]);

  return (
    <div className="w-full space-y-6">
      {/* Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("shop.search_products")}
        </h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInput}
            placeholder={t("shop.search_placeholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <svg
            className="absolute right-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("shop.categories")}
        </h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label
              key={category}
              className="flex items-center cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.category === category}
                onChange={() => handleCategoryChange(category)}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
              />
              <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors capitalize">
                {category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("shop.brands")}
        </h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.brand === brand}
                onChange={() => handleBrandChange(brand)}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
              />
              <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors capitalize">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("shop.price_range")}
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                {t("shop.min_price")}
              </label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => handlePriceChange(e.target.value, priceRange.max)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                {t("shop.max_price")}
              </label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => handlePriceChange(priceRange.min, e.target.value)}
                placeholder="∞"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Preset Price Ranges */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {t("shop.quick_filters")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: t("shop.under_1m"), min: 0, max: 1000000 },
              { label: t("shop.1m_to_2_5m"), min: 1000000, max: 2500000 },
              { label: t("shop.2_5m_to_5m"), min: 2500000, max: 5000000 },
              { label: t("shop.above_5m"), min: 5000000, max: 50000000 },
            ].map((range) => (
              <button
                key={range.label}
                onClick={() => handlePriceChange(range.min, range.max)}
                className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <button
          onClick={onClearFilters}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          {t("shop.clear_all_filters")}
        </button>
      </div>
    </div>
  );
};

ProductsSideNav.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    search: PropTypes.string,
    minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.string,
    brand: PropTypes.string,
  }).isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

export default ProductsSideNav;