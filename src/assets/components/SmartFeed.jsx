import { useEffect, useMemo, useState } from "react";

import {
  Newspaper,
  Search,
  TrendingUp,
  ExternalLink,
  Loader2,
  Heart,
  Bookmark,
  X,
  Sparkles,
  Flame,
  ChevronRight,
  Share2,
  Eye,
  Clock3,
  NewspaperIcon,
} from "lucide-react";

import { db, auth } from "../../firebase/config";

import {
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";

import { fetchNigeriaNews } from "../service/newsService";

export default function SmartFeed({ dark }) {
  /* =========================================================
     STATES
  ========================================================= */

  const [posts, setPosts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [activeTag, setActiveTag] =
    useState("All");

  const [selectedPost, setSelectedPost] =
    useState(null);

  const [likes, setLikes] =
    useState({});

  const [saved, setSaved] =
    useState({});

  const [bookmarks, setBookmarks] =
    useState([]);

  /* =========================================================
     TAGS
  ========================================================= */

  const tags = [
    "All",
    "Admissions",
    "Exams",
    "Scholarships",
    "Campus News",
    "Politics",
    "Tech",
    "Business",
    "Sports",
    "NYSC",
    "Funding",
    "General",
  ];

  /* =========================================================
     DETECT TAG
  ========================================================= */

  const getStudentTag = (
    text = ""
  ) => {
    const t =
      text.toLowerCase();

    if (
      t.includes("jamb") ||
      t.includes("utme") ||
      t.includes("admission")
    )
      return "Admissions";

    if (
      t.includes("waec") ||
      t.includes("neco") ||
      t.includes("exam")
    )
      return "Exams";

    if (
      t.includes("scholarship") ||
      t.includes("fellowship")
    )
      return "Scholarships";

    if (
      t.includes("nysc")
    )
      return "NYSC";

    if (
      t.includes("university") ||
      t.includes("student") ||
      t.includes("campus")
    )
      return "Campus News";

    if (
      t.includes("funding") ||
      t.includes("grant")
    )
      return "Funding";

    if (
      t.includes("president") ||
      t.includes("government") ||
      t.includes("senate") ||
      t.includes("minister")
    )
      return "Politics";

    if (
      t.includes("tech") ||
      t.includes("startup") ||
      t.includes("ai") ||
      t.includes("software")
    )
      return "Tech";

    if (
      t.includes("business") ||
      t.includes("finance") ||
      t.includes("economy") ||
      t.includes("naira")
    )
      return "Business";

    if (
      t.includes("football") ||
      t.includes("league") ||
      t.includes("sport")
    )
      return "Sports";

    return "General";
  };

  /* =========================================================
     FETCH NEWS
  ========================================================= */

  useEffect(() => {
    const loadNews =
      async () => {
        setLoading(true);

        try {
          const data =
            await fetchNigeriaNews();

          const generateImage =
            (
              title = ""
            ) => {
              const encoded =
                encodeURIComponent(
                  title
                );

              return `https://source.unsplash.com/900x700/?students,education,nigeria,${encoded}`;
            };

          const formatted =
            data.map(
              (
                item,
                index
              ) => ({
                id:
                  item.id ||
                  index,

                title:
                  item.title,

                description:
                  item.description,

                link:
                  item.link,

                image:
                  item.image ||
                  generateImage(
                    item.title
                  ),

                tag:
                  getStudentTag(
                    `${item.title} ${item.description}`
                  ),

                views:
                  Math.floor(
                    Math.random() *
                      3000
                  ),

                readTime:
                  Math.floor(
                    Math.random() *
                      7
                  ) + 2,
              })
            );

          setPosts(
            formatted
          );

          localStorage.setItem(
            "smartFeedCache",
            JSON.stringify(
              formatted
            )
          );
        } catch (err) {
          console.log(
            err
          );

          const cache =
            localStorage.getItem(
              "smartFeedCache"
            );

          if (cache) {
            setPosts(
              JSON.parse(
                cache
              )
            );
          }
        }

        setLoading(false);
      };

    loadNews();
  }, []);

  /* =========================================================
     FILTER POSTS
  ========================================================= */

  const filteredPosts =
    useMemo(() => {
      return posts
        .filter((post) => {
          const matchSearch =
            post.title
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            post.description
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchTag =
            activeTag ===
              "All" ||
            post.tag ===
              activeTag;

          return (
            matchSearch &&
            matchTag
          );
        })
        .sort(
          (a, b) => {
            const scoreA =
              (likes[
                a.id
              ] || 0) *
                2 +
              (saved[
                a.id
              ]
                ? 5
                : 0) +
              a.views;

            const scoreB =
              (likes[
                b.id
              ] || 0) *
                2 +
              (saved[
                b.id
              ]
                ? 5
                : 0) +
              b.views;

            return (
              scoreB -
              scoreA
            );
          }
        );
    }, [
      posts,
      search,
      activeTag,
      likes,
      saved,
    ]);

  /* =========================================================
     TOGGLE LIKE
  ========================================================= */

  const toggleLike =
    (id) => {
      setLikes(
        (prev) => ({
          ...prev,
          [id]:
            prev[id]
              ? prev[id] -
                1
              : 1,
        })
      );
    };

  /* =========================================================
     SAVE POST
  ========================================================= */

  const toggleSave =
    async (
      id
    ) => {
      setSaved(
        (prev) => ({
          ...prev,
          [id]:
            !prev[id],
        })
      );

      if (
        auth.currentUser
      ) {
        try {
          const refDoc =
            doc(
              db,
              "users",
              auth
                .currentUser
                .uid
            );

          await updateDoc(
            refDoc,
            {
              bookmarks:
                arrayUnion(
                  id
                ),
            }
          );

          setBookmarks(
            (
              prev
            ) => [
              ...prev,
              id,
            ]
          );
        } catch (err) {
          console.log(
            err
          );
        }
      }
    };

  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f3f7ff] text-gray-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div
      className={`min-h-screen w-full md:pt-20 px-4 md:px-6 py-6 ${bg}`}
    >
      <div className="max-w-7xl mx-auto">

        <div
          className={`relative overflow-hidden rounded-4xl p-6 md:p-10 mb-8 ${
            dark
              ? "bg-linear-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 border border-white/10"
              : "bg-linear-to-br from-indigo-500 to-purple-600 text-white"
          }`}
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-sm">
                <Sparkles size={16} />
                Personalized Campus Feed
              </div>

              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                Smart Feed
              </h1>

              <p className="max-w-2xl opacity-80 text-sm md:text-base">
                Discover trending student news,
                scholarships, tech updates,
                campus opportunities and everything
                happening around Nigerian universities.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 sm:w-auto sm:min-w-[17rem]">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                <p className="text-3xl font-black">
                  {posts.length}
                </p>

                <p className="text-sm opacity-80">
                  Articles
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                <p className="text-3xl font-black">
                  {
                    filteredPosts.length
                  }
                </p>

                <p className="text-sm opacity-80">
                  Trending
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <div
          className={`${card} p-4 rounded-3xl mb-6`}
        >
          <div className="flex items-center gap-3">
            <Search
              size={18}
              className="opacity-70"
            />

            <input
              placeholder="Search scholarships, tech, campus updates..."
              value={search}
              onChange={(
                e
              ) =>
                setSearch(
                  e.target
                    .value
                )
              }
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>
        </div>

        {/* =====================================================
            TAGS
        ===================================================== */}

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-8">
          {tags.map(
            (
              tag
            ) => (
              <button
                key={
                  tag
                }
                onClick={() =>
                  setActiveTag(
                    tag
                  )
                }
                className={`px-4 py-2 rounded-2xl whitespace-nowrap text-sm transition-all ${
                  activeTag ===
                  tag
                    ? "bg-indigo-600 text-white shadow-lg scale-105"
                    : dark
                    ? "bg-white/5 border border-white/10 hover:bg-white/10"
                    : "bg-white border border-gray-200 hover:border-indigo-400"
                }`}
              >
                {
                  tag
                }
              </button>
            )
          )}
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin mb-4" />

            <p className="opacity-70">
              Loading smart news feed...
            </p>
          </div>
        )}

        {!loading &&
          filteredPosts.length ===
            0 && (
            <div
              className={`${card} rounded-4xl p-10 text-center`}
            >
              <NewspaperIcon
                size={50}
                className="mx-auto mb-4 opacity-40"
              />

              <h2 className="text-xl font-bold">
                No articles found
              </h2>

              <p className="opacity-70 mt-2">
                Try another keyword or category
              </p>
            </div>
          )}


        {!loading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {filteredPosts.map(
              (
                post,
                index
              ) => (
                <div
                  key={
                    post.id
                  }
                  onClick={() =>
                    setSelectedPost(
                      post
                    )
                  }
                  className={`${card} rounded-4xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
                >
                  {/* IMAGE */}

                  <div className="relative h-60 overflow-hidden">

                    <img
                      src={
                        post.image
                      }
                      alt={
                        post.title
                      }
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                    {/* TOP BADGES */}

                    <div className="absolute top-4 left-4 flex gap-2">

                      <span className="px-3 py-1 rounded-full text-xs bg-indigo-600 text-white">
                        {
                          post.tag
                        }
                      </span>

                      {index <
                        3 && (
                        <span className="px-3 py-1 rounded-full text-xs bg-orange-500 text-white flex items-center gap-1">
                          <Flame size={12} />
                          Hot
                        </span>
                      )}
                    </div>

                    {/* BOTTOM */}

                    <div className="absolute bottom-4 left-4 right-4 text-white">

                      <div className="flex items-center gap-4 text-xs opacity-90 mb-2">

                        <span className="flex items-center gap-1">
                          <Eye size={13} />
                          {
                            post.views
                          }
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock3 size={13} />
                          {
                            post.readTime
                          }
                          min read
                        </span>
                      </div>

                      <h2 className="font-bold text-xl line-clamp-2">
                        {
                          post.title
                        }
                      </h2>
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="p-5">

                    <p className="text-sm opacity-70 line-clamp-3">
                      {
                        post.description
                      }
                    </p>

                    {/* ACTIONS */}

                    <div className="flex items-center justify-between mt-5">

                      <div className="flex items-center gap-3">

                        {/* LIKE */}

                        <button
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            toggleLike(
                              post.id
                            );
                          }}
                          className="flex items-center gap-1 text-sm"
                        >
                          <Heart
                            size={
                              18
                            }
                            fill={
                              likes[
                                post.id
                              ]
                                ? "red"
                                : "none"
                            }
                            className={
                              likes[
                                post.id
                              ]
                                ? "text-red-500"
                                : ""
                            }
                          />

                          <span>
                            {likes[
                              post.id
                            ] ||
                              0}
                          </span>
                        </button>

                        {/* SAVE */}

                        <button
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            toggleSave(
                              post.id
                            );
                          }}
                        >
                          <Bookmark
                            size={
                              18
                            }
                            fill={
                              saved[
                                post.id
                              ]
                                ? "orange"
                                : "none"
                            }
                            className={
                              saved[
                                post.id
                              ]
                                ? "text-orange-500"
                                : ""
                            }
                          />
                        </button>

                        {/* SHARE */}

                        <button
                          onClick={async (
                            e
                          ) => {
                            e.stopPropagation();

                            if (
                              navigator.share
                            ) {
                              await navigator.share(
                                {
                                  title:
                                    post.title,

                                  text:
                                    post.description,

                                  url:
                                    post.link,
                                }
                              );
                            }
                          }}
                        >
                          <Share2
                            size={
                              18
                            }
                          />
                        </button>
                      </div>

                      {/* OPEN */}

                      <a
                        href={
                          post.link
                        }
                        target="_blank"
                        rel="noreferrer"
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                      >
                        Read
                        <ChevronRight
                          size={
                            16
                          }
                        />
                      </a>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* =====================================================
            MODAL
        ===================================================== */}

        {selectedPost && (
          <div className="fixed inset-0 z-[501] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">

            <div
              className={`w-full max-w-4xl rounded-4xl overflow-hidden ${
                dark
                  ? "bg-[#0f172a] text-white border border-white/10"
                  : "bg-white text-black"
              }`}
            >
              {/* IMAGE */}

              <div className="relative h-80">

                <img
                  src={
                    selectedPost.image
                  }
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />

                <button
                  onClick={() =>
                    setSelectedPost(
                      null
                    )
                  }
                  className="absolute top-5 right-5 bg-black/60 text-white p-3 rounded-full"
                >
                  <X
                    size={
                      22
                    }
                  />
                </button>

                <div className="absolute bottom-6 left-6 right-6 text-white">

                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-sm">
                    {
                      selectedPost.tag
                    }
                  </span>

                  <h2 className="text-3xl font-black mt-4 leading-tight">
                    {
                      selectedPost.title
                    }
                  </h2>
                </div>
              </div>

              {/* BODY */}

              <div className="p-6 md:p-8">

                <p className="leading-8 opacity-80">
                  {
                    selectedPost.description
                  }
                </p>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-3 mt-8">

                  <a
                    href={
                      selectedPost.link
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <ExternalLink
                      size={
                        18
                      }
                    />
                    Open Source
                  </a>

                  <button
                    onClick={() =>
                      toggleLike(
                        selectedPost.id
                      )
                    }
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500/10 text-red-500"
                  >
                    <Heart
                      size={
                        18
                      }
                      fill={
                        likes[
                          selectedPost
                            .id
                        ]
                          ? "red"
                          : "none"
                      }
                    />

                    {likes[
                      selectedPost
                        .id
                    ] || 0}
                  </button>

                  <button
                    onClick={() =>
                      toggleSave(
                        selectedPost.id
                      )
                    }
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500/10 text-orange-500"
                  >
                    <Bookmark
                      size={
                        18
                      }
                      fill={
                        saved[
                          selectedPost
                            .id
                        ]
                          ? "orange"
                          : "none"
                      }
                    />

                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
