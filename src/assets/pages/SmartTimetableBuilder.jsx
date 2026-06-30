import React, { useEffect, useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Download,
  Eraser,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const COLORS = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-sky-600",
  "bg-rose-600",
  "bg-violet-600",
];

const createEmptyCourse = (index = 0) => ({
  id: makeId(),
  code: "",
  title: "",
  lectures: "",
  duration: "",
  preferredDay: "",
  avoidDay: "",
  location: "",
  color: COLORS[index % COLORS.length],
});

const STORAGE_KEY = "unihelp-smart-timetable";

const baseInput = "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30";

const themeClasses = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark ? `${baseInput} border-white/10 bg-white/5 text-white placeholder:text-white/40` : `${baseInput} border-slate-200 bg-white text-slate-900`,
  muted: dark ? "text-slate-400" : "text-slate-500",
});

const hoursBetween = (start, end) => {
  const slots = [];
  for (let hour = Number(start); hour < Number(end); hour += 1) {
    slots.push(hour);
  }
  return slots;
};

const formatHour = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const value = hour % 12 || 12;
  return `${value}:00 ${suffix}`;
};

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyGrid = () => DAYS.reduce((grid, day) => ({ ...grid, [day]: [] }), {});

const overlaps = (items, start, end) => items.some((item) => start < item.end && end > item.start);

const generateTimetable = (courses, settings) => {
  const grid = createEmptyGrid();
  const warnings = [];
  const dayLoad = DAYS.reduce((load, day) => ({ ...load, [day]: 0 }), {});
  const validCourses = courses.filter((course) => course.code.trim() && Number(course.lectures) > 0);

  const orderedCourses = [...validCourses].sort((a, b) => Number(b.duration) - Number(a.duration));

  orderedCourses.forEach((course) => {
    const sessions = Math.max(1, Number(course.lectures) || 1);
    const duration = Math.max(1, Number(course.duration) || 1);

    for (let index = 0; index < sessions; index += 1) {
      const preferred = course.preferredDay && course.preferredDay !== "Any" ? [course.preferredDay] : [];
      const remainingDays = DAYS
        .filter((day) => course.avoidDay !== day && !preferred.includes(day))
        .sort((a, b) => dayLoad[a] - dayLoad[b]);
      const candidateDays = [...preferred, ...remainingDays];
      let placed = false;

      for (const day of candidateDays) {
        if (course.avoidDay === day) continue;

        for (let start = Number(settings.startHour); start + duration <= Number(settings.endHour); start += 1) {
          const end = start + duration;
          const crossesBreak = settings.useBreak && start < Number(settings.breakEnd) && end > Number(settings.breakStart);

          if (crossesBreak || overlaps(grid[day], start, end)) continue;

          grid[day].push({
            ...course,
            session: index + 1,
            start,
            end,
          });
          dayLoad[day] += duration;
          placed = true;
          break;
        }

        if (placed) break;
      }

      if (!placed) {
        warnings.push(`${course.code} session ${index + 1} could not fit. Extend your school day or reduce constraints.`);
      }
    }
  });

  Object.keys(grid).forEach((day) => {
    grid[day].sort((a, b) => a.start - b.start);
  });

  return { grid, warnings };
};

const getDefaultCourses = () => [createEmptyCourse()];

const getDefaultSettings = () => ({
  startHour: 8,
  endHour: 18,
  useBreak: true,
  breakStart: 12,
  breakEnd: 13,
});

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const drawText = (page, text, options) => {
  page.drawText(String(text || ""), options);
};

