export const SETTINGS_STORAGE_KEY = "krakenFlightdeck.settings.v1";

export const THEMES = ["ice", "green", "amber"] as const;
export const UNITS = ["c", "f"] as const;
export const FOCUS_MODES = ["balanced", "cpu", "gpu", "liquid"] as const;
export const MOTION_MODES = ["normal", "reduced", "off"] as const;

export type FlightdeckTheme = (typeof THEMES)[number];
export type TemperatureUnit = (typeof UNITS)[number];
export type FocusMode = (typeof FOCUS_MODES)[number];
export type MotionMode = (typeof MOTION_MODES)[number];

export interface FlightdeckSettings {
  theme: FlightdeckTheme;
  unit: TemperatureUnit;
  focus: FocusMode;
  demoMode: boolean;
  motion: MotionMode;
}

export const DEFAULT_SETTINGS: FlightdeckSettings = {
  theme: "ice",
  unit: "c",
  focus: "balanced",
  demoMode: true,
  motion: "normal"
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const includes = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
  typeof value === "string" && values.includes(value);

export function coerceSettings(value: unknown): FlightdeckSettings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  const theme = includes(THEMES, value.theme) ? value.theme : DEFAULT_SETTINGS.theme;
  const unit = includes(UNITS, value.unit) ? value.unit : DEFAULT_SETTINGS.unit;
  const focus = includes(FOCUS_MODES, value.focus) ? value.focus : DEFAULT_SETTINGS.focus;
  const demoMode = typeof value.demoMode === "boolean" ? value.demoMode : DEFAULT_SETTINGS.demoMode;
  const motion = includes(MOTION_MODES, value.motion) ? value.motion : DEFAULT_SETTINGS.motion;

  return { theme, unit, focus, demoMode, motion };
}

export function parseSettings(raw: string | null): FlightdeckSettings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return coerceSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function serializeSettings(settings: FlightdeckSettings): string {
  return JSON.stringify(coerceSettings(settings));
}

export function readSettings(storage: Storage = window.localStorage): FlightdeckSettings {
  return parseSettings(storage.getItem(SETTINGS_STORAGE_KEY));
}

export function writeSettings(
  settings: FlightdeckSettings,
  storage: Storage = window.localStorage
): FlightdeckSettings {
  const next = coerceSettings(settings);
  storage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(next));
  return next;
}
