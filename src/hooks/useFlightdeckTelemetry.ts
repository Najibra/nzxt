import { useEffect, useMemo, useRef, useState } from "react";
import type { MonitoringData } from "@nzxt/web-integrations-types/v1";
import {
  type FlightdeckSnapshot,
  createDemoSnapshot,
  normalizeMonitoringData,
  pushHistory
} from "../lib/monitoring";

export type TelemetrySource = "demo" | "cam" | "waiting";

export interface DeviceInfo {
  width: number;
  height: number;
  shape: "circle" | "square";
  targetFps: number;
}

export interface FlightdeckTelemetry {
  snapshot: FlightdeckSnapshot;
  cpuHistory: number[];
  gpuHistory: number[];
  ramHistory: number[];
  ssdHistory: number[];
  latencyHistory: number[];
  liquidHistory: number[];
  source: TelemetrySource;
  device: DeviceInfo;
}

const emptyHistory = Array(42).fill(0) as number[];
const MONITORING_UPDATE_MS = 10000;

function readDeviceInfo(): DeviceInfo {
  const injected = window.nzxt?.v1;

  return {
    width: injected?.width ?? 640,
    height: injected?.height ?? 640,
    shape: injected?.shape ?? "circle",
    targetFps: injected?.targetFps ?? 30
  };
}

export function useFlightdeckTelemetry(demoMode: boolean): FlightdeckTelemetry {
  const step = useRef(0);
  const lastMonitoringUpdate = useRef(0);
  const [snapshot, setSnapshot] = useState(() => createDemoSnapshot(0));
  const [source, setSource] = useState<TelemetrySource>(demoMode ? "demo" : "waiting");
  const [device, setDevice] = useState<DeviceInfo>(() => readDeviceInfo());
  const [cpuHistory, setCpuHistory] = useState<number[]>(() =>
    emptyHistory.map((_, index) => createDemoSnapshot(index).cpu.load)
  );
  const [gpuHistory, setGpuHistory] = useState<number[]>(() =>
    emptyHistory.map((_, index) => createDemoSnapshot(index).gpu.load)
  );
  const [ramHistory, setRamHistory] = useState<number[]>(() =>
    emptyHistory.map((_, index) => createDemoSnapshot(index).ram.inUsePercent)
  );
  const [ssdHistory, setSsdHistory] = useState<number[]>(() =>
    emptyHistory.map((_, index) => createDemoSnapshot(index).ssd.activity)
  );
  const [latencyHistory, setLatencyHistory] = useState<number[]>(() =>
    emptyHistory.map((_, index) => createDemoSnapshot(index).latency.valueMs)
  );
  const [liquidHistory, setLiquidHistory] = useState<number[]>(() =>
    emptyHistory.map((_, index) => createDemoSnapshot(index).liquid.temperature)
  );

  useEffect(() => {
    const existing = window.nzxt?.v1;

    const handleMonitoringData = (data: MonitoringData) => {
      const now = Date.now();

      if (now - lastMonitoringUpdate.current < MONITORING_UPDATE_MS) {
        return;
      }

      lastMonitoringUpdate.current = now;
      const next = normalizeMonitoringData(data);
      setSnapshot(next);
      setSource("cam");
      setDevice(readDeviceInfo());
      setCpuHistory((history) => pushHistory(history, next.cpu.load, 42));
      setGpuHistory((history) => pushHistory(history, next.gpu.load, 42));
      setRamHistory((history) => pushHistory(history, next.ram.inUsePercent, 42));
      setSsdHistory((history) => pushHistory(history, next.ssd.activity, 42));
      setLatencyHistory((history) => pushHistory(history, next.latency.valueMs, 42));
      setLiquidHistory((history) => pushHistory(history, next.liquid.temperature, 42));
    };

    window.nzxt = {
      v1: {
        width: existing?.width ?? 640,
        height: existing?.height ?? 640,
        shape: existing?.shape ?? "circle",
        targetFps: existing?.targetFps ?? 30,
        onMonitoringDataUpdate: handleMonitoringData
      }
    };
  }, []);

  useEffect(() => {
    if (!demoMode) {
      setSource((current) => (current === "cam" ? "cam" : "waiting"));
      return undefined;
    }

    setSource("demo");
    const timer = window.setInterval(() => {
      step.current += 1;
      const next = createDemoSnapshot(step.current);
      setSnapshot(next);
      setCpuHistory((history) => pushHistory(history, next.cpu.load, 42));
      setGpuHistory((history) => pushHistory(history, next.gpu.load, 42));
      setRamHistory((history) => pushHistory(history, next.ram.inUsePercent, 42));
      setSsdHistory((history) => pushHistory(history, next.ssd.activity, 42));
      setLatencyHistory((history) => pushHistory(history, next.latency.valueMs, 42));
      setLiquidHistory((history) => pushHistory(history, next.liquid.temperature, 42));
    }, MONITORING_UPDATE_MS);

    return () => window.clearInterval(timer);
  }, [demoMode]);

  return useMemo(
    () => ({
      snapshot,
      cpuHistory,
      gpuHistory,
      ramHistory,
      ssdHistory,
      latencyHistory,
      liquidHistory,
      source,
      device
    }),
    [cpuHistory, device, gpuHistory, latencyHistory, liquidHistory, ramHistory, snapshot, source, ssdHistory]
  );
}
