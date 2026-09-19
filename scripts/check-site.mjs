import fs from "node:fs";
import path from "node:path";

const siteRoot = path.resolve(process.cwd(), "public");
const origin = "https://www.globalhighereducationalservices.com";
const pages = [
  { route: "/", file: "index.html" },
  { route: "/our-services", file: "our-services/index.html" },
  { route: "/about-us", file: "about-us/index.html" },
  { route: "/program-development-consulting", file: "program-development-consulting/index.html" },
  { route: "/accreditation-services", file: "accreditation-services/index.html" },
  { route: "/academic-leadership-faculty-recruitment-and-training", file: "academic-leadership-faculty-recruitment-and-training/index.html" },
  { route: "/industrial-and-workforce-development-programs", file: "industrial-and-workforce-development-programs/index.html" },
  { route: "/international-education-and-study-abroad-development", file: "international-education-and-study-abroad-development/index.html" },
  { route: "/contact-us", file: "contact-us/index.html" }
];
const homepageServiceRoutes = [
  "/program-development-consulting",
  "/accreditation-services",
  "/academic-leadership-faculty-recruitment-and-training",
  "/industrial-and-workforce-development-programs",
  "/international-education-and-study-abroad-development"
];
const requiredFiles = [
  "404.html",
  "favicon.png",
  "sitemap.xml",
  "robots.txt",
  "_headers",
  "_redirects",
  "assets/site.css"
];
const forbiddenPatterns = [
  { expression: /file:/i, label: "file: URL" },
  { expression: /localhost/i, label: "localhost reference" },
  { expression: /\.download\b/i, label: ".download asset" },
  { expression: /Global Higher Educational Services_files/i, label: "browser-save folder" },
  { expression: /global-higher-educational-services\.azargar\.workers\.dev/i, label: "old Worker hostname" }
];
const errors = [];

function exists(relativePath) {
  return fs.existsSync(path.join(siteRoot, relativePath));
}

function expectedUrl(route) {
  return route === "/" ? origin + "/" : origin + route;
}

function localTarget(rawUrl) {
  if (!rawUrl.startsWith("/") || rawUrl.startsWith("//")) {
    return null;
  }

  let pathname = rawUrl.split(/[?#]/, 1)[0];
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    errors.push("Invalid URL encoding: " + rawUrl);
    return null;
  }

  const relative = pathname.replace(/^\/+/, "");
  if (relative === "" || pathname.endsWith("/")) {
    return path.join(siteRoot, relative, "index.html");
  }
  if (path.extname(relative)) {
    return path.join(siteRoot, relative);
  }
  return path.join(siteRoot, relative, "index.html");
}

for (const page of pages) {
  const fullPath = path.join(siteRoot, page.file);
  if (!fs.existsSync(fullPath)) {
    errors.push("Missing page: " + page.file);
    continue;
  }

  const html = fs.readFileSync(fullPath, "utf8");
  for (const item of forbiddenPatterns) {
    if (item.expression.test(html)) {
      errors.push(page.file + " contains a " + item.label);
    }
  }

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  const expected = expectedUrl(page.route);

  if (!canonicalMatch || canonicalMatch[1] !== expected) {
    errors.push(page.file + " canonical URL should be " + expected);
  }
  if (!ogUrlMatch || ogUrlMatch[1] !== expected) {
    errors.push(page.file + " og:url should be " + expected);
  }

  const attributePattern = /(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    const target = localTarget(match[1]);
    if (target && !fs.existsSync(target)) {
      errors.push(page.file + " references missing local file " + match[1]);
    }
  }
}

const homepagePath = path.join(siteRoot, "index.html");
if (fs.existsSync(homepagePath)) {
  const homepage = fs.readFileSync(homepagePath, "utf8");
  for (const route of homepageServiceRoutes) {
    const expectedLink = 'class="ghes-service-link" href="' + route + '"';
    if (!homepage.includes(expectedLink)) {
      errors.push("Homepage service card is missing link " + route);
    }
  }
}
for (const file of requiredFiles) {
  if (!exists(file)) {
    errors.push("Missing required file: " + file);
  }
}

const sitemapPath = path.join(siteRoot, "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const actualUrls = new Set(Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]));
  const expectedUrls = new Set(pages.map((page) => expectedUrl(page.route)));

  for (const url of expectedUrls) {
    if (!actualUrls.has(url)) {
      errors.push("Sitemap is missing " + url);
    }
  }
  for (const url of actualUrls) {
    if (!expectedUrls.has(url)) {
      errors.push("Sitemap contains unexpected URL " + url);
    }
  }
}

if (errors.length > 0) {
  console.error("Site validation failed:");
  for (const error of errors) {
    console.error("- " + error);
  }
  process.exit(1);
}

console.log("Site validation passed: " + pages.length + " pages, " + requiredFiles.length + " support files, and " + homepageServiceRoutes.length + " homepage service links checked.");