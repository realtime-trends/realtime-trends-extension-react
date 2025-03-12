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
