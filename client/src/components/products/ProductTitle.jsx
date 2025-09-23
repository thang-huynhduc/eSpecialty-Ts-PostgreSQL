import { useState } from "react";

const ProductTitle = ({ name }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <h1
      className={`text-3xl md:text-4xl font-semibold text-gray-900 leading-tight cursor-pointer ${
        expanded ? "" : "line-clamp-2"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      {name}
    </h1>
  );
};

export default ProductTitle;
