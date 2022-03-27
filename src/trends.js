/* global chrome */
import axios from 'axios';

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

export function updateTrends(setTrends) {
  const trendsObejct = JSON.parse(localStorage.getItem("trends"));
  const latestTimeStamp = Math.max.apply(null, trendsObejct["timestamps"]);
  setTrends(trendsObejct[latestTimeStamp]);
}

export function getStandardTime(setStandardTime) {
  const trendsObejct = JSON.parse(localStorage.getItem("trends"));
  const latestTimeStamp = Math.max.apply(null, trendsObejct["timestamps"]);
  let standardTime = new Date(latestTimeStamp*1000);
  let year = standardTime.getFullYear();
  let month = ('0' + (standardTime.getMonth() + 1)).slice(-2);
  let day = ('0' + standardTime.getDate()).slice(-2);
  let hour = ('0' + standardTime.getHours()).slice(-2);
  let minute = ('0' + standardTime.getMinutes()).slice(-2);
  setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
}