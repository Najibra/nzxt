import { useCallback, useEffect, useState } from "react";
import {
  type FlightdeckSettings,
  SETTINGS_STORAGE_KEY,
  readSettings,
  writeSettings
} from "../lib/settings";

const SETTINGS_EVENT = "flightdeck-settings-change";

export function useFlightdeckSettings() {
  const [settings, setSettings] = useState<FlightdeckSettings>(() => readSettings());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY) {
        setSettings(readSettings());
      }
    };

    const handleLocalChange = () => {
      setSettings(readSettings());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SETTINGS_EVENT, handleLocalChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SETTINGS_EVENT, handleLocalChange);
    };
  }, []);

  const updateSettings = useCallback((next: FlightdeckSettings) => {
    const saved = writeSettings(next);
    setSettings(saved);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }, []);

  return { settings, updateSettings };
}
