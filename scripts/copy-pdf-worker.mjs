// Menyalin worker pdfjs-dist ke public/ supaya ekstraksi teks PDF di
// browser punya workerSrc yang valid (/pdf.worker.min.mjs).
// Dijalankan otomatis sebagai `prebuild` lewat `npm run copy-pdf-worker`
// di script `build`. Tanpa ini, pdfjs melempar "No worker found".
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destDir = path.join(__dirname, '..', 'public');
const dest = path.join(destDir, 'pdf.worker.min.mjs');

if (!existsSync(src)) {
  console.error(`copy-pdf-worker: worker tidak ditemukan di ${src}`);
  process.exit(1);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`copy-pdf-worker: ${dest}`);
