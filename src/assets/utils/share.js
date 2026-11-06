const SHARE_BASE = "https://myunihelp.com.ng";

export const buildShareUrl = (pathname, params = {}) => {
  const url = new URL(String(pathname || "").replace(/^\//, ""), `${SHARE_BASE}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

export const shareContent = async ({ title, text, url }) => {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return "shared";
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  window.prompt("Copy this link", url);
  return "copied";
};
