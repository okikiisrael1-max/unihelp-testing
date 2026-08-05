import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Moon,
  Sun,
  Bookmark,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

import { db, auth } from "../../../firebase/config";

export default function ReadStory() {
  const { storyId, chapterId } =
    useParams();

  const navigate = useNavigate();

  const [story, setStory] =
    useState(null);

  const [chapter, setChapter] =
    useState(null);

  const [chapters, setChapters] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [fontSize, setFontSize] =
    useState(20);

  const [lineHeight, setLineHeight] =
    useState(2);

  const [darkMode, setDarkMode] =
    useState(true);

  const [saved, setSaved] =
    useState(false);

  /* =========================
     FETCH
  ========================= */
  useEffect(() => {
    fetchData();
  }, [chapterId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      /* STORY */
      const storySnap = await getDoc(
        doc(db, "stories", storyId)
      );

      if (storySnap.exists()) {
        setStory({
          id: storySnap.id,
          ...storySnap.data(),
        });
      }

      /* CHAPTER */
      const chapterSnap =
        await getDoc(
          doc(
            db,
            "storyChapters",
            chapterId
          )
        );

      if (chapterSnap.exists()) {
        setChapter({
          id: chapterSnap.id,
          ...chapterSnap.data(),
        });
      }

      /* ALL CHAPTERS */
      const q = query(
        collection(db, "storyChapters"),
        where(
          "storyId",
          "==",
          storyId
        ),
        orderBy("chapterNumber", "asc")
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setChapters(data);

      /* SAVE READING PROGRESS */
      saveProgress();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SAVE PROGRESS
  ========================= */
  const saveProgress = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "bookmarks"),
        where(
          "userId",
          "==",
          auth.currentUser.uid
        ),
        where(
          "storyId",
          "==",
          storyId
        )
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const bookmarkDoc =
          snap.docs[0];

        await updateDoc(
          doc(
            db,
            "bookmarks",
            bookmarkDoc.id
          ),
          {
            chapterId,
            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        await addDoc(
          collection(db, "bookmarks"),
          {
            userId:
              auth.currentUser.uid,
            storyId,
            chapterId,
            createdAt:
              serverTimestamp(),
          }
        );
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================
     CURRENT INDEX
  ========================= */
  const currentIndex = useMemo(() => {
    return chapters.findIndex(
      (c) => c.id === chapterId
    );
  }, [chapters, chapterId]);

  const prevChapter =
    currentIndex > 0
      ? chapters[currentIndex - 1]
      : null;

  const nextChapter =
    currentIndex <
    chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  /* =========================
     NAVIGATION
  ========================= */
  const goPrev = () => {
    if (!prevChapter) return;

    navigate(
      `/read-story/${storyId}/${prevChapter.id}`
    );

    window.scrollTo(0, 0);
  };

  const goNext = () => {
    if (!nextChapter) return;

    navigate(
      `/read-story/${storyId}/${nextChapter.id}`
    );

    window.scrollTo(0, 0);
  };

  /* =========================
     THEME
  ========================= */
  const bg = darkMode
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const card = darkMode
    ? "bg-white/5 border-white/10"
    : "bg-white border-gray-200";

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        Loading chapter...
      </div>
    );
  }

  if (!chapter) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        Chapter not found
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition ${bg}`}
    >
      {/* TOP BAR */}
      <div
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${card}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <Link
              to={`/stories/${storyId}`}
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${card}`}
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <h2 className="font-bold line-clamp-1">
                {story?.title}
              </h2>

              <p className="text-sm text-gray-400">
                {
                  chapter.chapterTitle
                }
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* FONT DOWN */}
            <button
              onClick={() =>
                setFontSize((prev) =>
                  Math.max(16, prev - 2)
                )
              }
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${card}`}
            >
              <Minus size={18} />
            </button>

            {/* FONT UP */}
            <button
              onClick={() =>
                setFontSize((prev) =>
                  Math.min(34, prev + 2)
                )
              }
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${card}`}
            >
              <Plus size={18} />
            </button>

            {/* THEME */}
            <button
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${card}`}
            >
              {darkMode ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {/* SAVED */}
            <div
              className={`px-4 py-3 rounded-2xl border flex items-center gap-2 ${card}`}
            >
              {saved ? (
                <>
                  <CheckCircle2
                    size={18}
                    className="text-green-500"
                  />

                  <span className="text-sm">
                    Saved
                  </span>
                </>
              ) : (
                <>
                  <Bookmark
                    size={18}
                  />

                  <span className="text-sm">
                    Reading
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* CHAPTER TITLE */}
        <div className="text-center mb-14">
          <p className="text-purple-500 font-semibold mb-4">
            Chapter{" "}
            {chapter.chapterNumber}
          </p>

          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            {chapter.chapterTitle}
          </h1>

          <div className="flex items-center justify-center gap-3 mt-6 text-gray-400">
            <BookOpen size={18} />

            <span>
              {story?.authorName}
            </span>
          </div>
        </div>

        {/* STORY CONTENT */}
        <div
          className={`rounded-[40px] border p-6 sm:p-10 md:p-14 leading-relaxed whitespace-pre-wrap ${card}`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight,
          }}
        >
          {chapter.content}
        </div>

        {/* SETTINGS */}
        <div
          className={`rounded-3xl border p-6 mt-10 ${card}`}
        >
          <h3 className="font-bold text-xl mb-5">
            Reading Settings
          </h3>

          {/* FONT SIZE */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Font Size</span>

              <span>
                {fontSize}px
              </span>
            </div>

            <input
              type="range"
              min="16"
              max="34"
              value={fontSize}
              onChange={(e) =>
                setFontSize(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full"
            />
          </div>

          {/* LINE HEIGHT */}
          <div>
            <div className="flex justify-between mb-2">
              <span>
                Line Height
              </span>

              <span>
                {lineHeight}
              </span>
            </div>

            <input
              type="range"
              min="1.5"
              max="3"
              step="0.1"
              value={lineHeight}
              onChange={(e) =>
                setLineHeight(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full"
            />
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {/* PREVIOUS */}
          <button
            onClick={goPrev}
            disabled={!prevChapter}
            className={`rounded-3xl border p-6 text-left transition hover:-translate-y-1 disabled:opacity-40 ${card}`}
          >
            <div className="flex items-center gap-3 text-gray-400 mb-3">
              <ChevronLeft size={18} />
              Previous Chapter
            </div>

            <h3 className="font-bold text-xl line-clamp-2">
              {prevChapter
                ?.chapterTitle ||
                "No previous chapter"}
            </h3>
          </button>

          {/* NEXT */}
          <button
            onClick={goNext}
            disabled={!nextChapter}
            className={`rounded-3xl border p-6 text-right transition hover:-translate-y-1 disabled:opacity-40 ${card}`}
          >
            <div className="flex items-center justify-end gap-3 text-gray-400 mb-3">
              Next Chapter
              <ChevronRight
                size={18}
              />
            </div>

            <h3 className="font-bold text-xl line-clamp-2">
              {nextChapter
                ?.chapterTitle ||
                "End of story"}
            </h3>
          </button>
        </div>
      </div>
    </div>
  );
}