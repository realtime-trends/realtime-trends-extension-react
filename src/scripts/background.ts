/* eslint-disable no-console */
/* global chrome */
import { setStorageByTrends } from '../trends';

// 크롬 타입 정의
declare namespace chrome {
  export interface Runtime {
    lastError?: { message?: string };
    onInstalled: {
      addListener: (callback: (details: { reason: string; previousVersion?: string; id?: string }) => void) => void;
    };
    onMessage: {
      addListener: (
        callback: (
          message: any,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void
      ) => void;
    };
    getURL(path: string): string;
    sendMessage(message: any, responseCallback?: (response: any) => void): void;
  }

  export namespace runtime {
    export interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }
  }

  export interface Tabs {
    create(createProperties: { url: string }): void;
  }

  export namespace tabs {
    export interface Tab {
      id?: number;
      url?: string;
    }
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

  export interface Alarms {
    create(name: string, alarmInfo: { when?: number; periodInMinutes?: number }): void;
    onAlarm: {
      addListener: (callback: () => void) => void;
    };
  }

  export interface Action {
    onClicked: {
      addListener: (callback: () => void) => void;
    };
  }

  export const runtime: Runtime;
  export const tabs: Tabs;
  export const storage: Storage;
  export const alarms: Alarms;
  export const action: Action;
}

// 크롬 메시지 인터페이스 정의
interface ChromeMessage {
  action: string;
  query?: string;
  [key: string]: any;
}

// 크롬 메시지 응답 인터페이스 정의
interface ChromeMessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// @ts-ignore: 브라우저 환경에서의 오류 핸들러 타입 문제
self.onerror = (errorMsg, url, lineNumber, column, errorObj) => {
  console.error('Caught background script error');
  console.error(`errorMsg: ${errorMsg}`);
  console.error(`url: ${url}`);
  console.error(`lineNumber: ${lineNumber}`);
  console.error(`column: ${column}`);
  console.error('errorObj follows:');
  console.error(errorObj);
  return true;
};

// UUID v4 생성 함수
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 사용자 ID 가져오기 또는 생성하기
async function getUserId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userId'], (result) => {
      if (result.userId) {
        // 기존 사용자 ID가 있으면 그대로 사용
        console.log('기존 사용자 ID 사용:', result.userId);
        resolve(result.userId);
      } else {
        // 새 사용자 ID 생성 및 저장
        const newUserId = generateUUID();
        chrome.storage.sync.set({ userId: newUserId }, () => {
          console.log('새 사용자 ID가 생성되었습니다:', newUserId);
          resolve(newUserId);
        });
      }
    });
  });
}

// 서버 설정 가져오기
async function getServerConfig(): Promise<{ server_endpoint: string } | null> {
  try {
    const response = await fetch('https://realtime-trends.github.io/realtime-trends-data/config.json');
    if (!response.ok) {
      console.error('서버 설정을 가져오는데 실패했습니다. 상태 코드:', response.status);
      return null;
    }
    const data = await response.json();
    if (!data.server_endpoint) {
      console.error('서버 설정에 server_endpoint가 없습니다:', data);
      return null;
    }
    return data;
  } catch (error) {
    console.error('서버 설정 가져오기 오류:', error);
    return null;
  }
}

// 액세스 토큰 가져오기
async function getAccessToken(userId: string): Promise<string | null> {
  try {
    const config = await getServerConfig();
    if (!config || !config.server_endpoint) {
      console.error('서버 설정을 가져올 수 없어 토큰 요청을 건너뜁니다.');
      return null;
    }

    const tokenUrl = `${config.server_endpoint}/api/token?user_id=${userId}`;
    console.log('토큰 요청 URL:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      console.error(`토큰 요청 실패: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data.access_token) {
      console.error('응답에 액세스 토큰이 없습니다');
      return null;
    }

    // 토큰을 로컬 스토리지에 저장
    chrome.storage.local.set({ access_token: data.access_token }, () => {
      console.log('액세스 토큰이 저장되었습니다');
    });

    return data.access_token;
  } catch (error) {
    console.error('액세스 토큰 가져오기 오류:', error);
    return null;
  }
}

