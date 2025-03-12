/* eslint-disable no-console */
/* global chrome */
import { SearchQuery, SearchQueriesStorage } from './types/searchQueries';
import { extractKeywords } from './utils/keywordExtractor';

// 크롬 타입 정의
declare namespace chrome {
  export interface Runtime {
    lastError?: { message?: string };
    onInstalled: {
      addListener: (callback: (details: { reason: string; previousVersion?: string; id?: string }) => void) => void;
    };
    sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;
  }

  export interface Storage {
    sync: {
      get(keys: string | string[] | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
    };
    local: {
      get(keys: string | string[] | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
    };
  }

  export const runtime: Runtime;
  export const storage: Storage;
}

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

// 키워드 API에 쿼리 전송하기
async function sendQueryToAPI(query: string): Promise<void> {
  try {
    // 메시지 전송을 통해 백그라운드 스크립트의 함수 호출
    chrome.runtime.sendMessage({
      action: 'sendQueryToKeywordsAPI',
      query: query
    }, (response: { success: boolean; data?: any; error?: string }) => {
      if (chrome.runtime.lastError) {
        console.error('메시지 전송 오류:', chrome.runtime.lastError);
      } else {
        console.log('API 응답:', response);
      }
    });
  } catch (error) {
    console.error('API 요청 오류:', error);
  }
}

// 새 검색 쿼리 추가하기
export async function addSearchQuery(query: string, engine: 'google' | 'naver'): Promise<void> {
  // 검색어에서 키워드 추출
  const keywords = await extractKeywords(query);
  
  // 키워드 API에 쿼리 전송
  await sendQueryToAPI(query);
  
  getStorageBySearchQueries((queriesObject) => {
    const newQuery: SearchQuery = {
      query,
      engine,
      timestamp: Math.floor(Date.now() / 1000),
      keywords: keywords
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
      console.log(`검색 쿼리 저장됨: ${query} (${engine}), 키워드: ${keywords.join(', ')}`);
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

// 모든 키워드 가져오기
export async function getAllKeywords(): Promise<string[]> {
  return new Promise((resolve) => {
    getStorageBySearchQueries((queriesObject) => {
      const allKeywords: string[] = [];
      
      // 모든 쿼리에서 키워드 추출
      queriesObject.queries.forEach((query) => {
        if (query.keywords && Array.isArray(query.keywords)) {
          allKeywords.push(...query.keywords);
        }
      });
      
      // 중복 제거 (Set 대신 Array.filter 사용)
      const uniqueKeywords = allKeywords.filter(
        (keyword, index, self) => self.indexOf(keyword) === index
      );
      
      resolve(uniqueKeywords);
    });
  });
}

// 키워드로 쿼리 필터링
export async function filterQueriesByKeyword(keyword: string): Promise<SearchQuery[]> {
  return new Promise((resolve) => {
    getStorageBySearchQueries((queriesObject) => {
      const filteredQueries = queriesObject.queries.filter((query) => 
        query.keywords && query.keywords.includes(keyword)
      );
      
      resolve(filteredQueries);
    });
  });
}
