import React, {
  useState,
} from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  useNavigate,
} from "react-router-dom";

import {
  ImagePlus,
  Sparkles,
  Upload,
  BookOpen,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import {
  db,
  auth,
} from "../../../firebase/config";

import { toCloudinaryAsset, uploadImage } from "../../../services/cloudinary";

export default function CreateStory({
  dark,
}) {
  const navigate = useNavigate();

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [genre, setGenre] =
    useState("Romance");

  const [status, setStatus] =
    useState("ongoing");

  const [tags, setTags] =
    useState("");

  const [mature, setMature] =
    useState(false);

  const [cover, setCover] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const genres = [
    "Romance",
    "Campus",
    "Thriller",
    "Mystery",
    "Sci-Fi",
    "Fantasy",
    "Comedy",
    "Horror",
    "Adventure",
    "Drama",
  ];

  /* =========================
     COVER PREVIEW
  ========================= */
  const handleCover = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setCover(file);

    setPreview(
      URL.createObjectURL(file)
    );
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Login first");
      return;
    }

    if (!cover) {
      alert(
        "Please upload cover image"
      );
      return;
    }

    try {
      setLoading(true);

      /* UPLOAD COVER */
      const result = await uploadImage(cover);
      const coverImage = result.secure_url;

      /* CREATE STORY */
      const docRef = await addDoc(
        collection(db, "stories"),
        {
          title,
          description,
          genre,
          status,
          mature,
          coverImage,
          coverAsset:
            toCloudinaryAsset(result),

          tags: tags
            .split(",")
            .map((t) => t.trim()),

          authorId:
            auth.currentUser.uid,

          authorName:
            auth.currentUser.displayName ||
            "Anonymous",

          views: 0,
          likes: 0,
          bookmarks: 0,
          chaptersCount: 0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            new Date().toLocaleDateString(),
        }
      );

      navigate(
        `/create-chapter/${docRef.id}`
      );
    } catch (err) {
      console.log(err);

      alert(
        "Failed to create story"
      );
    } finally {
      setLoading(false);
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
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* HERO */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-5">
            <Sparkles size={16} />
            Become a Writer
          </div>

          <h1 className="text-5xl font-black">
            Publish Your Story
          </h1>

          <p className="text-gray-400 mt-5 text-lg max-w-2xl mx-auto">
            Share your imagination with
            thousands of readers on
            Unihelp Stories.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-[40px] border p-6 sm:p-10 ${card}`}
        >
          {/* COVER */}
          <div className="mb-10">
            <label className="font-bold text-lg mb-5 block">
              Story Cover
            </label>

            <label
              className={`relative rounded-[30px] border-2 border-dashed overflow-hidden cursor-pointer flex items-center justify-center h-[420px] transition ${
                dark
                  ? "border-white/10 bg-white/5"
                  : "border-gray-300 bg-gray-100"
              }`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <ImagePlus
                    size={70}
                    className="mx-auto mb-5 text-purple-500"
                  />

                  <h3 className="text-2xl font-bold">
                    Upload Cover
                  </h3>

                  <p className="text-gray-400 mt-2">
                    PNG, JPG or WEBP
                  </p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleCover
                }
              />
            </label>
          </div>

          {/* TITLE */}
          <div className="mb-8">
            <label className="font-bold text-lg mb-3 block">
              Story Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              required
              placeholder="Enter story title..."
              className={`w-full rounded-2xl border px-5 py-4 outline-none ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="mb-8">
            <label className="font-bold text-lg mb-3 block">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              required
              rows={6}
              placeholder="Write story description..."
              className={`w-full rounded-2xl border px-5 py-4 outline-none resize-none ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* GENRE */}
            <div>
              <label className="font-bold text-lg mb-3 block">
                Genre
              </label>

              <select
                value={genre}
                onChange={(e) =>
                  setGenre(
                    e.target.value
                  )
                }
                className={`w-full rounded-2xl border px-5 py-4 outline-none ${
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

            {/* STATUS */}
            <div>
              <label className="font-bold text-lg mb-3 block">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                className={`w-full rounded-2xl border px-5 py-4 outline-none ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="ongoing">
                  Ongoing
                </option>

                <option value="completed">
                  Completed
                </option>
              </select>
            </div>
          </div>

          {/* TAGS */}
          <div className="mb-8">
            <label className="font-bold text-lg mb-3 block">
              Tags
            </label>

            <input
              value={tags}
              onChange={(e) =>
                setTags(
                  e.target.value
                )
              }
              placeholder="romance, campus, mystery..."
              className={`w-full rounded-2xl border px-5 py-4 outline-none ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-300"
              }`}
            />

            <p className="text-sm text-gray-400 mt-2">
              Separate tags with commas
            </p>
          </div>

          {/* MATURE */}
          <div
            className={`rounded-3xl border p-5 flex items-center justify-between mb-10 ${card}`}
          >
            <div>
              <h3 className="font-bold">
                Mature Content
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Mark if story contains
                mature themes.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMature(
                  !mature
                )
              }
              className={`w-16 h-9 rounded-full transition relative ${
                mature
                  ? "bg-purple-600"
                  : "bg-gray-400"
              }`}
            >
              <div
                className={`absolute top-1 w-7 h-7 rounded-full bg-white transition ${
                  mature
                    ? "translate-x-8"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  size={22}
                  className="animate-spin"
                />

                Publishing...
              </>
            ) : (
              <>
                <Upload size={22} />

                Publish Story
              </>
            )}
          </button>

          {/* FOOTER */}
          <div className="mt-8 text-center text-sm text-gray-400">
            By publishing, you agree to
            Unihelp community guidelines.
          </div>
        </form>

        {/* SUCCESS CARD */}
        <div
          className={`rounded-3xl border p-6 mt-10 flex items-center gap-5 ${card}`}
        >
          <CheckCircle2
            size={50}
            className="text-green-500"
          />

          <div>
            <h3 className="font-bold text-xl">
              Build Your Audience
            </h3>

            <p className="text-gray-400 mt-1">
              Readers can discover, like,
              bookmark and share your
              stories globally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
