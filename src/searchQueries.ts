/* eslint-disable no-console */
/* global chrome */
import { SearchQuery, SearchQueriesStorage } from './types/searchQueries';

// 저장된 검색 쿼리 가져오기
export function getStorageBySearchQueries(
  callback: (queriesObject: SearchQueriesStorage) => void
): void {
  chrome.storage.local.get('searchQueries', (items) => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      let queriesObject: SearchQueriesStorage = { queries: [] };
      // eslint-disable-next-line no-prototype-builtins
      if (items.hasOwnProperty('searchQueries')) {
        queriesObject = items.searchQueries as SearchQueriesStorage;
      }
      callback(queriesObject);
    }
  });
}

// 검색 쿼리 저장하기
export function setStorageBySearchQueries(queriesObject: SearchQueriesStorage): void {
  chrome.storage.local.set({ searchQueries: queriesObject }, () => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      console.log('검색 쿼리가 성공적으로 저장되었습니다.');
    }
  });
}

// 새 검색 쿼리 추가하기
export function addSearchQuery(query: string, engine: 'google' | 'naver'): void {
  getStorageBySearchQueries((queriesObject) => {
    const newQuery: SearchQuery = {
      query,
      engine,
      timestamp: Math.floor(Date.now() / 1000),
    };
    
    // 중복 검색어 방지 (같은 쿼리와 엔진으로 최근 10분 이내에 검색한 경우)
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
    const isDuplicate = queriesObject.queries.some(
      (q) => q.query === query && q.engine === engine && q.timestamp > tenMinutesAgo
    );
    
    if (!isDuplicate) {
      const updatedQueries = {
        queries: [...queriesObject.queries, newQuery],
      };
      setStorageBySearchQueries(updatedQueries);
      console.log(`검색 쿼리 저장됨: ${query} (${engine})`);
    }
  });
}

// 검색 쿼리를 JSON 파일로 내보내기
export function exportSearchQueriesToJSON(): Promise<string> {
  return new Promise<string>((resolve) => {
    getStorageBySearchQueries((queriesObject) => {
      const jsonString = JSON.stringify(queriesObject, null, 2);
      resolve(jsonString);
    });
  });
}
