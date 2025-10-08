/* eslint-disable no-console */
/* global chrome */
import { setStorageByTrends } from '../background-trends';

import type { ChromeMessage, ChromeMessageResponse, MessageSender } from '../types/chrome-extension';

// Service Worker에서의 전역 오류 핸들러
(self as any).onerror = (errorMsg: string | Event, url?: string, lineNumber?: number, column?: number, errorObj?: Error) => {
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
    chrome.storage.sync.get('userId', (result) => {
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

// 트렌드 데이터는 공개 읽기만 하므로 별도 인증 불필요

// 키워드 API 관련 기능은 현재 사용하지 않음
// 필요시 나중에 GitHub 기반으로 재구현 가능

// 메시지 리스너는 필요시 나중에 추가

// 확장 프로그램 설치 또는 업데이트 시 실행
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('확장 프로그램이 설치되었습니다. 이유:', details.reason);

  // 사용자 ID 초기화 (로컬 저장용)
  const userId = await getUserId();
  console.log('현재 사용자 ID:', userId);

  // GitHub에서 트렌드 데이터 로드
  await saveTrendsInStorage();
});

async function saveTrendsInStorage(): Promise<void> {
  try {
    // GitHub에서 트렌드 데이터 가져오기
    await setStorageByTrends();
    console.log('GitHub에서 트렌드 데이터를 성공적으로 가져왔습니다');
  } catch (error) {
    console.error('GitHub에서 트렌드 데이터 가져오기 실패:', error);
  }
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
