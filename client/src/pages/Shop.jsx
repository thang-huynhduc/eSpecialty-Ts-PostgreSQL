import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Container from "../components/Container";
import ProductsSideNav from "../components/products/ProductsSideNav";
import PaginationProductList from "../components/products/PaginationProductList";
import { config } from "../../config";
import { getData } from "../helpers";

const Shop = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    search: "",
    minPrice: "",
    maxPrice: "",
  });
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const endpoint = `${config?.baseUrl}/api/products/list`;

  // Handle URL parameters for category filtering
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");

    if (categoryParam) {
      setFilters((prev) => ({
        ...prev,
        category: categoryParam,
      }));
    }
  }, [location.search]);
  const categoryLabel = filters.category
    ? t(`categories.${filters.category}`)
    : t("categories.all");

  // Fetch products with pagination and filters
  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          _page: currentPage,
          _perPage: itemsPerPage,
          ...(filters.category && { category: filters.category }),
          ...(filters.brand && { brand: filters.brand }),
          ...(filters.search && { _search: filters.search }),
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
          // Map sortBy to API-compatible sort parameters if supported
          ...(sortBy !== "newest" && { _sort: sortBy }),
        }).toString();

        const data = await getData(`${endpoint}?${queryParams}`);
        if (data.success) {
          setProducts(data.products || []);
          setTotalItems(data.totalItems || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.currentPage || 1);
        } else {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, [endpoint, filters, sortBy, currentPage, itemsPerPage]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
    if (window.innerWidth < 1024) {
      setTimeout(() => setMobileFiltersOpen(false), 500);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      brand: "",
      search: "",
      minPrice: "",
      maxPrice: "",
    });
    setCurrentPage(1);
    if (window.innerWidth < 1024) {
      setTimeout(() => setMobileFiltersOpen(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <Container className="py-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{t("shop.shop_title")}</h1>
            <nav className="flex text-sm text-gray-500">
              <a href="/" className="hover:text-gray-700 transition-colors">
                {t("shop.home_breadcrumb")}
              </a>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{t("shop.shop_title")}</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:w-1/4">
            <div className="sticky top-8 space-y-6">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{t("shop.filters_button")}</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      mobileFiltersOpen ? "rotate-180" : ""
                    }`}
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
                </button>

                {/* Mobile Filter Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    mobileFiltersOpen
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pt-4">
                    <ProductsSideNav
                      onFilterChange={handleFilterChange}
                      filters={filters}
                      onClearFilters={clearFilters}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Filter Sidebar */}
              <div className="hidden lg:block">
                <ProductsSideNav
                  onFilterChange={handleFilterChange}
                  filters={filters}
                  onClearFilters={clearFilters}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {t("shop.showing_results")} {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                  {t("shop.of_results")} {totalItems} {t("shop.results_text")}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Items per page */}
                <div className="flex items-center gap-2">
                  <label htmlFor="perPage" className="text-sm text-gray-600">
                    {t("shop.show_label")}
                  </label>
                  <select
                    id="perPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={36}>36</option>
                  </select>
                </div>

                {/* Sort by */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sortBy" className="text-sm text-gray-600">
                    {t("shop.sort_by_label")}
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="newest">{t("shop.newest_option")}</option>
                    <option value="price-low">{t("shop.price_low_to_high_option")}</option>
                    <option value="price-high">{t("shop.price_high_to_low_option")}</option>
                    <option value="name">{t("shop.name_a_to_z_option")}</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    } transition-colors`}
                    aria-label={t("shop.grid_view")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM9 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM9 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM15 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM15 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    } transition-colors`}
                    aria-label={t("shop.list_view")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h14a1 1 0 100-2H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.category || filters.brand || filters.search || filters.minPrice || filters.maxPrice) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-gray-600">{t("shop.active_filters_label")}</span>
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    {t("shop.category_filter")} {categoryLabel}
                    <button
                      onClick={() => handleFilterChange({ category: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.brand && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    {t("shop.brand_filter")} {filters.brand}
                    <button
                      onClick={() => handleFilterChange({ brand: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    {t("shop.search_filter")} {filters.search}
                    <button
                      onClick={() => handleFilterChange({ search: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    {t("shop.price_filter")} {filters.minPrice || "0"} - {filters.maxPrice || "∞"}
                    <button
                      onClick={() => handleFilterChange({ minPrice: "", maxPrice: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  {t("shop.clear_all_filters")}
                </button>
              </div>
            )}

            {/* Products Grid/List */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <PaginationProductList
                  products={products}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  viewMode={viewMode}
                />
              )}
            </div>
          </main>
        </div>
      </Container>
    </div>
  );
};

export default Shop;