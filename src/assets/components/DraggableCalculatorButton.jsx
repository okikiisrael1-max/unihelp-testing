import React from "react";

import { motion } from "framer-motion";

import { FaCalculator, FaGraduationCap } from "react-icons/fa";


export default function DraggableCalculatorButton({ onClick, dark = false }) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      // PREVENT OUTSIDE SCREEN DRAGGING
      dragConstraints={{
        top: -500,
        left: -350,
        right: 0,
        bottom: 0,
      }}
      whileTap={{
        scale: 1.03,
      }}
      className="
        fixed
        z-[9999]
        bottom-24
        right-4
        sm:bottom-28
        sm:right-6
        cursor-grab
        active:cursor-grabbing
      "
    >
      {/* GLOW */}
      <div
        className="
          absolute
          inset-0
          rounded-full
          blur-xl
          bg-indigo-500/30
          animate-pulse
        "
      />

      {/* BUTTON */}
      <motion.button
        onClick={onClick}
        whileHover={{
          scale: 1.04,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
        }}
        className={`
          relative
          overflow-hidden
          flex
          items-center
          gap-2
          sm:gap-3

          px-3
          py-3

          sm:px-4
          sm:py-3

          rounded-full
          border
          shadow-2xl
          backdrop-blur-xl

          transition-all
          duration-300

          max-w-[13.75rem]

          ${
            dark
              ? `
                bg-[#0f172ad9]
                border-slate-700
                text-white
              `
              : `
                bg-white/90
                border-slate-300
                text-slate-900
              `
          }
        `}
      >
        {/* BACKGROUND GRADIENT */}
        <div
          className="
            absolute
            inset-0
            bg-linear-to-r
            from-indigo-500/10
            to-purple-500/10
          "
        />

        {/* ICON */}
        <div
          className="
            relative
            flex
            items-center
            justify-center

            w-10
            h-10

            sm:w-11
            sm:h-11

            rounded-full
            bg-indigo-600
            text-white
            shadow-lg
            shrink-0
          "
        >
          <FaCalculator className="text-sm sm:text-base" />
        </div>

        {/* TEXT */}
        <div className="relative flex max-md:hidden flex-col leading-tight">
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap">
            Calculator
          </span>

          <span className=" text-[9px] sm:text-[10px] opacity-70 whitespace-nowrap">
            Engineering Toolkit
          </span>
        </div>

        {/* EXTRA ICON */}
        <div
          className="
            relative
            hidden
            sm:flex
            items-center
            justify-center
          "
        >
          <FaGraduationCap
            className="
              text-indigo-400
              text-sm
            "
          />
        </div>
      </motion.button>
    </motion.div>
  );
}
