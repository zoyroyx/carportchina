import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const manifest = JSON.parse(await fs.readFile('output/catalog-import-2026-11-09/manifest.json', 'utf8'));
const metadata = JSON.parse(await fs.readFile('data/catalog-images.json', 'utf8'));
const covers = JSON.parse(await fs.readFile('data/catalog-covers.json', 'utf8'));
const offers = JSON.parse(await fs.readFile('data/offers.json', 'utf8'));
const imported = new Set(manifest.filter(row => row.offer).map(row => row.offer));

for (const row of manifest) {
  if (!row.source) continue;
  await fs.mkdir(path.dirname(row.dest), { recursive: true });
  await sharp(row.source).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }).toFile(row.dest);
  const m = await sharp(row.dest).metadata();
  const variants = [];
  for (const width of [360, 640]) {
    const dest = row.dest.replace('.webp', `-${width}.webp`);
    await sharp(row.dest).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
    variants.push(`${dest.replace('public', '')} ${Math.min(width, m.width)}w`);
  }
  const src = row.dest.replace('public', '');
  metadata[src] = { width: m.width, height: m.height, srcSet: [...variants, `${src} ${m.width}w`].join(', '), thumbnail: src.replace('.webp', '-360.webp') };
}

await fs.mkdir('public/photos/catalog/covers', { recursive: true });
for (const offer of offers.filter(o => imported.has(o.slug))) {
  const src = offer.gallery?.[0]?.src;
  if (!src) continue;
  const sizes = [];
  for (const width of [360, 640, 960]) {
    const dest = `/photos/catalog/covers/${offer.slug}-${width}.webp`;
    const height = Math.round(width * 5 / 8);
    if (offer.slug === 'byd-leopard-8-2025') {
      // The supplied portrait is too tight for a landscape crop: preserve the whole car.
      const focused = await sharp('public' + src).extract({ left: 0, top: 260, width: 960, height: 850 }).toBuffer();
      const foreground = await sharp(focused).resize({ width, height, fit: 'inside' }).toBuffer();
      await sharp(focused).resize(width, height, { fit: 'cover' }).blur(24).modulate({ brightness: 0.65 })
        .composite([{ input: foreground, gravity: 'centre' }]).webp({ quality: 85 }).toFile('public' + dest);
    } else {
      await sharp('public' + src).resize(width, height, { fit: 'cover', position: 'centre' }).webp({ quality: 85 }).toFile('public' + dest);
    }
    sizes.push(`${dest} ${width}w`);
  }
  covers[offer.slug] = { src: `/photos/catalog/covers/${offer.slug}-640.webp`, srcSet: sizes.join(', '), source: src, width: 640, height: 400 };
}
await fs.writeFile('data/catalog-images.json', JSON.stringify(metadata, null, 2) + '\n');
await fs.writeFile('data/catalog-covers.json', JSON.stringify(covers, null, 2) + '\n');
console.log(`${imported.size} offers prepared with responsive WebP galleries and 8:5 covers`);
