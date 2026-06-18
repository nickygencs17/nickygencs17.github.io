import { mkdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find package 'sharp'/.test(error?.message ?? '')) {
      console.error('This script requires sharp. Run `npm install --no-save sharp` and try again.');
      process.exit(1);
    }
    throw error;
  }
}

async function fileExists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sharp = await loadSharp();
  const projectRoot = process.cwd();
  const outDir = path.join(projectRoot, 'images', 'optimized');
  const sources = [
    { file: 'background.jpg', prefix: 'background' },
    { file: 'nyc_day.jpg', prefix: 'nyc-day' }
  ];

  for (const { file } of sources) {
    const src = path.join(projectRoot, 'images', file);
    if (!(await fileExists(src))) {
      console.error('Source image not found:', src);
      process.exit(1);
    }
  }

  await mkdir(outDir, { recursive: true });

  // Responsive target widths tuned for hero background usage
  const sizes = [640, 1024, 1600];

  for (const { file, prefix } of sources) {
    const src = path.join(projectRoot, 'images', file);
    console.log('Optimizing:', src);

    for (const width of sizes) {
      const base = sharp(src).resize({ width, withoutEnlargement: true });

      const jpgPath = path.join(outDir, `${prefix}-${width}.jpg`);
      const webpPath = path.join(outDir, `${prefix}-${width}.webp`);
      const avifPath = path.join(outDir, `${prefix}-${width}.avif`);

      await base
        .clone()
        .jpeg({ quality: 70, progressive: true, mozjpeg: true })
        .toFile(jpgPath);

      await base
        .clone()
        .webp({ quality: 75 })
        .toFile(webpPath);

      await base
        .clone()
        .avif({ quality: 50 })
        .toFile(avifPath);

      console.log(` - ${width}px:`, path.basename(jpgPath), path.basename(webpPath), path.basename(avifPath));
    }
  }

  console.log('Done. Output directory:', path.relative(projectRoot, outDir));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
