import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const files = [
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
];

for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(dist, file);

  if (!fs.existsSync(source)) {
    throw new Error(`Static asset not found: ${file}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

// Recursively copy any subdirectories of assets/ not already in the explicit list
// (e.g. assets/zodiac/ — the 12 brand SVG icons used by rasiIconHtml()).
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

console.log(`Copied ${files.length} static files to dist/`);
