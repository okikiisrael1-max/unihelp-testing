import React, { useMemo, useState } from "react";
import {
  evaluate,
  matrix,
  multiply,
  det,
  inv,
} from "mathjs";
import Plot from "react-plotly.js";
import { motion, AnimatePresence } from "framer-motion";

import {
  FaCalculator,
  FaChartLine,
  FaTable,
  FaVectorSquare,
  FaChartBar,
  FaHistory,
  FaMoon,
  FaSun,
  FaEquals,
  FaTrash,
  FaInfoCircle,
  FaBars,
  FaTimes,
  FaLightbulb,
} from "react-icons/fa";

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function AcademicCalculator({dark}) {


  const [activeTab, setActiveTab] = useState("scientific");

  const [history, setHistory] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ======================================================
  // THEME
  // ======================================================

  const theme = useMemo(() => {
    return dark
      ? {
          bg: "bg-[#020617]",
          card: "bg-[#0f172a]",
          soft: "bg-[#1e293b]",
          softHover: "hover:bg-[#334155]",
          input: "bg-[#020617]",
          border: "border-slate-800",
          text: "text-white",
          muted: "text-slate-400",
          primary:
            "bg-indigo-600 hover:bg-indigo-700 active:scale-95",
          danger:
            "bg-red-500 hover:bg-red-600 active:scale-95",
          success:
            "bg-emerald-500 hover:bg-emerald-600 active:scale-95",
        }
      : {
          bg: "bg-slate-100",
          card: "bg-white",
          soft: "bg-slate-200",
          softHover: "hover:bg-slate-300",
          input: "bg-white",
          border: "border-slate-300",
          text: "text-black",
          muted: "text-slate-500",
          primary:
            "bg-indigo-500 hover:bg-indigo-600 active:scale-95",
          danger:
            "bg-red-500 hover:bg-red-600 active:scale-95",
          success:
            "bg-emerald-500 hover:bg-emerald-600 active:scale-95",
        };
  }, [dark]);

  // ======================================================
  // TABS
  // ======================================================

  const tabs = [
    {
      id: "scientific",
      title: "Scientific",
      desc: "Advanced math operations",
      icon: <FaCalculator />,
    },
    {
      id: "matrix",
      title: "Matrix",
      desc: "Matrix calculations",
      icon: <FaTable />,
    },
    {
      id: "vector",
      title: "Vector",
      desc: "Vector operations",
      icon: <FaVectorSquare />,
    },
    {
      id: "statistics",
      title: "Statistics",
      desc: "Analyze datasets",
      icon: <FaChartBar />,
    },
    {
      id: "graph",
      title: "Graph",
      desc: "Plot equations visually",
      icon: <FaChartLine />,
    },
  ];

  return (
    <div
      className={`min-h-screen md:pt-20 ${theme.bg} ${theme.text} transition-all duration-300`}
    >
      <div className="flex min-h-screen">
        {/* ======================================================
            MOBILE OVERLAY
        ====================================================== */}

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50
            h-screen w-[280px]
            transition-transform duration-300
            border-r
            ${theme.card}
            ${theme.border}
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <div className="flex flex-col h-full p-5">
            {/* HEADER */}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(false)}
                className={`lg:hidden p-2 rounded-xl ${theme.soft}`}
              >
                <FaTimes />
              </button>
            </div>

            {/* NAVIGATION */}

            <div className="mt-8 flex-1 overflow-auto">
              <p
                className={`text-xs uppercase tracking-wider mb-4 ${theme.muted}`}
              >
                Calculator Tools
              </p>

              <div className="space-y-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full p-4 rounded-2xl text-left transition-all
                      ${
                        activeTab === tab.id
                          ? `${theme.primary} text-white`
                          : `${theme.soft} ${theme.softHover}`
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-xl mt-1">
                        {tab.icon}
                      </div>

                      <div>
                        <h3 className="font-bold">
                          {tab.title}
                        </h3>

                        <p className="text-sm opacity-80">
                          {tab.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* HISTORY */}

              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <FaHistory />

                  <h2 className="font-bold">History</h2>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-auto">
                  {history.length === 0 && (
                    <div
                      className={`p-4 rounded-2xl ${theme.soft}`}
                    >
                      <p
                        className={`text-sm ${theme.muted}`}
                      >
                        Your recent calculations will
                        appear here.
                      </p>
                    </div>
                  )}

                  {history.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl ${theme.soft}`}
                    >
                      <p className="text-sm break-all">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="flex-1 w-full">
          {/* TOPBAR */}

          <div
            className={`
              sticky top-0 z-30
              backdrop-blur-xl
              border-b
              ${theme.border}
              ${theme.card}/80
            `}
          >
            <div className="flex items-center justify-between px-4 md:px-8 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`lg:hidden p-3 rounded-2xl ${theme.soft}`}
                >
                  <FaBars />
                </button>

                <div>
                  <h2 className="text-xl md:text-2xl font-black">
                    {
                      tabs.find(
                        (tab) => tab.id === activeTab
                      )?.title
                    }
                  </h2>

                  <p
                    className={`text-sm ${theme.muted}`}
                  >
                    {
                      tabs.find(
                        (tab) => tab.id === activeTab
                      )?.desc
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}

          <div className="p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                }}
                transition={{
                  duration: 0.25,
                }}
              >
                {activeTab === "scientific" && (
                  <ScientificCalculator
                    theme={theme}
                    setHistory={setHistory}
                  />
                )}

                {activeTab === "matrix" && (
                  <MatrixCalculator theme={theme} />
                )}

                {activeTab === "vector" && (
                  <VectorCalculator theme={theme} />
                )}

                {activeTab === "statistics" && (
                  <StatisticsCalculator theme={theme} />
                )}

                {activeTab === "graph" && (
                  <GraphCalculator
                    theme={theme}
                    dark={dark}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ======================================================
// SECTION TITLE
// ======================================================

function SectionHeader({
  title,
  subtitle,
  theme,
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-black">
        {title}
      </h2>

      <p className={`mt-2 ${theme.muted}`}>
        {subtitle}
      </p>
    </div>
  );
}

// ======================================================
// SCIENTIFIC CALCULATOR
// ======================================================

function ScientificCalculator({
  theme,
  setHistory,
}) {
  const [expression, setExpression] =
    useState("");

  const [result, setResult] = useState("0");

  const buttons = [
    "sin(",
    "cos(",
    "tan(",
    "sqrt(",
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "^",
    "+",
    "(",
    ")",
    "log(",
    "pi",
  ];

  const calculate = () => {
    try {
      const res = evaluate(expression);

      setResult(res.toString());

      setHistory((prev) => [
        `${expression} = ${res}`,
        ...prev,
      ]);
    } catch {
      setResult("Error");
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Scientific Calculator"
        subtitle="Solve advanced mathematical expressions quickly and easily."
        theme={theme}
      />

      <div className="grid xl:grid-cols-2 gap-8">
        {/* CALCULATOR */}

        <div
          className={`rounded-3xl p-5 md:p-6 ${theme.card} border ${theme.border}`}
        >
          {/* HELP */}

          <div
            className={`flex items-start gap-3 p-4 rounded-2xl mb-6 ${theme.soft}`}
          >
            <FaInfoCircle className="mt-1" />

            <div className="text-sm">
              <p className="font-bold mb-1">
                How to use
              </p>

              <p className={theme.muted}>
                Tap the buttons to build your
                equation, then press Calculate.
              </p>
            </div>
          </div>

          {/* DISPLAY */}

          <div
            className={`rounded-3xl p-5 md:p-6 ${theme.input} border ${theme.border}`}
          >
            <div
              className={`text-right text-base md:text-lg ${theme.muted}`}
            >
              {expression || "0"}
            </div>

            <div className="text-right text-3xl md:text-5xl font-black mt-4 break-all">
              {result}
            </div>
          </div>

          {/* BUTTONS */}

          <div className="grid grid-cols-4 gap-3 mt-6">
            {buttons.map((btn) => (
              <button
                key={btn}
                onClick={() =>
                  setExpression(expression + btn)
                }
                className={`
                  h-14 md:h-16 rounded-2xl font-bold text-base md:text-lg transition-all
                  ${
                    ["+", "-", "*", "/"].includes(btn)
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : `${theme.soft} ${theme.softHover}`
                  }
                `}
              >
                {btn}
              </button>
            ))}

            <button
              onClick={() => {
                setExpression("");
                setResult("0");
              }}
              className={`h-14 md:h-16 rounded-2xl text-white font-bold transition-all ${theme.danger}`}
            >
              <FaTrash className="mx-auto" />
            </button>

            <button
              onClick={calculate}
              className={`col-span-3 h-14 md:h-16 rounded-2xl text-white font-black text-lg md:text-xl flex items-center justify-center gap-3 transition-all ${theme.primary}`}
            >
              <FaEquals />
              Calculate
            </button>
          </div>
        </div>

        {/* QUICK GUIDE */}

        <div className="space-y-6">
          {/* FORMULAS */}

          <div
            className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}
          >
            <div className="flex items-center gap-3 mb-5">
              <FaLightbulb />

              <h2 className="text-xl font-black">
                Popular Formulas
              </h2>
            </div>

            <div className="grid gap-4">
              {[
                "F = ma",
                "E = mc²",
                "PV = nRT",
                "a² + b² = c²",
                "V = IR",
                "sin²x + cos²x = 1",
              ].map((formula) => (
                <div
                  key={formula}
                  className={`p-4 rounded-2xl ${theme.soft}`}
                >
                  <p className="font-semibold">
                    {formula}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* EXAMPLES */}

          <div
            className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}
          >
            <h2 className="text-xl font-black mb-5">
              Examples
            </h2>

            <div className="space-y-4">
              {[
                "sqrt(25)",
                "sin(pi / 2)",
                "5^2 + 10",
                "log(100)",
              ].map((example) => (
                <div
                  key={example}
                  className={`p-4 rounded-2xl ${theme.soft}`}
                >
                  <p className="font-semibold">
                    {example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// MATRIX CALCULATOR
// ======================================================

function MatrixCalculator({ theme }) {
  const [A, setA] = useState("1,2\n3,4");

  const [B, setB] = useState("5,6\n7,8");

  const [result, setResult] = useState("");

  const parseMatrix = (text) =>
    text
      .split("\n")
      .map((row) =>
        row.split(",").map(Number)
      );

  const operate = (type) => {
    try {
      const mA = matrix(parseMatrix(A));

      const mB = matrix(parseMatrix(B));

      let res;

      if (type === "multiply")
        res = multiply(mA, mB);

      if (type === "det") res = det(mA);

      if (type === "inverse")
        res = inv(mA);

      setResult(JSON.stringify(res, null, 2));
    } catch {
      setResult("Invalid Matrix");
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Matrix Calculator"
        subtitle="Perform matrix multiplication, determinant and inverse calculations."
        theme={theme}
      />

      <div className="grid xl:grid-cols-2 gap-8">
        {/* INPUT */}

        <div className="space-y-5">
          <div
            className={`p-4 rounded-2xl ${theme.soft}`}
          >
            <p className="font-semibold mb-2">
              Matrix A
            </p>

            <p className={`text-sm ${theme.muted}`}>
              Separate numbers with commas and
              rows with new lines.
            </p>
          </div>

          <textarea
            rows={6}
            value={A}
            onChange={(e) => setA(e.target.value)}
            className={`w-full rounded-3xl p-5 resize-none ${theme.card} border ${theme.border}`}
          />

          <div
            className={`p-4 rounded-2xl ${theme.soft}`}
          >
            <p className="font-semibold mb-2">
              Matrix B
            </p>
          </div>

          <textarea
            rows={6}
            value={B}
            onChange={(e) => setB(e.target.value)}
            className={`w-full rounded-3xl p-5 resize-none ${theme.card} border ${theme.border}`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => operate("multiply")}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.primary}`}
            >
              Multiply
            </button>

            <button
              onClick={() => operate("det")}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.success}`}
            >
              Determinant
            </button>

            <button
              onClick={() => operate("inverse")}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.primary}`}
            >
              Inverse
            </button>
          </div>
        </div>

        {/* RESULT */}

        <div
          className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}
        >
          <h2 className="text-2xl font-black mb-5">
            Result
          </h2>

          <pre className="whitespace-pre-wrap overflow-auto text-sm">
            {result || "Your result will appear here"}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// VECTOR CALCULATOR
