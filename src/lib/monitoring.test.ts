import { describe, expect, it } from "vitest";
import {
  createDemoSnapshot,
  fahrenheitFromCelsius,
  normalizeMonitoringData,
  pushHistory
} from "./monitoring";

describe("monitoring data normalization", () => {
  it("normalizes NZXT CAM data into the Flightdeck metric shape", () => {
    const snapshot = normalizeMonitoringData({
      cpus: [
        {
          name: "Ryzen 9",
          load: 0.42,
          temperature: 61.4,
          frequency: 5100,
          fanSpeed: 1317,
          power: 112.2
        }
      ],
      gpus: [
        {
          name: "NVIDIA RTX 4090",
          load: 0.18,
          temperature: 41.2,
          frequency: 2730,
          fanSpeed: 562,
          power: 88.8
        }
      ],
      ram: {
        inUse: 6093,
        totalSize: 32768
      },
      kraken: {
        liquidTemperature: 35.3,
        pumpSpeed: 2840
      }
    });

    expect(snapshot.cpu.temperature).toBe(61);
    expect(snapshot.cpu.load).toBe(42);
    expect(snapshot.gpu.temperature).toBe(41);
    expect(snapshot.gpu.load).toBe(18);
    expect(snapshot.gpu.fanSpeed).toBe(562);
    expect(snapshot.ram.inUseMb).toBe(6093);
    expect(snapshot.ram.inUsePercent).toBe(19);
    expect(snapshot.liquid.temperature).toBe(35);
    expect(snapshot.liquid.pumpSpeed).toBe(2840);
    expect(snapshot.ssd.activity).toBeGreaterThan(0);
    expect(snapshot.ssd.readMb).toBeGreaterThan(0);
    expect(snapshot.ssd.totalGb).toBe(480);
    expect(snapshot.ssd.usedGb).toBeGreaterThan(0);
    expect(snapshot.latency.valueMs).toBeGreaterThan(0);
    expect(snapshot.latency.jitterMs).toBeGreaterThan(0);
    expect(snapshot.thermal.liquidTemp).toBe(35);
    expect(snapshot.cooling.pumpSpeed).toBe(2840);
    expect(snapshot.power.combinedWatts).toBe(201);
  });

  it("chooses the discrete GPU when integrated graphics are also reported", () => {
    const snapshot = normalizeMonitoringData({
      cpus: [{ name: "CPU", load: 0.5, temperature: 50 }],
      gpus: [
        { name: "AMD Radeon Graphics", load: 0.9, temperature: 70 },
        { name: "NVIDIA GeForce RTX", load: 0.25, temperature: 44 }
      ],
      ram: { inUse: 4096, totalSize: 16384 },
      kraken: { liquidTemperature: 31 }
    });

    expect(snapshot.gpu.name).toBe("NVIDIA GeForce RTX");
    expect(snapshot.gpu.load).toBe(25);
  });

  it("keeps history windows capped for the small LCD surface", () => {
    expect(pushHistory([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
  });

  it("provides deterministic demo data outside CAM", () => {
    const demo = createDemoSnapshot(0);
    expect(demo.cpu.temperature).toBeGreaterThan(0);
    expect(demo.gpu.temperature).toBeGreaterThan(0);
    expect(demo.ram.inUsePercent).toBeGreaterThan(0);
    expect(demo.ssd.activity).toBeGreaterThan(0);
    expect(demo.latency.valueMs).toBeGreaterThan(0);
  });

  it("converts Celsius to Fahrenheit for settings display", () => {
    expect(fahrenheitFromCelsius(35)).toBe(95);
  });
});
