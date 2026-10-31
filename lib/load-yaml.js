// Loads a YAML data file and validates it, so a typo fails the build with a clear message
// instead of rendering a broken page.
import { readFileSync } from "node:fs";
import { CORE_SCHEMA, load } from "js-yaml";

export const loadYaml = (path) => load(readFileSync(path, "utf8"), { schema: CORE_SCHEMA, filename: path });

const isRealDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// Checks one record against a field spec: { name: { type, required } }.
// Types: "string", "date" (YYYY-MM-DD), "https-url", "boolean".
export const checkRecord = (record, spec, where) => {
  const problems = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) return [`${where}: expected a mapping of fields`];
  for (const key of Object.keys(record)) {
    if (!(key in spec)) problems.push(`${where}: unknown field "${key}"`);
  }
  for (const [key, rule] of Object.entries(spec)) {
    const value = record[key];
    if (value === undefined || value === null || value === "") {
      if (rule.required) problems.push(`${where}: missing "${key}"`);
      continue;
    }
    const ok =
      (rule.type === "string" && typeof value === "string") ||
      (rule.type === "boolean" && typeof value === "boolean") ||
      (rule.type === "date" && isRealDate(value)) ||
      (rule.type === "https-url" && typeof value === "string" && /^https:\/\/[^\s"'<>]+$/.test(value));
    if (!ok) problems.push(`${where}: "${key}" should be a ${rule.type}, got ${JSON.stringify(value)}`);
  }
  return problems;
};

export const failIfProblems = (problems, file) => {
  if (problems.length) {
    throw new Error(`${file} has problems:\n  - ${problems.join("\n  - ")}`);
  }
};
