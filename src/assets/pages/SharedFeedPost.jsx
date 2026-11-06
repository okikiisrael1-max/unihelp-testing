import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getJson } from "../../services/api";
import { updateShareMetadata } from "../utils/shareMetadata";

export default function SharedFeedPost({ dark = false }) {
  const location = useLocation();
  const postId = new URLSearchParams(location.search).get("post")?.trim() || "";
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(Boolean(postId));
  const [unavailable, setUnavailable] = useState(false);
  const theme = dark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900";
  const muted = dark ? "text-slate-300" : "text-slate-600";

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      setPost(null);
      setUnavailable(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setUnavailable(false);
    getJson(`/api/feed/posts/${encodeURIComponent(postId)}/public`)
      .then((response) => {
        const record = response?.item;
        if (!record?.id || record.audience !== "everyone") throw new Error("Post unavailable");
        if (!cancelled) setPost(record);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    if (!post) {
      updateShareMetadata({
        title: "Student feed | UniHelp",
        description: "Discover student communities, campus listings, learning resources, and more on UniHelp.",
      });
      return;
    }

    updateShareMetadata({
      title: `${post.authorName || "UniHelp student"} on UniHelp`,
      description: String(post.content || "View this student post on UniHelp.").slice(0, 200),
      url: `https://myunihelp.com.ng/feed?post=${encodeURIComponent(post.id)}`,
      image: post.imageUrl || "/logo.png",
    });
  }, [post]);

  return (
    <main className={`min-h-screen px-4 py-10 md:pt-24 ${theme}`}>
      <article className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase text-indigo-500">UniHelp feed</p>
        {loading ? <p className="py-12">Loading this post...</p> : null}
        {!loading && unavailable ? (
          <section className="border-t py-8">
            <h1 className="mt-4 text-2xl font-black">This post is unavailable</h1>
            <p className={`mt-3 ${muted}`}>It may have expired, been deleted, or be shared with friends only.</p>
            <Link
              to="/login"
              state={{ from: { pathname: location.pathname, search: location.search } }}
              className="mt-5 inline-flex rounded-md bg-indigo-600 px-4 py-3 font-semibold text-white"
            >
              Sign in to UniHelp
            </Link>
          </section>
        ) : null}
        {!loading && !unavailable && !postId ? (
          <section className="border-t py-8">
            <h1 className="mt-4 text-2xl font-black">Student feed</h1>
            <p className={`mt-3 ${muted}`}>Open a shared post link to view its content.</p>
            <Link to="/login" className="mt-5 inline-flex font-semibold text-indigo-500">Sign in to UniHelp</Link>
          </section>
        ) : null}
        {post ? (
          <section className="mt-5 border-t py-6">
            <p className="font-bold">{post.authorName || "UniHelp student"}</p>
            {post.university ? <p className={`mt-1 text-sm ${muted}`}>{post.university}</p> : null}
            {post.content ? <p className="mt-5 whitespace-pre-wrap leading-7">{post.content}</p> : null}
            {post.imageUrl ? <img src={post.imageUrl} alt="Shared UniHelp post" className="mt-5 max-h-[38rem] w-full rounded-lg object-contain" /> : null}
            <p className={`mt-5 text-sm ${muted}`}>Shared from UniHelp</p>
          </section>
        ) : null}
      </article>
    </main>
  );
}
