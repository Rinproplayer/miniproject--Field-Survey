import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SmartphoneSurveyItem, SmartphoneDraft, AppSettings } from '../types/survey';

interface SmartphoneSurveyDB extends DBSchema {
  surveys: {
    key: string;
    value: SmartphoneSurveyItem;
    indexes: {
      'by-status': string;
      'by-timestamp': string;
    };
  };
  drafts: {
    key: string;
    value: SmartphoneDraft;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'smartphone-survey-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartphoneSurveyDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SmartphoneSurveyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartphoneSurveyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Surveys Store with indexes for status & timestamp
        if (!db.objectStoreNames.contains('surveys')) {
          const surveyStore = db.createObjectStore('surveys', { keyPath: 'id' });
          surveyStore.createIndex('by-status', 'syncStatus');
          surveyStore.createIndex('by-timestamp', 'timestamp');
        }

        // Drafts Store
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

/* ================= SURVEYS / OFFLINE QUEUE OPERATIONS ================= */

export async function getAllSurveys(): Promise<SmartphoneSurveyItem[]> {
  const db = await getDB();
  const items = await db.getAll('surveys');
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getPendingSurveys(): Promise<SmartphoneSurveyItem[]> {
  const db = await getDB();
  const index = db.transaction('surveys').store.index('by-status');
  return index.getAll('PENDING_SYNC');
}

export async function saveSurvey(survey: SmartphoneSurveyItem): Promise<void> {
  const db = await getDB();
  await db.put('surveys', survey);
}

export async function updateSurveyStatus(
  id: string,
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED',
  errorMessage?: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('surveys', 'readwrite');
  const survey = await tx.store.get(id);
  if (survey) {
    survey.syncStatus = status;
    if (status === 'SYNCED') {
      survey.syncedAt = new Date().toISOString();
      survey.errorMessage = undefined;
    } else if (status === 'FAILED') {
      survey.errorMessage = errorMessage || 'Đồng bộ thất bại';
      survey.retryCount = (survey.retryCount || 0) + 1;
    }
    await tx.store.put(survey);
  }
  await tx.done;
}

export async function deleteSurvey(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('surveys', id);
}

export async function clearAllSurveys(): Promise<void> {
  const db = await getDB();
  await db.clear('surveys');
}

/* ================= REAL-TIME DRAFT PERSISTENCE (IndexedDB) ================= */

export async function saveCurrentDraft(draft: SmartphoneDraft): Promise<void> {
  const db = await getDB();
  await db.put('drafts', draft, 'current_survey_draft');
}

export async function getCurrentDraft(): Promise<SmartphoneDraft | undefined> {
  const db = await getDB();
  return db.get('drafts', 'current_survey_draft');
}

export async function clearCurrentDraft(): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', 'current_survey_draft');
}

/* ================= APP SETTINGS & GOOGLE SHEETS ================= */

const DEFAULT_SETTINGS: AppSettings = {
  googleSheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbzK1I1x0zHEQ6EjQizTtod_6RfPLD3z93o1AvYhbV56WVNOAxC1Pci4VsE7hc6L1NGh/exec',
  mockApiUrl: 'https://vku.udn.vn/api/smartphone-survey/sync',
  autoSyncOnReconnect: true,
  simulateOffline: false,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app_config');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app_config');
}
