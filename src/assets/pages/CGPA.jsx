import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  BookOpen,
  BarChart3,
  History,
  X,
  Award,
  Brain,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

/* =====================================================
   PRIMITIVES — one source of truth for every input,
   button, and field so the tool feels consistent
   instead of hand-styled per section.
===================================================== */

const cx = (...args) => args.filter(Boolean).join(" ");

const inputClass = (dark, hasError) =>
  cx(
    "w-full h-11 rounded-xl px-3.5 text-sm outline-none border transition-colors",
    "focus:ring-2 focus:ring-indigo-500/30",
    dark
      ? "bg-[#0b1220] border-white/10 placeholder:text-white/25 text-white focus:border-indigo-500"
      : "bg-white border-gray-200 placeholder:text-gray-400 text-gray-900 focus:border-indigo-500",
    hasError && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
  );

const buttonClass = (dark, variant, size) => {
  const sizes = {
    md: "h-11 px-4 text-sm",
    sm: "h-9 px-3 text-xs",
    icon: "h-11 w-11 p-0",
    iconSm: "h-9 w-9 p-0",
  };
  const ringOffset = dark ? "focus-visible:ring-offset-[#050816]" : "focus-visible:ring-offset-white";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500",
    purple: "bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-500",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500",
    dangerGhost: "bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white focus-visible:ring-rose-500",
    secondary: dark
      ? "bg-white/[0.06] hover:bg-white/10 text-white focus-visible:ring-white/30"
      : "bg-gray-100 hover:bg-gray-200 text-gray-900 focus-visible:ring-gray-300",
    ghost: dark
      ? "text-white/60 hover:text-white hover:bg-white/5 focus-visible:ring-white/20"
      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-300",
  };
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "focus:outline-none focus-visible:ring-2",
    ringOffset,
    sizes[size],
    variants[variant]
  );
};

function Button({ dark, variant = "primary", size = "md", icon: Icon, loading, className, children, ...props }) {
  return (
    <button className={cx(buttonClass(dark, variant, size), className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin shrink-0" /> : Icon ? <Icon size={16} className="shrink-0" /> : null}
      {children}
    </button>
  );
}

function IconButton({ dark, variant = "ghost", size = "icon", icon: Icon, label, className, ...props }) {
  return (
    <button aria-label={label} className={cx(buttonClass(dark, variant, size), className)} {...props}>
      <Icon size={16} />
    </button>
  );
}

function Field({ dark, label, htmlFor, hideLabel, hint, children }) {
  return (
    <div>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cx(
            "block text-[11px] font-semibold uppercase tracking-wide mb-1.5",
            dark ? "text-white/45" : "text-gray-500",
            hideLabel && "sr-only"
          )}
        >
          {label}
        </label>
      )}
      {children}
      {hint && <p className={cx("text-xs mt-1.5", dark ? "text-white/35" : "text-gray-400")}>{hint}</p>}
    </div>
  );
}

function TextInput({ dark, error, className, ...props }) {
  return <input className={cx(inputClass(dark, error), className)} {...props} />;
}

