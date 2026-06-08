import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dist = path.join(root, 'dist');

// JS files that need cache-busting hashes
const jsFiles = [
  'app.js',
  'astrology-core.js',
  'ui-actions.js',
  'data/thai-astrology-content.js',
  'js/reading-helpers.js',
  'js/life-graph.js',
  'js/renderer-shared.js',
  'js/streak-tracker.js',
  'js/renderer-individual.js',
  'js/renderer-couple.js',
  'js/renderer-auspicious.js',
  'js/daily-fortune.js',
  'js/onboarding.js',
  'js/gamification.js',
  'js/share-viral.js',
  'js/social-proof.js',
  'js/analytics.js',
  'js/ab-testing.js',
  'js/chat-concierge.js',
  'js/tarot.js',
  'js/tarot-ui.js',
];

// Other static files (no hash needed)
const otherFiles = [
  'css/chat-concierge.css',
  'css/tarot.css',
  'analytics.html',
  'agent-docs.md',
  'assets/html2canvas.min.js',
  'assets/og-image.png',
  'assets/og-share-story.png',
  'assets/qr-payment.jpg',
  'privacy.html',
  'terms.html',
  'admin.html',
  'share.html',
  '_headers',
];

// Compute short hash for a file
function fileHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
}

// Map: original src path → hashed filename
const hashMap = {};

// Copy JS files with hashes
for (const file of jsFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Static asset not found: ${file}`);
  }
  const hash = fileHash(source);
  const ext = path.extname(file);
  const base = file.slice(0, -ext.length);
  const hashedName = `${base}-${hash}${ext}`;
  const target = path.join(dist, hashedName);

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);

  // Store: original src value → hashed filename
  hashMap[file] = hashedName;
}

// Copy other files without hashing
for (const file of otherFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Static asset not found: ${file}`);
  }
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

// Recursively copy subdirectories (assets/zodiac/)
const extraDirs = ['assets/zodiac'];
for (const dir of extraDirs) {
  const sourceDir = path.join(root, dir);
  if (!fs.existsSync(sourceDir)) continue;
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const source = path.join(sourceDir, entry.name);
    const target = path.join(dist, dir, entry.name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

// Rewrite dist/index.html to use hashed JS filenames
const indexHtml = path.join(dist, 'index.html');
if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, 'utf-8');
  let replacements = 0;
  
  for (const [original, hashed] of Object.entries(hashMap)) {
    // Escape for regex (dots in paths)
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match src="original" or src='/original' — with or without leading slash
    // Also strip ?v=... cache-buster from the src before matching
    const regex = new RegExp(`(src=["'])(/?)${escaped}(\\?[^"']*)?(["'])`, 'g');
    
    html = html.replace(regex, (match, prefix, slash, _query, suffix) => {
      replacements++;
      return `${prefix}${slash}${hashed}${suffix}`;
    });
  }
  
  fs.writeFileSync(indexHtml, html);
  console.log(`✅ Rewrote index.html: ${replacements} JS references → hashed`);
} else {
  console.warn('⚠️ dist/index.html not found — skipping rewrite');
}

console.log(`Copied ${jsFiles.length} JS (hashed) + ${otherFiles.length} static files to dist/`);
