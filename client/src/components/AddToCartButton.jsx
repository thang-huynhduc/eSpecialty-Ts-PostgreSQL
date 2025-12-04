import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import {
  addToCart,
  decreaseQuantity,
  increaseQuantity,
} from "../redux/especialtySlice";
import { FaMinus, FaPlus } from "react-icons/fa";
import { cn } from "./ui/cn";

const AddToCartButton = ({ item, className }) => {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.eSpecialtyReducer);
  const [existingProduct, setExistingProduct] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const availableItem = products.find(
      (product) => product?.id === item?.id
    );
    setExistingProduct(availableItem || null);
  }, [products, item]);

  const handleAddToCart = () => {
    // Kiểm tra nếu stock là 0 hoặc không đủ để thêm
    if (!item?.stock || item.stock <= 0) {
      toast.error("This product is out of stock!");
      return;
    }
    dispatch(addToCart(item));
    toast.success(`${item?.name.substring(0, 10)}... is added successfully!`);
  };

  const handleIncreaseQuantity = () => {
    // Kiểm tra nếu số lượng hiện tại đã đạt hoặc vượt stock
    if (existingProduct?.quantity >= item?.stock) {
      toast.error("Cannot add more, stock limit reached!");
      return;
    }
    dispatch(increaseQuantity(item?.id));
    toast.success("Quantity increased successfully!");
  };

  return (
    <>
      {existingProduct ? (
        <div
          className={cn(
            "flex self-start items-center justify-center gap-3 py-2",
            className
          )}
        >
          <button
            disabled={existingProduct?.quantity <= 1}
            onClick={() => {
              dispatch(decreaseQuantity(item?.id));
              toast.success("Quantity decreased successfully!");
            }}
            className="border border-gray-300 text-gray-700 p-2 hover:border-black hover:text-black rounded-md text-sm transition-all duration-200 cursor-pointer disabled:text-gray-300 disabled:border-gray-200 disabled:hover:border-gray-200 disabled:hover:text-gray-300"
          >
            <FaMinus />
          </button>
          <p className="text-sm font-medium w-8 text-center">
            {existingProduct?.quantity || 0}
          </p>
          <button
            onClick={handleIncreaseQuantity}
            disabled={existingProduct?.quantity >= item?.stock}
            className="border border-gray-300 text-gray-700 p-2 hover:border-black hover:text-black rounded-md text-sm transition-all duration-200 cursor-pointer disabled:text-gray-300 disabled:border-gray-200 disabled:hover:border-gray-200 disabled:hover:text-gray-300"
          >
            <FaPlus />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={!item?.stock || item.stock <= 0}
          className="w-full border border-black text-black text-xs font-medium py-3 px-6 uppercase tracking-wide hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("product.add_to_cart")}
        </button>
      )}
    </>
  );
};

AddToCartButton.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    stock: PropTypes.number, // Thêm stock vào PropTypes
  }).isRequired,
  className: PropTypes.string,
};

export default AddToCartButton;