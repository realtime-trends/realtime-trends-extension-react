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
  });
}

chrome.alarms.create('saveTrendsInStorage', {
  when: 1000,
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener(async () => {
  await saveTrendsInStorage();
});
