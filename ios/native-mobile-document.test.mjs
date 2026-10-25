/* Regression for Redion's shared PDF toolbar in iPhone WebKit. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'quell/schale/stil/pdf-studio.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src/kern/einstellung/app.ts'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mobile = css.indexOf('@media(max-width:760px){');
const nextMedia = css.indexOf('@media(', mobile + 1);
const mobileRules = css.slice(mobile, nextMedia);

test('iPhone PDF action menu respects visual viewport while keyboard is open', () => {
  assert.ok(mobile >= 0, 'mobile media query missing');
  const marker = '.document-studio[data-document-view="open"] .document-commandbar{';
  const start = mobileRules.indexOf(marker);
  assert.ok(start >= 0, 'PDF menu must be styled only when opened');
  const block = mobileRules.slice(start + marker.length, mobileRules.indexOf('}', start));
  assert.match(block, /max-height:/);
  assert.match(block, /var\(--visual-height,100dvh\)/);
  assert.match(block, /safe-area-inset-top/);
  assert.match(block, /overflow-y:auto/);
  assert.match(block, /overscroll-behavior:contain/);
  assert.match(mobileRules, /\.document-commandbar button\{min-height:var\(--touch-min\)/);
});

test('shared viewport source updates on WebKit keyboard resize without native-only UI', () => {
  assert.match(source, /window\.visualViewport/);
  assert.match(source, /setProperty\('--visual-height'/);
  assert.match(source, /visualViewport\?\.addEventListener\('resize'/);
  assert.match(html, /viewport-fit=cover/);
  assert.doesNotMatch(html, /redion-native-sicherung\.js/);
});

test('mobile PDF menu honors Redion quiet mode and iOS reduced motion', () => {
  assert.match(css, /body\[data-bewegung="ruhig"\].*document-commandbar\{animation:none\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
