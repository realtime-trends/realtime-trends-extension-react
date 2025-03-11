// Chrome API 타입 정의
interface Chrome {
  storage: {
    local: {
      get: (key: string, callback: (items: any) => void) => void;
      set: (items: object, callback?: () => void) => void;
    };
  };
  runtime: {
    lastError?: {
      message?: string;
    };
  };
  alarms: {
    create: (name: string, alarmInfo: {
      when?: number;
      delayInMinutes?: number;
      periodInMinutes?: number;
    }) => void;
    onAlarm: {
      addListener: (callback: () => void) => void;
    };
  };
  action: {
    onClicked: {
      addListener: (callback: () => void) => void;
    };
  };
  tabs: {
    create: (createProperties: { url: string }) => void;
  };
}

declare global {
  interface Window {
    chrome: Chrome;
  }
  var chrome: Chrome;
  var self: Window & typeof globalThis;
}

export {};
