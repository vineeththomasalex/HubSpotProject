import { StorageData } from '../types';

/**
 * Get data from chrome.storage.sync
 */
export async function getStorageData(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['hubspotToken', 'openaiKey'], (result) => {
      resolve({
        hubspotToken: result.hubspotToken,
        openaiKey: result.openaiKey,
      });
    });
  });
}

/**
 * Save data to chrome.storage.sync
 */
export async function saveStorageData(data: Partial<StorageData>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}

/**
 * Clear all storage data
 */
export async function clearStorageData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(() => {
      resolve();
    });
  });
}
