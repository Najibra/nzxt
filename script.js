/*
 * This script updates the CPU and GPU temperature displays using the
 * monitoring data provided by NZXT CAM. When running inside CAM, the
 * onMonitoringDataUpdate callback will be invoked automatically with fresh
 * telemetry every second. Outside of CAM, we simulate changing values so
 * developers can preview the UI in a standard browser.
 */

// DOM elements for updating temperature values
const cpuTempEl = document.getElementById('cpu-temp');
const gpuTempEl = document.getElementById('gpu-temp');

// Helper function to format temperatures nicely
function formatTemp(tempCelsius) {
  return `${Math.round(tempCelsius)} °C`;
}

// Updates the displayed temperatures from monitoring data
function updateTemperatures(data) {
  // Attempt to extract the first CPU and GPU temperature if available
  const firstCpu = data?.cpus?.[0];
  const firstGpu = data?.gpus?.[0];

  if (firstCpu && typeof firstCpu.temperature === 'number') {
    cpuTempEl.textContent = formatTemp(firstCpu.temperature);
  }

  if (firstGpu && typeof firstGpu.temperature === 'number') {
    gpuTempEl.textContent = formatTemp(firstGpu.temperature);
  }
}

// Determine if the integration is running in the Kraken Browser by checking
// the presence of the "kraken" query parameter. Outside of CAM this will
// return false.
const urlParams = new URLSearchParams(window.location.search);
const isKraken = urlParams.get('kraken') === '1';

if (isKraken && window.nzxt?.v1) {
  // In Kraken Browser: register callback for monitoring data
  window.nzxt.v1.onMonitoringDataUpdate = (data) => {
    updateTemperatures(data);
  };
} else {
  // In regular browser: simulate changing data for demo purposes
  let fakeCpu = 45;
  let fakeGpu = 40;
  setInterval(() => {
    // Oscillate temperatures slightly
    fakeCpu += (Math.random() - 0.5) * 2;
    fakeGpu += (Math.random() - 0.5) * 2;
    updateTemperatures({
      cpus: [{ temperature: fakeCpu }],
      gpus: [{ temperature: fakeGpu }],
    });
  }, 1000);
}