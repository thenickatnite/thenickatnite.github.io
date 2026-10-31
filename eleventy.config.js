const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Decorative minimize / maximize / close buttons for window title bars.
const windowControls = `<span class="window-controls" aria-hidden="true"><span>_</span><span>&#x25A1;</span><span>&#x2715;</span></span>`;

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");

  // Shown in the footer as the "last updated" stamp.
  eleventyConfig.addGlobalData("buildDate", () => new Date());
  eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));

  eleventyConfig.addShortcode("windowControls", () => windowControls);

  // An extra window inside a page: {% window "Title" %} markdown {% endwindow %}
  eleventyConfig.addPairedShortcode("window", (content, title) => `<section class="window">
<div class="title-bar"><h2>${escapeHtml(title)}</h2>${windowControls}</div>
<div class="window-body">

${content}

</div>
</section>`);

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
