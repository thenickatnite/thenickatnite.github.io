// Publishes the last good watch log so a later build can fall back to it if Letterboxd is down.
// Skipped when there's nothing to publish, so an outage never overwrites a good copy with an empty one.
export const data = {
  layout: null,
  eleventyExcludeFromCollections: true,
  eleventyComputed: {
    permalink: (data) => (data.letterboxd?.films?.length ? "/assets/data/letterboxd.json" : false),
  },
};

export const render = (data) => JSON.stringify({ films: data.letterboxd.films });
