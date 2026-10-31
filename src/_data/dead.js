import { checkRecord, failIfProblems, loadYaml } from "../../lib/load-yaml.js";

const FILE = "data/dead.yaml";

const FAVORITE = {
  date: { type: "date", required: true },
  venue: { type: "string", required: true },
  city: { type: "string", required: true },
  why: { type: "string", required: true },
  highlight: { type: "string" },
  recording: { type: "https-url" },
  placeholder: { type: "boolean" },
};

export default function () {
  const data = loadYaml(FILE) ?? {};
  const favorites = data.favorites ?? [];
  const problems = Array.isArray(favorites)
    ? favorites.flatMap((show, i) => checkRecord(show, FAVORITE, `favorites[${i}]`))
    : ["favorites: expected a list"];
  failIfProblems(problems, FILE);
  return { favorites: [...favorites].sort((a, b) => a.date.localeCompare(b.date)) };
}
