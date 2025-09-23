import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { getData } from "../../helpers";
import { config } from "../../../config";
import { debounce } from "lodash";

const ProductsSideNav = ({ onFilterChange, filters, onClearFilters }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]); // Danh sách categories sau khi lọc
  const [categorySearchTerm, setCategorySearchTerm] = useState(""); // Từ khóa tìm kiếm category
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]); // Danh sách brands sau khi lọc
  const [brandSearchTerm, setBrandSearchTerm] = useState(""); // Từ khóa tìm kiếm brand
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  useEffect(() => {
    // Fetch categories từ /api/category và brands từ /api/brand
    const fetchFilterOptions = async () => {
      try {
        // Fetch categories từ /api/category
        const categoryData = await getData(`${config?.baseUrl}/api/category`);
        const categories = categoryData?.categories || [];
        setCategories(categories.map((category) => category.name)); // Giả sử API trả về { _id, name, image }
        setFilteredCategories(categories.map((category) => category.name)); // Khởi tạo filteredCategories

        // Fetch brands từ /api/brand
        const brandData = await getData(`${config?.baseUrl}/api/brand`);
        const brands = brandData?.brands || [];
        setBrands(brands.map((brand) => brand.name)); // Giả sử API trả về { _id, name, image }
        setFilteredBrands(brands.map((brand) => brand.name)); // Khởi tạo filteredBrands
      } catch (error) {
        console.error("Error fetching filter options:", error);
        toast.error("Error loading filters");
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [token]);

  useEffect(() => {
    // Sync local state với filters prop
    setSearchTerm(filters.search || "");
    setPriceRange({
      min: filters.minPrice || "",
      max: filters.maxPrice || "",
    });
  }, [filters]);

  // Debounce search filter cho product search
  const handleSearchChange = useCallback(
    debounce((value) => {
      onFilterChange({ search: value });
    }, 800),
    [onFilterChange]
  );

  // Debounce price filter
  const handlePriceChangeDebounced = useCallback(
    debounce((min, max) => {
      onFilterChange({
        minPrice: min,
        maxPrice: max,
      });
    }, 500),
    [onFilterChange]
  );

  // Debounce tìm kiếm category
  const handleCategorySearchChange = useCallback(
    debounce((value) => {
      setFilteredCategories(
        categories.filter((category) =>
          category.toLowerCase().includes(value.toLowerCase())
        )
      );
    }, 300),
    [categories]
  );

  // Debounce tìm kiếm brand
  const handleBrandSearchChange = useCallback(
    debounce((value) => {
      setFilteredBrands(
        brands.filter((brand) =>
          brand.toLowerCase().includes(value.toLowerCase())
        )
      );
    }, 300),
    [brands]
  );

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearchChange(value);
  };

  const handleCategorySearchInput = (e) => {
    const value = e.target.value;
    setCategorySearchTerm(value);
    handleCategorySearchChange(value);
  };

  const handleBrandSearchInput = (e) => {
    const value = e.target.value;
    setBrandSearchTerm(value);
    handleBrandSearchChange(value);
  };

  const handlePriceChange = (min, max) => {
    setPriceRange({ min, max });
    handlePriceChangeDebounced(min, max);
  };

  const handleCategoryChange = (categoryName) => {
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
      handleCategorySearchChange.cancel();
      handleBrandSearchChange.cancel();
    };
  }, [handleSearchChange, handlePriceChangeDebounced, handleCategorySearchChange, handleBrandSearchChange]);

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
        {/* Search input cho categories */}
        <div className="relative mb-4">
          <input
            type="text"
            value={categorySearchTerm}
            onChange={handleCategorySearchInput}
            placeholder={"Search categories..."}
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
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
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
            ))
          ) : (
            <p className="text-gray-500 text-sm">
              {t("shop.no_categories_found") || "No categories found"}
            </p>
          )}
        </div>
      </div>


      {/* Brands */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("shop.brands")}
        </h3>
        <div className="relative mb-4">
          <input
            type="text"
            value={brandSearchTerm}
            onChange={handleBrandSearchInput}
            placeholder={"Search brands..."}
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
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {filteredBrands.length > 0 ? (
            filteredBrands.map((brand) => (
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
            ))
          ) : (
            <p className="text-gray-500 text-sm">
              {t("shop.no_brands_found") || "No brands found"}
            </p>
          )}
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
          onClick={() => {
            setCategorySearchTerm(""); // Reset category search
            setFilteredCategories(categories); // Khôi phục danh sách categories
            setBrandSearchTerm(""); // Reset brand search
            setFilteredBrands(brands); // Khôi phục danh sách brands
            onClearFilters();
          }}
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