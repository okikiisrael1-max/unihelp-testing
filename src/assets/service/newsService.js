// ================= CONFIG =================
const NEWS_DATA_API_KEY =
  "pub_8e4604fffe4c4da6978410bb483909b7";
const GNEWS_API_KEY =
  "83f4c77fb42e587d094456b2ae149c99";

// ================= CACHE =================
let cache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 mins

// ================= NEWSDATA =================
const fetchFromNewsData = async () => {
  try {
    const res = await fetch(
      `https://newsdata.io/api/1/news?apikey=${NEWS_DATA_API_KEY}&country=ng&language=en&category=education,politics,business,technology,sports`
    );

    const data = await res.json();

    if (!data || !Array.isArray(data.results)) {
      console.error("NewsData invalid response:", data);
      return [];
    }

    return data.results.map((item) => ({
      title: item.title || "",
      description: item.description || "",
      link: item.link || "#",
      image: item.image_url || "",
      source: "NewsData",
    }));
  } catch (err) {
    console.error("NewsData API error:", err);
    return [];
  }
};

// ================= GNEWS =================
const fetchFromGNews = async () => {
  try {
    const res = await fetch(
      `https://gnews.io/api/v4/top-headlines?country=ng&lang=en&max=10&token=${GNEWS_API_KEY}`
    );

    const data = await res.json();

    if (!data || !Array.isArray(data.articles)) {
      console.error("GNews invalid response:", data);
      return [];
    }

    return data.articles.map((item) => ({
      title: item.title || "",
      description: item.description || "",
      link: item.url || "#",
      image: item.image || "",
      source: "GNews",
    }));
  } catch (err) {
    console.error("GNews API error:", err);
    return [];
  }
};

// ================= CATEGORY =================
const categorize = (text = "") => {
  const t = text.toLowerCase();

  if (
    t.includes("president") ||
    t.includes("government") ||
    t.includes("senate") ||
    t.includes("minister")
  )
    return "Politics";

  if (
    t.includes("school") ||
    t.includes("education") ||
    t.includes("university") ||
    t.includes("jamb") ||
    t.includes("waec") ||
    t.includes("student")
  )
    return "Education";

  if (
    t.includes("tech") ||
    t.includes("ai") ||
    t.includes("startup") ||
    t.includes("app")
  )
    return "Tech";

  if (
    t.includes("economy") ||
    t.includes("bank") ||
    t.includes("finance") ||
    t.includes("business")
  )
    return "Business";

  if (
    t.includes("football") ||
    t.includes("sport") ||
    t.includes("match")
  )
    return "Sports";

  return "General";
};

// ================= REMOVE DUPLICATES =================
const removeDuplicates = (articles) => {
  const seen = new Set();

  return articles.filter((item) => {
    const key = (item.title || "").trim().toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

// ================= MAIN EXPORT =================
export const fetchNigeriaNews = async () => {
  try {
    const now = Date.now();

    // ===== CACHE CHECK =====
    if (cache && now - lastFetchTime < CACHE_DURATION) {
      return cache;
    }

    // ===== FETCH IN PARALLEL =====
    const [newsData, gnews] = await Promise.all([
      fetchFromNewsData(),
      fetchFromGNews(),
    ]);

    // ===== MERGE =====
    let combined = [...newsData, ...gnews];

    // ===== FILTER NIGERIA RELEVANT =====
    combined = combined.filter((item) => {
      const text = (
        (item.title || "") +
        " " +
        (item.description || "")
      ).toLowerCase();

      return (
        text.includes("nigeria") ||
        text.includes("lagos") ||
        text.includes("abuja") ||
        text.includes("student") ||
        text.includes("school") ||
        text.includes("university") ||
        text.includes("politics") ||
        text.includes("economy")
      );
    });

    // ===== CLEAN DUPLICATES =====
    combined = removeDuplicates(combined);

    // ===== FORMAT FINAL DATA =====
    const finalData = combined.map((item, index) => ({
      id: index,
      title: item.title,
      description: item.description,
      link: item.link,
      image: item.image,
      source: item.source,
      category: categorize(
        item.title + " " + item.description
      ),
    }));

    // ===== SAVE CACHE =====
    cache = finalData;
    lastFetchTime = now;

    return finalData;
  } catch (err) {
    console.error("Fetch Nigeria News Error:", err);
    return [];
  }
};