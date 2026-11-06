const SHARE_BASE = "https://myunihelp.com.ng";
const DEFAULT_IMAGE = `${SHARE_BASE}/logo.png`;

const setMeta = (attribute, key, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

export const updateShareMetadata = ({
  title = "UniHelp | Nigeria's Student Super App",
  description = "Discover student communities, campus listings, learning resources, and more on UniHelp.",
  url,
  image = DEFAULT_IMAGE,
} = {}) => {
  if (typeof document === "undefined") return;

  const pageUrl = url || new URL(`${window.location.pathname}${window.location.search}`, SHARE_BASE).toString();
  const imageUrl = new URL(image, SHARE_BASE).toString();
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:site_name", "UniHelp");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", pageUrl);
  setMeta("property", "og:image", imageUrl);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", imageUrl);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = pageUrl;
};
