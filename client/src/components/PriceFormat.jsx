import { cn } from "./ui/cn";
import PropTypes from "prop-types";
import { formatVND } from "../utils/currency";

const PriceFormat = ({ amount, className }) => {
  const formattedAmount = formatVND(amount);
  return <span className={cn(className)}>{formattedAmount}</span>;
};

PriceFormat.propTypes = {
  amount: PropTypes.number,
  className: PropTypes.string,
};

export default PriceFormat;
