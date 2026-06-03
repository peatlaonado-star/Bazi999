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
  'css/chat-concierge.css',
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

console.log(`Copied ${files.length} static files to dist/`);
