/* global chrome */
import axios from 'axios';

axios.defaults.headers = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

export function updateTrends(setTrends) {
  axios.get(
        "https://raw.githubusercontent.com/hoyaaaa/realtime-trends-data/main/trends.json"
      )
      .then((res) => {
        const latestTimeStamp = Math.max.apply(null, res.data["timestamps"]);
        setTrends(res.data[latestTimeStamp]);
      });
}

export function getStandardTime(setStandardTime) {
  axios.get(
    "https://raw.githubusercontent.com/hoyaaaa/realtime-trends-data/main/trends.json"
  )
  .then((res) => {
    const latestTimeStamp = Math.max.apply(null, res.data["timestamps"]);
    let standardTime = new Date(latestTimeStamp*1000);
    let year = standardTime.getFullYear();
    let month = ('0' + (standardTime.getMonth() + 1)).slice(-2);
    let day = ('0' + standardTime.getDate()).slice(-2);
    let hour = ('0' + standardTime.getHours()).slice(-2);
    let minute = ('0' + standardTime.getMinutes()).slice(-2);
    setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
  });
}