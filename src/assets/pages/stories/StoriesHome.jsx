import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";

import { db, auth } from "../../../firebase/config";

import {
  Search,
  Sparkles,
  Flame,
  BookOpen,
  Clock3,
  ChevronRight,
  Filter,
  GraduationCap,
} from "lucide-react";

import StoryCard from "../../components/stories/StoryCard";

const PAGE_SIZE = 12;

export default function StoriesHome({
  dark,
}) {
  const [stories, setStories] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [lastDoc, setLastDoc] =
    useState(null);

  const [search, setSearch] = useState("");

  const [genre, setGenre] =
    useState("All");

  const [continueReading, setContinueReading] =
    useState([]);

  /* =========================
     FETCH STORIES
  ========================= */
  useEffect(() => {
    fetchStories();
    fetchContinueReading();
  }, []);

  const fetchStories = async () => {
    try {
      const q = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setStories(data);

      setLastDoc(
        snap.docs[snap.docs.length - 1]
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CONTINUE READING
  ========================= */
  const fetchContinueReading =
    async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "bookmarks"),
          where(
            "userId",
            "==",
            auth.currentUser.uid
          ),
          limit(5)
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setContinueReading(data);
      } catch (err) {
        console.log(err);
      }
    };

  /* =========================
     LOAD MORE
  ========================= */
  const loadMore = async () => {
    if (!lastDoc) return;

    try {
      setLoadingMore(true);

      const q = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setStories((prev) => [
        ...prev,
        ...data,
      ]);

      if (snap.docs.length < PAGE_SIZE) {
        setLastDoc(null);
      } else {
        setLastDoc(
          snap.docs[snap.docs.length - 1]
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingMore(false);
    }
  };

  /* =========================
     GENRES
  ========================= */
  const genres = useMemo(() => {
    const list = stories
      .map((s) => s.genre)
      .filter(Boolean);

    return ["All", ...new Set(list)];
  }, [stories]);

  /* =========================
     FILTERED STORIES
  ========================= */
  const filteredStories = useMemo(() => {
    let temp = [...stories];

    if (genre !== "All") {
      temp = temp.filter(
        (s) =>
          s.genre?.toLowerCase() ===
          genre.toLowerCase()
      );
    }

    if (search.trim()) {
      temp = temp.filter(
        (s) =>
          s.title
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          s.authorName
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }

    return temp;
  }, [stories, genre, search]);

  /* =========================
     UI STYLES
  ========================= */
  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200";

  return (
    <div
      className={`min-h-screen w-full ${bg}`}
    >
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full" />

        <div className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* HERO */}
        <div
          className={`rounded-[40px] border overflow-hidden p-8 md:p-12 mb-10 relative ${card}`}
        >
          {/* GLOW */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/20 blur-[120px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
              <Sparkles size={16} />
              Unihelp Stories
            </div>

            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-black leading-tight">
                Discover Amazing Stories &
                Novels
              </h1>

              <p className="mt-6 text-lg text-gray-400 leading-relaxed">
                Read thrilling campus
                stories, romance, mystery,
                sci-fi, and thousands of
                immersive novels written by
                talented creators.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-2xl text-white font-semibold hover:scale-105 transition">
                  Start Reading
                </button>

                <button
                  className={`px-8 py-4 rounded-2xl border font-semibold ${
                    dark
                      ? "border-white/10 bg-white/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  Become a Writer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div
          className={`rounded-3xl border p-5 mb-10 ${card}`}
        >
          <div className="grid lg:grid-cols-[1fr_220px] gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search
                className="absolute left-4 top-4 text-gray-400"
                size={20}
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search stories, authors..."
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            {/* FILTER */}
            <div className="relative">
              <Filter
                className="absolute left-4 top-4 text-gray-400"
                size={18}
              />

              <select
                value={genre}
                onChange={(e) =>
                  setGenre(e.target.value)
                }
                className={`w-full pl-12 py-4 rounded-2xl border outline-none ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-white border-gray-300"
                }`}
              >
                {genres.map((g) => (
                  <option
                    key={g}
                    value={g}
                  >
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CONTINUE READING */}
        {continueReading.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock3 className="text-blue-500" />

                <h2 className="text-3xl font-black">
                  Continue Reading
                </h2>
              </div>

              <button className="flex items-center gap-2 text-blue-500 font-semibold">
                View All
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {continueReading.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-6 ${card}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="text-purple-500" />

                    <div>
                      <h3 className="font-bold">
                        {
                          item.storyTitle
                        }
                      </h3>

                      <p className="text-sm text-gray-400">
                        Chapter{" "}
                        {
                          item.chapterNumber
                        }
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{
                        width: `${
                          item.progress ||
                          0
                        }%`,
                      }}
                    />
                  </div>

                  <button className="w-full mt-5 bg-gradient-to-r from-purple-600 to-blue-600 py-3 rounded-2xl text-white font-semibold">
                    Continue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRENDING */}
        <div className="flex items-center gap-3 mb-8">
          <Flame className="text-orange-500" />

          <h2 className="text-3xl font-black">
            Trending Stories
          </h2>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="py-24 text-center text-gray-400">
            Loading stories...
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          filteredStories.length === 0 && (
            <div
              className={`rounded-3xl border p-16 text-center ${card}`}
            >
              <BookOpen
                size={60}
                className="mx-auto mb-5 text-purple-500"
              />

              <h2 className="text-3xl font-black">
                No Stories Found
              </h2>

              <p className="text-gray-400 mt-4">
                Try searching another
                keyword or genre.
              </p>
            </div>
          )}

        {/* STORIES GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              dark={dark}
            />
          ))}
        </div>

        {/* LOAD MORE */}
        {!loading && lastDoc && (
          <div className="text-center mt-16">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-2xl text-white font-semibold hover:scale-105 transition disabled:opacity-50"
            >
              {loadingMore
                ? "Loading..."
                : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}