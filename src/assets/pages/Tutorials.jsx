import {
  Bookmark,
  Clock3,
  Flame,
  Play,
  PlayCircle,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Youtube,
  Filter,
  Star,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

/* ---------------- CONFIG ---------------- */

const API_KEY =
  "AIzaSyAhQUd-So4kqcAMEr6lTlnly-KJdK16Nu8";

const DEFAULT_QUERIES = [
  "Use Of English",
  "HTML CSS Tutorial",
  "Learn Video Editing",
  "How To Create Animation",
  "React JS Full Course",
  "UI UX Design",
];

const DEFAULT_QUERY =
  DEFAULT_QUERIES[
    new Date().getSeconds() %
      DEFAULT_QUERIES.length
  ];

const CACHE_KEY = "unihelp_yt_cache";
const CACHE_TTL = 1000 * 60 * 60 * 24;

/* ---------------- DEBOUNCE ---------------- */

const useDebounce = (
  value,
  delay = 600
) => {
  const [debounced, setDebounced] =
    useState(value);

  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(value),
      delay
    );

    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* ---------------- CACHE ---------------- */

const getCache = () => {
  const data =
    localStorage.getItem(CACHE_KEY);

  return data ? JSON.parse(data) : {};
};

const saveCache = (cache) => {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify(cache)
  );
};

const isValid = (time) =>
  Date.now() - time < CACHE_TTL;

/* ---------------- COMPONENT ---------------- */

