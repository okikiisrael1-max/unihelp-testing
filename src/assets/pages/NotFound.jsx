import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound({ dark }) {
  const bg = dark ? "bg-[#050816] text-white" : "bg-slate-50 text-slate-900";

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-6 ${bg}`}
    >
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-5 py-2 backdrop-blur-md">
          <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />
          <span className="font-semibold tracking-wider text-cyan-300">UNIHELP</span>
        </div>

        <h1 className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-[90px] font-black leading-none text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.4)] md:text-[120px]">
          404
        </h1>

        <h2 className="mt-4 text-3xl font-bold md:text-5xl">Lost in the Digital Space</h2>

        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-400">
          The page you are searching for does not exist, was moved, or vanished into the UniHelp universe.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <div className="px-4 text-cyan-400">
            <Search size={20} />
          </div>

          <input
            type="text"
            placeholder="Search UniHelp..."
            className="flex-1 bg-transparent py-4 text-white outline-none placeholder:text-gray-500"
          />

          <button className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-medium transition hover:opacity-90">
            Search
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-105"
          >
            <Home size={20} />
            Back Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md transition-all duration-300 hover:bg-white/10"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>

        <p className="mt-12 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} UniHelp - Smart Student Assistance Platform
        </p>
      </div>
    </div>
  );
}
