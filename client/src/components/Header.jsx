import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Container from "./Container";
import SearchInput from "./SearchInput";
import LanguageSwitcher from "./LanguageSwitcher";
import { IoMdCart } from "react-icons/io";
import { FaUserAlt } from "react-icons/fa";
import menuIcon from "../assets/images/menu.png";
import { logo } from "../assets/images";
import toast from "react-hot-toast";

export const getHeaderNavigation = (t) => [
  { title: t("navigation.home"), link: "/" },
  { title: t("navigation.shop"), link: "/shop" },
  { title: t("navigation.about"), link: "/about" },
  { title: t("navigation.contact"), link: "/contact" },
  { title: t("navigation.orders"), link: "/orders" },
];


const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { products, userInfo, orderCount, token } = useSelector(
    (state) => state.eSpecialtyReducer
  );

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showNav, setShowNav] = useState(true); // 🔹 state để ẩn/hiện hàng 2

  const toggleCategory = () => setIsCategoryOpen(!isCategoryOpen);
  const headerNavigation = getHeaderNavigation(t);

  // 🔹 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/category`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        } else {
          toast.error(data.message || "Failed to fetch categories");
        }
      } catch (err) {
        console.error("Fetch categories error:", err);
        toast.error("Failed to fetch categories");
      }
    };

    fetchCategories();
  }, [token]);

  // 🔹 Lắng nghe scroll để ẩn/hiện navigation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="border-b border-gray-200 sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <Container className="py-2 lg:py-3 w-full flex flex-col gap-1">
        {/* 🔹 Hàng 1 */}
        <div className="flex items-center justify-between w-full">
          {/* Category icon */}
          <div className="relative">
            <button
              onClick={toggleCategory}
              className="flex items-center gap-1 text-gray-700 hover:text-black px-2 py-2 transition-all"
            >
              <img src={menuIcon} alt="categories" className="h-6 w-auto" />
            </button>
            {isCategoryOpen && categories.length > 0 && (
              <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-100 z-50">
                <ul className="py-2">
                  <li>
                    <Link
                      to="/shop"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      onClick={() => setIsCategoryOpen(false)}
                    >
                      All Products
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat._id}>
                      <Link
                        to={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Logo */}
          <Link to={"/"} className="flex-shrink-0">
            <img src={logo} alt="logo" className="h-6 w-auto" />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-lg px-4">
            <SearchInput />
          </div>

          {/* Cart */}
          <Link
            to={"/cart"}
            className="text-2xl text-gray-700 hover:text-black relative transition-colors duration-300 p-2"
          >
            <IoMdCart />
            {products?.length > 0 && (
              <span className="absolute -right-1 -top-1 w-5 h-5 rounded-full text-xs bg-black text-white flex items-center justify-center font-medium animate-pulse">
                {products.length}
              </span>
            )}
          </Link>

          {/* User info */}
          {userInfo ? (
            <Link
              to={"/profile"}
              className="text-sm text-gray-700 hover:text-black font-medium transition-colors duration-300 px-2 py-1 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUserAlt className="text-xs text-gray-600" />
                </div>
                <span className="hidden lg:inline">{userInfo?.name}</span>
              </div>
            </Link>
          ) : (
            <Link
              to={"/signin"}
              className="text-xl text-gray-700 hover:text-black relative transition-colors duration-300 p-2"
            >
              <FaUserAlt />
            </Link>
          )}

          {/* Language */}
          <LanguageSwitcher />
        </div>

        {/* 🔹 Hàng 2 - Navigation */}
        <div
          className={`hidden md:flex items-center gap-4 justify-center text-xs uppercase font-medium text-gray-700 transition-all duration-300 overflow-hidden ${
            showNav ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {headerNavigation.map((item) => (
            <NavLink
              key={item?.title}
              to={item?.link}
              state={{ data: location.pathname.split("/")[1] }}
              className={`hover:text-black duration-300 relative group overflow-hidden px-1 py-2 transition-colors ${
                location?.pathname === item?.link
                  ? "text-black font-semibold"
                  : "text-gray-700"
              }`}
            >
              <div className="relative flex items-center">
                {item?.title}
                {item?.title === t("navigation.orders") &&
                  userInfo &&
                  orderCount > 0 && (
                    <span className="absolute -right-1 -top-2 w-4 h-4 rounded-full text-xs bg-red-500 text-white flex items-center justify-center font-medium animate-pulse">
                      {orderCount}
                    </span>
                  )}
              </div>
              <span
                className={`absolute bottom-0 left-0 inline-block w-full h-0.5 bg-black group-hover:translate-x-0 duration-300 ease-out ${
                  location?.pathname === item?.link
                    ? "translate-x-0"
                    : "-translate-x-full"
                }`}
              />
            </NavLink>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Header;