function NumberInput({ dark, error, suffix, className, ...props }) {
  return (
    <div className="relative">
      <input type="number" aria-invalid={!!error} className={cx(inputClass(dark, error), suffix && "pr-14", className)} {...props} />
      {suffix && (
        <span
          className={cx(
            "absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wide pointer-events-none",
            dark ? "text-white/25" : "text-gray-400"
          )}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function Card({ dark, className, children }) {
  return (
    <div
      className={cx(
        "rounded-2xl",
        dark ? "bg-white/[0.04] border border-white/10" : "bg-white border border-gray-200 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function SoftCard({ dark, className, children }) {
  return (
    <div
      className={cx(
        "rounded-xl",
        dark ? "bg-white/[0.03] border border-white/5" : "bg-gray-50 border border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeading({ dark, icon: Icon, tone = "indigo", title, subtitle, action }) {
  const toneBg = { indigo: "bg-indigo-500/10 text-indigo-500", purple: "bg-purple-500/10 text-purple-500" }[tone];
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <div className={cx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", toneBg)}><Icon size={18} /></div>}
        <div className="min-w-0">
          <h2 className="font-bold text-lg leading-tight truncate">{title}</h2>
          {subtitle && <p className={cx("text-xs mt-0.5", dark ? "text-white/45" : "text-gray-500")}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* =====================================================
   DATA HELPERS
===================================================== */

let idSeed = 0;
const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${idSeed++}`;

const createSemester = () => ({ id: makeId(), name: "", units: "", gpa: "" });
const createTargetCourse = () => ({ id: makeId(), title: "", unit: "" });

const CLASS_BANDS = [
  { min: 4.5, label: "First Class", tone: "amber" },
  { min: 3.5, label: "Second Class Upper", tone: "emerald" },
  { min: 2.4, label: "Second Class Lower", tone: "sky" },
  { min: 1.5, label: "Third Class", tone: "orange" },
  { min: 0, label: "Pass", tone: "rose" },
];

const TONE = {
  amber: { text: "text-amber-500", bg: "bg-amber-500/10", bar: "bg-amber-500" },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500/10", bar: "bg-emerald-500" },
  sky: { text: "text-sky-500", bg: "bg-sky-500/10", bar: "bg-sky-500" },
  orange: { text: "text-orange-500", bg: "bg-orange-500/10", bar: "bg-orange-500" },
  rose: { text: "text-rose-500", bg: "bg-rose-500/10", bar: "bg-rose-500" },
};

const getBand = (cgpa) => CLASS_BANDS.find((b) => cgpa >= b.min) ?? CLASS_BANDS[CLASS_BANDS.length - 1];
const getNextBand = (cgpa) => {
  const idx = CLASS_BANDS.findIndex((b) => cgpa >= b.min);
  return idx > 0 ? CLASS_BANDS[idx - 1] : null;
};

const parseUnits = (v) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) && n > 0 && n <= 30 ? n : null;
};
const parseGpa = (v) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) && n >= 0 && n <= 5 ? n : null;
};
const fmt2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

/* =====================================================
   COMPONENT
===================================================== */

const CGPATracker = ({ dark }) => {
  const [semesters, setSemesters] = useState([createSemester()]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [predictedGPA, setPredictedGPA] = useState("");
  const [predictedUnits, setPredictedUnits] = useState("");
  const [predictedResult, setPredictedResult] = useState(null);
  const [predictError, setPredictError] = useState("");

  const [targetCGPA, setTargetCGPA] = useState("");
  const [targetCourses, setTargetCourses] = useState([createTargetCourse()]);
  const [gradeAdvice, setGradeAdvice] = useState(null);
  const [targetError, setTargetError] = useState("");

  const [toasts, setToasts] = useState([]);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const bg = dark ? "bg-[#050816] text-white" : "bg-[#f5f7ff] text-gray-900";
  const subtle = dark ? "text-white/50" : "text-gray-500";
  const faint = dark ? "text-white/35" : "text-gray-400";
  const divider = dark ? "border-white/10" : "border-gray-200";

  /* ---------------- TOASTS ---------------- */

  const pushToast = useCallback((type, message) => {
    const id = makeId();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => { if (isMounted.current) setToasts((t) => t.filter((x) => x.id !== id)); }, 3500);
  }, []);
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  /* ---------------- SEMESTERS ---------------- */

  const addSemester = () => setSemesters((prev) => [...prev, createSemester()]);
  const removeSemester = (id) =>
    setSemesters((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      return updated.length ? updated : [createSemester()];
    });
  const updateSemester = (id, field, value) =>
    setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  /* ---------------- CALCULATIONS ---------------- */

  const validSemesters = useMemo(
    () => semesters.filter((s) => parseUnits(s.units) != null && parseGpa(s.gpa) != null),
    [semesters]
  );

  const totals = useMemo(
    () =>
      validSemesters.reduce(
        (acc, s) => {
          const units = parseUnits(s.units);
          const gpa = parseGpa(s.gpa);
          return { totalUnits: acc.totalUnits + units, totalPoints: acc.totalPoints + units * gpa };
        },
        { totalUnits: 0, totalPoints: 0 }
      ),
    [validSemesters]
  );

  const cgpa = totals.totalUnits ? totals.totalPoints / totals.totalUnits : 0;
  const cgpaLabel = fmt2(cgpa);
  const band = getBand(cgpa);
  const nextBand = getNextBand(cgpa);
  const bandTone = TONE[band.tone];
  const pointsToNext = nextBand ? nextBand.min - cgpa : null;

  const bestSemesterGpa = useMemo(
    () => (validSemesters.length ? Math.max(...validSemesters.map((s) => parseGpa(s.gpa))) : null),
    [validSemesters]
  );

  const declineWarning = useMemo(() => {
    if (validSemesters.length < 2) return "";
    const last = validSemesters[validSemesters.length - 1];
    const prev = validSemesters[validSemesters.length - 2];
    return parseGpa(last.gpa) < parseGpa(prev.gpa) ? "Your most recent semester GPA is lower than the one before it." : "";
  }, [validSemesters]);

  const canSave = validSemesters.length > 0;

  /* ---------------- PREDICTOR ---------------- */

  const predictNextCGPA = () => {
    setPredictError("");
    const gpa = parseGpa(predictedGPA);
    const units = parseUnits(predictedUnits);
    if (gpa == null || units == null) {
      setPredictError("Enter a GPA between 0–5 and units between 1–30.");
      setPredictedResult(null);
      return;
    }
    setPredictedResult((totals.totalPoints + units * gpa) / (totals.totalUnits + units));
  };

  /* ---------------- TARGET PLANNER ---------------- */

  const addTargetCourse = () => setTargetCourses((prev) => [...prev, createTargetCourse()]);
  const removeTargetCourse = (id) =>
    setTargetCourses((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      return updated.length ? updated : [createTargetCourse()];
    });
  const updateTargetCourse = (id, field, value) =>
    setTargetCourses((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const calculateRequiredGrades = () => {
    setTargetError("");
    setGradeAdvice(null);

    const target = parseGpa(targetCGPA);
    const totalNewUnits = targetCourses.reduce((sum, c) => sum + (parseUnits(c.unit) || 0), 0);

    if (target == null) return setTargetError("Enter a target CGPA between 0–5.");
    if (!totalNewUnits) return setTargetError("Add at least one course with a valid unit load.");

    const neededPoints = target * (totals.totalUnits + totalNewUnits);
    const avg = (neededPoints - totals.totalPoints) / totalNewUnits;

    if (avg > 5) return setTargetError("Not reachable with these units — add more units or lower the target.");
    if (avg <= 0) return setTargetError("You've already secured this target with your current record.");

    const getGrade = (gpa) => (gpa >= 4.5 ? "A" : gpa >= 3.5 ? "B" : gpa >= 2.5 ? "C" : gpa >= 1.5 ? "D" : "E");

    setGradeAdvice({
      avg,
      courses: targetCourses.filter((c) => parseUnits(c.unit) != null).map((c) => ({ ...c, required: getGrade(avg) })),
    });
  };

  /* ---------------- FETCH / SAVE / DELETE ---------------- */

  const fetchRecords = useCallback(
    async (user) => {
      try {
        const q = query(collection(db, "cgpaTracker"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
        if (isMounted.current) setRecords(data);
      } catch {
        if (isMounted.current) pushToast("error", "Couldn't load your saved records.");
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) fetchRecords(user);
      else setLoading(false);
    });
    return () => unsub();
  }, [fetchRecords]);

  const handleSave = async () => {
    if (!auth.currentUser) return pushToast("error", "Log in to save your CGPA record.");
    if (!canSave) return pushToast("error", "Add at least one complete semester before saving.");

    setSaving(true);
    try {
      await addDoc(collection(db, "cgpaTracker"), {
        userId: auth.currentUser.uid,
        semesters: validSemesters.map(({ name, units, gpa }, i) => ({
          name: name.trim() || `Semester ${i + 1}`,
          units: parseUnits(units),
          gpa: parseGpa(gpa),
        })),
        cgpa: cgpaLabel,
        createdAt: serverTimestamp(),
      });
      pushToast("success", "CGPA record saved.");
      await fetchRecords(auth.currentUser);
      if (isMounted.current) setShowSaveModal(false);
    } catch {
      pushToast("error", "Something went wrong while saving. Try again.");
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "cgpaTracker", id));
      if (isMounted.current) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        pushToast("success", "Record deleted.");
      }
    } catch {
      pushToast("error", "Couldn't delete this record.");
    } finally {
      if (isMounted.current) {
        setDeleting(null);
        setConfirmDeleteId(null);
      }
    }
  };

  const chartData = useMemo(() => records.map((r, i) => ({ name: `#${i + 1}`, cgpa: Number(r.cgpa) })), [records]);
  const trend = useMemo(() => {
    if (records.length < 2) return null;
    return Number(records[records.length - 1].cgpa) - Number(records[records.length - 2].cgpa);
  }, [records]);

  useEffect(() => {
    if (!showSaveModal && !confirmDeleteId) return;
    const onKey = (e) => { if (e.key === "Escape") { setShowSaveModal(false); setConfirmDeleteId(null); } };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [showSaveModal, confirmDeleteId]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className={`min-h-screen md:mb-20 w-full ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-28 lg:pb-8 space-y-5 md:space-y-6">

        {/* TOOLBAR */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">CGPA Tracker</h1>
            <p className={cx("text-sm mt-0.5", subtle)}>Log semesters, track trend, plan target grades</p>
          </div>
          <Button dark={dark} variant="primary" icon={Save} disabled={!canSave} onClick={() => setShowSaveModal(true)} className="hidden lg:inline-flex shrink-0">
            Save Record
          </Button>
        </div>

        {/* SUMMARY */}
        <Card dark={dark} className="p-5 md:p-6">
          <div className="grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-10 lg:items-center">
            <div className="flex items-center gap-4 sm:gap-5">
              <div>
                <p className={cx("text-[11px] font-semibold uppercase tracking-wide", faint)}>Current CGPA</p>
                <p className="text-5xl sm:text-6xl font-black mt-1 tabular-nums text-indigo-500 leading-none">{cgpaLabel}</p>
              </div>
              <div className={cx("h-12 w-px hidden sm:block", dark ? "bg-white/10" : "bg-gray-200")} />
              <div className="space-y-2">
                <span className={cx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", bandTone.bg, bandTone.text)}>
                  {band.label}
                </span>
                {trend != null && (
                  <div className={cx("flex items-center gap-1 text-xs font-medium", trend > 0 ? "text-emerald-500" : trend < 0 ? "text-rose-500" : faint)}>
                    {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                    {trend === 0 ? "No change" : `${trend > 0 ? "+" : ""}${trend.toFixed(2)} since last save`}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2 gap-2">
                <p className={cx("text-[11px] font-semibold uppercase tracking-wide", faint)}>Classification scale</p>
                {nextBand && <p className="text-xs font-medium text-indigo-500 whitespace-nowrap">{pointsToNext.toFixed(2)} to {nextBand.label}</p>}
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden flex">
                {[...CLASS_BANDS].reverse().map((b, i, arr) => {
                  const upper = i === arr.length - 1 ? 5 : arr[i + 1].min;
                  return <div key={b.label} className={cx(TONE[b.tone].bar, "opacity-70")} style={{ width: `${((upper - b.min) / 5) * 100}%` }} />;
                })}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow"
                  style={{ left: `calc(${Math.min(100, (cgpa / 5) * 100)}% - 7px)` }}
                  aria-hidden
                />
              </div>
              <div className="grid grid-cols-5 mt-2 text-center text-[10px] font-medium uppercase tracking-wide">
                {["Pass", "3rd", "2:2", "2:1", "1st"].map((l) => <span key={l} className={faint}>{l}</span>)}
              </div>
            </div>
          </div>
        </Card>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Total Units", value: totals.totalUnits || "—", icon: Award },
            { label: "Semesters Logged", value: validSemesters.length, icon: BookOpen },
            { label: "Best Semester GPA", value: bestSemesterGpa != null ? fmt2(bestSemesterGpa) : "—", icon: TrendingUp },
            { label: "Saved Records", value: records.length, icon: History },
          ].map((item) => (
            <Card key={item.label} dark={dark} className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className={cx("text-xs truncate", subtle)}>{item.label}</p>
                  <h2 className="text-xl font-bold mt-1.5 tabular-nums">{item.value}</h2>
                </div>
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <item.icon size={16} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-3 gap-5 md:gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">

            {/* SEMESTERS */}
            <Card dark={dark} className="p-4 sm:p-5 md:p-6">
              <SectionHeading
                dark={dark}
                title="Semester Records"
                subtitle="Units 1–30 · GPA 0.00–5.00"
                action={<Button dark={dark} variant="primary" size="sm" icon={Plus} onClick={addSemester}>Add</Button>}
              />

              {/* column headers — desktop only, mirrors the row grid exactly */}
              <div className={cx("hidden md:grid grid-cols-[1fr_104px_112px_44px] gap-3 px-1 mb-2 text-[11px] font-semibold uppercase tracking-wide", faint)}>
                <span>Semester</span>
                <span>Units</span>
                <span>GPA</span>
                <span aria-hidden />
              </div>

              <div className="space-y-2.5">
                {semesters.map((s, i) => {
                  const unitsInvalid = s.units !== "" && parseUnits(s.units) == null;
                  const gpaInvalid = s.gpa !== "" && parseGpa(s.gpa) == null;
                  return (
                    <SoftCard key={s.id} dark={dark} className="p-3.5">
                      <div className="grid md:grid-cols-[1fr_104px_112px_44px] gap-3 md:items-start">
                        <Field dark={dark} label="Semester" htmlFor={`sem-name-${s.id}`} hideLabel={true}>
                          <TextInput
                            dark={dark}
                            id={`sem-name-${s.id}`}
                            value={s.name}
                            onChange={(e) => updateSemester(s.id, "name", e.target.value)}
                            placeholder={`Semester ${i + 1}`}
                          />
                        </Field>

                        <Field dark={dark} label="Units" htmlFor={`sem-units-${s.id}`} hideLabel={true}>
                          <NumberInput
                            dark={dark}
                            id={`sem-units-${s.id}`}
                            min="1" max="30"
                            value={s.units}
                            onChange={(e) => updateSemester(s.id, "units", e.target.value)}
                            placeholder="24"
                            suffix="UNITS"
                            error={unitsInvalid}
                          />
                        </Field>

                        <Field dark={dark} label="GPA" htmlFor={`sem-gpa-${s.id}`} hideLabel={true}>
                          <NumberInput
                            dark={dark}
                            id={`sem-gpa-${s.id}`}
                            min="0" max="5" step="0.01"
                            value={s.gpa}
                            onChange={(e) => updateSemester(s.id, "gpa", e.target.value)}
                            placeholder="4.50"
                            error={gpaInvalid}
                          />
                        </Field>

                        <IconButton dark={dark} variant="dangerGhost" icon={Trash2} label="Remove semester" onClick={() => removeSemester(s.id)} className="w-full md:w-11" />
                      </div>

                      {(unitsInvalid || gpaInvalid) && (
                        <p className="text-xs text-rose-500 mt-2.5 flex items-center gap-1.5">
                          <AlertTriangle size={12} className="shrink-0" />
                          {unitsInvalid ? "Units must be 1–30. " : ""}{gpaInvalid ? "GPA must be 0.00–5.00." : ""}
                        </p>
                      )}
                    </SoftCard>
                  );
                })}
              </div>

              {declineWarning && (
                <div className="mt-4 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center gap-2 text-sm">
                  <AlertTriangle size={16} className="shrink-0" />
                  {declineWarning}
                </div>
              )}
            </Card>

            {/* CHART */}
            <Card dark={dark} className="p-4 sm:p-5 md:p-6">
              <SectionHeading dark={dark} title="Performance Trend" subtitle="CGPA across your saved records" />

              {loading ? (
                <div className={cx("h-64 rounded-xl animate-pulse", dark ? "bg-white/5" : "bg-gray-100")} />
              ) : chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
                  <History className={faint} size={26} />
                  <p className={cx("text-sm", subtle)}>Save a record to start tracking your trend.</p>
                </div>
              ) : (
                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cgpaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#252b3b" : "#e5e7eb"} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, opacity: 0.6 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12, opacity: 0.6 }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip
                        formatter={(v) => [Number(v).toFixed(2), "CGPA"]}
                        contentStyle={{ background: dark ? "#0b1220" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb", borderRadius: 12, fontSize: 13 }}
                      />
                      <Area type="monotone" dataKey="cgpa" stroke="#6366f1" strokeWidth={3} fill="url(#cgpaFill)" dot={{ r: 3, fill: "#6366f1" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-5 md:space-y-6">

            {/* PREDICTOR */}
            <Card dark={dark} className="p-4 sm:p-5 md:p-6">
              <SectionHeading dark={dark} icon={Brain} title="Predictor" subtitle="CGPA after next semester" />

              <div className="grid grid-cols-2 gap-3">
                <Field dark={dark} label="Expected GPA" htmlFor="pred-gpa">
                  <NumberInput dark={dark} id="pred-gpa" min="0" max="5" step="0.01" value={predictedGPA} onChange={(e) => setPredictedGPA(e.target.value)} placeholder="4.20" />
                </Field>
                <Field dark={dark} label="Expected Units" htmlFor="pred-units">
                  <NumberInput dark={dark} id="pred-units" min="1" max="30" value={predictedUnits} onChange={(e) => setPredictedUnits(e.target.value)} placeholder="21" suffix="UNITS" />
                </Field>
              </div>

              {predictError && <p className="text-xs text-rose-500 flex items-center gap-1.5 mt-3"><AlertTriangle size={12} className="shrink-0" />{predictError}</p>}

              <Button dark={dark} variant="primary" icon={Sparkles} onClick={predictNextCGPA} className="w-full mt-4">Predict</Button>

              {predictedResult != null && (
                <SoftCard dark={dark} className="mt-4 p-5 text-center">
                  <p className={cx("text-xs", faint)}>Projected CGPA</p>
                  <h1 className="text-4xl font-black mt-1 text-indigo-500 tabular-nums">{fmt2(predictedResult)}</h1>
                  <p className={cx("text-xs mt-2", subtle)}>{getBand(predictedResult).label}</p>
                </SoftCard>
              )}
            </Card>

            {/* TARGET PLANNER */}
            <Card dark={dark} className="p-4 sm:p-5 md:p-6">
              <SectionHeading dark={dark} icon={Target} tone="purple" title="Target Planner" subtitle="Grades needed to hit a target" />

              <Field dark={dark} label="Target CGPA" htmlFor="target-cgpa">
                <NumberInput dark={dark} id="target-cgpa" min="0" max="5" step="0.01" value={targetCGPA} onChange={(e) => setTargetCGPA(e.target.value)} placeholder="4.50" />
              </Field>

              <div className="mt-4">
                <div className={cx("hidden sm:grid grid-cols-[1fr_88px_36px] gap-2 px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-wide", faint)}>
                  <span>Course</span>
                  <span>Units</span>
                  <span aria-hidden />
                </div>
                <div className="space-y-2">
                  {targetCourses.map((c) => (
                    <div key={c.id} className="grid grid-cols-[1fr_72px_36px] sm:grid-cols-[1fr_88px_36px] gap-2">
                      <TextInput dark={dark} value={c.title} onChange={(e) => updateTargetCourse(c.id, "title", e.target.value)} placeholder="Course title" />
                      <NumberInput dark={dark} min="1" max="30" value={c.unit} onChange={(e) => updateTargetCourse(c.id, "unit", e.target.value)} placeholder="Units" />
                      <IconButton dark={dark} variant="dangerGhost" icon={X} label="Remove course" onClick={() => removeTargetCourse(c.id)} className="w-9 h-11" />
                    </div>
                  ))}
                </div>
              </div>

              <Button dark={dark} variant="ghost" size="sm" icon={Plus} onClick={addTargetCourse} className="mt-3 !px-0 !justify-start text-indigo-500 hover:!bg-transparent hover:!text-indigo-400">
                Add Course
              </Button>

              {targetError && <p className="text-xs text-rose-500 flex items-center gap-1.5 mt-2"><AlertTriangle size={12} className="shrink-0" />{targetError}</p>}

              <Button dark={dark} variant="purple" icon={BarChart3} onClick={calculateRequiredGrades} className="w-full mt-4">Calculate Required Grades</Button>

              {gradeAdvice && (
                <div className="mt-4 space-y-2">
                  <p className={cx("text-xs flex items-center gap-1.5", subtle)}>
                    <Info size={13} className="shrink-0" />
                    Average of {fmt2(gradeAdvice.avg)} points needed across these courses
                  </p>
                  {gradeAdvice.courses.map((c) => (
                    <SoftCard key={c.id} dark={dark} className="p-3.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.title || "Untitled course"}</p>
                        <p className={cx("text-xs mt-0.5", faint)}>{c.unit} Units</p>
                      </div>
                      <div className="text-emerald-500 font-black text-xl shrink-0">{c.required}</div>
                    </SoftCard>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* HISTORY */}
        <div>
          <SectionHeading dark={dark} icon={History} title="Saved Records" subtitle="Your CGPA history over time" />

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {[0, 1, 2].map((i) => <div key={i} className={cx("rounded-2xl h-40 animate-pulse", dark ? "bg-white/5" : "bg-gray-100")} />)}
            </div>
          ) : records.length === 0 ? (
            <Card dark={dark} className="p-10 sm:p-12 text-center">
              <History className={cx("mx-auto mb-3", faint)} size={26} />
              <h3 className="font-bold text-lg">No records yet</h3>
              <p className={cx("mt-1.5 text-sm", subtle)}>Fill in your semesters above and save your first record.</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {records.map((r) => (
                <Card key={r.id} dark={dark} className="p-4 sm:p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={cx("text-xs", faint)}>CGPA</p>
                      <h2 className="text-4xl font-black text-indigo-500 mt-1 tabular-nums">{r.cgpa}</h2>
                    </div>
                    <IconButton dark={dark} variant="dangerGhost" icon={Trash2} label="Delete record" onClick={() => setConfirmDeleteId(r.id)} />
                  </div>

                  <div className="space-y-2 mt-4 max-h-56 overflow-y-auto pr-1">
                    {r.semesters?.map((s, i) => (
                      <SoftCard key={i} dark={dark} className="p-3 flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{s.name}</p>
                          <p className={cx("text-xs mt-0.5", faint)}>{s.units} Units</p>
                        </div>
                        <div className="text-indigo-500 font-bold text-lg tabular-nums shrink-0">{fmt2(Number(s.gpa))}</div>
                      </SoftCard>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE STICKY SAVE BAR */}
      <div className={cx("lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 border-t backdrop-blur", dark ? "bg-[#050816]/90 border-white/10" : "bg-white/90 border-gray-200")}>
        <Button dark={dark} variant="primary" icon={Save} disabled={!canSave} onClick={() => setShowSaveModal(true)} className="w-full">
          Save Record
        </Button>
      </div>

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="save-modal-title" className={cx("w-full max-w-sm rounded-2xl p-6", dark ? "bg-[#0b1120] border border-white/10" : "bg-white")}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Save size={19} /></div>
              <IconButton dark={dark} icon={X} label="Close" onClick={() => setShowSaveModal(false)} />
            </div>
            <h2 id="save-modal-title" className="text-xl font-bold">Save this record?</h2>
            <p className={cx("text-sm mt-2", subtle)}>
              You're about to save a CGPA of <span className="font-bold text-indigo-500">{cgpaLabel}</span> across {validSemesters.length} semester{validSemesters.length === 1 ? "" : "s"}. You can delete it later from your history.
            </p>
            <div className="flex gap-3 mt-6">
              <Button dark={dark} variant="secondary" onClick={() => setShowSaveModal(false)} className="flex-1">Cancel</Button>
              <Button dark={dark} variant="primary" icon={Save} loading={saving} onClick={handleSave} className="flex-1">{saving ? "Saving…" : "Save Record"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" className={cx("w-full max-w-sm rounded-2xl p-6", dark ? "bg-[#0b1120] border border-white/10" : "bg-white")}>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4"><AlertTriangle size={19} /></div>
            <h2 id="delete-modal-title" className="text-xl font-bold">Delete this record?</h2>
            <p className={cx("text-sm mt-2", subtle)}>This can't be undone.</p>
            <div className="flex gap-3 mt-6">
              <Button dark={dark} variant="secondary" onClick={() => setConfirmDeleteId(null)} className="flex-1">Cancel</Button>
              <Button dark={dark} variant="danger" icon={Trash2} loading={deleting === confirmDeleteId} onClick={() => handleDelete(confirmDeleteId)} className="flex-1">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div aria-live="polite" className="fixed bottom-20 lg:bottom-5 right-4 left-4 sm:left-auto z-[60] space-y-2.5 sm:w-[calc(100%-2rem)] sm:max-w-sm">
        {toasts.map((t) => (
          <div key={t.id} className={cx("rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-lg", dark ? "bg-[#0b1120] border border-white/10" : "bg-white border border-gray-200")}>
            {t.type === "success" ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />}
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className={cx(faint, "hover:opacity-100")}><X size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CGPATracker;