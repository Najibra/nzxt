import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  coerceSettings,
  serializeSettings
} from "./settings";

describe("settings", () => {
  it("keeps invalid or missing settings on the documented defaults", () => {
    expect(coerceSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(coerceSettings({ theme: "purple", unit: "kelvin" })).toEqual(DEFAULT_SETTINGS);
  });

  it("accepts only the documented settings contract", () => {
    expect(
      coerceSettings({
        theme: "amber",
        unit: "f",
        focus: "gpu",
        demoMode: false,
        motion: "off"
      })
    ).toEqual({
      theme: "amber",
      unit: "f",
      focus: "gpu",
      demoMode: false,
      motion: "off"
    });
  });

  it("serializes under the stable storage key", () => {
    expect(SETTINGS_STORAGE_KEY).toBe("krakenFlightdeck.settings.v1");
    expect(serializeSettings({ ...DEFAULT_SETTINGS, theme: "green" })).toContain('"theme":"green"');
  });
});