function StatCard({ dark, label, value, tone }) {
  const t = themeClasses(dark);
  return (
    <div className={`rounded-3xl border p-4 ${t.soft}`}>
      <p className={`text-xs font-bold uppercase ${t.muted}`}>{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone || ""}`}>{value}</p>
    </div>
  );
}

function CourseEditor({ dark, course, onChange, onRemove }) {
  const t = themeClasses(dark);

  return (
    <div className={`rounded-3xl border p-4 ${t.panel}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black">{course.code || "New Course"}</p>
          <p className={`truncate text-xs ${t.muted}`}>{course.title || "Add course details"}</p>
        </div>
        <button onClick={onRemove} className="rounded-2xl p-2 text-red-400 hover:bg-red-500/10" aria-label="Remove course">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input className={t.input} value={course.code} onChange={(e) => onChange({ code: e.target.value })} placeholder="Course code" />
        <input className={t.input} value={course.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Course title" />
        <label className="space-y-2">
          <span className={`text-xs font-bold uppercase ${t.muted}`}>Weekly lectures</span>
          <input className={t.input} type="number" min="1" max="6" value={course.lectures} onChange={(e) => onChange({ lectures: e.target.value })} />
        </label>
        <label className="space-y-2">
          <span className={`text-xs font-bold uppercase ${t.muted}`}>Hours per lecture</span>
          <input className={t.input} type="number" min="1" max="4" value={course.duration} onChange={(e) => onChange({ duration: e.target.value })} />
        </label>
        <label className="space-y-2">
          <span className={`text-xs font-bold uppercase ${t.muted}`}>Preferred day</span>
          <select className={t.input} value={course.preferredDay} onChange={(e) => onChange({ preferredDay: e.target.value })}>
            <option value="">No preference</option>
            {DAYS.map((day) => <option key={day}>{day}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className={`text-xs font-bold uppercase ${t.muted}`}>Avoid day</span>
          <select className={t.input} value={course.avoidDay} onChange={(e) => onChange({ avoidDay: e.target.value })}>
            <option value="">No restriction</option>
            {DAYS.map((day) => <option key={day}>{day}</option>)}
          </select>
        </label>
        <input className={t.input} value={course.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="Venue or room" />
        <select className={t.input} value={course.color} onChange={(e) => onChange({ color: e.target.value })}>
          {COLORS.map((color, index) => <option key={color} value={color}>Color {index + 1}</option>)}
        </select>
      </div>
    </div>
  );
}

function TimetableGrid({ dark, grid, settings }) {
  const t = themeClasses(dark);
  const slots = hoursBetween(settings.startHour, settings.endHour);

  return (
    <div className={`overflow-hidden rounded-3xl border ${t.panel}`}>
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className={`grid grid-cols-[120px_repeat(5,minmax(150px,1fr))] border-b text-sm font-black ${dark ? "border-white/10" : "border-slate-200"}`}>
            <div className={`p-4 ${t.soft}`}>Time</div>
            {DAYS.map((day) => <div key={day} className="p-4">{day}</div>)}
          </div>

          {slots.map((hour) => (
            <div key={hour} className={`grid min-h-[92px] grid-cols-[120px_repeat(5,minmax(150px,1fr))] border-b last:border-b-0 ${dark ? "border-white/10" : "border-slate-200"}`}>
              <div className={`p-4 text-sm font-bold ${t.soft}`}>{formatHour(hour)}</div>
              {DAYS.map((day) => {
                const items = grid[day].filter((item) => item.start === hour);
                const covered = grid[day].some((item) => item.start < hour && item.end > hour);
                const isBreak = settings.useBreak && hour >= Number(settings.breakStart) && hour < Number(settings.breakEnd);

                return (
                  <div key={`${day}-${hour}`} className={`min-h-[92px] border-l p-2 ${dark ? "border-white/10" : "border-slate-200"} ${isBreak ? "bg-amber-500/10" : ""}`}>
                    {isBreak && !covered && items.length === 0 && <p className="text-xs font-bold text-amber-500">Break</p>}
                    {!covered && items.map((item) => (
                      <div key={`${item.id}-${item.session}`} className={`${item.color} min-h-20 rounded-2xl p-3 text-white shadow-lg`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black">{item.code}</p>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">{item.end - item.start}h</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-white/85">{item.title}</p>
                        <p className="mt-2 text-xs font-bold text-white/90">{formatHour(item.start)} - {formatHour(item.end)}</p>
                        {item.location && <p className="mt-1 truncate text-xs text-white/80">{item.location}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SmartTimetableBuilder({ dark = false }) {
  const t = themeClasses(dark);
  const [courses, setCourses] = useState(getDefaultCourses);
  const [settings, setSettings] = useState(getDefaultSettings);
  const [generated, setGenerated] = useState(() => generateTimetable(getDefaultCourses(), getDefaultSettings()));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.courses) && parsed.settings) {
        setGenerated(generateTimetable(parsed.courses, parsed.settings));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const stats = useMemo(() => {
    const totalCourses = courses.filter((course) => course.code.trim()).length;
    const totalHours = courses.reduce((sum, course) => sum + (Number(course.lectures) || 0) * (Number(course.duration) || 0), 0);
    const scheduledHours = Object.values(generated.grid).flat().reduce((sum, item) => sum + (item.end - item.start), 0);

    return { totalCourses, totalHours, scheduledHours };
  }, [courses, generated]);

  const updateCourse = (id, patch) => {
    setCourses((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const addCourse = () => {
    setCourses((items) => [
      ...items,
      {
        ...createEmptyCourse(items.length),
      },
    ]);
  };

  const buildTimetable = () => {
    setGenerated(generateTimetable(courses, settings));
    setNotice("Timetable generated.");
  };

  const savePlan = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ courses, settings }));
    setNotice("Timetable plan saved on this device.");
  };

  const resetPlan = () => {
    const nextCourses = getDefaultCourses();
    const nextSettings = getDefaultSettings();
    setCourses(nextCourses);
    setSettings(nextSettings);
    setGenerated(generateTimetable(nextCourses, nextSettings));
    localStorage.removeItem(STORAGE_KEY);
    setNotice("Timetable reset.");
  };

  const exportPlan = () => {
    const rows = ["Day,Start,End,Course,Title,Venue"];
    DAYS.forEach((day) => {
      generated.grid[day].forEach((item) => {
        rows.push(`${day},${formatHour(item.start)},${formatHour(item.end)},${item.code},${item.title},${item.location}`);
      });
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "unihelp-timetable.csv");
  };

  const exportPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const sessions = DAYS.flatMap((day) => generated.grid[day].map((item) => ({ ...item, day })));
    let page = pdfDoc.addPage([842, 595]);
    let y = 545;

    drawText(page, "UniHelp Smart Timetable", {
      x: 40,
      y,
      size: 22,
      font: bold,
      color: rgb(0.12, 0.16, 0.28),
    });
    y -= 28;
    drawText(page, `School day: ${formatHour(settings.startHour)} - ${formatHour(settings.endHour)}`, {
      x: 40,
      y,
      size: 11,
      font: regular,
      color: rgb(0.32, 0.37, 0.46),
    });
    y -= 28;
    drawText(page, `Courses: ${stats.totalCourses}   Needed hours: ${stats.totalHours}   Scheduled hours: ${stats.scheduledHours}`, {
      x: 40,
      y,
      size: 11,
      font: bold,
      color: rgb(0.12, 0.16, 0.28),
    });
    y -= 34;

    const headers = ["Day", "Time", "Course", "Title", "Venue"];
    const widths = [110, 120, 90, 320, 130];
    const xStart = 40;
    const rowHeight = 24;

    const drawHeader = () => {
      let x = xStart;
      headers.forEach((header, index) => {
        page.drawRectangle({
          x,
          y: y - 6,
          width: widths[index],
          height: rowHeight,
          color: rgb(0.93, 0.95, 0.99),
        });
        drawText(page, header, { x: x + 8, y: y + 2, size: 10, font: bold, color: rgb(0.12, 0.16, 0.28) });
        x += widths[index];
      });
      y -= rowHeight;
    };

    drawHeader();

    if (sessions.length === 0) {
      drawText(page, "No scheduled sessions yet. Add courses and generate a timetable first.", {
        x: xStart,
        y: y - 4,
        size: 11,
        font: regular,
        color: rgb(0.42, 0.47, 0.56),
      });
    } else {
      sessions.forEach((item) => {
        if (y < 50) {
          page = pdfDoc.addPage([842, 595]);
          y = 545;
          drawHeader();
        }

        const row = [
          item.day,
          `${formatHour(item.start)} - ${formatHour(item.end)}`,
          item.code,
          item.title,
          item.location,
        ];
        let x = xStart;
        row.forEach((value, index) => {
          const text = String(value || "").slice(0, index === 3 ? 54 : 22);
          drawText(page, text, { x: x + 8, y: y + 2, size: 9, font: regular, color: rgb(0.18, 0.23, 0.33) });
          x += widths[index];
        });
        y -= rowHeight;
      });
    }

    const bytes = await pdfDoc.save();
    downloadBlob(new Blob([bytes], { type: "application/pdf" }), "unihelp-timetable.pdf");
  };

  return (
    <div className={`min-h-screen md:mt-13 ${t.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className={`rounded-3xl border p-5 md:p-8 ${t.panel}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
                <Sparkles size={14} /> Smart Timetable Builder
              </div>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">Build a Cleaner Week</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-7 md:text-base ${t.muted}`}>
                Add your courses, set simple constraints, and generate a balanced lecture timetable without clashes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={buildTimetable} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-4 font-bold text-white">
                <RefreshCw size={18} /> Generate
              </button>
              <button onClick={savePlan} className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}>
                <Save size={18} /> Save
              </button>
              <button onClick={exportPlan} className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}>
                <Download size={18} /> CSV
              </button>
              <button onClick={exportPdf} className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}>
                <Download size={18} /> PDF
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <StatCard dark={dark} label="Courses" value={stats.totalCourses} />
            <StatCard dark={dark} label="Needed hours" value={stats.totalHours} tone="text-sky-400" />
            <StatCard dark={dark} label="Scheduled hours" value={stats.scheduledHours} tone="text-emerald-400" />
          </div>
        </div>

        {notice && <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-400">{notice}</div>}

        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className={`rounded-3xl border p-5 ${t.panel}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">Constraints</h2>
                  <p className={`mt-1 text-sm ${t.muted}`}>Set your school day and break period.</p>
                </div>
                <CalendarDays className="text-indigo-400" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className={`text-xs font-bold uppercase ${t.muted}`}>Start</span>
                  <select className={t.input} value={settings.startHour} onChange={(e) => setSettings({ ...settings, startHour: e.target.value })}>
                    {hoursBetween(6, 13).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className={`text-xs font-bold uppercase ${t.muted}`}>End</span>
                  <select className={t.input} value={settings.endHour} onChange={(e) => setSettings({ ...settings, endHour: e.target.value })}>
                    {hoursBetween(13, 22).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                  </select>
                </label>
                <label className={`flex items-center justify-between gap-3 rounded-2xl border p-4 sm:col-span-2 ${t.soft}`}>
                  <span className="text-sm font-bold">Protect lunch break</span>
                  <input type="checkbox" checked={settings.useBreak} onChange={(e) => setSettings({ ...settings, useBreak: e.target.checked })} />
                </label>
                <label className="space-y-2">
                  <span className={`text-xs font-bold uppercase ${t.muted}`}>Break start</span>
                  <select className={t.input} value={settings.breakStart} onChange={(e) => setSettings({ ...settings, breakStart: e.target.value })}>
                    {hoursBetween(10, 16).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className={`text-xs font-bold uppercase ${t.muted}`}>Break end</span>
                  <select className={t.input} value={settings.breakEnd} onChange={(e) => setSettings({ ...settings, breakEnd: e.target.value })}>
                    {hoursBetween(11, 17).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={addCourse} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 font-bold text-white">
                <Plus size={18} /> Add Course
              </button>
              <button onClick={resetPlan} className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}>
                <Eraser size={18} /> Reset
              </button>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <CourseEditor
                  key={course.id}
                  dark={dark}
                  course={course}
                  onChange={(patch) => updateCourse(course.id, patch)}
                  onRemove={() => setCourses((items) => items.filter((item) => item.id !== course.id))}
                />
              ))}
            </div>
          </aside>

          <main className="space-y-5 min-w-0">
            {generated.warnings.length > 0 && (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-500">
                <div className="mb-2 flex items-center gap-2 font-black">
                  <AlertCircle size={18} /> Some sessions need attention
                </div>
                <div className="space-y-1">
                  {generated.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              </div>
            )}

            <div className={`rounded-3xl border p-5 ${t.panel}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black">Generated Timetable</h2>
                  <p className={`mt-1 text-sm ${t.muted}`}>Use Generate after changing courses or constraints.</p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${t.soft}`}>
                  <Clock size={17} /> {formatHour(settings.startHour)} - {formatHour(settings.endHour)}
                </div>
              </div>
            </div>

            <TimetableGrid dark={dark} grid={generated.grid} settings={settings} />
          </main>
        </div>
      </div>
    </div>
  );
}
