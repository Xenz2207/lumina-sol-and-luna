import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');
const OUT_SHARED_DIR = path.join(ROOT_DIR, 'public', 'shared');

await fs.mkdir(OUT_SHARED_DIR, { recursive: true });
const entries = await fs.readdir(SHARED_DIR, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
  await fs.copyFile(path.join(SHARED_DIR, entry.name), path.join(OUT_SHARED_DIR, entry.name));
}

console.log('Built Vercel static assets: copied shared/*.js -> public/shared/');
