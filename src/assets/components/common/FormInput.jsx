import { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { theme, inputBase, labelBase, fadeIn } from "../../utils/theme";

/* ────────────────────────────────────────────────
   FormInput
   A beautifully styled text / email / password input
   with optional icon, error state, and reveal toggle.
─────────────────────────────────────────────────── */
const FormInput = forwardRef(({
  dark, label, icon: Icon, type = "text",
  error, className = "", ...props
}, ref) => {
  const t = theme(dark);
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={`${labelBase} ${t.text}`}>{label}</label>
      )}

      <div className="relative">
        {/* Leading icon */}
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={18} className={t.textMuted} />
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          className={`${inputBase} ${t.input} ${
            Icon ? "pl-12" : "pl-4"
          } ${isPassword ? "pr-12" : "pr-4"} ${
            error ? t.inputError : ""
          }`}
          {...props}
        />

        {/* Password reveal toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal(!reveal)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.btnGhost} p-1 rounded-lg`}
            tabIndex={-1}
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="flex items-center gap-1.5 text-red-500 text-xs mt-1"
          >
            <AlertCircle size={12} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

FormInput.displayName = "FormInput";
export default FormInput;

/* ────────────────────────────────────────────────
   FormSelect
   A styled custom select with chevron icon.
─────────────────────────────────────────────────── */
export const FormSelect = forwardRef(({
  dark, label, icon: Icon, options = [],
  placeholder = "Select…", error, className = "", ...props
}, ref) => {
  const t = theme(dark);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={`${labelBase} ${t.text}`}>{label}</label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={18} className={t.textMuted} />
          </div>
        )}

        <select
          ref={ref}
          className={`${inputBase} appearance-none ${t.select} ${
            Icon ? "pl-12" : "pl-4"
          } pr-10 ${error ? t.inputError : ""}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom chevron */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`w-4 h-4 ${t.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="flex items-center gap-1.5 text-red-500 text-xs mt-1"
          >
            <AlertCircle size={12} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

FormSelect.displayName = "FormSelect";

/* ────────────────────────────────────────────────
   FormTextarea
   A styled multiline input.
─────────────────────────────────────────────────── */
export const FormTextarea = forwardRef(({
  dark, label, icon: Icon, error, className = "", rows = 4, ...props
}, ref) => {
  const t = theme(dark);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={`${labelBase} ${t.text}`}>{label}</label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-4 pointer-events-none">
            <Icon size={18} className={t.textMuted} />
          </div>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={`${inputBase} resize-none ${
            Icon ? "pl-12" : "pl-4"
          } pr-4 pt-3 ${t.input} ${error ? t.inputError : ""}`}
          {...props}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="flex items-center gap-1.5 text-red-500 text-xs mt-1"
          >
            <AlertCircle size={12} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

FormTextarea.displayName = "FormTextarea";
