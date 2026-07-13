export const VIEWPORT_PROFILES = Object.freeze({
  full: Object.freeze([
    { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
    { name: "desktop-short", width: 1440, height: 720, deviceScaleFactor: 1 },
    { name: "tablet", width: 1024, height: 768, deviceScaleFactor: 1 },
    { name: "tablet-short", width: 1024, height: 700, deviceScaleFactor: 1 },
    { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  ]),
  standard: Object.freeze([
    { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
    { name: "tablet", width: 1024, height: 768, deviceScaleFactor: 1 },
    { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  ]),
  minimal: Object.freeze([
    { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
    { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  ]),
});

export function resolveViewportProfile(name = "full") {
  const profile = VIEWPORT_PROFILES[name];
  if (!profile) {
    throw new Error(`Unknown viewport profile: ${name}. Use full, standard, or minimal.`);
  }
  return profile.map((viewport) => ({ ...viewport }));
}
