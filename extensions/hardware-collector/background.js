/**
 * Hardware Collector Background Service Worker
 * Collects hardware info and device ID, then reports to the backend.
 */

const BACKEND_URL = 'http://YOUR_SERVER_IP:4001/api/devices/hardware-info'; // 물리 장치 테스트 시 서버 IP로 변경 필요

async function collectAndReport() {
  try {
    // 1. Get hardware info (Manufacturer & Model from BIOS)
    const hardwareInfo = await new Promise((resolve) => {
      chrome.enterprise.hardwarePlatform.getHardwarePlatformInfo((info) => {
        resolve(info);
      });
    });

    // 2. Get device identifiers
    const deviceId = await new Promise((resolve) => {
      chrome.enterprise.deviceAttributes.getDirectoryDeviceId((id) => {
        resolve(id);
      });
    });

    const serialNumber = await new Promise((resolve) => {
      chrome.enterprise.deviceAttributes.getDeviceSerialNumber((sn) => {
        resolve(sn);
      });
    });

    console.log('Hardware Info Collected:', { hardwareInfo, deviceId, serialNumber });

    // 3. Report to Backend
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        googleDeviceId: deviceId,
        serialNumber: serialNumber,
        manufacturer: hardwareInfo.manufacturer,
        model: hardwareInfo.model,
        collectedAt: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log('Successfully reported hardware info to backend');
      // Store last sync time
      await chrome.storage.local.set({ lastReportTime: Date.now() });
    } else {
      console.error('Failed to report hardware info:', response.statusText);
    }
  } catch (error) {
    console.error('Error in hardware collection:', error);
  }
}

// Run on startup and periodically
chrome.runtime.onStartup.addListener(collectAndReport);
chrome.runtime.onInstalled.addListener(collectAndReport);

// Periodic check (every 24 hours)
chrome.alarms.create('dailySync', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailySync') {
    collectAndReport();
  }
});

// Immediate run for testing if manually reloaded
collectAndReport();
