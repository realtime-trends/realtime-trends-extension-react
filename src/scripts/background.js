/* global chrome */
import axios from 'axios';

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

async function saveJsonfileinLocal() {
    await axios.get(
        "https://raw.githubusercontent.com/hoyaaaa/realtime-trends-data/main/trends.json"
      )
      .then((res) => {
        localStorage.setItem('trends', JSON.stringify(res.data);
      }
}

chrome.alarms.create('saveJsonfileinLocal', {
    when: 1000,
    periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(async function() {
    await saveJsonfileinLocal();
});