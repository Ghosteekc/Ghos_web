/**
 * Runtime checks for hapticManager.
 * Run: npx tsx scripts/hapticManager.selftest.ts
 */

const globalWindow = globalThis as typeof globalThis & { window?: Window & typeof globalThis };
globalWindow.window = globalThis as Window & typeof globalThis;

async function main() {
  const {
    getHapticIntensity,
    haptic,
    hapticManager,
    isHapticEnabled,
    setHapticEnabled,
    setHapticIntensity,
    triggerHaptic,
  } = await import("../src/utils/hapticManager");

  let impactCalls = 0;
  let impactStyles: string[] = [];
  let notificationCalls = 0;
  let selectionCalls = 0;

  function installTelegram() {
    globalWindow.window!.Telegram = {
      WebApp: {
        HapticFeedback: {
          impactOccurred: (style: string) => {
            impactCalls += 1;
            impactStyles.push(style);
          },
          selectionChanged: () => {
            selectionCalls += 1;
          },
          notificationOccurred: () => {
            notificationCalls += 1;
          },
        },
      },
    } as unknown as Window["Telegram"];
  }

  function resetCounts() {
    impactCalls = 0;
    impactStyles = [];
    notificationCalls = 0;
    selectionCalls = 0;
  }

  installTelegram();
  setHapticEnabled(true);
  setHapticIntensity("standard");

  resetCounts();
  haptic.light();
  if (impactCalls !== 1) throw new Error("haptic.light should call impactOccurred once");
  if (impactStyles[0] !== "light") throw new Error("standard light should stay light");

  resetCounts();
  setHapticEnabled(false);
  haptic.medium();
  haptic.button();
  haptic.toggle();
  if (impactCalls !== 0 || selectionCalls !== 0 || notificationCalls !== 0) {
    throw new Error("disabled haptic must not call any Telegram haptic API");
  }

  delete globalWindow.window!.Telegram;
  resetCounts();
  setHapticEnabled(true);
  haptic.success();
  if (notificationCalls !== 0) throw new Error("missing Telegram API must skip silently");

  installTelegram();
  resetCounts();
  haptic.double();
  if (impactCalls < 1) throw new Error("double should trigger at least one impact");

  resetCounts();
  haptic.confirm();
  if (impactCalls !== 1) throw new Error("confirm should trigger medium impact once");

  resetCounts();
  triggerHaptic("selection");
  if (impactCalls !== 0) throw new Error("selection should not use impactOccurred in standard mode");
  if (selectionCalls !== 1) throw new Error("selection should call selectionChanged");

  resetCounts();
  hapticManager.important();
  if (impactCalls < 1) throw new Error("important alias should still work");

  resetCounts();
  setHapticIntensity("weak");
  haptic.button();
  if (impactStyles[0] !== "soft") throw new Error("weak button should resolve to soft");

  resetCounts();
  haptic.toggle();
  if (selectionCalls !== 0 || impactStyles[0] !== "soft") {
    throw new Error("weak toggle should use soft impact");
  }

  resetCounts();
  setHapticIntensity("strong");
  haptic.light();
  if (impactStyles[0] !== "medium") throw new Error("strong light should resolve to medium");

  resetCounts();
  haptic.heavy();
  if (impactStyles[0] !== "heavy") throw new Error("strong heavy should stay heavy (not rigid)");

  resetCounts();
  haptic.success();
  if (notificationCalls !== 1) throw new Error("strong success should notify");

  if (!isHapticEnabled()) throw new Error("haptic should remain enabled");
  if (getHapticIntensity() !== "strong") throw new Error("intensity should remain strong");

  console.log("hapticManager.selftest OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
