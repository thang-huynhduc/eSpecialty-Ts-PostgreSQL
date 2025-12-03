import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const PriceFormat = ({ amount, className }) => {
  const { i18n } = useTranslation();
  
  // FIX: Ép kiểu sang Number trước khi xử lý
  const numericAmount = Number(amount) || 0;

  const formatCurrency = (value) => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const currency = i18n.language === 'vi' ? 'VND' : 'USD';
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: i18n.language === 'vi' ? 0 : 2,
    }).format(value);
  };

  return (
    <span className={className}>
      {formatCurrency(numericAmount)}
    </span>
  );
};

PriceFormat.propTypes = {
  // FIX: Cho phép nhận cả string và number
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

export default PriceFormat;