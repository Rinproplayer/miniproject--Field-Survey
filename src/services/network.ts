import { Network, type ConnectionStatus } from '@capacitor/network';
import { getSettings } from './db';

type NetworkCallback = (online: boolean) => void;
const listeners: Set<NetworkCallback> = new Set();

let currentStatus: boolean = navigator.onLine;

export function isOnline(): boolean {
  return currentStatus;
}

export function subscribeNetworkStatus(callback: NetworkCallback): () => void {
  listeners.add(callback);
  callback(currentStatus);
  return () => {
    listeners.delete(callback);
  };
}

function notifyAll(status: boolean) {
  currentStatus = status;
  listeners.forEach((cb) => cb(status));
}

// Initialize listeners
export async function initNetworkMonitoring(): Promise<void> {
  // Check settings for simulated offline
  const settings = await getSettings();
  if (settings.simulateOffline) {
    notifyAll(false);
  } else {
    try {
      const status: ConnectionStatus = await Network.getStatus();
      notifyAll(status.connected);
    } catch {
      notifyAll(navigator.onLine);
    }
  }

  // Capacitor Network change listener
  Network.addListener('networkStatusChange', async (status) => {
    const currentSettings = await getSettings();
    if (currentSettings.simulateOffline) {
      notifyAll(false);
    } else {
      notifyAll(status.connected);
    }
  });

  // Browser standard listeners
  window.addEventListener('online', async () => {
    const currentSettings = await getSettings();
    if (!currentSettings.simulateOffline) {
      notifyAll(true);
    }
  });

  window.addEventListener('offline', () => {
    notifyAll(false);
  });
}

export function setSimulatedOffline(simulated: boolean): void {
  if (simulated) {
    notifyAll(false);
  } else {
    notifyAll(navigator.onLine);
  }
}
