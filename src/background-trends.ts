interface TrendsObject {
  timestamps: number[];
  [key: number]: string[];
}

export function setStorageByTrends(trendsObject: TrendsObject): void {
  chrome.storage.local.set({ trends: trendsObject }, () => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    }
  });
}