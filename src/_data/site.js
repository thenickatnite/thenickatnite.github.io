export default {
  title: "Nick's Place",
  author: "Nick Brown",
  url: "https://nickbrown.live",
  description: "Nick Brown's corner of the web: live music, the Grateful Dead, John Carpenter movies, and other eccentricities.",
  // Cloudflare Web Analytics site token (public, not a secret). Only production deploys
  // include the beacon, so local, CI and preview visits aren't counted.
  cfAnalyticsToken: process.env.DEPLOY_ENV === "production" ? "22c30525c7314243baf0110d745ace33" : "",
  nav: [
    { label: "Home", url: "/" },
    { label: "Live Music Map", url: "/music/" },
    { label: "Dead Shrine", url: "/dead/" },
    { label: "Movie Corner", url: "/movies/" },
    { label: "Links", url: "/links/" },
    { label: "The Boring Page", url: "/boring/" },
  ],
};
