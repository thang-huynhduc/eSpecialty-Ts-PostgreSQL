import Header from "./Header";
import { Outlet, ScrollRestoration } from "react-router-dom";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import "slick-carousel/slick/slick.css";
import { Provider } from "react-redux";
import { persistor, store } from "../redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import MainLoader from "./MainLoader";
import ServicesTag from "./ServicesTag";
import { FaShippingFast } from "react-icons/fa";

const RootLayout = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<MainLoader />} persistor={persistor}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center text-sm font-medium shadow-sm">
          <div className="flex items-center justify-center gap-2 flex-wrap overflow-hidden">
            <div className="marquee">
              <span className="flex items-center text-l font-semibold mr-2">
                <FaShippingFast className="mr-2" />
                FREESHIP - 30K THÀNH VIÊN MỚI
              </span>
              <span className="flex items-center text-l font-semibold mr-2">
                🎁 GIẢM 10% CHO ĐƠN HÀNG ĐẦU TIÊN
              </span>
              <span className="flex items-center text-l font-semibold mr-2">
                🛒 MUA 2 TẶNG 1 NHIỀU SẢN PHẨM HOT
              </span>
            </div>
          </div>
        </div>
        <Header />
        <ScrollRestoration />
        <Outlet />
        <ServicesTag />
        <Footer />
        <ScrollToTop />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#000000",
              color: "#ffffff",
            },
          }}
        />
      </PersistGate>
    </Provider>
  );
};

export default RootLayout;
