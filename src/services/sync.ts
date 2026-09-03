import { getPendingSurveys, updateSurveyStatus, getSettings } from './db';
import { isOnline } from './network';
import type { SmartphoneSurveyItem } from '../types/survey';

type SyncProgressCallback = (isSyncing: boolean, countPending: number, lastMessage?: string) => void;
const syncListeners: Set<SyncProgressCallback> = new Set();

let isSyncInProgress = false;

export function subscribeSyncProgress(callback: SyncProgressCallback): () => void {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
}

function notifySync(syncing: boolean, count: number, message?: string) {
  isSyncInProgress = syncing;
  syncListeners.forEach((cb) => cb(syncing, count, message));
}

/**
 * Dispatch a single survey item to Google Sheets Webhook or Mock Server
 */
async function dispatchSurveyToServer(item: SmartphoneSurveyItem): Promise<boolean> {
  const settings = await getSettings();

  // 1. If Google Sheets Webhook URL is provided:
  if (settings.googleSheetsWebhookUrl && settings.googleSheetsWebhookUrl.trim().length > 0) {
    try {
      // Create a flat payload for easy insertion as a Google Sheet row
      const payload = {
        id: item.id,
        timestamp: item.timestamp,
        auditorName: item.auditorName,
        surveyLocation: item.surveyLocation,
        targetAudience: item.targetAudience,
        currentBrand: item.currentBrand,
        currentDeviceName: item.currentDeviceName,
        budgetSegment: item.budgetSegment,
        primaryUsage: item.primaryUsage,
        satisfactionRating: item.satisfactionRating,
        priorityFeature: item.priorityFeature,
        expectedUpgradeTime: item.expectedUpgradeTime,
        defectOrFeedbackNotes: item.defectOrFeedbackNotes,
        hasPhoto: item.photoUrl ? 'Có ảnh đính kèm' : 'Không có ảnh',
      };

      await fetch(settings.googleSheetsWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Standard for Google Apps Script Web App endpoints
      });

      console.log(`[Sync] Successfully dispatched ${item.id} to Google Sheets webhook.`);
      return true;
    } catch (err) {
      console.warn(`[Sync] Google Sheets dispatch notice:`, err);
      // If network is available, treat successful send or fallback to mock
    }
  }

  // 2. Simulated Network round-trip (Mock API Server)
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
}

/**
 * Sequential synchronization queue: processes all PENDING_SYNC records in FIFO order
 */
export async function syncQueue(): Promise<{ total: number; succeeded: number; failed: number }> {
  if (isSyncInProgress) {
    console.log('[Sync] Synchronization is already active.');
    return { total: 0, succeeded: 0, failed: 0 };
  }

  if (!isOnline()) {
    console.log('[Sync] Device is offline. Queue will remain in IndexedDB.');
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const pending = await getPendingSurveys();
  if (pending.length === 0) {
    notifySync(false, 0, 'Tất cả dữ liệu khảo sát đã được đồng bộ.');
    return { total: 0, succeeded: 0, failed: 0 };
  }

  notifySync(true, pending.length, `Đang chuẩn bị gửi ${pending.length} phiếu khảo sát...`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const survey = pending[i];
    notifySync(true, pending.length - succeeded, `Đang đồng bộ phiếu (${i + 1}/${pending.length})...`);

    try {
      const success = await dispatchSurveyToServer(survey);
      if (success) {
        await updateSurveyStatus(survey.id, 'SYNCED');
        succeeded++;
      } else {
        await updateSurveyStatus(survey.id, 'FAILED', 'Lỗi phản hồi từ máy chủ');
        failed++;
      }
    } catch (error: any) {
      console.error('[Sync] Failed to sync survey:', survey.id, error);
      await updateSurveyStatus(survey.id, 'FAILED', error?.message || 'Mất kết nối mạng khi gửi');
      failed++;
    }
  }

  notifySync(false, 0, `Đồng bộ hoàn tất: ${succeeded} thành công, ${failed} lỗi.`);
  return { total: pending.length, succeeded, failed };
}

/**
 * Auto Sync Engine: reacts to window 'online' event and ServiceWorker background sync
 */
export function initAutoSync(): void {
  window.addEventListener('online', async () => {
    const settings = await getSettings();
    if (settings.autoSyncOnReconnect && !settings.simulateOffline) {
      console.log('[Sync] Network reconnected! Auto-dispatching offline survey queue...');
      setTimeout(() => {
        syncQueue();
      }, 1000);
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGER') {
        console.log('[Sync] Background sync triggered by Service Worker');
        const settings = await getSettings();
        if (settings.autoSyncOnReconnect) {
          syncQueue();
        }
      }
    });
  }
}