export default function TutorialSearchPage({
  dark = false,
}) {
  const [query, setQuery] =
    useState(DEFAULT_QUERY);

  const debouncedQuery = useDebounce(
    query,
    600
  );

  const [results, setResults] = useState(
    []
  );

  const [loading, setLoading] =
    useState(false);

  const [pageToken, setPageToken] =
    useState("");

  const [currentVideo, setCurrentVideo] =
    useState(null);

  const [saved, setSaved] = useState([]);

  const [history, setHistory] = useState(
    []
  );

  const [activeCategory, setActiveCategory] =
    useState("All");

  const categories = [
    "All",
    "Programming",
    "Design",
    "Editing",
    "Business",
    "School",
  ];

  /* ---------------- LOAD SAVED ---------------- */

  useEffect(() => {
    const data = localStorage.getItem(
      "unihelp_saved_videos"
    );

    if (data) setSaved(JSON.parse(data));
  }, []);

  /* ---------------- LOAD HISTORY ---------------- */

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem(
        "tutorial_history"
      ) || "[]"
    );

    setHistory(data);
  }, []);

  /* ---------------- SAVE HISTORY ---------------- */

  useEffect(() => {
    const term = debouncedQuery.trim();

    if (!term) return;

    const stored = JSON.parse(
      localStorage.getItem(
        "tutorial_history"
      ) || "[]"
    );

    const updated = [
      term,
      ...stored.filter(
        (t) => t !== term
      ),
    ].slice(0, 8);

    localStorage.setItem(
      "tutorial_history",
      JSON.stringify(updated)
    );

    setHistory(updated);
  }, [debouncedQuery]);

  /* ---------------- FETCH ---------------- */

  const fetchVideos = async (
    reset = false
  ) => {
    setLoading(true);

    const searchTerm =
      (debouncedQuery.trim() ||
        DEFAULT_QUERY) +
      " tutorial education course";

    const cache = getCache();

    /* CACHE */

    if (
      cache[searchTerm] &&
      isValid(cache[searchTerm].time) &&
      !reset
    ) {
      setResults(cache[searchTerm].data);

      setLoading(false);

      return;
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=18&q=${encodeURIComponent(
          searchTerm
        )}&pageToken=${
          reset ? "" : pageToken
        }&key=${API_KEY}`
      );

      const data = await res.json();

      if (!data.items) return;

      const videos = data.items.map(
        (item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.high.url,
          channel:
            item.snippet.channelTitle,
          published:
            item.snippet.publishedAt,
        })
      );

      const merged = reset
        ? videos
        : [...results, ...videos];

      setResults(merged);

      setPageToken(
        data.nextPageToken || ""
      );

      cache[searchTerm] = {
        data: merged,
        time: Date.now(),
      };

      saveCache(cache);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* ---------------- RUN SEARCH ---------------- */

  useEffect(() => {
    setResults([]);
    setPageToken("");

    fetchVideos(true);
  }, [debouncedQuery]);

  /* ---------------- SAVE VIDEO ---------------- */

  const saveVideo = (video) => {
    if (
      saved.find(
        (v) => v.id === video.id
      )
    )
      return;

    const updated = [video, ...saved];

    setSaved(updated);

    localStorage.setItem(
      "unihelp_saved_videos",
      JSON.stringify(updated)
    );
  };

  /* ---------------- REMOVE ---------------- */

  const removeVideo = (id) => {
    const updated = saved.filter(
      (v) => v.id !== id
    );

    setSaved(updated);

    localStorage.setItem(
      "unihelp_saved_videos",
      JSON.stringify(updated)
    );
  };

  /* ---------------- FILTERED ---------------- */

  const filteredVideos = useMemo(() => {
    if (activeCategory === "All")
      return results;

    return results.filter((v) =>
      v.title
        .toLowerCase()
        .includes(
          activeCategory.toLowerCase()
        )
    );
  }, [results, activeCategory]);

  /* ---------------- STYLE ---------------- */

  const glass = dark
    ? "bg-white/[0.04] border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200";

  const textSub = dark
    ? "text-white/60"
    : "text-gray-500";

  return (
    <div
      className={`min-h-screen overflow-hidden ${
        dark
          ? "bg-[#050816] text-white"
          : "bg-[#f5f7ff] text-black"
      }`}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-indigo-500/20 blur-[120px] rounded-full" />

        <div className="absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-pink-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">

        {/* HERO */}
        <div className="px-4 md:px-7 pt-6 md:pt-24">

          <div className="relative overflow-hidden rounded-[35px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 md:p-10 text-slate-100">

            <div className="absolute top-0 right-0 opacity-10">
              <Youtube size={260} />
            </div>

            <div className="relative z-10">

              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm mb-5">
                <Sparkles size={16} />
                UniHelp Learning Hub
              </div>

              <h1 className="text-3xl md:text-6xl font-black leading-tight mb-4">
                Learn Any Skill
                <br />
                For Free 🚀
              </h1>

              <p className="max-w-2xl text-white/80 text-sm md:text-lg leading-relaxed">
                Discover tutorials, tech
                courses, editing guides,
                business lessons and
                educational videos curated
                for students.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">

                <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                  <p className="text-sm text-white/70">
                    Tutorials
                  </p>

                  <h2 className="text-3xl font-black">
                    1000+
                  </h2>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                  <p className="text-sm text-white/70">
                    Categories
                  </p>

                  <h2 className="text-3xl font-black">
                    6
                  </h2>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                  <p className="text-sm text-white/70">
                    Students
                  </p>

                  <h2 className="text-3xl font-black">
                    Live
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="px-4 md:px-7 mt-8">

          <div
            className={`${glass} rounded-[30px] p-4 md:p-5`}
          >
            <div className="flex flex-col lg:flex-row gap-4">

              {/* SEARCH */}
              <div
                className={`flex items-center gap-3 h-14 rounded-2xl px-4 flex-1 ${
                  dark
                    ? "bg-white/[0.04]"
                    : "bg-gray-100"
                }`}
              >
                <Search
                  className={textSub}
                  size={20}
                />

                <input
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                  placeholder="Search tutorials..."
                  className="bg-transparent outline-none w-full"
                />
              </div>

              {/* FILTER */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar">

                <div
                  className={`flex items-center gap-2 px-4 h-14 rounded-2xl whitespace-nowrap ${
                    dark
                      ? "bg-white/[0.04]"
                      : "bg-gray-100"
                  }`}
                >
                  <Filter size={18} />
                  Filter
                </div>

                {categories.map(
                  (cat, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setActiveCategory(
                          cat
                        )
                      }
                      className={`px-5 h-14 rounded-2xl whitespace-nowrap font-semibold transition ${
                        activeCategory === cat
                          ? "bg-indigo-600 text-white"
                          : dark
                          ? "bg-white/[0.04]"
                          : "bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* HISTORY */}
            <div className="flex flex-wrap gap-2 mt-5">

              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setQuery(item)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                    dark
                      ? "bg-white/[0.04]"
                      : "bg-gray-100"
                  }`}
                >
                  <Clock3 size={14} />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VIDEO PLAYER */}
        {currentVideo && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">

            <div className="w-full max-w-5xl">

              <div className="flex justify-end mb-3">
                <button
                  onClick={() =>
                    setCurrentVideo(null)
                  }
                  className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="rounded-[30px] overflow-hidden border border-white/10 shadow-2xl">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${currentVideo}`}
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="grid xl:grid-cols-[1fr_350px] gap-6 px-4 md:px-7 py-8">

          {/* RESULTS */}
          <div>

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="text-2xl md:text-3xl font-black">
                  Tutorials
                </h2>

                <p className={textSub}>
                  Curated learning resources
                </p>
              </div>

              <div
                className={`${glass} px-4 py-2 rounded-2xl text-sm`}
              >
                {filteredVideos.length} Videos
              </div>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

                {[...Array(6)].map(
                  (_, index) => (
                    <div
                      key={index}
                      className={`${glass} rounded-[30px] overflow-hidden animate-pulse`}
                    >
                      <div className="h-48 bg-white/5" />

                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-white/5 rounded" />

                        <div className="h-4 bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* VIDEOS */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

              {filteredVideos.map(
                (video, index) => (
                  <div
                    key={index}
                    className={`${glass} rounded-[30px] overflow-hidden hover:-translate-y-1 transition-all duration-300 group`}
                  >
                    {/* THUMB */}
                    <div
                      className="relative cursor-pointer"
                      onClick={() =>
                        setCurrentVideo(
                          video.id
                        )
                      }
                    >
                      <img
                        src={
                          video.thumbnail
                        }
                        alt={video.title}
                        className="w-full h-52 object-cover"
                      />

                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center">

                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                          <Play
                            className="text-white ml-1"
                            fill="white"
                          />
                        </div>
                      </div>

                      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        YouTube
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="p-5">

                      <h2
                        onClick={() =>
                          setCurrentVideo(
                            video.id
                          )
                        }
                        className="font-bold text-lg line-clamp-2 cursor-pointer hover:text-indigo-500 transition"
                      >
                        {video.title}
                      </h2>

                      <p
                        className={`text-sm mt-2 ${textSub}`}
                      >
                        {video.channel}
                      </p>

                      <div className="flex items-center justify-between mt-6">

                        <button
                          onClick={() =>
                            setCurrentVideo(
                              video.id
                            )
                          }
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
                        >
                          Watch
                        </button>

                        <button
                          onClick={() =>
                            saveVideo(
                              video
                            )
                          }
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            dark
                              ? "bg-white/[0.05]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Bookmark
                            size={20}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* LOAD MORE */}
            {pageToken && (
              <button
                onClick={() =>
                  fetchVideos(false)
                }
                className="w-full mt-8 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
              >
                Load More Tutorials
              </button>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">

            {/* SAVED */}
            <div
              className={`${glass} rounded-[30px] p-5`}
            >
              <div className="flex items-center gap-2 mb-5">
                <Bookmark className="text-yellow-500" />

                <h2 className="text-xl font-black">
                  Saved Tutorials
                </h2>
              </div>

              {saved.length === 0 && (
                <div
                  className={`rounded-2xl p-5 text-center ${
                    dark
                      ? "bg-white/[0.03]"
                      : "bg-gray-100"
                  }`}
                >
                  <Bookmark
                    className="mx-auto opacity-40 mb-3"
                    size={40}
                  />

                  <p className={textSub}>
                    No saved tutorials yet
                  </p>
                </div>
              )}

              <div className="space-y-4">

                {saved.map((video) => (
                  <div
                    key={video.id}
                    className={`rounded-2xl overflow-hidden ${
                      dark
                        ? "bg-white/[0.03]"
                        : "bg-gray-100"
                    }`}
                  >
                    <img
                      src={
                        video.thumbnail
                      }
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() =>
                        setCurrentVideo(
                          video.id
                        )
                      }
                    />

                    <div className="p-4">

                      <h2 className="font-semibold line-clamp-2 text-sm">
                        {video.title}
                      </h2>

                      <div className="flex justify-between items-center mt-4">

                        <button
                          onClick={() =>
                            setCurrentVideo(
                              video.id
                            )
                          }
                          className="text-indigo-500 text-sm font-semibold"
                        >
                          Watch
                        </button>

                        <button
                          onClick={() =>
                            removeVideo(
                              video.id
                            )
                          }
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRENDING */}
            <div
              className={`${glass} rounded-[30px] p-5`}
            >
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="text-pink-500" />

                <h2 className="text-xl font-black">
                  Trending Topics
                </h2>
              </div>

              <div className="space-y-3">

                {[
                  "React JS",
                  "UI UX Design",
                  "Motion Graphics",
                  "Video Editing",
                  "JavaScript",
                  "AI Tools",
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      setQuery(item)
                    }
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition hover:scale-[1.02] ${
                      dark
                        ? "bg-white/[0.03]"
                        : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>

                      <span className="font-semibold">
                        {item}
                      </span>
                    </div>

                    <Flame className="text-orange-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
