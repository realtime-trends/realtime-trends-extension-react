/* eslint-disable no-console */
/* global chrome */
import { setStorageByTrends } from '../trends';

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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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

// 확장 프로그램 설치 또는 업데이트 시 실행
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('확장 프로그램이 설치되었습니다. 이유:', details.reason);
  
  // 사용자 ID 초기화
  const userId = await getUserId();
  console.log('현재 사용자 ID:', userId);
  
  // 트렌드 데이터 저장
  await saveTrendsInStorage();
});

// 확장 프로그램 아이콘 클릭 시 쿼리 페이지 열기
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'queries.html' });
});
