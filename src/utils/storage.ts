import { StorageData } from '../types';

/**
 * Get data from chrome.storage.local (persists across extension reloads)
 */
export async function getStorageData(): Promise<StorageData> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(['hubspotToken', 'openaiKey'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting storage data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        console.log('Retrieved storage data:', {
          hasHubSpotToken: !!result.hubspotToken,
          hasOpenAIKey: !!result.openaiKey,
        });
        resolve({
          hubspotToken: result.hubspotToken,
          openaiKey: result.openaiKey,
        });
      });
    } catch (error) {
      console.error('Exception in getStorageData:', error);
      reject(error);
    }
  });
}

/**
 * Save data to chrome.storage.local (persists across extension reloads)
 */
export async function saveStorageData(data: Partial<StorageData>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving storage data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        console.log('Saved storage data successfully:', {
          hasHubSpotToken: !!data.hubspotToken,
          hasOpenAIKey: !!data.openaiKey,
        });
        resolve();
      });
    } catch (error) {
      console.error('Exception in saveStorageData:', error);
      reject(error);
    }
  });
}

/**
 * Clear all storage data
 */
export async function clearStorageData(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing storage data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        console.log('Cleared storage data successfully');
        resolve();
      });
    } catch (error) {
      console.error('Exception in clearStorageData:', error);
      reject(error);
    }
  });
}
