/* eslint-disable no-console */
/* global chrome */
import axios from 'axios';
import { setStorageByTrends } from '../trends';

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
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log('Error', error.message);
    }
    console.log(error.config);
  });
}

chrome.alarms.create('saveTrendsInStorage', {
  when: 1000,
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener(async () => {
  await saveTrendsInStorage();
});