// ======================================================

function VectorCalculator({ theme }) {
  const [v1, setV1] = useState("1,2,3");

  const [v2, setV2] = useState("4,5,6");

  const [result, setResult] = useState("");

  const parse = (v) =>
    v.split(",").map(Number);

  const dot = () => {
    const a = parse(v1);

    const b = parse(v2);

    const res = a.reduce(
      (sum, val, i) => sum + val * b[i],
      0
    );

    setResult(`Dot Product = ${res}`);
  };

  const magnitude = () => {
    const a = parse(v1);

    const res = Math.sqrt(
      a.reduce(
        (sum, val) => sum + val * val,
        0
      )
    );

    setResult(`Magnitude = ${res}`);
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Vector Calculator"
        subtitle="Calculate vector dot products and magnitudes."
        theme={theme}
      />

      <div className="grid xl:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div
            className={`p-4 rounded-2xl ${theme.soft}`}
          >
            <p className="font-semibold">
              Example format:
            </p>

            <p className={`text-sm ${theme.muted}`}>
              1,2,3
            </p>
          </div>

          <input
            value={v1}
            onChange={(e) => setV1(e.target.value)}
            className={`w-full p-5 rounded-3xl ${theme.card} border ${theme.border}`}
          />

          <input
            value={v2}
            onChange={(e) => setV2(e.target.value)}
            className={`w-full p-5 rounded-3xl ${theme.card} border ${theme.border}`}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={dot}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.primary}`}
            >
              Dot Product
            </button>

            <button
              onClick={magnitude}
              className={`p-5 rounded-2xl text-white font-bold transition-all ${theme.success}`}
            >
              Magnitude
            </button>
          </div>
        </div>

        <div
          className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}
        >
          <h2 className="text-2xl font-black mb-5">
            Result
          </h2>

          <div className="text-2xl md:text-4xl font-black break-all">
            {result || "No result yet"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// STATISTICS CALCULATOR
// ======================================================

function StatisticsCalculator({ theme }) {
  const [data, setData] = useState(
    "1,2,3,4,5"
  );

  const [stats, setStats] = useState(null);

  const calculate = () => {
    const arr = data
      .split(",")
      .map(Number);

    const mean =
      arr.reduce((a, b) => a + b, 0) /
      arr.length;

    const variance =
      arr.reduce(
        (a, b) => a + (b - mean) ** 2,
        0
      ) / arr.length;

    const std = Math.sqrt(variance);

    setStats({
      mean,
      variance,
      std,
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Statistics Calculator"
        subtitle="Analyze your data with mean, variance and standard deviation."
        theme={theme}
      />

      <div className="grid xl:grid-cols-2 gap-8">
        {/* INPUT */}

        <div>
          <div
            className={`p-4 rounded-2xl mb-5 ${theme.soft}`}
          >
            <p className="font-semibold mb-2">
              Enter numbers separated by commas
            </p>

            <p className={`text-sm ${theme.muted}`}>
              Example: 1,2,3,4,5
            </p>
          </div>

          <textarea
            rows={8}
            value={data}
            onChange={(e) =>
              setData(e.target.value)
            }
            className={`w-full rounded-3xl p-5 resize-none ${theme.card} border ${theme.border}`}
          />

          <button
            onClick={calculate}
            className={`mt-5 w-full p-5 rounded-2xl text-white font-black transition-all ${theme.primary}`}
          >
            Calculate Statistics
          </button>
        </div>

        {/* RESULT */}

        <div
          className={`rounded-3xl p-6 ${theme.card} border ${theme.border}`}
        >
          {!stats ? (
            <div
              className={`h-full flex items-center justify-center ${theme.muted}`}
            >
              Your statistics will appear here
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3
                  className={`text-sm ${theme.muted}`}
                >
                  Mean
                </h3>

                <p className="text-4xl font-black">
                  {stats.mean}
                </p>
              </div>

              <div>
                <h3
                  className={`text-sm ${theme.muted}`}
                >
                  Variance
                </h3>

                <p className="text-4xl font-black">
                  {stats.variance}
                </p>
              </div>

              <div>
                <h3
                  className={`text-sm ${theme.muted}`}
                >
                  Standard Deviation
                </h3>

                <p className="text-4xl font-black">
                  {stats.std}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// GRAPH CALCULATOR
// ======================================================

function GraphCalculator({
  theme,
  dark,
}) {
  const [equation, setEquation] =
    useState("x^2");

  const x = Array.from(
    { length: 200 },
    (_, i) => i - 100
  );

  const y = x.map((val) => {
    try {
      return evaluate(equation, {
        x: val,
      });
    } catch {
      return 0;
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Graph Calculator"
        subtitle="Visualize mathematical equations instantly."
        theme={theme}
      />

      <div
        className={`p-4 rounded-2xl ${theme.soft}`}
      >
        <p className="font-semibold mb-2">
          Example equations
        </p>

        <p className={`text-sm ${theme.muted}`}>
          x^2, sin(x), cos(x), x^3
        </p>
      </div>

      <input
        value={equation}
        onChange={(e) =>
          setEquation(e.target.value)
        }
        className={`w-full p-5 rounded-3xl ${theme.card} border ${theme.border}`}
        placeholder="Enter equation..."
      />

      <div
        className={`rounded-3xl overflow-hidden border ${theme.border}`}
      >
        <Plot
          data={[
            {
              x,
              y,
              type: "scatter",
              mode: "lines",
              line: {
                color: "#6366f1",
              },
            },
          ]}
          layout={{
            autosize: true,
            paper_bgcolor: dark
              ? "#0f172a"
              : "#ffffff",
            plot_bgcolor: dark
              ? "#0f172a"
              : "#ffffff",
            font: {
              color: dark
                ? "#ffffff"
                : "#000000",
            },
            margin: {
              t: 20,
              l: 40,
              r: 20,
              b: 40,
            },
          }}
          style={{
            width: "100%",
            height: "600px",
          }}
          useResizeHandler
          config={{
            responsive: true,
          }}
        />
      </div>
    </div>
  );
}