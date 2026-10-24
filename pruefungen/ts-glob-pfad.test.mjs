import { test } from 'node:test';
import assert from 'node:assert/strict';
import { globPfad, typescriptGlob } from './ts-glob-pfad.mjs';

test('Windows-Laufwerksbuchstabe und Rückstriche erzeugen gültige TSX-Globs', () => {
  const result = typescriptGlob('C:\\Users\\redur\\Redion',
    'fremd/touch', 'tsx');
  assert.equal(result, 'C:/Users/redur/Redion/fremd/touch/**/*.tsx');
  assert.ok(!result.includes('\\\\'));
});

test('Windows-UNC-Pfade behalten doppelte führende Slashes', () => {
  const result = typescriptGlob('\\\\server\\share\\Redion',
    'src/islands', 'tsx');
  assert.equal(result, '//server/share/Redion/src/islands/**/*.tsx');
});

test('Unix-Pfade bleiben gültig', () => {
  assert.equal(typescriptGlob('/home/redion', 'src/islands', 'tsx'),
    '/home/redion/src/islands/**/*.tsx');
  assert.equal(typescriptGlob('/home/redion/', 'fremd/touch', 'ts'),
    '/home/redion/fremd/touch/**/*.ts');
});

test('Leere Muster und unerwartete Verzeichnisse werden abgewiesen', () => {
  assert.throws(() => globPfad(''), /Pfad/);
  assert.throws(() => typescriptGlob('/repo', '../anderes', 'tsx'), /Quellordner/);
  assert.throws(() => typescriptGlob('/repo', 'src/islands', 'js'), /Endung/);
});
