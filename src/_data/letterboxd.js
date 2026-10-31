// Recently watched films from Letterboxd, fetched at build time.
// Everything from the feed is untrusted: only known fields are kept, reviews are reduced to
// plain text, and each value is shape-checked. Templates autoescape on top of that.
// If Letterboxd is unreachable, the last good copy is pulled from the live site instead.

const FEED_URL = "https://letterboxd.com/thenickatnite/rss/";
const FALLBACK_URL = "https://nickbrown.live/assets/data/letterboxd.json";
const PROFILE_PREFIX = "https://letterboxd.com/thenickatnite/";
const LIMIT = 10;
const SNIPPET_LENGTH = 140;
const TIMEOUT_MS = 10_000;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decodeEntities = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });

const tagText = (xml, name) => {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  if (!match) return "";
  return match[1].replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, "$1").trim();
};

const toPlainText = (html) =>
  decodeEntities(html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const snippet = (text) => {
  if (text.length <= SNIPPET_LENGTH) return text;
  const cut = text.slice(0, SNIPPET_LENGTH);
  return cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : SNIPPET_LENGTH).replace(/[\s,.;:!?-]+$/, "") + "…";
};

// The single gate every film passes through, whether it came from the feed or the fallback.
const sanitizeFilm = (film) => {
  if (!film || typeof film !== "object") return null;
  const title = typeof film.title === "string" ? film.title.trim().slice(0, 200) : "";
  const url = typeof film.url === "string" && film.url.startsWith(PROFILE_PREFIX) && !/["'<>\s]/.test(film.url) ? film.url : "";
  const watched = typeof film.watched === "string" && /^\d{4}-\d{2}-\d{2}$/.test(film.watched) ? film.watched : "";
  if (!title || !url || !watched) return null;
  const rating = Number(film.rating);
  return {
    title,
    year: typeof film.year === "string" && /^\d{4}$/.test(film.year) ? film.year : "",
    rating: rating >= 0.5 && rating <= 5 && rating * 2 === Math.round(rating * 2) ? rating : null,
    liked: film.liked === true,
    rewatch: film.rewatch === true,
    watched,
    review: typeof film.review === "string" ? snippet(film.review.trim()).slice(0, SNIPPET_LENGTH + 1) : "",
    url,
  };
};

const parseFeed = (xml) =>
  xml
    .split("<item>")
    .slice(1)
    .map((item) => {
      const title = decodeEntities(tagText(item, "letterboxd:filmTitle"));
      if (!title) return null; // lists and other non-diary items
      const review = toPlainText(tagText(item, "description"))
        .replace(/^Watched on [A-Za-z]+ [A-Za-z]+ \d{1,2}, \d{4}\.?\s*/, "")
        .replace(/^This review may contain spoilers\.?\s*/i, "");
      return sanitizeFilm({
        title,
        year: tagText(item, "letterboxd:filmYear"),
        rating: tagText(item, "letterboxd:memberRating") || null,
        liked: tagText(item, "letterboxd:memberLike") === "Yes",
        rewatch: tagText(item, "letterboxd:rewatch") === "Yes",
        watched: tagText(item, "letterboxd:watchedDate"),
        review,
        url: tagText(item, "link"),
      });
    })
    .filter(Boolean);

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "nickbrown.live site build (+https://nickbrown.live)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
};

export default async function () {
  try {
    const films = parseFeed(await fetchText(FEED_URL)).slice(0, LIMIT);
    if (films.length === 0) throw new Error("feed had no films");
    return { films, source: "letterboxd" };
  } catch (error) {
    console.warn(`[letterboxd] live feed unavailable (${error.message}); trying last published copy`);
  }
  try {
    const published = JSON.parse(await fetchText(FALLBACK_URL));
    const films = (Array.isArray(published.films) ? published.films : []).map(sanitizeFilm).filter(Boolean).slice(0, LIMIT);
    if (films.length === 0) throw new Error("published copy had no films");
    return { films, source: "fallback" };
  } catch (error) {
    console.warn(`[letterboxd] last published copy unavailable (${error.message}); showing nothing`);
    return { films: [], source: "none" };
  }
}
