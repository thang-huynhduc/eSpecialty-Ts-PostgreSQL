import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Title from "../components/ui/title";
import { IoMdAdd, IoMdCloudUpload } from "react-icons/io";
import { FaTimes } from "react-icons/fa";
import Input, { Label } from "../components/ui/input";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SmallLoader from "../components/SmallLoader";
import { useTranslation } from "react-i18next";

const Add = ({ token }) => {
  const { t } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    _type: "",
    name: "",
    description: "",
    brand: "",
    price: "",
    discountedPercentage: 10,
    stock: "",
    category: "",
    offer: false,
    isAvailable: true,
    badge: false,
    tags: [],
  });
  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const translateCategory = (categoryName) => {
    return t(`categories.${categoryName}`, { defaultValue: categoryName });
  };

  // Fetch categories and brands
  const fetchCategoriesAndBrands = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/category`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/brand`),
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
      toast.error(t('add_product.addProduct.validation.errorLoadingData'));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  // Handle input change
  const handleChange = (e) => {
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
    } else if (name === "category") {
      const originalCategoryName = categories.find(
        cat => translateCategory(cat.name) === value
      )?.name || value;

      setFormData({
        ...formData,
        [name]: originalCategoryName,
      });
    } else if (
      name === "price" ||
      name === "discountedPercentage" ||
      name === "stock"
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

  const handleUploadProduct = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.stock ||
      !formData.category
    ) {
      toast.error(t('add_product.addProduct.validation.requiredFields'));
      return;
    }

    // Check if at least one image is uploaded
    const hasImage = Object.values(imageFiles).some((file) => file !== null);
    if (!hasImage) {
      toast.error(t('add_product.addProduct.validation.atLeastOneImage'));
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      // Append form fields
      data.append("_type", formData._type);
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("brand", formData.brand);
      data.append("price", formData.price);
      data.append("discountedPercentage", formData.discountedPercentage);
      data.append("stock", formData.stock);
      data.append("category", formData.category);
      data.append("offer", formData.offer);
      data.append("isAvailable", formData.isAvailable);
      data.append("badge", formData.badge);
      data.append("tags", JSON.stringify(formData.tags));

      // Append image files
      Object.keys(imageFiles).forEach((key) => {
        if (imageFiles[key]) {
          data.append(key, imageFiles[key]);
        }
      });

      const response = await axios.post(serverUrl + "/api/product/add", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success(responseData?.message);
        navigate("/list");
      } else {
        toast.error(responseData?.message);
      }
    } catch (error) {
      console.log("Product data uploading error", error);
      toast.error(error?.response?.data?.message || t('add_product.addProduct.validation.uploadError'));
    } finally {
      setLoading(false);
    }
  };

  const tagOptions = [
    t('add_product.addProduct.tags.fashion'),
    t('add_product.addProduct.tags.electronics'),
    t('add_product.addProduct.tags.sports'),
    t('add_product.addProduct.tags.accessories'),
    t('add_product.addProduct.tags.others')
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="xl:max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <IoMdAdd className="text-white text-xl" />
            </div>
            <div>
              <Title className="text-xl sm:text-2xl font-bold text-gray-800">
                {t('add_product.addProduct.title')}
              </Title>
              <p className="text-sm text-gray-500 mt-1">
                {t('add_product.addProduct.subtitle')}
              </p>
            </div>
          </div>

          <form
            className="space-y-6 sm:space-y-8"
            onSubmit={handleUploadProduct}
          >
            {/* Image Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('add_product.addProduct.images.title')}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {["image1", "image2", "image3", "image4"].map(
                  (imageKey, index) => (
                    <div key={imageKey} className="relative">
                      <label htmlFor={imageKey} className="block">
                        <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors duration-200 min-h-[120px] flex flex-col items-center justify-center bg-white">
                          {imageFiles[imageKey] ? (
                            <>
                              <img
                                src={URL.createObjectURL(imageFiles[imageKey])}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md mb-2"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeImage(imageKey);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                              <span className="text-xs text-gray-600">
                                {t('add_product.addProduct.images.change')}
                              </span>
                            </>
                          ) : (
                            <>
                              <IoMdCloudUpload className="text-3xl text-gray-400 mb-2" />
                              <span className="text-xs text-gray-600">
                                {t('add_product.addProduct.images.upload', { number: index + 1 })}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            id={imageKey}
                            hidden
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, imageKey)}
                          />
                        </div>
                      </label>
                    </div>
                  )
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {t('add_product.addProduct.images.hint')}
              </p>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('add_product.addProduct.basicInfo.title')}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <Label htmlFor="name">{t('add_product.addProduct.basicInfo.name')}</Label>
                  <Input
                    type="text"
                    placeholder={t('add_product.addProduct.basicInfo.namePlaceholder')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="description">{t('add_product.addProduct.basicInfo.description')}</Label>
                  <textarea
                    placeholder={t('add_product.addProduct.basicInfo.descriptionPlaceholder')}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">{t('add_product.addProduct.basicInfo.brand')}</Label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? t('add_product.addProduct.basicInfo.loadingBrands') : t('add_product.addProduct.basicInfo.brandPlaceholder')}
                    </option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="_type">{t('add_product.addProduct.basicInfo.type')}</Label>
                  <select
                    name="_type"
                    value={formData._type}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('add_product.addProduct.basicInfo.typePlaceholder')}</option>
                    <option value="new_arrivals">{t('add_product.addProduct.basicInfo.typeOptions.new_arrivals')}</option>
                    <option value="best_sellers">{t('add_product.addProduct.basicInfo.typeOptions.best_sellers')}</option>
                    <option value="special_offers">{t('add_product.addProduct.basicInfo.typeOptions.special_offers')}</option>
                    <option value="promotions">{t('add_product.addProduct.basicInfo.typeOptions.promotions')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('add_product.addProduct.pricing.title')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="price">{t('add_product.addProduct.pricing.price')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t('add_product.addProduct.pricing.pricePlaceholder')}
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="discountedPercentage">{t('add_product.addProduct.pricing.discount')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder={t('add_product.addProduct.pricing.discountPlaceholder')}
                    name="discountedPercentage"
                    value={formData.discountedPercentage}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="stock">{t('add_product.addProduct.pricing.stock')}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder={t('add_product.addProduct.pricing.stockPlaceholder')}
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category and Settings */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('add_product.addProduct.category.title')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="category">{t('add_product.addProduct.category.category')}</Label>
                  <select
                    name="category"
                    value={translateCategory(formData.category)}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? t('add_product.addProduct.category.loadingCategories') : t('add_product.addProduct.category.categoryPlaceholder')}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={translateCategory(category.name)}>
                        {translateCategory(category.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="isAvailable">{t('add_product.addProduct.category.availability')}</Label>
                  <select
                    name="isAvailable"
                    value={formData.isAvailable.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">{t('add_product.addProduct.category.availabilityOptions.true')}</option>
                    <option value="false">{t('add_product.addProduct.category.availabilityOptions.false')}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="offer">{t('add_product.addProduct.category.offer')}</Label>
                  <select
                    name="offer"
                    value={formData.offer.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">{t('add_product.addProduct.category.offerOptions.false')}</option>
                    <option value="true">{t('add_product.addProduct.category.offerOptions.true')}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="badge">{t('add_product.addProduct.category.badge')}</Label>
                  <select
                    name="badge"
                    value={formData.badge.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">{t('add_product.addProduct.category.badgeOptions.false')}</option>
                    <option value="true">{t('add_product.addProduct.category.badgeOptions.true')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('add_product.addProduct.tags.title')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {tagOptions.map((tag) => (
                  <div className="flex items-center space-x-2" key={tag}>
                    <input
                      id={tag.toLowerCase()}
                      type="checkbox"
                      name="tags"
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
                    <label
                      htmlFor={tag.toLowerCase()}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                disabled={isLoading}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <SmallLoader />
                    <span>{t('add_product.addProduct.submit.adding')}</span>
                  </>
                ) : (
                  <>
                    <IoMdAdd className="text-lg" />
                    <span>{t('add_product.addProduct.submit.add')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

Add.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Add;