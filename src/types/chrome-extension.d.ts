// Chrome Extension API 타입 정의
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
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void
      ) => void;
    };
    getURL(path: string): string;
    sendMessage(
      message: any,
      responseCallback?: (response: any) => void
    ): void;
  }

  export interface MessageSender {
    tab?: Tab;
    frameId?: number;
    id?: string;
    url?: string;
    tlsChannelId?: string;
  }

  export interface Tab {
    id?: number;
    url?: string;
  }

  export interface Tabs {
    create(createProperties: { url: string }): void;
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

// Chrome 메시지 타입 정의
export interface ChromeMessage {
  action: string;
  query?: string;
  [key: string]: any;
}

export interface ChromeMessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Chrome namespace에서 타입들을 export
export type MessageSender = chrome.MessageSender;
export type Tab = chrome.Tab;

// Service Worker와 Window 전역 타입 확장
declare global {
  interface ServiceWorkerGlobalScope {
    sendQueryToKeywordsAPI?: (query: string) => Promise<any>;
  }
  
  interface Window {
    onerror: (
      errorMsg: string | Event,
      url?: string,
      lineNumber?: number,
      column?: number,
      errorObj?: Error
    ) => boolean;
  }

  // Chrome Extension Global 타입
  const chrome: {
    runtime: chrome.Runtime;
    storage: chrome.Storage;
    tabs: chrome.Tabs;
    alarms: chrome.Alarms;
    action: chrome.Action;
  };
}