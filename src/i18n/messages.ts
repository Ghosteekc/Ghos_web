import type { Settings } from "@/types";

export type AppLanguage = Settings["language"];

const messages = {
  ru: {
    "settings.haptic.title": "Вибрация интерфейса",
    "settings.haptic.enabled": "Включено",
    "settings.haptic.disabled": "Выключено",
    "settings.haptic.subtitleOn": "Тактильная отдача при действиях",
    "settings.haptic.subtitleOff": "Вибрация отключена",
    "settings.haptic.intensity": "Мощность",
    "settings.haptic.weak": "Слабая",
    "settings.haptic.standard": "Стандартная",
    "settings.haptic.strong": "Сильная",
  },
  en: {
    "settings.haptic.title": "Haptic feedback",
    "settings.haptic.enabled": "Enabled",
    "settings.haptic.disabled": "Disabled",
    "settings.haptic.subtitleOn": "Tactile feedback for actions",
    "settings.haptic.subtitleOff": "Haptics are off",
    "settings.haptic.intensity": "Intensity",
    "settings.haptic.weak": "Weak",
    "settings.haptic.standard": "Standard",
    "settings.haptic.strong": "Strong",
  },
} as const;

export type MessageKey = keyof typeof messages.ru;

export function translate(key: MessageKey, language: AppLanguage = "ru"): string {
  return messages[language][key] ?? messages.ru[key];
}
