const FormulaVariables = ({ variables, dark }) => {
  return (
    <div className="mt-8">
      <h2
        className={`
          text-lg font-semibold mb-4
          ${dark ? "text-white" : "text-black"}
        `}
      >
        Variables
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {variables.map((item, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-2xl border
              ${
                dark
                  ? "bg-zinc-800 border-zinc-700"
                  : "bg-zinc-100 border-zinc-200"
              }
            `}
          >
            <h3
              className={`
                text-lg font-semibold
                ${dark ? "text-white" : "text-black"}
              `}
            >
              {item.symbol}
            </h3>

            <p
              className={`
                text-sm mt-1
                ${dark ? "text-zinc-400" : "text-zinc-600"}
              `}
            >
              {item.meaning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormulaVariables;