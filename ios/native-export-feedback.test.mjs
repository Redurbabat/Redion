import test from 'node:test';
import assert from 'node:assert/strict';
import { withNativeExportFeedback } from './native-export-feedback.mjs';

const settle = () => new Promise(resolve => setImmediate(resolve));

function harness({ hidden = false, quiet = false, reduced = false, failHaptics = false } = {}) {
  const events = [];
  const source = { hidden, defaultView: {
    matchMedia(query) {
      assert.equal(query, '(prefers-reduced-motion: reduce)');
      return { matches: reduced };
    }
  } };
  const settings = {
    haptics: { impact: async ({ style }) => {
      events.push(style);
      if (failHaptics) throw new Error('Taptic Engine unavailable');
    } },
    document: source,
    quiet: () => quiet
  };
  return { events, settings, source };
}

test('one subtle success pulse happens only after native file persistence', async () => {
  const h = harness();
  let finish;
  const persisted = new Promise(resolve => { finish = resolve; });
  const save = withNativeExportFeedback((...args) => {
    assert.deepEqual(args, ['PDF bytes', 'Test.pdf', 'Exporte']);
    return persisted;
  }, h.settings);
  const promise = save('PDF bytes', 'Test.pdf', 'Exporte');
  await settle();
  assert.deepEqual(h.events, []);
  const exported = { path: 'Exporte/Test.pdf', bytes: 9, shareSheetOpened: false };
  finish(exported);
  assert.strictEqual(await promise, exported);
  await settle();
  assert.deepEqual(h.events, ['LIGHT']);
});

test('failed Files export never signals a success', async () => {
  const h = harness();
  const save = withNativeExportFeedback(async () => { throw new Error('Disk full'); }, h.settings);
  await assert.rejects(save('bad.pdf'), /Disk full/);
  await settle();
  assert.deepEqual(h.events, []);
});

test('suppresses success haptics in background, quiet mode, or reduced motion', async () => {
  for (const option of [{ hidden: true }, { quiet: true }, { reduced: true }]) {
    const h = harness(option);
    assert.equal(await withNativeExportFeedback(async () => 'saved', h.settings)(), 'saved');
    await settle();
    assert.deepEqual(h.events, []);
  }
});

test('unavailable native haptics never changes successful export results', async () => {
  const result = Object.freeze({ path: 'Backups/sicherung.redion', bytes: 800 });
  const unavailable = harness({ failHaptics: true });
  const wrapped = withNativeExportFeedback(async () => result, unavailable.settings);
  assert.strictEqual(await wrapped(), result);
  await settle();
  assert.deepEqual(unavailable.events, ['LIGHT']);
  const noPlugin = withNativeExportFeedback(async () => result, {
    document: unavailable.source, haptics: null
  });
  assert.strictEqual(await noPlugin(), result);
});

test('unexpected reduced-motion detection failure must not invalidate exports', async () => {
  const file = { path: 'Exporte/ok.pdf' };
  const wrapped = withNativeExportFeedback(async () => file, {
    document: { defaultView: { matchMedia() { throw new Error('unavailable'); } } },
    haptics: { impact() { throw new Error('must not execute'); } }
  });
  assert.strictEqual(await wrapped(), file);
});

test('configuration must contain a real native exporter callback', () => {
  assert.throws(() => withNativeExportFeedback(null, {}), /save callback missing/);
});
