/**
 * Background Worker <-> Content Script 메시징
 * Content Script는 IndexedDB에 직접 접근할 수 없으므로
 * Background Worker를 통해 데이터를 가져옴
 */

import type { TrendsData, SettingsState } from '../utils/indexedDB';

export type MessageType = 'GET_TRENDS' | 'GET_SETTINGS' | 'SAVE_SETTINGS';

export interface MessageRequest {
  type: MessageType;
  data?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Background Worker에 메시지 전송
 */
export async function sendMessageToBackground(message: MessageRequest): Promise<MessageResponse> {
  return new Promise((resolve) => {
    try {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.error('chrome.runtime.sendMessage is not available');
        resolve({
          success: false,
          error: 'chrome.runtime.sendMessage is not available'
        });
        return;
      }

      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || '';
          if (errorMsg.includes('Extension context invalidated')) {
            console.log('🔄 확장 프로그램이 업데이트되었습니다. 페이지를 새로고침(F5)해주세요.');
          } else {
            console.error('Message send error:', chrome.runtime.lastError);
          }
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '';
      if (errorMsg.includes('Extension context invalidated')) {
        console.log('🔄 확장 프로그램이 업데이트되었습니다. 페이지를 새로고침(F5)해주세요.');
      } else {
        console.error('Exception in sendMessageToBackground:', error);
      }
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Content Script에서 트렌드 가져오기
 */
export async function getTrendsFromBackground(): Promise<TrendsData | null> {
  const response = await sendMessageToBackground({ type: 'GET_TRENDS' });
  if (response.success && response.data) {
    return response.data as TrendsData;
  }
  return null;
}

/**
 * Content Script에서 설정 가져오기
 */
export async function getSettingsFromBackground(): Promise<SettingsState | null> {
  const response = await sendMessageToBackground({ type: 'GET_SETTINGS' });
  if (response.success && response.data) {
    return response.data as SettingsState;
  }
  return null;
}

/**
 * Content Script에서 설정 저장
 */
export async function saveSettingsToBackground(settings: SettingsState): Promise<boolean> {
  const response = await sendMessageToBackground({
    type: 'SAVE_SETTINGS',
    data: settings
  });
  return response.success;
}
