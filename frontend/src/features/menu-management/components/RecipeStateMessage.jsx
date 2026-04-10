function RecipeStateMessage({ kind, message }) {
  if (!message) {
    return null;
  }

  if (kind === 'error') {
    return (
      <p className="mb-4 rounded-[12px] border border-[#f3cece] bg-[#fdecec] px-4 py-3 text-center text-[#a61e1e]">
        {message}
      </p>
    );
  }

  return <p className="py-3 text-center">{message}</p>;
}

export default RecipeStateMessage;
