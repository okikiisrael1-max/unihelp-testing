const SITE_ORIGIN = "https://myunihelp.com.ng";
const BACKEND_ORIGIN = (process.env.VITE_API_URL || "https://unihelp-backend-vdps.onrender.com").replace(/\/$/, "");
const FALLBACK_IMAGE = `${SITE_ORIGIN}/logo.png`;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const shorten = (value, maxLength = 200) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

const toPublicImage = (value) => {
  if (typeof value !== "string") return FALLBACK_IMAGE;
  try {
    const parsed = new URL(value, SITE_ORIGIN);
    return parsed.protocol === "https:" ? parsed.toString() : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
};

const fetchPublicItem = async (path) => {
  const response = await fetch(`${BACKEND_ORIGIN}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.item || payload?.data || payload || null;
};

const getPreview = async (kind, id) => {
  if (!id || id.length > 256 || /[\\/\u0000-\u001f]/.test(id)) return null;
  const encodedId = encodeURIComponent(id);

  if (kind === "feed") {
    const item = await fetchPublicItem(`/api/feed/posts/${encodedId}/public`);
    if (!item || item.audience !== "everyone") return null;
    return {
      title: `${item.authorName || "UniHelp student"} on UniHelp`,
      description: shorten(item.content || "View this student post on UniHelp."),
      url: `${SITE_ORIGIN}/feed?post=${encodedId}`,
      image: item.imageUrl,
    };
  }

  if (kind === "marketplace") {
    const item = await fetchPublicItem(`/api/marketplace/${encodedId}`);
    if (!item) return null;
    const image = Array.isArray(item.images) ? item.images[0] : item.imageUrl;
    return {
      title: `${item.title || "Marketplace listing"} | UniHelp`,
      description: shorten([item.category, item.location, item.description].filter(Boolean).join(" · ")),
      url: `${SITE_ORIGIN}/marketplace/${encodedId}`,
      image,
    };
  }

  if (kind === "hostel") {
    const item = await fetchPublicItem(`/api/hostels/${encodedId}`);
    if (!item || ["pending", "rejected", "deleted"].includes(String(item.status || "").toLowerCase())) return null;
    return {
      title: `${item.title || "Student hostel"} | UniHelp`,
      description: shorten([item.location, item.description].filter(Boolean).join(" · ")),
      url: `${SITE_ORIGIN}/hostels/${encodedId}`,
      image: Array.isArray(item.images) ? item.images[0] : item.imageUrl,
    };
  }

  if (kind === "past-question") {
    const item = await fetchPublicItem(`/api/past-questions/${encodedId}/public`);
    if (!item || item.status !== "published") return null;
    return {
      title: `${item.title || item.courseCode || "Past question"} | UniHelp`,
      description: shorten([item.courseCode, item.school, item.year || item.session].filter(Boolean).join(" · ") || "View this past-question resource on UniHelp."),
      url: `${SITE_ORIGIN}/past-questions/${encodedId}`,
      image: item.coverImage || item.thumbnail || (Array.isArray(item.images) ? item.images[0] : ""),
    };
  }

  if (kind === "profile") {
    const response = await fetchPublicItem(`/api/users/public/${encodedId}`);
    const profile = response?.profile;
    if (!profile) return null;
    const name = profile.username || profile.displayName || "UniHelp student";
    return {
      title: `${name} | UniHelp profile`,
      description: "View this student's public profile on UniHelp.",
      url: `${SITE_ORIGIN}/profile/${encodedId}`,
      image: profile.photo || profile.photoURL || profile.photoThumb,
    };
  }

  return null;
};

export default async function handler(request, response) {
  const query = request.query || {};
  const kind = String(query.kind || "");
  const id = String(kind === "feed" ? query.post || "" : query.id || "");
  const preview = await getPreview(kind, id).catch(() => null);
  const metadata = preview || {
    title: "UniHelp | Nigeria's Student Super App",
    description: "Discover student communities, campus listings, learning resources, and more on UniHelp.",
    url: SITE_ORIGIN,
    image: FALLBACK_IMAGE,
  };
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const url = escapeHtml(metadata.url);
  const image = escapeHtml(toPublicImage(metadata.image));
  const status = preview ? 200 : 404;

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  response.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta property="og:type" content="website"><meta property="og:site_name" content="UniHelp"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"><link rel="canonical" href="${url}"></head><body><main><h1>${title}</h1><p>${description}</p><a href="${url}">Open on UniHelp</a></main></body></html>`);
}
