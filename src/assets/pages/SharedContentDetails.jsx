import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getJson } from "../../services/api";
import { updateShareMetadata } from "../utils/shareMetadata";

const isHostel = (type) => type === "hostel";
const formatPrice = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `₦${amount.toLocaleString("en-NG")}` : "Price unavailable";
};

const getQuestionFileUrl = (item) => (
  item?.originalFile?.url || item?.fileUrl || item?.downloadUrl || item?.url || ""
);

export default function SharedContentDetails({ type, dark = false }) {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hostel = isHostel(type);
  const theme = dark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900";
  const muted = dark ? "text-slate-300" : "text-slate-600";
  const border = dark ? "border-white/10" : "border-slate-200";

  useEffect(() => {
    if (!id || (!hostel && !user)) {
      setLoading(false);
      setError(!hostel && !user ? "Sign in to view this past question." : "This link is invalid.");
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    const endpoint = hostel ? "hostels" : "past-questions";
    getJson(`/api/${endpoint}/${encodeURIComponent(id)}`)
      .then((response) => {
        const record = response?.item || response;
        if (!record?.id) throw new Error("This content is unavailable.");
        if (hostel && ["pending", "rejected", "deleted"].includes(String(record.status || "").toLowerCase())) {
          throw new Error("This hostel listing is not publicly available.");
        }
        if (!cancelled) setItem(record);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError?.message || "Could not load this content.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [hostel, id, user]);

  useEffect(() => {
    const contentTitle = item?.title || item?.courseCode || (hostel ? "Hostel listing" : "Past question");
    const description = hostel
      ? [item?.location, item?.description].filter(Boolean).join(" · ") || "View this student hostel listing on UniHelp."
      : [item?.courseCode, item?.school, item?.year].filter(Boolean).join(" · ") || "View this past-question resource on UniHelp.";
    updateShareMetadata({
      title: `${contentTitle} | UniHelp`,
      description: description.slice(0, 200),
    });
  }, [hostel, item]);

  const title = item?.title || item?.courseCode || (hostel ? "Hostel listing" : "Past question");
  const imageUrls = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
  const questionBlocks = Array.isArray(item?.content)
    ? item.content.map((block) => typeof block === "string" ? block : block?.text || block?.value || block?.content || "").filter(Boolean)
    : [];
  const fileUrl = getQuestionFileUrl(item);

  return (
    <main className={`min-h-screen px-4 py-8 md:pt-24 ${theme}`}>
      <article className="mx-auto max-w-4xl">
        <Link to={hostel ? "/hostels" : "/resources"} className={`inline-flex items-center gap-2 text-sm font-semibold ${muted}`}>
          Back to UniHelp
        </Link>

        {loading ? (
          <p className="py-16 text-center">Loading shared content...</p>
        ) : error ? (
          <section className={`mt-8 border-t py-10 ${border}`}>
            <h1 className="text-2xl font-bold">Content unavailable</h1>
            <p className={`mt-3 ${muted}`}>{error}</p>
            {!user && !hostel ? (
              <Link to="/login" state={{ from: { pathname: window.location.pathname, search: window.location.search } }} className="mt-5 inline-flex font-semibold text-indigo-500">
                Sign in to continue
              </Link>
            ) : null}
          </section>
        ) : item ? (
          <>
            <header className={`mt-6 border-b pb-6 ${border}`}>
              <p className="text-sm font-bold uppercase text-indigo-500">{hostel ? "Student hostel" : "Past question"}</p>
              <h1 className="mt-2 text-3xl font-black">{title}</h1>
              <div className={`mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm ${muted}`}>
                {hostel ? (
                  <>
                    {item.location ? <span>{item.location}</span> : null}
                    <span>{formatPrice(item.price)}</span>
                  </>
                ) : (
                  <>
                    {item.courseCode ? <span>{item.courseCode}</span> : null}
                    {item.school ? <span>{item.school}</span> : null}
                    {item.year || item.session ? <span>{item.year || item.session}</span> : null}
                  </>
                )}
              </div>
            </header>

            {imageUrls.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {imageUrls.slice(0, 4).map((src) => (
                  <img key={src} src={src} alt={title} className="max-h-[28rem] w-full rounded-lg object-cover" />
                ))}
              </div>
            ) : null}

            {hostel ? (
              <section className="py-7">
                <h2 className="text-lg font-bold">About this hostel</h2>
                <p className={`mt-3 whitespace-pre-wrap leading-7 ${muted}`}>{item.description || "No description was provided."}</p>
                {item.phone ? <p className="mt-5 font-semibold">Contact: {item.phone}</p> : null}
              </section>
            ) : (
              <section className="py-7">
                <h2 className="text-lg font-bold">Question resource</h2>
                {fileUrl ? (
                  <div className="mt-4 space-y-3">
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-md bg-indigo-600 px-4 py-3 font-semibold text-white">
                      Open original document
                    </a>
                    {/\.pdf(?:\?|$)/i.test(fileUrl) ? (
                      <iframe title={title} src={fileUrl} className="h-[70vh] min-h-96 w-full border-0" />
                    ) : null}
                  </div>
                ) : null}
                {questionBlocks.length ? (
                  <div className={`mt-5 space-y-3 leading-7 ${muted}`}>
                    {questionBlocks.slice(0, 12).map((block, index) => <p key={`${index}-${block.slice(0, 24)}`}>{block}</p>)}
                  </div>
                ) : null}
                {!fileUrl && !questionBlocks.length ? <p className={`mt-3 ${muted}`}>No preview is available for this resource.</p> : null}
              </section>
            )}
          </>
        ) : null}
      </article>
    </main>
  );
}
