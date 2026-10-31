// Fails the build if the deployed _headers file is missing a required security header
// or loosens the CSP. Run after `npm run build`.
import { readFileSync } from "node:fs";

const file = "_site/_headers";
let text;
try {
  text = readFileSync(file, "utf8");
} catch {
  console.error(`✗ ${file} not found. Did the build run?`);
  process.exit(1);
}

// Headers under the catch-all "/*" rule.
const headers = {};
let inCatchAll = false;
for (const line of text.split("\n")) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  if (!/^\s/.test(line)) {
    inCatchAll = line.trim() === "/*";
    continue;
  }
  if (inCatchAll) {
    const i = line.indexOf(":");
    headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
}

const failures = [];
const expect = (name, test, why) => {
  const value = headers[name];
  if (value === undefined) failures.push(`missing ${name}`);
  else if (test && !test(value)) failures.push(`${name}: ${why}`);
};

const csp = Object.fromEntries(
  (headers["content-security-policy"] ?? "")
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .filter((parts) => parts[0])
    .map(([name, ...values]) => [name, values]),
);

expect("content-security-policy");
for (const directive of ["default-src", "script-src", "style-src", "object-src", "base-uri", "frame-ancestors"]) {
  if (!csp[directive]) failures.push(`CSP is missing ${directive}`);
}
for (const [directive, values] of Object.entries(csp)) {
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'", "*", "http:", "data:"]) {
    if (values.includes(bad) && !(directive === "img-src" && bad === "data:")) {
      failures.push(`CSP ${directive} allows ${bad}`);
    }
  }
}
if (csp["object-src"]?.join(" ") !== "'none'") failures.push("CSP object-src must be 'none'");
if (csp["frame-ancestors"]?.join(" ") !== "'none'") failures.push("CSP frame-ancestors must be 'none'");

expect("strict-transport-security", (v) => Number(v.match(/max-age=(\d+)/)?.[1]) >= 31536000, "max-age must be at least one year");
expect("x-content-type-options", (v) => v === "nosniff", "must be nosniff");
expect("x-frame-options", (v) => v === "DENY", "must be DENY");
expect("referrer-policy");
expect("permissions-policy");

if (failures.length) {
  console.error("✗ Security header check failed:\n  - " + failures.join("\n  - "));
  process.exit(1);
}
console.log(`✓ Security headers OK (${Object.keys(headers).length} headers, ${Object.keys(csp).length} CSP directives)`);
