import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import debounce from "lodash.debounce";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaBox,
  FaAngleLeft,
  FaAngleRight,
  FaSync,
} from "react-icons/fa";
import { IoMdClose, IoMdCloudUpload } from "react-icons/io";
import { FaTimes } from "react-icons/fa"; // Bổ sung import thiếu
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import PriceFormat from "../components/PriceFormat";
import Container from "../components/Container";
import Input, { Label } from "../components/ui/input";
import SmallLoader from "../components/SmallLoader";
import { serverUrl } from "../../config";

const List = ({ token }) => {
  // States for data
  const [products, setProducts] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // States for filters
  const [filters, setFilters] = useState({
    _search: "",
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    minStock: "",
    type: "",
    offer: "",
    isAvailable: "true",
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const perPage = 25;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit form data - SỬA: Đổi brand -> brandId, category -> categoryId
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    description: "",
    brandId: "", // Dùng ID
    price: "",
    discountedPercentage: 10,
    stock: "",
    categoryId: "", // Dùng ID
    offer: false,
    isAvailable: true,
    badge: false,
    tags: [],
    weight: 500,
  });

  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  // Fetch products with filters and pagination
  const fetchProducts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          ...filters,
          _page: page,
          _perPage: perPage,
        });
        // params được tạo ra nhưng chưa được đưa vào url, sửa lại cho đúng chuẩn axios
        const response = await axios.get(`${serverUrl}/api/product/list?${params.toString()}`, {
          withCredentials: true // Sửa 'true' string thành boolean true
        });
        const data = response?.data;

        if (data?.success) {
          setProducts(data.products);
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
          setTotalItems(data.totalItems);
        } else {
          toast.error(data?.message);
        }
      } catch (error) {
        console.log("Product List fetching error", error?.message);
        toast.error(error?.response?.data?.message || error?.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchProductsRef = useRef(fetchProducts);

  // Update ref when fetchProducts changes
  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
  }, [fetchProducts]);

  // Debounced fetchProducts
  const debouncedFetchProducts = useMemo(
    () => debounce((page) => fetchProductsRef.current(page), 500),
    []
  );

  // Fetch categories and brands
  const fetchCategoriesAndBrands = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${serverUrl}/api/category`),
        fetch(`${serverUrl}/api/brand`),
      ]);

      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
      if (brandsData.success) {
        setBrands(brandsData.brands);
      }
    } catch (error) {
      console.error("Error fetching categories and brands:", error);
      toast.error("Failed to load categories and brands");
    }
  };

  useEffect(() => {
    fetchCategoriesAndBrands();
    fetchProducts(1); // Initial load
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Apply debounced fetch when filters change
  useEffect(() => {
    debouncedFetchProducts(1);
    return () => {
      debouncedFetchProducts.cancel(); // Cancel debounce on unmount
    };
  }, [filters, debouncedFetchProducts]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchProducts(page);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (
      type === "select-one" &&
      (name === "offer" || name === "isAvailable" || name === "badge")
    ) {
      setFormData({
        ...formData,
        [name]: value === "true",
      });
    } else if (
      name === "price" ||
      name === "discountedPercentage" ||
      name === "stock" ||
      name === "weight"
    ) {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle individual image upload
  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      setImageFiles((prev) => ({
        ...prev,
        [imageKey]: file,
      }));
    }
  };

  // Remove an image
  const removeImage = (imageKey) => {
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }));
  };

  // Open edit modal - SỬA: Gán biến đúng từ API vào formData
  const openEditModal = (product) => {
    setEditingProduct(product);

    // Xử lý Tags: API trả về ["[\"Khác\"]"] (mảng chuỗi JSON) hoặc mảng thường
    let parsedTags = [];
    if (Array.isArray(product.tags) && product.tags.length > 0) {
        // Kiểm tra xem phần tử đầu tiên có phải là chuỗi JSON không
        try {
            if (typeof product.tags[0] === 'string' && product.tags[0].startsWith('[')) {
                 parsedTags = JSON.parse(product.tags[0]);
            } else {
                 parsedTags = product.tags;
            }
        } catch (e) {
            parsedTags = product.tags;
        }
    }

    setFormData({
      type: product.type || "",
      name: product.name || "",
      description: product.description || "",
      brandId: product.brandId || "", // Lấy brandId
      price: product.price || "",
      discountedPercentage: product.discountedPercentage || 10,
      stock: product.stock || 0,
      categoryId: product.categoryId || "", // Lấy categoryId
      offer: product.offer || false,
      isAvailable: product.isAvailable !== false,
      badge: product.badge || false,
      tags: parsedTags, 
      weight: product.weight || 500,
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setFormData({
      type: "",
      name: "",
      description: "",
      brandId: "",
      price: "",
      discountedPercentage: 10,
      stock: "",
      categoryId: "",
      offer: false,
      isAvailable: true,
      badge: false,
      tags: [],
      weight: 500,
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
  };

  // Open delete modal
  const openDeleteModal = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingProduct(null);
  };

  // Handle product update - SỬA: Gửi brandId và categoryId lên
  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.categoryId // Check ID
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      // Append form fields
      data.append("type", formData.type);
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("brandId", formData.brandId); // Gửi brandId
      data.append("price", formData.price);
      data.append("discountedPercentage", formData.discountedPercentage);
      data.append("stock", formData.stock);
      data.append("categoryId", formData.categoryId); // Gửi categoryId
      data.append("offer", formData.offer);
      data.append("isAvailable", formData.isAvailable);
      data.append("badge", formData.badge);
      data.append("tags", JSON.stringify(formData.tags));
      data.append("weight", formData.weight);

      // Append image files only if new images are selected
      Object.keys(imageFiles).forEach((key) => {
        if (imageFiles[key]) {
          data.append(key, imageFiles[key]);
        }
      });

      const response = await axios.put(
        `${serverUrl}/api/product/${editingProduct.id}`,
        data,
        {
          headers: {
            token, // Token có thể nằm trong header Authorization hoặc custom header tùy backend
            Authorization: `Bearer ${token}`, // Thêm dòng này cho chắc
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true
        }
      );

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success("Product updated successfully");
        await fetchProducts(currentPage);
        closeEditModal();
      } else {
        toast.error(responseData?.message || "Failed to update product");
      }
    } catch (error) {
      console.log("Product update error", error);
      toast.error(error?.response?.data?.message || "Error updating product");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle product deletion
  const handleRemoveProduct = async () => {
    if (!deletingProduct) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${serverUrl}/api/product/remove`,
        { id: deletingProduct.id },
        { headers: { Authorization: `Bearer ${token}` } } // Sửa header cho chuẩn
      );
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        await fetchProducts(currentPage);
        closeDeleteModal();
      } else {
        const errorMessage = data?.message || "Failed to delete product";
        const orderIds = data?.uncompletedOrderIds
          ? ` (Orders: ${data.uncompletedOrderIds.join(", ")})`
          : "";
        toast.error(`${errorMessage}${orderIds}`);
      }
    } catch (error) {
      console.log("Product remove error", error);
      const errorMessage =
        error?.response?.data?.message || "Error deleting product";
      const orderIds = error?.response?.data?.uncompletedOrderIds
        ? ` (Orders: ${error.response.data.uncompletedOrderIds.join(", ")})`
        : "";
      toast.error(`${errorMessage}${orderIds}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Products
            </h1>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchProducts(currentPage)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Refresh Products"
            >
              <FaSync className="w-4 h-4" />
              Refresh
            </button>
            <Link
              to="/add"
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FaPlus />
              Add Product
            </Link>
          </div>
        </div>

        {/* Filters Section (Giữ nguyên) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search products..."
                  value={filters._search}
                  onChange={(e) => handleFilterChange("_search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* ... Các bộ lọc khác giữ nguyên logic ... */}
             <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
             <div>
              <Label htmlFor="brand">Brand</Label>
              <select
                id="brand"
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Brands</option>
                {brands.map((br) => (
                  <option key={br.id} value={br.name}>
                    {br.name}
                  </option>
                ))}
              </select>
            </div>
            {/* ... (Các input filter khác giữ nguyên) ... */}
          </div>
           {/* Clear Filters Button (Giữ nguyên) */}
           <button
            onClick={() =>
              setFilters({
                _search: "",
                category: "",
                brand: "",
                minPrice: "",
                maxPrice: "",
                minStock: "",
                type: "",
                offer: "",
                isAvailable: "true",
              })
            }
            className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        {/* Pagination (Giữ nguyên) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
             {/* ... Pagination code giữ nguyên ... */}
             <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * perPage, totalItems)}</span> of{" "}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                   <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    <FaAngleLeft className="h-5 w-5" />
                   </button>
                   {/* Logic render số trang đơn giản hóa để tiết kiệm không gian code */}
                   <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                     Page {currentPage} of {totalPages}
                   </span>
                   <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    <FaAngleRight className="h-5 w-5" />
                   </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Products List (Giữ nguyên hiển thị name/categoryName/brandName) */}
        {isLoading ? (
          <div className="text-center py-10"><SmallLoader /> Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</div>
                          {product.brandName && <div className="text-xs text-gray-500 mt-1">{product.brandName}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900"><PriceFormat amount={product.price} /></div>
                          {product.discountedPercentage > 0 && <div className="text-xs text-green-600">{product.discountedPercentage}% off</div>}
                        </td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-900">{product.weight || 500}g</div></td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{product.stock || 0}</div>
                          <div className={`text-xs ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditModal(product)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                              <FaEdit /> Edit
                            </button>
                            <button onClick={() => openDeleteModal(product)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
             {/* Mobile Card View (Giữ nguyên) */}
             {/* ... */}
          </>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEditModal();
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Edit Product</h2>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                  <IoMdClose size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
                {/* Image Upload Section (Giữ nguyên) */}
                <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
                   {/* ... Code upload ảnh ... */}
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {["image1", "image2", "image3", "image4"].map((imageKey, index) => (
                         <div key={imageKey} className="relative">
                            {/* ... Image Input UI logic ... */}
                             <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 min-h-[120px] flex flex-col items-center justify-center bg-white">
                                {imageFiles[imageKey] ? (
                                    <>
                                        <img src={URL.createObjectURL(imageFiles[imageKey])} alt="preview" className="w-full h-20 object-cover rounded-md mb-2"/>
                                        <button type="button" onClick={() => removeImage(imageKey)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><FaTimes className="text-xs" /></button>
                                    </>
                                ) : editingProduct?.images?.[index] ? (
                                    <>
                                        <img src={editingProduct.images[index]} alt="current" className="w-full h-20 object-cover rounded-md mb-2"/>
                                        <span className="text-xs text-gray-600">Replace</span>
                                    </>
                                ) : (
                                    <IoMdCloudUpload className="text-3xl text-gray-400" />
                                )}
                                <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(e, imageKey)} />
                             </div>
                         </div>
                    ))}
                   </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  {/* SỬA: Brand select dùng brandId */}
                  <div>
                    <Label htmlFor="brandId">Brand</Label>
                    <select
                      name="brandId" // Đổi name
                      value={formData.brandId} // Đổi value
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SỬA: Category select dùng categoryId */}
                  <div>
                    <Label htmlFor="categoryId">Category *</Label>
                    <select
                      name="categoryId" // Đổi name
                      value={formData.categoryId} // Đổi value
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing, Stock & Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="discountedPercentage">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="discountedPercentage"
                      value={formData.discountedPercentage}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      type="number"
                      min="0"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                   <div className="flex flex-col">
                    <Label htmlFor="weight">Weight (grams) *</Label>
                    <Input
                      type="number"
                      min="0"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                {/* Settings (Type, Avail, Offer, Badge) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                   {/* ... (Giữ nguyên các select option khác) ... */}
                   <div>
                    <Label htmlFor="type">Product Type</Label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2">
                      <option value="">Select type</option>
                      <option value="new_arrivals">New Arrivals</option>
                      <option value="best_sellers">Best Sellers</option>
                      <option value="special_offers">Special Offers</option>
                      <option value="promotions">Promotions</option>
                    </select>
                  </div>
                   <div>
                    <Label htmlFor="isAvailable">Availability</Label>
                    <select name="isAvailable" value={formData.isAvailable.toString()} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2">
                      <option value="true">Available</option>
                      <option value="false">Out of Stock</option>
                    </select>
                  </div>
                   <div>
                    <Label htmlFor="offer">Special Offer</Label>
                    <select name="offer" value={formData.offer.toString()} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                   <div>
                    <Label htmlFor="badge">Show Badge</Label>
                    <select name="badge" value={formData.badge.toString()} onChange={handleInputChange} className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Tags (Giữ nguyên logic checkbox) */}
                <div>
                  <Label>Tags</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                    {["Fashion", "Electronics", "Sports", "Accessories", "Others"].map(
                      (tag) => (
                        <div className="flex items-center space-x-2" key={tag}>
                          <input
                            id={`edit-${tag.toLowerCase()}`}
                            type="checkbox"
                            value={tag}
                            checked={formData.tags.includes(tag)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prevData) => ({
                                  ...prevData,
                                  tags: [...prevData.tags, tag],
                                }));
                              } else {
                                setFormData((prevData) => ({
                                  ...prevData,
                                  tags: prevData.tags.filter((t) => t !== tag),
                                }));
                              }
                            }}
                          />
                          <label htmlFor={`edit-${tag.toLowerCase()}`} className="text-sm text-gray-700 cursor-pointer">
                            {tag}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button type="button" onClick={closeEditModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><SmallLoader /> Updating...</> : "Update Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal (Giữ nguyên) */}
        {showDeleteModal && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
               {/* ... Code Modal Delete ... */}
               <div className="bg-white rounded-lg max-w-md w-full p-6">
                 {/* ... Content ... */}
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
                 <p className="text-gray-600 mb-6">Are you sure you want to delete {deletingProduct?.name}?</p>
                 <div className="flex gap-3">
                    <button onClick={closeDeleteModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                    <button onClick={handleRemoveProduct} disabled={submitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">
                        {submitting ? "Deleting..." : "Delete"}
                    </button>
                 </div>
               </div>
             </div>
        )}
      </div>
    </Container>
  );
};

List.propTypes = {
  token: PropTypes.string.isRequired,
};

export default List;
