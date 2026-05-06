const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');

const SRC = path.join(__dirname, '..', 'original.jpg');
const OUT = path.join(__dirname, '..', 'images');

const WIDTHS = [800, 1600, 2400];
const QUALITY = { jpg: 80, webp: 80, avif: 50 };

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const buf = await fs.readFile(SRC);

  const tasks = [];
  for (const w of WIDTHS) {
    const base = sharp(buf).resize({ width: w, withoutEnlargement: true });
    tasks.push(
      base.clone().jpeg({ quality: QUALITY.jpg, mozjpeg: true })
        .toFile(path.join(OUT, `${w}w.jpg`)),
      base.clone().webp({ quality: QUALITY.webp })
        .toFile(path.join(OUT, `${w}w.webp`)),
      base.clone().avif({ quality: QUALITY.avif })
        .toFile(path.join(OUT, `${w}w.avif`)),
    );
  }
  const results = await Promise.all(tasks);

  const manifest = {};
  for (const r of results) {
    const name = path.basename(r.format ? '' : '');
    void name;
  }

  const files = await fs.readdir(OUT);
  const meta = {};
  for (const f of files) {
    if (f === 'manifest.json') continue;
    const stat = await fs.stat(path.join(OUT, f));
    meta[f] = { bytes: stat.size };
  }
  await fs.writeFile(
    path.join(OUT, 'manifest.json'),
    JSON.stringify(meta, null, 2),
  );

  console.log('Generated:');
  for (const [name, m] of Object.entries(meta).sort()) {
    const kb = (m.bytes / 1024).toFixed(1);
    console.log(`  ${name.padEnd(14)} ${kb.padStart(8)} KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
