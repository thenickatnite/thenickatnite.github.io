export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  // Shown in the footer as the "last updated" stamp.
  eleventyConfig.addGlobalData("buildDate", () => new Date());
  eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));
}

export const config = {
  dir: {
    input: "src",
    output: "_site",
  },
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
};
