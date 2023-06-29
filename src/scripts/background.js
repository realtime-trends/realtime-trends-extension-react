/* eslint-disable no-console */
/* global chrome */
import axios from 'axios';
import { setStorageByTrends } from '../trends';

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

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

async function saveTrendsInStorage() {
  await axios.get(
    'https://raw.githubusercontent.com/realtime-trends/realtime-trends-data/data/trends.json',
  ).then((res) => {
    setStorageByTrends(res.data);
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
  });
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
