import React, {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  Loader2,
  PlusCircle,
  Save,
  Sparkles,
  Eye,
  FileText,
  CheckCircle2,
} from "lucide-react";

import {
  db,
  auth,
} from "../../../firebase/config";

export default function CreateChapter({
  dark,
}) {
  const { storyId } =
    useParams();

  const navigate = useNavigate();

  const [story, setStory] =
    useState(null);

  const [chapterTitle, setChapterTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [chapterNumber, setChapterNumber] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [publishing, setPublishing] =
    useState(false);

  const [previewMode, setPreviewMode] =
    useState(false);

  /* =========================
     FETCH STORY
  ========================= */
  useEffect(() => {
    fetchStory();
  }, []);

  const fetchStory = async () => {
    try {
      const storySnap = await getDoc(
        doc(db, "stories", storyId)
      );

      if (!storySnap.exists()) {
        navigate("/stories");
        return;
      }

      const storyData = {
        id: storySnap.id,
        ...storySnap.data(),
      };

      setStory(storyData);

      /* GET CHAPTER COUNT */
      const q = query(
        collection(db, "storyChapters"),
        where(
          "storyId",
          "==",
          storyId
        )
      );

      const snap = await getDocs(q);

      setChapterNumber(
        snap.docs.length + 1
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     PUBLISH
  ========================= */
  const publishChapter =
    async () => {
      if (!auth.currentUser) {
        alert("Login first");
        return;
      }

      if (!chapterTitle.trim()) {
        alert(
          "Enter chapter title"
        );
        return;
      }

      if (!content.trim()) {
        alert(
          "Write chapter content"
        );
        return;
      }

      try {
        setPublishing(true);

        /* CREATE CHAPTER */
        await addDoc(
          collection(
            db,
            "storyChapters"
          ),
          {
            storyId,

            chapterTitle,

            content,

            chapterNumber,

            authorId:
              auth.currentUser.uid,

            createdAt:
              serverTimestamp(),
          }
        );

        /* UPDATE STORY */
        await updateDoc(
          doc(
            db,
            "stories",
            storyId
          ),
          {
            chaptersCount:
              increment(1),

            updatedAt:
              new Date().toLocaleDateString(),
          }
        );

        alert(
          "Chapter published!"
        );

        navigate(
          `/stories/${storyId}`
        );
      } catch (err) {
        console.log(err);

        alert(
          "Failed to publish chapter"
        );
      } finally {
        setPublishing(false);
      }
    };

  /* =========================
     UI
  ========================= */
  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200";

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${bg}`}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-purple-500/20 blur-[120px] rounded-full" />

        <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-10">
          <div>
            <Link
              to={`/stories/${storyId}`}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border mb-5 ${card}`}
            >
              <ArrowLeft size={18} />
              Back to Story
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-5">
              <Sparkles size={16} />
              Story Editor
            </div>

            <h1 className="text-5xl font-black">
              Create Chapter
            </h1>

            <p className="text-gray-400 mt-4 text-lg">
              Writing for{" "}
              <span className="text-white font-semibold">
                {story?.title}
              </span>
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() =>
                setPreviewMode(
                  !previewMode
                )
              }
              className={`px-6 py-4 rounded-2xl border flex items-center gap-3 ${card}`}
            >
              <Eye size={20} />

              {previewMode
                ? "Editor"
                : "Preview"}
            </button>

            <button
              onClick={
                publishChapter
              }
              disabled={publishing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-7 py-4 rounded-2xl text-white font-semibold flex items-center gap-3 hover:scale-105 transition disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Publishing...
                </>
              ) : (
                <>
                  <Save size={20} />

                  Publish Chapter
                </>
              )}
            </button>
          </div>
        </div>

        {/* INFO CARDS */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {/* CHAPTER */}
          <div
            className={`rounded-3xl border p-6 ${card}`}
          >
            <PlusCircle
              size={28}
              className="text-purple-500 mb-4"
            />

            <p className="text-gray-400 text-sm">
              Chapter Number
            </p>

            <h3 className="text-3xl font-black mt-2">
              {chapterNumber}
            </h3>
          </div>

          {/* WORDS */}
          <div
            className={`rounded-3xl border p-6 ${card}`}
          >
            <FileText
              size={28}
              className="text-blue-500 mb-4"
            />

            <p className="text-gray-400 text-sm">
              Word Count
            </p>

            <h3 className="text-3xl font-black mt-2">
              {
                content
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .length
              }
            </h3>
          </div>

          {/* STATUS */}
          <div
            className={`rounded-3xl border p-6 ${card}`}
          >
            <CheckCircle2
              size={28}
              className="text-green-500 mb-4"
            />

            <p className="text-gray-400 text-sm">
              Story Status
            </p>

            <h3 className="text-2xl font-black mt-2 capitalize">
              {
                story?.status
              }
            </h3>
          </div>
        </div>

        {/* EDITOR */}
        <div
          className={`rounded-[40px] border overflow-hidden ${card}`}
        >
          {!previewMode ? (
            <div className="p-6 sm:p-10">
              {/* TITLE */}
              <div className="mb-8">
                <label className="block text-lg font-bold mb-4">
                  Chapter Title
                </label>

                <input
                  value={
                    chapterTitle
                  }
                  onChange={(e) =>
                    setChapterTitle(
                      e.target.value
                    )
                  }
                  placeholder="Enter chapter title..."
                  className={`w-full rounded-2xl border px-5 py-4 outline-none text-lg ${
                    dark
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>

              {/* CONTENT */}
              <div>
                <label className="block text-lg font-bold mb-4">
                  Chapter Content
                </label>

                <textarea
                  value={content}
                  onChange={(e) =>
                    setContent(
                      e.target.value
                    )
                  }
                  placeholder="Start writing your story..."
                  className={`w-full min-h-[700px] rounded-3xl border px-6 py-6 outline-none resize-none leading-relaxed ${
                    dark
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                  style={{
                    fontSize:
                      "18px",
                    lineHeight:
                      "2",
                  }}
                />
              </div>
            </div>
          ) : (
            /* PREVIEW */
            <div className="p-6 sm:p-10 md:p-14">
              <div className="text-center mb-14">
                <p className="text-purple-500 font-semibold mb-4">
                  Chapter{" "}
                  {
                    chapterNumber
                  }
                </p>

                <h1 className="text-5xl font-black leading-tight">
                  {chapterTitle ||
                    "Untitled Chapter"}
                </h1>

                <div className="flex items-center justify-center gap-3 mt-6 text-gray-400">
                  <BookOpen
                    size={18}
                  />

                  <span>
                    {
                      story?.authorName
                    }
                  </span>
                </div>
              </div>

              <div
                className="leading-relaxed whitespace-pre-wrap"
                style={{
                  fontSize:
                    "20px",
                  lineHeight:
                    "2",
                }}
              >
                {content ||
                  "Chapter preview will appear here..."}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`rounded-3xl border p-6 mt-10 ${card}`}
        >
          <h3 className="font-bold text-xl mb-3">
            Writing Tips
          </h3>

          <ul className="space-y-3 text-gray-400">
            <li>
              • Use short paragraphs
              for better mobile
              reading.
            </li>

            <li>
              • End chapters with
              suspense to increase
              retention.
            </li>

            <li>
              • Keep chapter titles
              memorable and engaging.
            </li>

            <li>
              • Upload consistently to
              build loyal readers.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}