import type { FlightdeckTelemetry } from "../hooks/useFlightdeckTelemetry";
import {
  FOCUS_MODES,
  MOTION_MODES,
  THEMES,
  type FlightdeckSettings
} from "../lib/settings";
import { FlightdeckDisplay } from "./FlightdeckDisplay";

interface ConfigPanelProps {
  settings: FlightdeckSettings;
  telemetry: FlightdeckTelemetry;
  onSettingsChange: (settings: FlightdeckSettings) => void;
}

const localUrl = "http://localhost:5173/?kraken=1";
const publishedPlaceholder = "https://YOUR-GITHUB-USER.github.io/nzxt-kraken-flightdeck/";

function makeShareUrl(protocolHost: string, targetUrl: string) {
  return `${protocolHost}/action/load-web-integration?url=${encodeURIComponent(targetUrl)}`;
}

export function ConfigPanel({ settings, telemetry, onSettingsChange }: ConfigPanelProps) {
  const update = <Key extends keyof FlightdeckSettings>(key: Key, value: FlightdeckSettings[Key]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <main className="config-page" data-theme={settings.theme} data-motion={settings.motion}>
      <section className="config-hero">
        <div className="config-copy">
          <p className="eyebrow">NZXT Kraken Elite / Web Integration</p>
          <h1>Flightdeck</h1>
          <p className="lede">
            A circular cockpit monitor for CPU, GPU, RAM, liquid temperature, and cooling RPMs.
          </p>

          <div className="status-strip" aria-label="current telemetry status">
            <span>{telemetry.source === "cam" ? "CAM live" : telemetry.source === "demo" ? "Demo data" : "Waiting for CAM"}</span>
            <span>{telemetry.device.width}x{telemetry.device.height}</span>
            <span>{telemetry.device.shape}</span>
          </div>
        </div>

        <div className="preview-wrap" aria-label="live display preview">
          <FlightdeckDisplay compact settings={settings} telemetry={telemetry} />
        </div>
      </section>

      <section className="settings-grid" aria-label="Flightdeck settings">
        <div className="settings-panel">
          <h2>Theme</h2>
          <div className="segmented swatches">
            {THEMES.map((theme) => (
              <button
                key={theme}
                className={settings.theme === theme ? "active" : ""}
                type="button"
                onClick={() => update("theme", theme)}
                aria-pressed={settings.theme === theme}
              >
                <span className={`swatch swatch-${theme}`} aria-hidden="true" />
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel">
          <h2>Units</h2>
          <div className="segmented">
            <button
              type="button"
              className={settings.unit === "c" ? "active" : ""}
              onClick={() => update("unit", "c")}
              aria-pressed={settings.unit === "c"}
            >
              Celsius
            </button>
            <button
              type="button"
              className={settings.unit === "f" ? "active" : ""}
              onClick={() => update("unit", "f")}
              aria-pressed={settings.unit === "f"}
            >
              Fahrenheit
            </button>
          </div>
        </div>

        <div className="settings-panel">
          <h2>Focus</h2>
          <div className="segmented">
            {FOCUS_MODES.map((focus) => (
              <button
                key={focus}
                className={settings.focus === focus ? "active" : ""}
                type="button"
                onClick={() => update("focus", focus)}
                aria-pressed={settings.focus === focus}
              >
                {focus}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel">
          <h2>Motion</h2>
          <div className="segmented">
            {MOTION_MODES.map((motion) => (
              <button
                key={motion}
                className={settings.motion === motion ? "active" : ""}
                type="button"
                onClick={() => update("motion", motion)}
                aria-pressed={settings.motion === motion}
              >
                {motion}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2>Data Source</h2>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.demoMode}
              onChange={(event) => update("demoMode", event.currentTarget.checked)}
            />
            <span className="toggle-track" aria-hidden="true" />
            <span>Run demo data when CAM is not sending telemetry</span>
          </label>
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2>CAM Links</h2>
          <div className="link-list">
            <a href={localUrl}>{localUrl}</a>
            <a href={makeShareUrl("https://cam-redirect.nzxt.com", publishedPlaceholder)}>
              NZXT CAM share link template
            </a>
            <a href={makeShareUrl("https://cam-beta-redirect.nzxt.com", publishedPlaceholder)}>
              NZXT CAM Beta share link template
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
