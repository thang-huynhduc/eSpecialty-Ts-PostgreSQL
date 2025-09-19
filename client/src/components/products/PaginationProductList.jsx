import PropTypes from "prop-types";
import Pagination from "./Pagination";
import ProductCard from "../ProductCard";
import { useTranslation } from "react-i18next";

const PaginationProductList = ({
  products = [],
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 12,
  totalItems = 0,
  onPageChange,
  viewMode = "grid",
}) => {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 text-gray-300">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("shop.no_products_found")}
          </h3>
          <p className="text-gray-600 max-w-md">
            {t("shop.no_products_message")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Products Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "grid grid-cols-1 gap-4"
        }
      >
        {products.map((product) => (
          <div
            key={product._id}
            className={
              viewMode === "list"
                ? "transform-none" // Override any transforms for list view
                : ""
            }
          >
            <ProductCard item={product} viewMode={viewMode} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

PaginationProductList.propTypes = {
  products: PropTypes.array.isRequired,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  itemsPerPage: PropTypes.number,
  totalItems: PropTypes.number,
  onPageChange: PropTypes.func,
  viewMode: PropTypes.string,
};

export default PaginationProductList;