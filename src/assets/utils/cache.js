const CACHE_PREFIX = "campusflow_cache_";

export const setCache = (key, data, ttl = 1000 * 60 * 10) => {
  const item = {
    data,
    expiry: Date.now() + ttl,
  };

  localStorage.setItem(
    CACHE_PREFIX + key,
    JSON.stringify(item)
  );
};

export const getCache = (key) => {
  const item = localStorage.getItem(CACHE_PREFIX + key);
  if (!item) return null;

  const parsed = JSON.parse(item);

  if (Date.now() > parsed.expiry) {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }

  return parsed.data;
};