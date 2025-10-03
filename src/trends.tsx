import React from 'react';

interface TrendsObject {
  timestamps: number[];
  [key: number]: string[];
}

export interface TrendItem {
  keyword: string;
  delta: number;
}

function getStorageByTrends(callback: (trendsObject: TrendsObject) => void): void {
  chrome.storage.local.get('trends', (items) => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      let trendsObject: TrendsObject = { timestamps: [] };
      console.log(items);
      if (items.hasOwnProperty('trends')) {
        trendsObject = items.trends as TrendsObject;
      }
      callback(trendsObject);
    }
  });
}

export function setStorageByTrends(trendsObject: TrendsObject): void {
  chrome.storage.local.set({ trends: trendsObject }, () => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    }
  });
}

export function updateTrends(setTrends: React.Dispatch<React.SetStateAction<TrendItem[]>>): void {
  getStorageByTrends((trendsObject) => {
    const latestTimeStamp = Math.max.apply(null, trendsObject.timestamps);
    const keywords = trendsObject[latestTimeStamp];
    
    // 디버깅을 위한 콘솔 로그 추가
    console.log('keywords 배열:', keywords);
    
    // 키워드 배열을 TrendItem 배열로 변환
    const trendItems: TrendItem[] = [];
    
    if (Array.isArray(keywords)) {
      keywords.forEach((keyword, index) => {
        // 키워드가 문자열인지 확인
        let keywordStr = `키워드${index+1}`;
        
        if (typeof keyword === 'string') {
          keywordStr = keyword;
        } else if (keyword && typeof keyword === 'object') {
          const keywordObj = keyword as { keyword?: string };
          if ('keyword' in keywordObj && typeof keywordObj.keyword === 'string') {
            keywordStr = keywordObj.keyword;
          }
        }
        
        // 임의로 delta 값을 설정합니다
        const delta = Math.floor(Math.random() * 10) - 5; // -5에서 4 사이의 임의의 값
        trendItems.push({ keyword: keywordStr, delta });
      });
    }
    
    console.log('생성된 trendItems:', trendItems);
    setTrends(trendItems);
  });
}

export function getStandardTime(setStandardTime: (time: string) => void): void {
  getStorageByTrends((trendsObject) => {
    const latestTimeStamp = Math.max.apply(null, trendsObject.timestamps);
    const standardTime = new Date(latestTimeStamp * 1000);
    const year = standardTime.getFullYear();
    const month = (`0${standardTime.getMonth() + 1}`).slice(-2);
    const day = (`0${standardTime.getDate()}`).slice(-2);
    const hour = (`0${standardTime.getHours()}`).slice(-2);
    const minute = (`0${standardTime.getMinutes()}`).slice(-2);
    setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
  });
}
