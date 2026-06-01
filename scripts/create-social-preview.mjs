import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const width = 1200;
const height = 630;

const fromRoot = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

const overlay = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#05070a" stop-opacity="0.93"/>
      <stop offset="0.56" stop-color="#05070a" stop-opacity="0.76"/>
      <stop offset="1" stop-color="#111827" stop-opacity="0.58"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <rect x="64" y="64" width="1072" height="502" rx="18" fill="#05070a" fill-opacity="0.72" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
  <text x="252" y="178" fill="#f8fafc" font-family="Merriweather, Georgia, serif" font-size="72" font-weight="700">Nicholas Genco</text>
  <text x="252" y="246" fill="#e5edf7" font-family="Roboto, Arial, sans-serif" font-size="38" font-weight="600">Senior Frontend Platform Engineer</text>
  <text x="252" y="316" fill="#f59e0b" font-family="Roboto, Arial, sans-serif" font-size="28" font-weight="700">Enterprise UI modernization</text>
  <text x="252" y="362" fill="#dbe4ef" font-family="Roboto, Arial, sans-serif" font-size="28">TypeScript • Preact/React • Web Components</text>
  <text x="252" y="408" fill="#dbe4ef" font-family="Roboto, Arial, sans-serif" font-size="28">Accessibility • Design Systems • Performance</text>
  <text x="252" y="488" fill="#cbd5e1" font-family="Roboto, Arial, sans-serif" font-size="26">New York City &amp; Long Island, NY</text>
</svg>
`);

const logo = await sharp(fromRoot('images/logo.png'))
  .resize({ width: 136, withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp(fromRoot('images/optimized/background-1600.jpg'))
  .resize(width, height, { fit: 'cover' })
  .composite([
    { input: overlay, left: 0, top: 0 },
    { input: logo, left: 92, top: 132 }
  ])
  .png({ compressionLevel: 9 })
  .toFile(fromRoot('images/nicholas-genco-social-preview.png'));