// 저장된 액세스 토큰 가져오기
async function getSavedAccessToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['access_token'], (result) => {
      if (result.access_token) {
        resolve(result.access_token);
      } else {
        resolve(null);
      }
    });
  });
}

// 키워드 API에 쿼리 전송하기
async function sendQueryToKeywordsAPI(query: string): Promise<any> {
  let retryCount = 0;
  const MAX_RETRIES = 3;

  async function attemptSendQuery(): Promise<any> {
    try {
      // 서버 설정 가져오기
      const config = await getServerConfig();
      if (!config || !config.server_endpoint) {
        console.error('서버 설정을 가져올 수 없어 쿼리 전송을 건너뜁니다.');
        return null;
      }

      // 액세스 토큰 가져오기
      let accessToken = await getSavedAccessToken();
      if (!accessToken) {
        // 토큰이 없으면 사용자 ID로 새로 요청
        const userId = await getUserId();
        accessToken = await getAccessToken(userId);
        if (!accessToken) {
          console.error('액세스 토큰을 가져올 수 없어 쿼리 전송을 건너뜁니다.');
          return null;
        }
      }

      const keywordsUrl = `${config.server_endpoint}/api/keywords`;
      console.log('키워드 API 요청 URL:', keywordsUrl);

      const response = await fetch(keywordsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query })
      });

      if (response.status === 401) {
        // 401 Unauthorized 오류 - 토큰 만료 또는 유효하지 않음
        if (retryCount < MAX_RETRIES) {
          console.log(`토큰 인증 오류, 새 토큰 요청 중... (재시도 ${retryCount + 1}/${MAX_RETRIES})`);
          retryCount++;

          // 새 토큰 요청
          const userId = await getUserId();
          const newToken = await getAccessToken(userId);
          if (!newToken) {
            console.error('새 액세스 토큰을 가져올 수 없어 쿼리 전송을 건너뜁니다.');
            return null;
          }

          // 재시도
          return attemptSendQuery();
        } else {
          console.error(`최대 재시도 횟수(${MAX_RETRIES})를 초과했습니다. 쿼리 전송을 중단합니다.`);
          return null;
        }
      }

      if (!response.ok) {
        console.error(`키워드 API 요청 실패: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('키워드 API 요청 오류:', error);
      return null;
    }
  }

  return attemptSendQuery();
}

// 전역 객체에 함수 노출
// @ts-ignore: 전역 객체에 함수 추가
self.sendQueryToKeywordsAPI = sendQueryToKeywordsAPI;

// 메시지 리스너 추가
chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: ChromeMessageResponse) => void) => {
    if (message.action === 'sendQueryToKeywordsAPI' && message.query) {
      // 비동기 함수 호출 및 응답 처리
      sendQueryToKeywordsAPI(message.query)
        .then(result => {
          sendResponse({ success: !!result, data: result });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });

      // 비동기 응답을 위해 true 반환
      return true;
    }
    return false;
  }
);

// 확장 프로그램 설치 또는 업데이트 시 실행
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('확장 프로그램이 설치되었습니다. 이유:', details.reason);

  // 사용자 ID 초기화
  const userId = await getUserId();
  console.log('현재 사용자 ID:', userId);

  // 액세스 토큰 가져오기
  const accessToken = await getAccessToken(userId);
  if (accessToken) {
    console.log('액세스 토큰 획득 성공');
  } else {
    console.warn('액세스 토큰 획득 실패');
  }

  // 트렌드 데이터 저장
  await saveTrendsInStorage();
});

async function saveTrendsInStorage(): Promise<void> {
  const response = await fetch(
    'https://realtime-trends.github.io/realtime-trends-data/trends.json', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  }).catch((error) => {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
    console.error(error.config);
    throw error;
  });

  const json = await response.json();
  setStorageByTrends(json);
}

chrome.alarms.create('saveTrendsInStorage', {
  when: 1000,
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener(async () => {
  if (chrome.runtime.lastError) {
    console.log({
      status: 'error',
      msg: chrome.runtime.lastError,
    });
  } else {
    await saveTrendsInStorage();
  }
});

// 확장 프로그램 아이콘 클릭 시 쿼리 페이지 열기
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'queries.html' });
});
