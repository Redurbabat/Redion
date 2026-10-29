'use strict';
/*
 * Background updates for the signed, INSTALLED Windows NSIS application.
 * Not enabled in dev, portable editions, or unsigned/no-feed builds.
 * Never force-close the editor or touch Redion's IndexedDB/userData.
 */
const { updateEligible } = require('./update-policy.cjs');

function startRedionAutoUpdates({
  app, processInfo = process, resourcesPath = process.resourcesPath,
  updater, yaml, delay = setTimeout, repeat = setInterval,
  logger = console
}) {
  if (!updateEligible({
    platform: processInfo.platform,
    packaged: app.isPackaged,
    portable: Boolean(processInfo.env?.PORTABLE_EXECUTABLE_FILE),
    resourcePath: resourcesPath, yaml
  })) return Object.freeze({ enabled: false });

  // Configuration comes ONLY from the packaged, signed release's
  // app-update.yml, not from user-controlled navigation or a website.
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.allowDowngrade = false;
  updater.allowPrerelease = false;

  let busy = false;
  let stopped = false;
  const check = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      await updater.checkForUpdates();
    } catch (error) {
      logger.warn('Redion Windows: Updateprüfung fehlgeschlagen:', String(error));
    } finally {
      busy = false;
    }
  };
  updater.on('error', err => {
    logger.warn('Redion Windows: Update nicht installiert:', String(err));
  });
  updater.on('update-downloaded', () => {
    // electron-updater will install after the user closes Redion normally.
    // Never restart during editing; pages stay in the stable IndexedDB profile.
    logger.info('Redion Windows: Update beim nächsten normalen Beenden bereit.');
  });

  const first = delay(() => { void check(); }, 30_000);
  const interval = repeat(() => { void check(); }, 6 * 60 * 60 * 1000);
  first?.unref?.();
  interval?.unref?.();
  return Object.freeze({
    enabled: true,
    // Windows session-end can interrupt a detached NSIS installer halfway.
    // If Windows is shutting down/logging off, defer until a regular exit.
    onSystemShutdown() {
      updater.autoInstallOnAppQuit = false;
    },
    stop() {
      stopped = true;
      clearTimeout(first);
      clearInterval(interval);
    }
  });
}
module.exports = { startRedionAutoUpdates };
