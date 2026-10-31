// Fails if any page in _site links to an internal path that doesn't exist.
// External links are checked separately (and non-blocking) by lychee in CI.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "_site";

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });

const resolves = (url) => {
  const path = join(root, decodeURIComponent(url.split(/[?#]/)[0]));
  if (url.endsWith("/")) return existsSync(join(path, "index.html"));
  return existsSync(path) && statSync(path).isFile();
};

const broken = [];
let checked = 0;
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, "utf8");
  const urls = [...html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)].map((m) => m[1]);
  // srcset holds comma-separated "url descriptor" candidates.
  for (const [, srcset] of html.matchAll(/srcset="([^"]*)"/g)) {
    urls.push(...srcset.split(",").map((c) => c.trim().split(/\s+/)[0]).filter((u) => /^\/(?!\/)/.test(u)));
  }
  for (const url of urls) {
    checked++;
    if (!resolves(url)) broken.push(`${file}: ${url}`);
  }
}

if (broken.length) {
  console.error("✗ Broken internal links:\n  - " + broken.join("\n  - "));
  process.exit(1);
}
console.log(`✓ Internal links OK (${checked} checked)`);
