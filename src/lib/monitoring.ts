import type { Cpu, Gpu, Kraken, MonitoringData, Ram } from "@nzxt/web-integrations-types/v1";

export interface SystemMetric {
  name: string;
  load: number;
  temperature: number;
  frequency: number;
  fanSpeed: number;
  power: number;
}

export interface RamMetric {
  inUseMb: number;
  totalMb: number;
  inUsePercent: number;
}

export interface LiquidMetric {
  temperature: number;
  pumpSpeed: number;
}

export interface StorageMetric {
  activity: number;
  readMb: number;
  writeMb: number;
  usedGb: number;
  totalGb: number;
}

export interface LatencyMetric {
  valueMs: number;
  jitterMs: number;
}

export interface ThermalMetric {
  liquidTemp: number;
  cpuTemp: number;
  gpuTemp: number;
}

export interface CoolingMetric {
  pumpSpeed: number;
  cpuFanSpeed: number;
  gpuFanSpeed: number;
}

export interface PowerMetric {
  cpuWatts: number;
  gpuWatts: number;
  combinedWatts: number;
}

export interface FlightdeckSnapshot {
  timestamp: number;
  cpu: SystemMetric;
  gpu: SystemMetric;
  ram: RamMetric;
  liquid: LiquidMetric;
  ssd: StorageMetric;
  latency: LatencyMetric;
  thermal: ThermalMetric;
  cooling: CoolingMetric;
  power: PowerMetric;
}

type PartialCpu = Partial<Cpu>;
type PartialGpu = Partial<Gpu>;
type PartialRam = Partial<Ram>;
type PartialKraken = Partial<Kraken> & { pumpSpeed?: number };

export interface MonitoringInput {
  cpus?: PartialCpu[];
  gpus?: PartialGpu[];
  ram?: PartialRam;
  kraken?: PartialKraken;
}

const DEFAULT_NAME = "N/A";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const numberOrZero = (value: unknown): number => {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return value;
};

const round = (value: unknown): number => Math.round(numberOrZero(value));

const percentFromLoad = (load: unknown): number => {
  const value = numberOrZero(load);
  const percent = value <= 1 ? value * 100 : value;
  return clamp(Math.round(percent), 0, 100);
};

const discreteGpuMatchers = [/nvidia/i, /geforce/i, /rtx/i, /gtx/i, /radeon rx/i, /arc/i];
const integratedGpuMatchers = [/integrated/i, /graphics/i, /uhd/i, /iris/i, /vega/i];

function pickCpu(cpus: PartialCpu[] = []): PartialCpu {
  return cpus[0] ?? {};
}

function pickGpu(gpus: PartialGpu[] = []): PartialGpu {
  const discrete = gpus.find((gpu) =>
    discreteGpuMatchers.some((matcher) => matcher.test(gpu.name ?? ""))
  );

  if (discrete) {
    return discrete;
  }

  return (
    gpus.find((gpu) => !integratedGpuMatchers.some((matcher) => matcher.test(gpu.name ?? ""))) ??
    gpus[0] ??
    {}
  );
}

function normalizeSystemMetric(metric: PartialCpu | PartialGpu, fallbackName: string): SystemMetric {
  return {
    name: metric.name ?? fallbackName,
    load: percentFromLoad(metric.load),
    temperature: round(metric.temperature),
    frequency: round(metric.frequency),
    fanSpeed: round(metric.fanSpeed),
    power: round(metric.power)
  };
}

function deriveStorageMetric(cpu: SystemMetric, gpu: SystemMetric, ram: RamMetric): StorageMetric {
  const activity = clamp(
    Math.round(cpu.load * 0.28 + gpu.load * 0.18 + ram.inUsePercent * 0.54),
    0,
    100
  );
  const totalGb = 480;
  const usedGb = clamp(Math.round((activity / 100) * totalGb), 48, totalGb);

  return {
    activity,
    readMb: Math.round(activity * 0.74),
    writeMb: Math.round(activity * 0.46),
    usedGb,
    totalGb
  };
}

function deriveLatencyMetric(cpu: SystemMetric, gpu: SystemMetric, ram: RamMetric): LatencyMetric {
  const valueMs = clamp(
    Math.round(8 + cpu.load * 0.09 + gpu.load * 0.05 + ram.inUsePercent * 0.06),
    4,
    48
  );

  return {
    valueMs,
    jitterMs: clamp(Math.round(valueMs * 0.22), 1, 12)
  };
}

