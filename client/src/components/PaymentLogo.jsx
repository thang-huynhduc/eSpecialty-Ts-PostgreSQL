import PropTypes from "prop-types";

const paypalLogo = import.meta.env.VITE_PAYPAL_LOGO_URL;
const vnpayLogo = import.meta.env.VITE_VNPAY_LOGO_URL;
const codLogo = import.meta.env.VITE_COD_LOGO_URL;

const FALLBACKS = {
  paypal:
    "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg",
  vnpay:
    "https://seeklogo.com/vector-logo/428006/vnpay",
  cod:
    "https://static.thenounproject.com/png/cash-on-delivery-icon-4286952-512.png",
};

const PaymentLogo = ({ method, className = "w-5 h-5", alt = "" }) => {
  const srcMap = {
    paypal: paypalLogo || FALLBACKS.paypal,
    vnpay: vnpayLogo || FALLBACKS.vnpay,
    cod: codLogo || FALLBACKS.cod,
  };

  const key = (method || "").toLowerCase();
  const src = srcMap[key] || srcMap.cod;

  return (
    <img
      src={src}
      alt={alt || `${method || "payment"} logo`}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};

PaymentLogo.propTypes = {
  method: PropTypes.string,
  className: PropTypes.string,
  alt: PropTypes.string,
};

export default PaymentLogo;


