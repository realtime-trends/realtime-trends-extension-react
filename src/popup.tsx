/* global chrome */
import React, { useEffect } from 'react';
import './index.css';

interface Settings {
  naver: boolean;
  google: boolean;
}

const INITIAL_SETTINGS: Settings = {
  naver: true,
  google: true
}

export function getStorageBySettings(callback: Function) {
  chrome.storage.local.get('settings', function (items) {
    let cached = {};
    if (items.hasOwnProperty('settings')) {
      cached = items['settings'];
      callback(cached);
    } else {
      setStorageBySettings(INITIAL_SETTINGS);
      callback(INITIAL_SETTINGS);
    }  
  });
}

function setStorageBySettings(content: object) {
  chrome.storage.local.set({ settings: content }, function () {
    console.log('saved settings items');
  });
}

const Popup = () => {
  const [state, setState] = React.useState(INITIAL_SETTINGS);

  const handleChange = (event: {target: HTMLInputElement}) => {
    let changed = {
      ...state,
      [event.target.name]: event.target.checked,
    }
    setState(changed);
    setStorageBySettings(changed);
  };

  useEffect(() => {
    getStorageBySettings((settings: Settings) => {
      setState(settings);
    })
  }, []);

  return (
    <div>
      #실시간 검색어
      <div>
      <input type="checkbox"/>
      <input type="checkbox"/>
      </div>
    </div>
  );
}

export default Popup; 