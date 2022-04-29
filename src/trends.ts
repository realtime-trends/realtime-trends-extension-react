/* global chrome */
import axios from 'axios';
import Trend from './models/trend'

interface TrendsObject {
  timestamps: number[];
  [timestamp: number]: Trend
}

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

function getStorageByTrends(callback: Function) {
  chrome.storage.local.get('trends', function (items) {
    let trendsObejct = {};
    if (items.hasOwnProperty('trends')) {
      trendsObejct = items['trends'];
    }
    callback(trendsObejct);
  });
}

export function setStorageByTrends(trendsObejct: TrendsObject) {
  chrome.storage.local.set({ 'trends': trendsObejct }, function () {
    console.log('saved trends');
  });
}

export function updateTrends(setTrends: Function) {
  getStorageByTrends((trendsObejct: TrendsObject) => {
    const latestTimeStamp = Math.max.apply(null, trendsObejct.timestamps);
    setTrends(trendsObejct[latestTimeStamp]);
  });  
}

export function getStandardTime(setStandardTime: Function) {
  getStorageByTrends((trendsObejct: TrendsObject) => {
    const latestTimeStamp = Math.max.apply(null, trendsObejct["timestamps"]);
    let standardTime = new Date(latestTimeStamp*1000);
    let year = standardTime.getFullYear();
    let month = ('0' + (standardTime.getMonth() + 1)).slice(-2);
    let day = ('0' + standardTime.getDate()).slice(-2);
    let hour = ('0' + standardTime.getHours()).slice(-2);
    let minute = ('0' + standardTime.getMinutes()).slice(-2);
    setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
  });
}