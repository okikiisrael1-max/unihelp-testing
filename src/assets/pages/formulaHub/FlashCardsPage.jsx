import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, Brain, Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formulas } from "../../data/sampleFormulas";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import EmptyState from "../../components/EmptyState";

const FlashCardsPage = ({ dark = false }) => {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeSubject, setActiveSubject] = useState("All");
  const [isShuffled, setIsShuffled] = useState(false);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const allSubjects = formulas.map((f) => f.subject);
    return ["All", ...new Set(allSubjects)];
  }, []);

  // Filtered formulas
  const filteredFormulas = useMemo(() => {
    let list = formulas;
    if (activeSubject !== "All") {
      list = list.filter((f) => f.subject === activeSubject);
    }
    
    // Create a copy to shuffle if needed
    if (isShuffled) {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    return list;
  }, [activeSubject, isShuffled]);

  // Handle Next
  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredFormulas.length);
    }, 150);
  };

  // Handle Previous
  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? filteredFormulas.length - 1 : prev - 1
      );
    }, 150);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleSubjectChange = (subject) => {
    setActiveSubject(subject);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const theme = {
    bg: dark ? "bg-black text-white" : "bg-zinc-50 text-black",
    card: dark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
    cardBack: dark ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50 border-indigo-200",
    soft: dark ? "bg-zinc-800" : "bg-zinc-100",
    text: dark ? "text-zinc-400" : "text-zinc-500",
    highlight: dark ? "text-white" : "text-black",
  };

  const currentFormula = filteredFormulas[currentIndex];

  return (
    <div className={`min-h-screen md:pt-20 px-4 sm:px-6 lg:px-10 py-6 transition-all duration-300 ${theme.bg}`}>
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/formula-hub")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 ${
              dark
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "bg-white text-black border border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                isShuffled 
                  ? "bg-indigo-600 text-white" 
                  : dark ? "bg-zinc-900 text-zinc-400 hover:text-white" : "bg-white text-zinc-600 border border-zinc-200"
              }`}
              title="Shuffle Cards"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${dark ? "bg-zinc-900" : "bg-white border border-zinc-200"}`}>
              <Brain className={`w-7 h-7 ${theme.highlight}`} />
            </div>
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${theme.highlight}`}>
                Flash Cards
              </h1>
              <p className={`mt-1 text-sm ${theme.text}`}>
                Test your memory with formula flashcards
              </p>
            </div>
          </div>
        </div>

        {/* CATEGORIES / SUBJECTS */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-6">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => handleSubjectChange(subject)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeSubject === subject
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : dark
                  ? "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        {filteredFormulas.length === 0 ? (
          <EmptyState
            dark={dark}
            title="No Formulas Found"
            description="There are no formulas in this subject yet."
          />
        ) : (
          <div className="relative">
            {/* PROGRESS BAR */}
            <div className="flex items-center justify-between mb-4 px-2">
              <span className={`text-sm font-medium ${theme.text}`}>
                Card {currentIndex + 1} of {filteredFormulas.length}
              </span>
              <div className="flex-1 max-w-[200px] h-2 rounded-full overflow-hidden ml-4 bg-zinc-200 dark:bg-zinc-800">
                <motion.div 
                  className="h-full bg-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / filteredFormulas.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* FLASH CARD CONTAINER */}
            <div className="perspective-1000 relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] max-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex + (isFlipped ? "-flipped" : "-front")}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`absolute inset-0 cursor-pointer rounded-[35px] border p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all ${
                    isFlipped ? theme.cardBack : theme.card
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${dark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                      {currentFormula.subject}
                    </span>
                  </div>

                  {!isFlipped ? (
                    // FRONT OF CARD (Title)
                    <div className="flex flex-col items-center gap-6">
                      <Sparkles className="w-10 h-10 text-indigo-500 opacity-50" />
                      <h2 className={`text-2xl sm:text-4xl font-bold px-4 ${theme.highlight}`}>
                        {currentFormula.title}
                      </h2>
                      <p className={`text-sm sm:text-base mt-2 flex items-center gap-2 ${theme.text}`}>
                        <RotateCcw className="w-4 h-4" />
                        Tap to reveal formula
                      </p>
                    </div>
                  ) : (
                    // BACK OF CARD (Formula & Explanation)
                    <div className="flex flex-col items-center w-full max-w-2xl">
                      <div className={`p-6 rounded-2xl w-full mb-6 ${dark ? "bg-black/50" : "bg-white/50"}`}>
                        <div className="text-xl sm:text-3xl overflow-x-auto scrollbar-hide flex justify-center">
                          {currentFormula.formula ? (
                            <BlockMath math={currentFormula.formula} />
                          ) : (
                            <span className={theme.text}>No formula</span>
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm sm:text-lg leading-relaxed ${dark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {currentFormula.explanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center justify-center gap-6 mt-10">
              <button
                onClick={handlePrev}
                className={`p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                  dark ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-white text-black border border-zinc-200 hover:bg-zinc-100 shadow-sm"
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Flip Card
              </button>

              <button
                onClick={handleNext}
                className={`p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                  dark ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-white text-black border border-zinc-200 hover:bg-zinc-100 shadow-sm"
                }`}
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashCardsPage;
