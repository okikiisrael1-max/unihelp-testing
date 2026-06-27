import { BadgeCheck } from "lucide-react";

const VerifiedBadge = ({
  verified,
  size = 18,
  text = false,
  animated = true,
  variant = "green", // sky | gold | green
}) => {
  if (!verified) return null;

  const variants = {
    sky: {
      icon: "text-sky-500",
      glow: "shadow-sky-500/40",
      bg: "bg-sky-500/10",
    },
    gold: {
      icon: "text-amber-400",
      glow: "shadow-amber-400/40",
      bg: "bg-amber-400/10",
    },
    green: {
      icon: "text-emerald-500",
      glow: "shadow-emerald-500/40",
      bg: "bg-emerald-500/10",
    },
  };

  const style = variants[variant];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5
        rounded-full backdrop-blur-md border border-white/10
        ${style.bg}
        ${animated ? "hover:scale-105 transition-all duration-300" : ""}
      `}
    >
      {/* ICON WRAPPER */}
      <div className="relative flex items-center justify-center">
        {/* glow ring */}
        <span
          className={`
            absolute inset-0 rounded-full blur-md opacity-60
            ${style.glow}
          `}
        />

        {/* pulse animation */}
        {animated && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
        )}

        <BadgeCheck
          size={size}
          className={`${style.icon} relative z-10`}
        />
      </div>

      {text && (
        <span
          className={`
            text-xs font-semibold tracking-wide
            ${style.icon}
          `}
        >
          Verified
        </span>
      )}
    </div>
  );
};

export default VerifiedBadge;