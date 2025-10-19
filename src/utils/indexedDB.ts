/**
 * IndexedDB 유틸리티
 * Chrome Storage를 대체하여 더 많은 데이터를 저장하고 빠르게 접근
 */

import type { TrendEntry } from '../services/trendsCrawler';

const DB_NAME = 'TrendsExtensionDB';
const DB_VERSION = 1;
const TRENDS_STORE = 'trends';
const SETTINGS_STORE = 'settings';

export interface TrendsData {
  timestamp: number;
  trends: TrendEntry[];
  updated: string;
}

export interface SettingsState {
  naver: boolean;
  google: boolean;
  position: 'bottom-left' | 'bottom-right';
  bottomOffset: number;
  sideOffset: number;
  opacity: number;
  allowClickBehindChart: boolean; // 차트 뒤의 버튼 클릭 가능
  [key: string]: boolean | string | number;
}

/**
 * IndexedDB 초기화 및 연결
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB 열기 실패:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Trends Object Store 생성
      if (!db.objectStoreNames.contains(TRENDS_STORE)) {
        const trendsStore = db.createObjectStore(TRENDS_STORE, { keyPath: 'timestamp' });
        trendsStore.createIndex('updated', 'updated', { unique: false });
        console.log('Trends Object Store 생성됨');
      }

      // Settings Object Store 생성
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        console.log('Settings Object Store 생성됨');
      }
    };
  });
}

/**
 * 최신 Trends 데이터 저장
 */
export async function saveLatestTrends(trendsData: TrendsData): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRENDS_STORE], 'readwrite');
    const store = transaction.objectStore(TRENDS_STORE);

    // 새 데이터 저장
    const request = store.put(trendsData);

    request.onsuccess = () => {
      console.log(`Trends 데이터 저장 완료 (timestamp: ${trendsData.timestamp})`);
    };

    request.onerror = () => {
      console.error('Trends 데이터 저장 실패:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      // 오래된 데이터 정리 (최근 24시간만 유지 = 288개, 5분 간격 기준)
      cleanOldTrends(db, 288).then(() => {
        db.close();
        resolve();
      }).catch((err) => {
        db.close();
        reject(err);
      });
    };

    transaction.onerror = () => {
      console.error('Trends 저장 트랜잭션 실패:', transaction.error);
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * 오래된 트렌드 데이터 정리
 */
async function cleanOldTrends(db: IDBDatabase, keepCount: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRENDS_STORE], 'readwrite');
    const store = transaction.objectStore(TRENDS_STORE);
    const request = store.openCursor(null, 'prev'); // 최신순으로 정렬

    let count = 0;
    const toDelete: number[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        count++;
        if (count > keepCount) {
          toDelete.push(cursor.value.timestamp);
        }
        cursor.continue();
      } else {
        // 모든 커서 순회 완료, 삭제 실행
        toDelete.forEach(timestamp => {
          store.delete(timestamp);
        });
        if (toDelete.length > 0) {
          console.log(`${toDelete.length}개의 오래된 트렌드 데이터 삭제됨`);
        }
      }
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * 최신 Trends 데이터 읽기
 */
export async function getLatestTrends(): Promise<TrendsData | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRENDS_STORE], 'readonly');
    const store = transaction.objectStore(TRENDS_STORE);

    // 최신 데이터 가져오기 (timestamp가 가장 큰 것)
    const request = store.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      db.close();

      if (cursor) {
        resolve(cursor.value as TrendsData);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('Latest Trends 읽기 실패:', request.error);
      db.close();
      reject(request.error);
    };
  });
}

/**
 * 이전 Trends 데이터 읽기 (delta 계산용)
 */
export async function getPreviousTrends(): Promise<TrendsData | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRENDS_STORE], 'readonly');
    const store = transaction.objectStore(TRENDS_STORE);

    // 두 번째로 최신 데이터 가져오기
    const request = store.openCursor(null, 'prev');
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        count++;
        if (count === 2) {
          // 두 번째 데이터
          db.close();
          resolve(cursor.value as TrendsData);
        } else {
          cursor.continue();
        }
      } else {
        // 두 번째 데이터가 없음
        db.close();
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('Previous Trends 읽기 실패:', request.error);
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Settings 데이터 저장
 */
export async function saveSettings(settings: SettingsState): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);

    const data = {
      id: 'settings',
      data: settings,
      updatedAt: Date.now()
    };

    const request = store.put(data);

    request.onsuccess = () => {
      console.log('Settings 저장 완료');
    };

    request.onerror = () => {
      console.error('Settings 저장 실패:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
      // 설정 변경 알림
      notifySettingsChange(settings);
      resolve();
    };

    transaction.onerror = () => {
      console.error('Settings 저장 트랜잭션 실패:', transaction.error);
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Settings 데이터 읽기
 */
export async function getSettings(): Promise<SettingsState | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get('settings');

    request.onsuccess = () => {
      db.close();
      if (request.result) {
        resolve(request.result.data);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('Settings 읽기 실패:', request.error);
      db.close();
      reject(request.error);
    };
  });
}

/**
 * 이벤트 리스너 등록 (설정 변경 감지)
 * IndexedDB는 Chrome Storage처럼 onChanged 이벤트가 없으므로
 * BroadcastChannel을 사용하여 변경사항 전파
 */
export function notifySettingsChange(settings: SettingsState): void {
  try {
    const channel = new BroadcastChannel('settings-channel');
    channel.postMessage({ type: 'settings-changed', settings });
    channel.close();
  } catch (error) {
    console.error('Settings 변경 알림 실패:', error);
  }
}

export function onSettingsChange(callback: (settings: SettingsState) => void): () => void {
  const channel = new BroadcastChannel('settings-channel');

  const handler = (event: MessageEvent) => {
    if (event.data.type === 'settings-changed') {
      callback(event.data.settings);
    }
  };

  channel.addEventListener('message', handler);

  // cleanup 함수 반환
  return () => {
    channel.removeEventListener('message', handler);
    channel.close();
  };
}

/**
 * Trends 변경 알림
 */
export function notifyTrendsChange(trendsData: TrendsData): void {
  try {
    const channel = new BroadcastChannel('trends-channel');
    channel.postMessage({ type: 'trends-changed', trendsData });
    channel.close();
  } catch (error) {
    console.error('Trends 변경 알림 실패:', error);
  }
}

export function onTrendsChange(callback: (trendsData: TrendsData) => void): () => void {
  const channel = new BroadcastChannel('trends-channel');

  const handler = (event: MessageEvent) => {
    if (event.data.type === 'trends-changed') {
      callback(event.data.trendsData);
    }
  };

  channel.addEventListener('message', handler);

  // cleanup 함수 반환
  return () => {
    channel.removeEventListener('message', handler);
    channel.close();
  };
}
