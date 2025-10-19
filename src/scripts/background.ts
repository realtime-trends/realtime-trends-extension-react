/* eslint-disable no-console */
/* global chrome */
import { updateTrendsData } from '../services/trendsService';
import { getLatestTrends, getSettings, saveSettings } from '../utils/indexedDB';
import type { MessageRequest, MessageResponse } from '../services/messaging';

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

// 확장 프로그램 설치 또는 업데이트 시 실행
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('확장 프로그램이 설치되었습니다. 이유:', details.reason);

  // 사용자 ID 초기화 (로컬 저장용)
  const userId = await getUserId();
  console.log('현재 사용자 ID:', userId);

  // 초기 설정 생성
  const existingSettings = await getSettings();
  if (!existingSettings) {
    console.log('초기 설정 생성 중...');
    const INITIAL_SETTINGS = {
      naver: true,
      google: true,
      position: 'bottom-right' as const,
      bottomOffset: 80,
      sideOffset: 20,
      opacity: 30,
      allowClickBehindChart: false
    };
    await saveSettings(INITIAL_SETTINGS);
    console.log('초기 설정 생성 완료');
  }

  // 즉시 트렌드 데이터 크롤링 및 저장
  await updateTrendsFromSources();
});

/**
 * 다음 5분 단위 시간 계산 (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
 */
function getNext5MinuteTime(): number {
  const now = new Date();
  const minutes = now.getMinutes();

  // 현재 분을 5분 단위로 올림
  const nextMinute = Math.ceil((minutes + 1) / 5) * 5;

  // 다음 5분 단위 시간 계산
  const nextTime = new Date(now);
  nextTime.setMinutes(nextMinute);
  nextTime.setSeconds(0);
  nextTime.setMilliseconds(0);

  // 60분을 넘어가면 다음 시간으로
  if (nextMinute >= 60) {
    nextTime.setHours(nextTime.getHours() + 1);
    nextTime.setMinutes(0);
  }

  return nextTime.getTime();
}

/**
 * 현재 5분 단위 시간 키 생성 (예: "2024-01-15T10:05:00")
 */
function getCurrent5MinuteKey(): string {
  const now = new Date();
  const minutes = Math.floor(now.getMinutes() / 5) * 5;
  const roundedTime = new Date(now);
  roundedTime.setMinutes(minutes);
  roundedTime.setSeconds(0);
  roundedTime.setMilliseconds(0);
  return roundedTime.toISOString().slice(0, 16) + ':00';
}

/**
 * 트렌드 소스에서 직접 크롤링하여 IndexedDB에 저장
 * 중복 방지: 같은 5분 단위 시간에는 한 번만 업데이트
 */
async function updateTrendsFromSources(): Promise<void> {
  try {
    console.log('트렌드 크롤링 시작...');

    // 현재 5분 단위 시간 키
    const currentTimeKey = getCurrent5MinuteKey();
    console.log('현재 5분 단위 시간:', currentTimeKey);

    // 마지막 업데이트 시간 확인
    const lastTrends = await getLatestTrends();

    if (lastTrends) {
      const lastUpdateTime = new Date(lastTrends.updated).toISOString().slice(0, 16) + ':00';
      console.log('마지막 업데이트 시간:', lastUpdateTime);

      // 같은 5분 단위 시간이면 중복 업데이트 방지
      if (lastUpdateTime === currentTimeKey) {
        console.log('이미 이 시간대에 업데이트됨, 스킵');
        return;
      }
    }

    // 새로운 데이터 크롤링 및 저장
    const result = await updateTrendsData();

    if (result) {
      console.log('트렌드 데이터 업데이트 성공:', currentTimeKey);
    } else {
      console.warn('트렌드 데이터 업데이트 실패 (데이터 없음)');
    }
  } catch (error) {
    console.error('트렌드 업데이트 중 오류:', error);
  }
}

/**
 * 다음 5분 단위까지 알람 설정
 */
function scheduleNextUpdate(): void {
  const nextTime = getNext5MinuteTime();
  const now = Date.now();
  const delay = nextTime - now;

  const nextDate = new Date(nextTime);
  console.log(`다음 업데이트 예정: ${nextDate.toLocaleTimeString('ko-KR')} (${Math.round(delay / 1000)}초 후)`);

  chrome.alarms.create('updateTrends', {
    when: nextTime,
    periodInMinutes: 5,
  });
}

// 초기 알람 설정
scheduleNextUpdate();

// 알람 리스너
chrome.alarms.onAlarm.addListener(async (alarm: any) => {
  if (alarm.name === 'updateTrends') {
    if (chrome.runtime.lastError) {
      console.log({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      await updateTrendsFromSources();
    }
  }
});

// 메시지 리스너 (Content Script <-> Background)
chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
  console.log('Message received:', message);

  // 타입 체크
  if (!message || !message.type) {
    sendResponse({
      success: false,
      error: 'Invalid message format'
    });
    return true;
  }

  // async 함수이므로 Promise 반환
  (async () => {
    try {
      let response: MessageResponse;

      switch (message.type) {
        case 'GET_TRENDS':
          console.log('Getting trends from IndexedDB...');
          const trendsData = await getLatestTrends();
          console.log('Trends data:', trendsData);
          response = {
            success: true,
            data: trendsData
          };
          break;

        case 'GET_SETTINGS':
          console.log('Getting settings from IndexedDB...');
          let settings = await getSettings();

          // 설정이 없으면 기본 설정 생성
          if (!settings) {
            console.log('설정이 없음, 기본 설정 생성 중...');
            const INITIAL_SETTINGS = {
              naver: true,
              google: true,
              position: 'bottom-right' as const,
              bottomOffset: 80,
              sideOffset: 20,
              opacity: 30,
              allowClickBehindChart: false
            };
            await saveSettings(INITIAL_SETTINGS);
            settings = INITIAL_SETTINGS;
          } else {
            // 기존 설정에 새 필드 추가 (마이그레이션)
            if (settings.allowClickBehindChart === undefined) {
              settings.allowClickBehindChart = false;
              await saveSettings(settings);
              console.log('설정 마이그레이션: allowClickBehindChart 추가됨');
            }
          }

          console.log('Settings data:', settings);
          response = {
            success: true,
            data: settings
          };
          break;

        case 'SAVE_SETTINGS':
          console.log('Saving settings to IndexedDB...');
          await saveSettings(message.data);

          // 모든 탭에 설정 변경 알림
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'SETTINGS_CHANGED',
                  data: message.data
                }).catch(() => {
                  // 일부 탭에서 메시지를 받을 수 없을 수 있음 (무시)
                });
              }
            });
          });

          response = {
            success: true
          };
          break;

        default:
          response = {
            success: false,
            error: 'Unknown message type: ' + message.type
          };
      }

      console.log('Sending response:', response);
      sendResponse(response);
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();

  // async 응답을 위해 true 반환
  return true;
});
