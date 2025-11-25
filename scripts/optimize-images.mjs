import { mkdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function fileExists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const projectRoot = process.cwd();
  const src = path.join(projectRoot, 'images', 'background.jpg');
  const outDir = path.join(projectRoot, 'images', 'optimized');

  if (!(await fileExists(src))) {
    console.error('Source image not found:', src);
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  // Responsive target widths tuned for hero background usage
  const sizes = [640, 1024, 1600];

  console.log('Optimizing:', src);
  for (const width of sizes) {
    const base = sharp(src).resize({ width, withoutEnlargement: true });

    const jpgPath = path.join(outDir, `background-${width}.jpg`);
    const webpPath = path.join(outDir, `background-${width}.webp`);
    const avifPath = path.join(outDir, `background-${width}.avif`);

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

  console.log('Done. Output directory:', path.relative(projectRoot, outDir));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
