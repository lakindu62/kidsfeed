const VARIANT_CLASSES = {
  error:
    'mb-4 rounded-[12px] border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-center text-[#a61e1e]',
  default: 'py-3 text-center',
};

function RecipeStateMessage({ kind, message, className = '' }) {
  if (!message) {
    return null;
  }

  const variantClass = VARIANT_CLASSES[kind] || VARIANT_CLASSES.default;

  return <p className={`${variantClass} ${className}`.trim()}>{message}</p>;
}

export default RecipeStateMessage;
