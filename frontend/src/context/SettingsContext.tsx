import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { appTextScale } from "../modules/textSizing";
import type { AppSettings } from "../types";
import { loadSettings, saveSettings, hydrateStorage, isHydrated } from "../modules/storage";
import { applyLanguageDirection } from "../modules/i18n";
import { setSeedLanguage } from "../modules/customCategories";
import { setHapticsEnabled } from "../modules/haptics";

interface SettingsContextType {
  settings: AppSettings;
  ready: boolean;
  update: (patch: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(isHydrated());
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    if (ready) return;
    hydrateStorage().then(() => {
      const s = loadSettings();
      setSeedLanguage(s.language);
      setHapticsEnabled(s.hapticsEnabled);
      // sets RTL for the *next* app start if it differs from the current one
      try {
        applyLanguageDirection(s.language);
      } catch {
        /* ignore */
      }
      setSettings(s);
      setReady(true);
    });
  }, []);

  function update(patch: Partial<AppSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  return <SettingsContext.Provider value={{ settings, ready, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}

/** Loading screens outside SettingsProvider retain the native default text size. */
export function useAppTextScale(): number {
  const ctx = useContext(SettingsContext);
  return ctx ? appTextScale(ctx.settings.fontSize) : 1;
}
