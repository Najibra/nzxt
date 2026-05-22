import { useEffect, useState } from "react";
import type { FlightdeckTelemetry } from "../hooks/useFlightdeckTelemetry";
import { fahrenheitFromCelsius } from "../lib/monitoring";
import type { FlightdeckSettings } from "../lib/settings";

interface FlightdeckDisplayProps {
  settings: FlightdeckSettings;
  telemetry: FlightdeckTelemetry;
  compact?: boolean;
}

interface MetricPodProps {
  className: string;
  label: string;
  value: string;
  suffix?: string;
  mode: string;
  detail: string;
  detailLabel: string;
  progress: number;
  accent: "cpu" | "gpu" | "ram" | "ssd";
}

interface CenterDialProps {
  time: string;
  cpu: number;
  gpu: number;
  ram: number;
  cpuHistory: number[];
  gpuHistory: number[];
  ramHistory: number[];
}

const DISPLAY_SIZE = 640;
const CLOCK_UPDATE_MS = 10000;

function displayTemp(celsius: number, unit: FlightdeckSettings["unit"]) {
  return unit === "f" ? fahrenheitFromCelsius(celsius) : celsius;
}

function tempUnit(unit: FlightdeckSettings["unit"]) {
  return unit === "f" ? "F" : "C";
}

function degreeText(unit: string) {
  return `\u00B0${unit}`;
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(timestamp);
}

