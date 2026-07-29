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

  function assertSingleFamilyTick(expectedStyle: string, label: string) {
    if (impactCalls !== 1) throw new Error(`${label}: expected exactly 1 impact, got ${impactCalls}`);
    if (impactStyles[0] !== expectedStyle) {
      throw new Error(`${label}: expected style ${expectedStyle}, got ${impactStyles[0]}`);
    }
    if (selectionCalls !== 0) throw new Error(`${label}: must not call selectionChanged`);
    if (notificationCalls !== 0) throw new Error(`${label}: must not call notificationOccurred`);
  }

  installTelegram();
  setHapticEnabled(true);
  setHapticIntensity("standard");

  resetCounts();
  haptic.light();
  assertSingleFamilyTick("light", "standard light");

  resetCounts();
  setHapticEnabled(false);
  haptic.medium();
  haptic.button();
  haptic.toggle();
  haptic.success();
  if (impactCalls !== 0 || selectionCalls !== 0 || notificationCalls !== 0) {
    throw new Error("disabled haptic must not call any Telegram haptic API");
  }

  delete globalWindow.window!.Telegram;
  resetCounts();
  setHapticEnabled(true);
  haptic.success();
  if (impactCalls !== 0 || notificationCalls !== 0) {
    throw new Error("missing Telegram API must skip silently");
  }

  installTelegram();

  const events = [
    () => haptic.button(),
    () => haptic.toggle(),
    () => haptic.selection(),
    () => haptic.confirm(),
    () => haptic.success(),
    () => haptic.warning(),
    () => haptic.error(),
    () => haptic.double(),
    () => hapticManager.important(),
    () => triggerHaptic("selection"),
  ] as const;

  for (const intensity of ["weak", "standard", "strong"] as const) {
    const expected = intensity === "weak" ? "soft" : intensity === "standard" ? "light" : "medium";
    setHapticIntensity(intensity);
    for (const play of events) {
      resetCounts();
      play();
      assertSingleFamilyTick(expected, `${intensity} ${play.name || "event"}`);
    }
  }

  if (!isHapticEnabled()) throw new Error("haptic should remain enabled");
  if (getHapticIntensity() !== "strong") throw new Error("intensity should remain strong");

  console.log("hapticManager.selftest OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
