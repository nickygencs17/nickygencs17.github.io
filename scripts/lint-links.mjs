import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const siteOrigin = 'https://www.nicholasgenco.com';
const entryFiles = [
  'index.html',
  'resume.html',
  'data/NicholasGenco.resume.html',
  'css/style.css',
  'favicons/manifest.json',
  'favicons/browserconfig.xml',
  'robots.txt',
  'sitemap.xml',
  'llms.txt'
];

const failures = [];

const toProjectPath = (fromFile, value) => {
  if (!value || /^(mailto:|tel:|data:|javascript:)/i.test(value)) return null;
  if (/^https?:\/\//i.test(value) && !value.startsWith(siteOrigin)) return null;

  let reference = value;
  if (reference.startsWith(siteOrigin)) {
    reference = reference.slice(siteOrigin.length) || '/';
  }

  const [withoutQuery] = reference.split('?');
  const [rawPath, hash = ''] = withoutQuery.split('#');
  const baseDir = path.dirname(fromFile);
  const normalizedPath = rawPath || fromFile;
  const relativePath = normalizedPath.startsWith('/')
    ? normalizedPath.replace(/^\/+/, '') || 'index.html'
    : path.normalize(path.join(baseDir, normalizedPath));

  return {
    hash,
    relativePath: relativePath.endsWith('/') ? path.join(relativePath, 'index.html') : relativePath
  };
};

const readText = (relativePath) => readFileSync(path.join(projectRoot, relativePath), 'utf8');

const checkReference = (fromFile, value) => {
  const target = toProjectPath(fromFile, value);
  if (!target) return;

  const targetPath = path.join(projectRoot, target.relativePath);
  if (!existsSync(targetPath)) {
    failures.push(`${fromFile}: missing ${value} -> ${target.relativePath}`);
    return;
  }

  if (!target.hash || !target.relativePath.endsWith('.html')) return;

  const html = readText(target.relativePath);
  const escapedHash = target.hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idOrName = new RegExp(`\\b(?:id|name)=["']${escapedHash}["']`);
  if (!idOrName.test(html)) {
    failures.push(`${fromFile}: missing anchor ${value} -> ${target.relativePath}#${target.hash}`);
  }
};

for (const file of entryFiles) {
  const absolutePath = path.join(projectRoot, file);
  if (!existsSync(absolutePath)) {
    failures.push(`missing checked file: ${file}`);
    continue;
  }

  const text = readText(file);
  const htmlRefs = text.matchAll(/\b(?:href|src)=["']([^"']+)["']/g);
  const cssRefs = text.matchAll(/url\(["']?([^"')]+)["']?\)/g);
  const sitemapRefs = file === 'sitemap.xml' ? text.matchAll(/<loc>([^<]+)<\/loc>/g) : [];

  for (const [, value] of htmlRefs) checkReference(file, value);
  for (const [, value] of cssRefs) checkReference(file, value);
  for (const [, value] of sitemapRefs) checkReference(file, value);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Local links and anchors validated.');
