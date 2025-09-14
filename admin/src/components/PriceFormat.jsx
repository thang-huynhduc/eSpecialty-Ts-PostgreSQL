import { cn } from "./ui/cn";
import { formatVND } from "../utils/currency";

const PriceFormat = ({ amount, className }) => {
  const formattedAmount = formatVND(amount);
  return <span className={cn(className)}>{formattedAmount}</span>;
};

export default PriceFormat;
