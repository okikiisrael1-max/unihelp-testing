import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db, auth } from "../../firebase/config";
import { getCache, setCache } from "../utils/cache";

import {
  GraduationCap,
  Search,
  BookOpen,
  Sparkles,
  Trash2,
  ArrowRight,
  Filter,
  CheckCircle2,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Send,
  MessageCircle,
} from "lucide-react";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const PAGE_SIZE = 12;

export default function TutorialMarketplace({ dark }) {
  const [tutorials, setTutorials] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [lastDoc, setLastDoc] = useState(null);
  const [purchasedIds, setPurchasedIds] = useState([]);

  /* =========================
     FETCH
  ========================= */
  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const cached = getCache("tutorials");

        if (cached) {
          setTutorials(cached);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "tutorials"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setTutorials(data);
        setLastDoc(snap.docs[snap.docs.length - 1]);

        setCache("tutorials", data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  /* =========================
     PURCHASE LISTENER
  ========================= */
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs
        .filter((d) => d.data().status === "approved")
        .map((d) => d.data().tutorialId);

      setPurchasedIds(ids);
    });

    return () => unsub();
  }, []);

  /* =========================
     FILTERED
  ========================= */
  const categories = useMemo(() => {
    const cats = tutorials
      .map((t) => t.category)
      .filter(Boolean);

    return ["All", ...new Set(cats)];
  }, [tutorials]);

  const filtered = useMemo(() => {
    let temp = [...tutorials];

    if (category !== "All") {
      temp = temp.filter(
        (t) =>
          t.category?.toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (search.trim()) {
      temp = temp.filter((t) =>
        t.title
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    return temp;
  }, [tutorials, search, category]);

  /* =========================
     LOAD MORE
  ========================= */
  const loadMore = async () => {
    if (!lastDoc) return;

    try {
      setLoadingMore(true);

      const q = query(
        collection(db, "tutorials"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setTutorials((prev) => [...prev, ...data]);

      if (snap.docs.length < PAGE_SIZE) {
        setLastDoc(null);
      } else {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingMore(false);
    }
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id, tutorId) => {
    if (auth.currentUser?.uid !== tutorId) {
      toast.error("You are not authorized to delete this tutorial.");
      return;
    }

    const ok = window.confirm(
      "Delete this tutorial?"
    );

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "tutorials", id));

      setTutorials((prev) =>
        prev.filter((t) => t.id !== id)
      );
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete tutorial. Please try again.");
    }
  };

  /* =========================
     SHARE
  ========================= */
  const shareTutorial = async (tutorial) => {
    const url = `${window.location.origin}/tutorial/${tutorial.id}`;

    const shareData = {
      title: tutorial.title,
      text: `Watch "${tutorial.title}" on Unihelp`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);

        toast.success("Tutorial link copied to clipboard.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const copyLink = async (tutorialId) => {
    const url = `${window.location.origin}/tutorial/${tutorialId}`;

    try {
      await navigator.clipboard.writeText(url);

      toast.success("Link copied successfully.");
    } catch (err) {
      console.log(err);
    }
  };

  const socialLinks = (tutorial) => {
    const url = encodeURIComponent(
      `${window.location.origin}/tutorial/${tutorial.id}`
    );

    const text = encodeURIComponent(
      `Watch "${tutorial.title}" on Unihelp`
    );

    return {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
  };

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen w-full md:pt-20 ${bg}`}>
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-blue-500/20 blur-[120px] rounded-full" />

        <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* HERO */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-5">
              <Sparkles size={16} />
              Startup Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl font-black flex items-center gap-3">
              <GraduationCap className="text-blue-500" />
              Tutorials
            </h1>

            <p className="text-gray-400 mt-4 text-base sm:text-lg max-w-xl">
              Discover premium tutorials from expert
              creators worldwide.
            </p>
          </div>

          <Link
            to="/create-tutorial"
            className="h-fit bg-linear-to-r from-blue-600 to-purple-600 text-white px-7 py-4 rounded-2xl font-semibold hover:scale-105 transition"
          >
            Become a Tutor
          </Link>
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
                placeholder="Search tutorials..."
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            {/* CATEGORY */}
            <div className="relative">
              <Filter
                className="absolute left-4 top-4 text-gray-400"
                size={18}
              />

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className={`w-full pl-12 py-4 rounded-2xl border outline-none ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-white border-gray-300"
                }`}
              >
                {categories.map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center text-gray-400 py-20">
            Loading tutorials...
          </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <div
            className={`rounded-3xl border p-14 text-center ${card}`}
          >
            <GraduationCap
              size={60}
              className="mx-auto mb-4 text-blue-500"
            />

            <h2 className="text-2xl font-bold">
              No Tutorials Found
            </h2>

            <p className="text-gray-400 mt-3">
              Try searching with another keyword.
            </p>
          </div>
        )}

        {/* GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((t) => {
            const purchased =
              purchasedIds.includes(t.id);

            const socials = socialLinks(t);

            return (
              <div
                key={t.id}
                className={`rounded-3xl border overflow-hidden transition hover:-translate-y-2 hover:shadow-2xl ${card}`}
              >
                {/* IMAGE */}
                <div className="h-56 relative overflow-hidden">
                  <img
                    src={t.thumbnailUrl}
                    alt={t.title}
                    className="w-full h-full object-cover hover:scale-110 transition duration-500"
                  />

                  {/* PURCHASED */}
                  {purchased && (
                    <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      Purchased
                    </div>
                  )}

                  {/* SHARE BUTTON */}
                  <button
                    onClick={() => shareTutorial(t)}
                    className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 transition"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                {/* BODY */}
                <div className="p-6">
                  {/* CATEGORY */}
                  {t.category && (
                    <div className="inline-flex mb-4 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                      {t.category}
                    </div>
                  )}

                  <h2 className="text-xl font-bold line-clamp-1">
                    {t.title}
                  </h2>

                  <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                    {t.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
                    <BookOpen size={16} />
                    {t.tutorName}
                  </div>

                  {/* PRICE + OPEN */}
                  <div className="flex justify-between items-center mt-6 gap-3">
                    <span className="text-2xl font-black text-blue-500">
                      ₦
                      {Number(
                        t.price || 0
                      ).toLocaleString()}
                    </span>

                    <Link
                      to={`/tutorial/${t.id}`}
                      className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:scale-105 transition"
                    >
                      Open
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  {/* SHARE OPTIONS */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          copyLink(t.id)
                        }
                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition ${
                          dark
                            ? "border-white/10 bg-white/5 hover:bg-white/10"
                            : "border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <Copy size={16} />
                        Copy Link
                      </button>

                      <a
                        href={socials.whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center hover:scale-110 transition"
                      >
                        <MessageCircle size={18} />
                      </a>
                      
                      <a
                        href={socials.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center hover:scale-110 transition"
                      >
                        <Twitter size={18} />
                      </a>

                      <a
                        href={socials.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition"
                      >
                        <Facebook size={18} />
                      </a>
                    </div>
                  </div>

                  {/* DELETE */}
                  {auth.currentUser?.uid ===
                    t.tutorId && (
                    <button
                      onClick={() =>
                        handleDelete(
                          t.id,
                          t.tutorId
                        )
                      }
                      className="w-full mt-4 py-3 rounded-xl bg-red-600 text-white flex items-center justify-center gap-2 hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOAD MORE */}
        {!loading && lastDoc && (
          <div className="text-center mt-14">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-linear-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-2xl text-white font-semibold hover:scale-105 transition disabled:opacity-50"
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