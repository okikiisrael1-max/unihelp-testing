const FormulaCategory = ({ title, active, dark }) => {
  return (
    <button
      className={`
        px-5 py-3 rounded-2xl text-sm font-medium
        transition-all duration-300 whitespace-nowrap
        ${
          active
            ? dark
              ? "bg-white text-black"
              : "bg-black text-white"
            : dark
            ? "bg-zinc-900 text-zinc-300"
            : "bg-white text-zinc-700"
        }
      `}
    >
      {title}
    </button>
  );
};

export default FormulaCategory;