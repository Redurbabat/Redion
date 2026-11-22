/**
 * Proposed native dock message contract. Not wired to the application yet.
 * Reject untrusted/unknown messages; never pass arbitrary JS or URLs.
 */
export const REDION_NATIVE_DOCK_PROTOCOL = 1;
export const REDION_DOCK_SECTIONS = Object.freeze([
  "home", "learn", "workspace", "projects", "settings",
]);

export function parseDockMessage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  if (input.protocol !== REDION_NATIVE_DOCK_PROTOCOL) return null;
  if (!["ready", "navigate", "navigationChanged"].includes(input.type)) return null;
  if (input.type === "ready") {
    return input.section === undefined ? { protocol: 1, type: "ready" } : null;
  }
  if (typeof input.section !== "string" || !REDION_DOCK_SECTIONS.includes(input.section)) return null;
  return { protocol: 1, type: input.type, section: input.section };
}

export function makeDockNavigation(section) {
  return parseDockMessage({ protocol: 1, type: "navigate", section });
}
