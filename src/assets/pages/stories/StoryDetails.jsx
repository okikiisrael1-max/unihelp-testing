import React, {
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  increment,
  updateDoc,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

import {
  useParams,
  Link,
} from "react-router-dom";

import { toast } from "react-toastify";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  Eye,
  Share2,
  Clock3,
  Bookmark,
  PlayCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { db, auth } from "../../../firebase/config";

export default function StoryDetails({
  dark,
}) {
  const { id } = useParams();

  const [story, setStory] =
    useState(null);

  const [chapters, setChapters] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [liked, setLiked] =
    useState(false);

  const [bookmarked, setBookmarked] =
    useState(false);

  /* =========================
     FETCH STORY
  ========================= */
  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);

      /* STORY */
      const storyRef = doc(
        db,
        "stories",
        id
      );

      const storySnap = await getDoc(
        storyRef
      );

      if (!storySnap.exists()) {
        setLoading(false);
        return;
      }

      const storyData = {
        id: storySnap.id,
        ...storySnap.data(),
      };

      setStory(storyData);

      /* INCREMENT VIEWS */
      await updateDoc(storyRef, {
        views: increment(1),
      });

      /* CHAPTERS */
      const chaptersQuery = query(
        collection(db, "storyChapters"),
        where("storyId", "==", id),
        orderBy("chapterNumber", "asc")
      );

      const chaptersSnap =
        await getDocs(chaptersQuery);

      const chaptersData =
        chaptersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

      setChapters(chaptersData);

      /* CHECK BOOKMARK */
      if (auth.currentUser) {
        const bookmarkQuery = query(
          collection(db, "bookmarks"),
          where(
            "userId",
            "==",
            auth.currentUser.uid
          ),
          where("storyId", "==", id)
        );

        const bookmarkSnap =
          await getDocs(bookmarkQuery);

        if (!bookmarkSnap.empty) {
          setBookmarked(true);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LIKE STORY
  ========================= */
  const handleLike = async () => {
    if (!auth.currentUser) {
      toast.error("Please login first.");
      return;
    }

    if (liked) return;

    try {
      await updateDoc(
        doc(db, "stories", id),
        {
          likes: increment(1),
        }
      );

      setStory((prev) => ({
        ...prev,
        likes: (prev.likes || 0) + 1,
      }));

      setLiked(true);
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================
     BOOKMARK
  ========================= */
  const toggleBookmark =
    async () => {
      if (!auth.currentUser) {
        toast.error("Please login first.");
        return;
      }

      try {
        if (!bookmarked) {
          await addDoc(
            collection(db, "bookmarks"),
            {
              userId:
                auth.currentUser.uid,
              storyId: id,
              storyTitle:
                story.title,
              progress: 0,
              createdAt:
                serverTimestamp(),
            }
          );

          setBookmarked(true);
        } else {
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
              id
            )
          );

          const snap =
            await getDocs(q);

          snap.forEach(async (d) => {
            await deleteDoc(
              doc(
                db,
                "bookmarks",
                d.id
              )
            );
          });

          setBookmarked(false);
        }
      } catch (err) {
        console.log(err);
      }
    };

  /* =========================
     SHARE
  ========================= */
  const shareStory = async () => {
    const url =
      window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: story.description,
          url,
        });
      } else {
        await navigator.clipboard.writeText(
          url
        );

        toast.success("Story link copied to clipboard.");
      }
    } catch (err) {
      console.log(err);
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
        <div className="text-gray-400">
          Loading story...
        </div>
      </div>
    );
  }

  /* =========================
     NOT FOUND
  ========================= */
  if (!story) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        <div className="text-center">
          <BookOpen
            size={60}
            className="mx-auto mb-5 text-purple-500"
          />

          <h2 className="text-3xl font-black">
            Story Not Found
          </h2>
        </div>
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* BACK BUTTON */}
        <Link
          to="/stories"
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border mb-8 transition ${card}`}
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        {/* HERO */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-10">
          {/* COVER */}
          <div>
            <div
              className={`rounded-[30px] overflow-hidden border ${card}`}
            >
              <img
                src={
                  story.coverImage ||
                  "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop"
                }
                alt={story.title}
                className="w-full h-[500px] object-cover"
              />
            </div>
          </div>

          {/* DETAILS */}
          <div>
            {/* BADGES */}
            <div className="flex flex-wrap gap-3 mb-5">
              <span className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
                {story.genre}
              </span>

              <span
                className={`px-4 py-2 rounded-full text-sm ${
                  story.status ===
                  "completed"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                }`}
              >
                {story.status}
              </span>
            </div>

            {/* TITLE */}
            <h1 className="text-5xl font-black leading-tight">
              {story.title}
            </h1>

            {/* AUTHOR */}
            <p className="mt-4 text-xl text-gray-400">
              by{" "}
              <span className="text-white font-semibold">
                {story.authorName}
              </span>
            </p>

            {/* DESCRIPTION */}
            <p className="mt-8 text-lg leading-relaxed text-gray-300">
              {story.description}
            </p>

            {/* STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
              <div
                className={`rounded-3xl border p-5 text-center ${card}`}
              >
                <Eye
                  size={22}
                  className="mx-auto mb-3 text-blue-500"
                />

                <h3 className="text-2xl font-black">
                  {story.views || 0}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Views
                </p>
              </div>

              <div
                className={`rounded-3xl border p-5 text-center ${card}`}
              >
                <Heart
                  size={22}
                  className="mx-auto mb-3 text-pink-500"
                />

                <h3 className="text-2xl font-black">
                  {story.likes || 0}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Likes
                </p>
              </div>

              <div
                className={`rounded-3xl border p-5 text-center ${card}`}
              >
                <BookOpen
                  size={22}
                  className="mx-auto mb-3 text-purple-500"
                />

                <h3 className="text-2xl font-black">
                  {chapters.length}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Chapters
                </p>
              </div>

              <div
                className={`rounded-3xl border p-5 text-center ${card}`}
              >
                <Clock3
                  size={22}
                  className="mx-auto mb-3 text-orange-500"
                />

                <h3 className="text-2xl font-black">
                  {story.readTime ||
                    "10h"}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Read Time
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-4 mt-10">
              {chapters.length > 0 && (
                <Link
                  to={`/read-story/${story.id}/${chapters[0].id}`}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-3 hover:scale-105 transition"
                >
                  <PlayCircle size={22} />
                  Start Reading
                </Link>
              )}

              <button
                onClick={handleLike}
                className={`px-6 py-4 rounded-2xl border flex items-center gap-3 transition ${card}`}
              >
                <Heart
                  size={20}
                  className={
                    liked
                      ? "text-pink-500 fill-pink-500"
                      : ""
                  }
                />

                Like
              </button>

              <button
                onClick={toggleBookmark}
                className={`px-6 py-4 rounded-2xl border flex items-center gap-3 transition ${card}`}
              >
                {bookmarked ? (
                  <CheckCircle2
                    size={20}
                    className="text-green-500"
                  />
                ) : (
                  <Bookmark size={20} />
                )}

                {bookmarked
                  ? "Saved"
                  : "Bookmark"}
              </button>

              <button
                onClick={shareStory}
                className={`px-6 py-4 rounded-2xl border flex items-center gap-3 transition ${card}`}
              >
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* CHAPTERS */}
        <div className="mt-20">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-purple-500" />

            <h2 className="text-4xl font-black">
              Chapters
            </h2>
          </div>

          <div className="space-y-5">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/read-story/${story.id}/${chapter.id}`}
                className={`block rounded-3xl border p-6 transition hover:-translate-y-1 hover:shadow-2xl ${card}`}
              >
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-sm text-purple-400 font-semibold">
                      Chapter{" "}
                      {
                        chapter.chapterNumber
                      }
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                      {
                        chapter.chapterTitle
                      }
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-blue-500 font-semibold">
                    Read
                    <PlayCircle size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}