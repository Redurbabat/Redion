import test from "node:test";
import assert from "node:assert/strict";
import { parseDockMessage, makeDockNavigation, REDION_DOCK_SECTIONS } from "./dock-protocol.mjs";

test("validates all supported sections", () => {
  for (const section of REDION_DOCK_SECTIONS) {
    assert.deepEqual(makeDockNavigation(section), { protocol: 1, type: "navigate", section });
  }
});

test("rejects untrusted messages", () => {
  for (const input of [null, [], "navigate", {}, {protocol: 2, type: "ready"}, {protocol: 1, type: "navigate", section: "__proto__"}, {protocol: 1, type: "navigate", section: "javascript:alert(1)"}, {protocol: 1, type: "ready", section: "home"}]) {
    assert.equal(parseDockMessage(input), null);
  }
});

test("accepts ready and navigationChanged", () => {
  assert.deepEqual(parseDockMessage({protocol: 1, type: "ready"}), {protocol: 1, type: "ready"});
  assert.deepEqual(parseDockMessage({protocol: 1, type: "navigationChanged", section: "learn"}), {protocol: 1, type: "navigationChanged", section: "learn"});
});
