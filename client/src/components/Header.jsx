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

  const toggleCategory = () => setIsCategoryOpen(!isCategoryOpen);
  const headerNavigation = getHeaderNavigation(t);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // fetch categories
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

  return (
    <div className="border-b border-gray-200 sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <Container className="py-2 lg:py-3 w-full flex items-center justify-between gap-6">
        {/* LEFT: Category + Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Category */}
          <div className="relative">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-1 text-gray-700 hover:text-black px-2 py-2 transition-all"
            >
              <img src={menuIcon} alt="categories" className="h-6 w-auto" />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-100 z-50">
                <ul className="py-2">
                  {/* Navigation menu items */}
                  {headerNavigation.map((item) => (
                    <li key={item.title}>
                      <Link
                        to={item.link}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}

                  {/* Divider giữa navigation và categories */}
                  <li>
                    <hr className="my-1 border-gray-200" />
                  </li>

                  {/* Categories */}
                  {categories.map((cat) => (
                    <li key={cat._id}>
                      <Link
                        to={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        {t(`categories.${cat.name}`)}
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
        </div>

        {/* Search - Allow to shrink */}
        <div className="hidden lg:block w-80 max-w-[320px] flex-shrink">
          <SearchInput />
        </div>

        {/* RIGHT: Navigation + Cart + User + Language */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Navigation - Hidden on small screens to save space */}
          <div className="hidden xl:flex items-center gap-4 text-xs uppercase font-medium text-gray-700">
            {headerNavigation.map((item) => (
              <NavLink
                key={item?.title}
                to={item?.link}
                state={{ data: location.pathname.split("/")[1] }}
                className={({ isActive }) =>
                  `hover:text-black relative group transition-colors whitespace-nowrap ${isActive ? "text-black font-semibold" : "text-gray-700"
                  }`
                }
              >
                <div className="relative flex items-center">
                  {item?.title}
                  {item?.title === t("navigation.orders") &&
                    userInfo &&
                    orderCount > 0 && (
                      <span className="absolute -right-2 -top-2 w-4 h-4 rounded-full text-xs bg-red-500 text-white flex items-center justify-center font-medium animate-pulse">
                        {orderCount}
                      </span>
                    )}
                </div>
                <span
                  className="absolute bottom-0 left-0 inline-block w-full h-0.5 bg-black origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                />
              </NavLink>
            ))}
          </div>

          {/* Cart */}
          <Link
            to={"/cart"}
            className="text-2xl text-gray-700 hover:text-black relative transition-colors duration-300 p-2 flex-shrink-0"
          >
            <IoMdCart />
            {products?.length > 0 && (
              <span className="absolute -right-1 -top-1 w-5 h-5 rounded-full text-xs bg-black text-white flex items-center justify-center font-medium animate-pulse">
                {products.length}
              </span>
            )}
          </Link>

          {/* User - Fixed width to prevent overflow */}
          {userInfo ? (
            <Link
              to={"/profile"}
              className="flex items-center gap-2 px-2 py-1 text-sm text-gray-700 hover:text-black font-medium transition-colors hover:bg-gray-50 rounded-md max-w-[140px] min-w-[40px]"
            >
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUserAlt className="text-xs text-gray-600" />
              </div>
              <span className="hidden lg:inline truncate max-w-[80px]" title={userInfo?.name}>
                {userInfo?.name}
              </span>
            </Link>
          ) : (
            <Link
              to={"/signin"}
              className="text-xl text-gray-700 hover:text-black p-2 flex-shrink-0"
            >
              <FaUserAlt />
            </Link>
          )}

          {/* Language */}
          <div className="flex-shrink-0">
            <LanguageSwitcher />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Header;