export function normalizeMonitoringData(data: MonitoringInput | MonitoringData): FlightdeckSnapshot {
  const cpu = pickCpu(data.cpus);
  const gpu = pickGpu(data.gpus);
  const ram = data.ram ?? {};
  const kraken = data.kraken ?? {};
  const totalMb = Math.max(round(ram.totalSize), 1);
  const inUseMb = round(ram.inUse);
  const pumpSpeed = round((kraken as PartialKraken).pumpSpeed) || round(cpu.fanSpeed);
  const cpuMetric = normalizeSystemMetric(cpu, DEFAULT_NAME);
  const gpuMetric = normalizeSystemMetric(gpu, DEFAULT_NAME);
  const ramMetric = {
    inUseMb,
    totalMb,
    inUsePercent: clamp(Math.round((inUseMb / totalMb) * 100), 0, 100)
  };
  const liquidMetric = {
    temperature: round(kraken.liquidTemperature),
    pumpSpeed
  };
  const powerMetric = {
    cpuWatts: cpuMetric.power,
    gpuWatts: gpuMetric.power,
    combinedWatts: cpuMetric.power + gpuMetric.power
  };

  return {
    timestamp: Date.now(),
    cpu: cpuMetric,
    gpu: gpuMetric,
    ram: ramMetric,
    liquid: liquidMetric,
    ssd: deriveStorageMetric(cpuMetric, gpuMetric, ramMetric),
    latency: deriveLatencyMetric(cpuMetric, gpuMetric, ramMetric),
    thermal: {
      liquidTemp: liquidMetric.temperature,
      cpuTemp: cpuMetric.temperature,
      gpuTemp: gpuMetric.temperature
    },
    cooling: {
      pumpSpeed: liquidMetric.pumpSpeed,
      cpuFanSpeed: cpuMetric.fanSpeed,
      gpuFanSpeed: gpuMetric.fanSpeed
    },
    power: powerMetric
  };
}

export function pushHistory(history: number[], value: number, maxLength = 60): number[] {
  return [...history, value].slice(-maxLength);
}

export function fahrenheitFromCelsius(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

export function createDemoSnapshot(step: number): FlightdeckSnapshot {
  const wave = (offset: number, amplitude: number) => Math.sin(step / 18 + offset) * amplitude;
  const cpuTemp = 54 + wave(0.4, 8);
  const gpuTemp = 42 + wave(1.3, 6);
  const liquidTemp = 34 + wave(2.2, 2);
  const cpu = {
    name: "Demo CPU",
    load: clamp(Math.round(48 + wave(0, 26)), 2, 98),
    temperature: Math.round(cpuTemp),
    frequency: Math.round(5050 + wave(0.8, 220)),
    fanSpeed: Math.round(1260 + wave(0.2, 180)),
    power: Math.round(96 + wave(1.7, 34))
  };
  const gpu = {
    name: "Demo GPU",
    load: clamp(Math.round(24 + wave(1.1, 18)), 1, 96),
    temperature: Math.round(gpuTemp),
    frequency: Math.round(2520 + wave(0.6, 160)),
    fanSpeed: Math.round(610 + wave(1.8, 120)),
    power: Math.round(86 + wave(0.9, 28))
  };
  const ram = {
    inUseMb: Math.round(6093 + wave(2.5, 320)),
    totalMb: 32768,
    inUsePercent: clamp(Math.round(19 + wave(2.5, 2)), 1, 100)
  };
  const liquid = {
    temperature: Math.round(liquidTemp),
    pumpSpeed: Math.round(2840 + wave(0.3, 70))
  };
  const power = {
    cpuWatts: cpu.power,
    gpuWatts: gpu.power,
    combinedWatts: cpu.power + gpu.power
  };

  return {
    timestamp: Date.now(),
    cpu,
    gpu,
    ram,
    liquid,
    ssd: deriveStorageMetric(cpu, gpu, ram),
    latency: deriveLatencyMetric(cpu, gpu, ram),
    thermal: {
      liquidTemp: liquid.temperature,
      cpuTemp: cpu.temperature,
      gpuTemp: gpu.temperature
    },
    cooling: {
      pumpSpeed: liquid.pumpSpeed,
      cpuFanSpeed: cpu.fanSpeed,
      gpuFanSpeed: gpu.fanSpeed
    },
    power
  };
}
