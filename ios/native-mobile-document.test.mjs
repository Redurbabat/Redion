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
// One phone layout for portrait AND wide-but-short coarse-pointer landscape.
const mobileQuery = '@media(max-width:760px), (pointer:coarse) and (max-height:500px){';
const mobile = css.indexOf(mobileQuery);
const nextMedia = css.indexOf('@media(', mobile + 1);
const mobileRules = css.slice(mobile, nextMedia);

test('iPhone PDF action menu respects visual viewport while keyboard is open', () => {
  assert.ok(mobile >= 0, 'mobile media query missing');
  const marker = '.document-studio[data-document-view="open"] .document-commandbar{';
  const start = mobileRules.lastIndexOf(marker);
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

test('iPhone landscape uses the same compact PDF controls as portrait', () => {
  // Redion already detects landscape phones by coarse pointer and short
  // height in AppEinstellung.amTelefon(). CSS must honor that same criterion.
  assert.match(source, /\(pointer: coarse\)/);
  assert.match(source, /window\.innerHeight <= 500/);
  const wide = '@media (max-width:760px), (pointer:coarse) and (max-height:500px){';
  assert.equal(css.split(mobileQuery).length - 1, 3);
  assert.equal(css.split(wide).length - 1, 1);
  assert.ok(mobileRules.includes('.document-studio .document-topbar button{width:var(--touch-min)'));
  assert.ok(css.includes('body[data-dokument="an"] .document-studio .document-topbar{'));
  assert.ok(css.includes('.document-commandbar .document-folien-klappe:not([hidden])'));
  assert.ok(css.includes('.document-studio .document-title-progress{width:min(8rem,82%)}'));
});

test('landscape-safe PDF header, tabs and view popup honor all iPhone notch insets', () => {
  assert.match(mobileRules, /padding-inline-start:max\(4px,env\(safe-area-inset-left,0px\)\)/);
  assert.match(mobileRules, /padding-inline-end:max\(4px,env\(safe-area-inset-right,0px\)\)/);
  const pageTab = css.indexOf('body[data-dokument="an"] #reiterleiste{\n    min-height:var(--touch-min);');
  assert.ok(pageTab > 0);
  assert.match(css.slice(pageTab, pageTab + 310), /safe-area-inset-left/);
  assert.match(css.slice(pageTab, pageTab + 310), /safe-area-inset-right/);
  assert.match(mobileRules, /left:max\(8px,env\(safe-area-inset-left,0px\)\)/);
  assert.match(mobileRules, /right:max\(8px,env\(safe-area-inset-right,0px\)\)/);
  assert.match(mobileRules, /max-height:max\(120px,calc\(var\(--visual-height,100dvh\)/);
});

test('desktop PDF chrome keeps its original responsive layout', () => {
  assert.match(css, /@media\(min-width:761px\)\{\.document-studio \.document-center/);
  assert.match(css, /\.document-commandbar\{display:flex;align-items:center;/);
  assert.match(css, /@media\(max-width:1100px\)\{/);
});
