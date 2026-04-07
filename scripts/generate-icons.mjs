import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

const SOURCE = join(root, '..', 'flatmate-finance', 'assets', 'images', 'icon.png');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  await mkdir(publicDir, { recursive: true });

  const img = sharp(SOURCE);
  const meta = await img.metadata();

  const size = Math.min(meta.width, meta.height);
  const left = Math.round((meta.width - size) / 2);
  const top = Math.round((meta.height - size) / 2);

  const squareBuffer = await img
    .extract({ left, top, width: size, height: size })
    .toBuffer();

  for (const s of SIZES) {
    await sharp(squareBuffer)
      .resize(s, s, { fit: 'contain', background: { r: 17, g: 24, b: 56, alpha: 1 } })
      .png()
      .toFile(join(publicDir, `icon-${s}x${s}.png`));
    console.log(`  ✓ icon-${s}x${s}.png`);
  }

  await sharp(squareBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 17, g: 24, b: 56, alpha: 1 } })
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  await sharp(squareBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 17, g: 24, b: 56, alpha: 1 } })
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('  ✓ favicon-32x32.png');

  await sharp(squareBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 17, g: 24, b: 56, alpha: 1 } })
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('  ✓ favicon-16x16.png');

  // Generate ICO-like favicon (just use the 32x32 png renamed)
  await sharp(squareBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 17, g: 24, b: 56, alpha: 1 } })
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('  ✓ favicon.ico');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
