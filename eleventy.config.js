const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");

  eleventyConfig.addWatchTarget("data/");

  // Escape every {{ value }} by default; intentional HTML must be marked `| safe`.
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

  // Shown in the footer as the "last updated" stamp.
  eleventyConfig.addGlobalData("buildDate", () => new Date());
  eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));

  // 3.5 -> "★★★½"
  eleventyConfig.addFilter("stars", (rating) => "★".repeat(Math.floor(rating)) + (rating % 1 ? "½" : ""));

  // "2026-10-31" -> "Oct 31, 2026" (dates stay as plain strings, so no time zone surprises)
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  eleventyConfig.addFilter("readableDate", (iso) => {
    const [year, month, day] = iso.split("-").map(Number);
    return `${MONTHS[month - 1]} ${day}, ${year}`;
  });

  // An animated GIF that shows a still frame to visitors who prefer reduced motion.
  // Expects src/assets/gifs/<name>.gif and <name>-still.png (see README).
  eleventyConfig.addShortcode("gif", (name, alt, width, height) => {
    const base = `/assets/gifs/${encodeURIComponent(name)}`;
    return `<picture class="gif"><source srcset="${base}-still.png" media="(prefers-reduced-motion: reduce)"><img src="${base}.gif" alt="${escapeHtml(alt)}" width="${Number(width)}" height="${Number(height)}" loading="lazy"></picture>`;
  });
}

export const config = {
  dir: {
    input: "src",
    output: "_site",
  },
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
};
