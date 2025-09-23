import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Container from "./Container";
import { Button } from "./ui/button";
import { paymentCard } from "../assets/images";
import SocialLinks from "./SocialLinks";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Footer = () => {
  const { t } = useTranslation();
  const [emailInfo, setEmailInfo] = useState("");
  const [subscription, setSubscription] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const { token } = useSelector((state) => state.eSpecialtyReducer);

  // ✅ Fetch categories
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

  const emailValidation = () => {
    return String(emailInfo)
      .toLocaleLowerCase()
      .match(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/);
  };

  const handleSubscription = () => {
    if (emailInfo === "") {
      setErrMsg(t("footer.email_required"));
    } else if (!emailValidation(emailInfo)) {
      setErrMsg(t("footer.email_invalid"));
    } else {
      setSubscription(true);
      setErrMsg("");
      setEmailInfo("");
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100">
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">eSpecialty</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {t("footer.brand_description")}
            </p>
            <SocialLinks
              className="text-gray-400 hover:text-gray-900"
              iconStyle="w-5 h-5 transition-colors duration-200"
            />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              {t("footer.quick_links")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-600 hover:text-gray-900 text-sm">
                  {t("footer.about_us")}
                </a>
              </li>
              <li>
                <a href="/shop" className="text-gray-600 hover:text-gray-900 text-sm">
                  {t("footer.shop")}
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">
                  {t("footer.contact")}
                </a>
              </li>
              <li>
                <a href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">
                  {t("footer.blog")}
                </a>
              </li>
              <li>
                <a href="/faq" className="text-gray-600 hover:text-gray-900 text-sm">
                  {t("footer.faq")}
                </a>
              </li>
            </ul>
          </div>

          {/* ✅ Dynamic Categories */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              {t("footer.categories")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/shop"
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              {t("footer.stay_updated")}
            </h4>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              {t("footer.newsletter_description")}
            </p>
            {subscription ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-green-700 text-sm font-medium">
                  {t("footer.subscribe_success")}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div>
                  <input
                    onChange={(e) => setEmailInfo(e.target.value)}
                    value={emailInfo}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-sm"
                    type="email"
                    placeholder={t("footer.email_placeholder")}
                  />
                  {errMsg && (
                    <p className="text-red-500 text-xs mt-2 animate-pulse">
                      {errMsg}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubscription}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg transition-colors duration-200"
                >
                  {t("footer.subscribe")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm">{t("footer.copyright")}</p>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">{t("footer.we_accept")}:</span>
              <img src={paymentCard} alt="Payment methods" className="h-8 object-contain opacity-60" />
            </div>
            <div className="flex gap-6">
              {[t("footer.privacy_policy"), t("footer.terms_of_service")].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-gray-500 hover:text-gray-900 text-sm transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
