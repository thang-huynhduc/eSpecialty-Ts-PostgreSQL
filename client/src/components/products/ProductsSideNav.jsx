import { useState, useEffect } from "react";
import { getData } from "../../helpers";
import { config } from "../../../config";


const ProductsSideNav = ({ onFilterChange, filters, onClearFilters, token }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);

        // 🔹 Fetch categories từ API
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/category`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();

        if (data.success) {
          setCategories(data.categories || []);
        } else {
          toast.error(data.message || "Failed to fetch categories");
        }

        // 🔹 Nếu vẫn muốn lấy brands từ products
        const productsRes = await fetch(
          `${config?.baseUrl}/api/products`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const productsData = await productsRes.json();
        const products = productsData?.products || [];

        const uniqueBrands = [
          ...new Set(products.map((p) => p.brand).filter(Boolean)),
        ];
        setBrands(uniqueBrands);

      } catch (error) {
        console.error("Error fetching filter options:", error);
        toast.error("Error loading filters");
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [token]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ search: value });
  };

  const handleCategoryChange = (categoryName) => {
    onFilterChange({
      category: filters?.category === categoryName ? "" : categoryName,
    });
  };

  const handleBrandChange = (brand) => {
    onFilterChange({ brand: filters?.brand === brand ? "" : brand });
  };

  const handlePriceChange = (min, max) => {
    setPriceRange({ min, max });
    onFilterChange({ priceRange: `${min}-${max}` });
  };

  return (
    <div className="w-full space-y-6">
      {/* Search */}
      {/* ... giữ nguyên phần search ... */}

      {/* Categories */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : (
            <>
              {/* Hard-code category ALL */}
              <label
                key="all"
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={!filters?.category} // nếu không có filter thì chọn All
                  onChange={() => onFilterChange({ category: "" })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors capitalize">
                  All Products
                </span>
              </label>

              {/* Các category từ API */}
              {categories.map((cat) => (
                <label key={cat._id} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(cat.name)}
                    onChange={() => handleCategoryChange(cat.name)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-black">
                    {cat.name}
                  </span>
                </label>
              ))}

            </>
          )}
        </div>
      </div>


      {/* Brands */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brands</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters?.brand === brand}
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
          Price Range
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                placeholder="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => handlePriceChange(priceRange.min, priceRange.max)}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Apply Price Filter
          </button>
        </div>

        {/* Preset Price Ranges */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Quick Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Dưới 1.000.000đ", min: 0, max: 1000000 },
              { label: "1.000.000đ - 2.500.000đ", min: 1000000, max: 2500000 },
              { label: "2.500.000đ - 5.000.000đ", min: 2500000, max: 5000000 },
              { label: "Trên 5.000.000đ", min: 5000000, max: 50000000 },
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

      {/* Rating Filter */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Rating
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center cursor-pointer group"
            >
              <input
                type="checkbox"
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
              />
              <div className="ml-3 flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">& up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <button
          onClick={onClearFilters}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default ProductsSideNav;
