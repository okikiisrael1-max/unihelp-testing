import React from "react";

import {
  Eye,
  Heart,
  BookOpen,
  Clock3,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function StoryCard({
  story,
  dark,
}) {
  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200";

  return (
    <Link
      to={`/stories/${story.id}`}
      className={`group rounded-3xl border overflow-hidden transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${card}`}
    >
      {/* COVER */}
      <div className="relative h-[320px] overflow-hidden">
        <img
          src={
            story.coverImage ||
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop"
          }
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* GENRE */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/90 text-white backdrop-blur-md">
            {story.genre || "General"}
          </span>
        </div>

        {/* STATUS */}
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
              story.status === "completed"
                ? "bg-green-500/90 text-white"
                : "bg-orange-500/90 text-white"
            }`}
          >
            {story.status || "ongoing"}
          </span>
        </div>

        {/* BOTTOM CONTENT */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-white text-2xl font-black line-clamp-1">
            {story.title}
          </h2>

          <p className="text-gray-300 text-sm mt-1">
            by {story.authorName || "Anonymous"}
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5">
        {/* DESCRIPTION */}
        <p
          className={`text-sm leading-relaxed line-clamp-3 ${
            dark
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        >
          {story.description ||
            "No description available."}
        </p>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div
            className={`rounded-2xl p-3 text-center ${
              dark
                ? "bg-white/5"
                : "bg-gray-100"
            }`}
          >
            <Eye
              size={18}
              className="mx-auto mb-2 text-blue-500"
            />

            <p className="text-xs text-gray-400">
              Views
            </p>

            <h4 className="font-bold mt-1">
              {story.views || 0}
            </h4>
          </div>

          <div
            className={`rounded-2xl p-3 text-center ${
              dark
                ? "bg-white/5"
                : "bg-gray-100"
            }`}
          >
            <Heart
              size={18}
              className="mx-auto mb-2 text-pink-500"
            />

            <p className="text-xs text-gray-400">
              Likes
            </p>

            <h4 className="font-bold mt-1">
              {story.likes || 0}
            </h4>
          </div>

          <div
            className={`rounded-2xl p-3 text-center ${
              dark
                ? "bg-white/5"
                : "bg-gray-100"
            }`}
          >
            <BookOpen
              size={18}
              className="mx-auto mb-2 text-purple-500"
            />

            <p className="text-xs text-gray-400">
              Chapters
            </p>

            <h4 className="font-bold mt-1">
              {story.chaptersCount || 0}
            </h4>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock3 size={16} />
            {story.updatedAt || "Recently updated"}
          </div>

          <div className="flex items-center gap-2 text-blue-500 font-semibold">
            <Sparkles size={16} />
            Read
          </div>
        </div>
      </div>
    </Link>
  );
}