function formatGb(valueMb: number) {
  return (valueMb / 1024).toFixed(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, radius, endAngle);
  const end = polar(cx, cy, radius, startAngle);
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function historyPath(values: number[], width: number, height: number, topPadding = 8) {
  const points = values.length > 0 ? values : [0];
  const usableHeight = height - topPadding * 2;
  const step = width / Math.max(points.length - 1, 1);

  return points
    .map((value, index) => {
      const x = index * step;
      const y = topPadding + usableHeight - (clamp(value, 0, 100) / 100) * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function GaugeRing({
  progress,
  accent,
  compact = false
}: {
  progress: number;
  accent: "cpu" | "gpu" | "ram" | "ssd" | "system";
  compact?: boolean;
}) {
  const radius = compact ? 78 : 82;
  const start = 218;
  const span = 248;
  const end = start + (span * clamp(progress, 0, 100)) / 100;

  return (
    <svg className="pod-ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="92" className="pod-outer" />
      <circle cx="100" cy="100" r="76" className="pod-inner" />
      <path d={arcPath(100, 100, radius, 132, 408)} className="pod-track" />
      <path d={arcPath(100, 100, radius, start, end)} className={`pod-active pod-active-${accent}`} />
    </svg>
  );
}

function MetricPod({
  className,
  label,
  value,
  suffix = "",
  mode,
  detail,
  detailLabel,
  progress,
  accent
}: MetricPodProps) {
  return (
    <section className={`metric-pod ${className}`} aria-label={`${label} sensor`}>
      <GaugeRing progress={progress} accent={accent} />
      <div className="pod-copy">
        <div className="pod-label">{label}</div>
        <div className="pod-value">
          {value}
          {suffix ? <span>{suffix}</span> : null}
        </div>
        <div className="pod-mode">{mode}</div>
        <div className="pod-divider" />
        <div className={`pod-detail pod-detail-${accent}`}>{detail}</div>
        <div className="pod-detail-label">{detailLabel}</div>
      </div>
    </section>
  );
}

function MiniGraphLane({
  label,
  value,
  history,
  accent
}: {
  label: string;
  value: number;
  history: number[];
  accent: "cpu" | "gpu" | "ram";
}) {
  return (
    <div className={`mini-graph-lane mini-graph-${accent}`}>
      <div className="mini-graph-head">
        <span>{label}</span>
        <b>{value}%</b>
      </div>
      <svg viewBox="0 0 156 28" className="mini-graph-svg" aria-hidden="true">
        <line x1="0" y1="14" x2="156" y2="14" className="mini-graph-midline" />
        <path d={historyPath(history, 156, 28, 4)} className={`mini-graph-path mini-graph-path-${accent}`} />
      </svg>
    </div>
  );
}

function CenterDial({ time, cpu, gpu, ram, cpuHistory, gpuHistory, ramHistory }: CenterDialProps) {
  return (
    <section className="center-dial" aria-label="system monitoring graph">
      <div className="center-dial-ring" />
      <div className="center-time">{time}</div>
      <div className="center-title">System Monitoring</div>
      <div className="center-graph">
        <MiniGraphLane label="CPU" value={cpu} history={cpuHistory} accent="cpu" />
        <MiniGraphLane label="GPU" value={gpu} history={gpuHistory} accent="gpu" />
        <MiniGraphLane label="RAM" value={ram} history={ramHistory} accent="ram" />
      </div>
    </section>
  );
}

function SystemPod({
  liquid,
  pump
}: {
  liquid: string;
  pump: string;
}) {
  return (
    <section className="system-pod" aria-label="system stats">
      <div className="system-pod-copy">
        <div className="system-pod-title">SYSTEM</div>
        <div className="system-pod-row"><span>LIQUID</span><b>{liquid}</b></div>
        <div className="system-pod-row"><span>PUMP</span><b>{pump}</b></div>
      </div>
    </section>
  );
}

function BottomPanel({
  fans,
  power
}: {
  fans: string;
  power: string;
}) {
  return (
    <section className="bottom-panel" aria-label="fans and power">
      <div className="bottom-column fans-column">
        <span>FANS</span>
        <b>{fans}</b>
      </div>
      <div className="bottom-column power-column">
        <span>POWER</span>
        <b>{power}</b>
      </div>
    </section>
  );
}

export function FlightdeckDisplay({ settings, telemetry, compact = false }: FlightdeckDisplayProps) {
  const { snapshot, cpuHistory, gpuHistory, ramHistory } = telemetry;
  const [clock, setClock] = useState(() => formatClock(Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatClock(Date.now())), CLOCK_UPDATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const unit = tempUnit(settings.unit);
  const cpuTemp = displayTemp(snapshot.cpu.temperature, settings.unit);
  const gpuTemp = displayTemp(snapshot.gpu.temperature, settings.unit);
  const ramUsed = formatGb(snapshot.ram.inUseMb);
  const ramTotal = Math.round(snapshot.ram.totalMb / 1024).toString();
  const liquidTemp = displayTemp(snapshot.liquid.temperature, settings.unit);

  return (
    <section
      className={`flightdeck-shell ${compact ? "flightdeck-shell-preview" : ""}`}
      data-theme={settings.theme}
      data-motion={settings.motion}
      aria-label="NZXT Kraken circular display"
    >
      <div className="kraken-display" style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}>
        <div className="display-bezel display-bezel-outer" />
        <div className="display-bezel display-bezel-mid" />
        <div className="display-bezel display-bezel-inner" />

        <MetricPod
          className="pod-cpu"
          label="CPU"
          value={`${snapshot.cpu.load}`}
          suffix="%"
          mode="USAGE"
          detail={`${cpuTemp}${degreeText(unit)}`}
          detailLabel="TEMP"
          progress={snapshot.cpu.load}
          accent="cpu"
        />

        <MetricPod
          className="pod-gpu"
          label="GPU"
          value={`${snapshot.gpu.load}`}
          suffix="%"
          mode="USAGE"
          detail={`${gpuTemp}${degreeText(unit)}`}
          detailLabel="TEMP"
          progress={snapshot.gpu.load}
          accent="gpu"
        />

        <MetricPod
          className="pod-ram"
          label="RAM"
          value={`${snapshot.ram.inUsePercent}`}
          suffix="%"
          mode="USAGE"
          detail={`${ramUsed} / ${ramTotal} GB`}
          detailLabel="USED"
          progress={snapshot.ram.inUsePercent}
          accent="ram"
        />

        <CenterDial
          time={clock}
          cpu={snapshot.cpu.load}
          gpu={snapshot.gpu.load}
          ram={snapshot.ram.inUsePercent}
          cpuHistory={cpuHistory}
          gpuHistory={gpuHistory}
          ramHistory={ramHistory}
        />

        <MetricPod
          className="pod-ssd"
          label="SSD"
          value={`${snapshot.ssd.activity}`}
          suffix="%"
          mode="USED"
          detail=""
          detailLabel=""
          progress={snapshot.ssd.activity}
          accent="ssd"
        />

        <SystemPod
          liquid={`${liquidTemp}${degreeText(unit)}`}
          pump={`${snapshot.cooling.pumpSpeed || snapshot.cooling.cpuFanSpeed} RPM`}
        />

        <BottomPanel
          fans={`${snapshot.cooling.cpuFanSpeed || snapshot.cooling.pumpSpeed} RPM`}
          power={`${snapshot.power.combinedWatts || snapshot.cpu.power || snapshot.gpu.power} W`}
        />
      </div>
    </section>
  );
}
