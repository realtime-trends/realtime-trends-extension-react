/* eslint-disable no-console */
/* eslint-disable no-prototype-builtins */
/* global chrome */
import axios from 'axios';

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

function getStorageByTrends(callback) {
  chrome.storage.local.get('trends', (items) => {
    let trendsObejct = {};
    if (items.hasOwnProperty('trends')) {
      trendsObejct = items.trends;
    }
    callback(trendsObejct);
  });
}

export function setStorageByTrends(trendsObejct) {
  chrome.storage.local.set({ trends: trendsObejct }, () => {
    console.log('saved trends');
  });
}

export function updateTrends(setTrends) {
  getStorageByTrends((trendsObejct) => {
    const latestTimeStamp = Math.max.apply(null, trendsObejct.timestamps);
    setTrends(trendsObejct[latestTimeStamp]);
  });
}

export function getStandardTime(setStandardTime) {
  getStorageByTrends((trendsObejct) => {
    const latestTimeStamp = Math.max.apply(null, trendsObejct.timestamps);
    const standardTime = new Date(latestTimeStamp * 1000);
    const year = standardTime.getFullYear();
    const month = (`0${standardTime.getMonth() + 1}`).slice(-2);
    const day = (`0${standardTime.getDate()}`).slice(-2);
    const hour = (`0${standardTime.getHours()}`).slice(-2);
    const minute = (`0${standardTime.getMinutes()}`).slice(-2);
    setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
  });
}
