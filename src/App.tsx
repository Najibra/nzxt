import { ConfigPanel } from "./components/ConfigPanel";
import { FlightdeckDisplay } from "./components/FlightdeckDisplay";
import { useFlightdeckSettings } from "./hooks/useFlightdeckSettings";
import { useFlightdeckTelemetry } from "./hooks/useFlightdeckTelemetry";

const inKrakenMode = new URLSearchParams(window.location.search).get("kraken") === "1";

export default function App() {
  const { settings, updateSettings } = useFlightdeckSettings();
  const telemetry = useFlightdeckTelemetry(settings.demoMode);

  if (inKrakenMode) {
    return (
      <main className="kraken-stage" data-theme={settings.theme} data-motion={settings.motion}>
        <FlightdeckDisplay settings={settings} telemetry={telemetry} />
      </main>
    );
  }

  return (
    <ConfigPanel settings={settings} telemetry={telemetry} onSettingsChange={updateSettings} />
  );
}
