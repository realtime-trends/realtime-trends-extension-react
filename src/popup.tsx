/* eslint-disable no-console */
/* eslint-disable no-prototype-builtins */
/* global chrome */
import React, { useEffect, ChangeEvent } from 'react';
import './index.css';

interface SettingsState {
  naver: boolean;
  google: boolean;
  [key: string]: boolean;
}

const INITIAL_STATE: SettingsState = {
  naver: true,
  google: true,
};

function setStorageBySettings(content: SettingsState): void {
  chrome.storage.local.set({ settings: content }, () => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      console.log({
        status: 'success',
        msg: 'save settings items',
      });
    }
  });
}

export function getStorageBySettings(callback: (settings: SettingsState) => void): void {
  chrome.storage.local.get('settings', (items) => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      let cached: SettingsState = {} as SettingsState;
      if (items.hasOwnProperty('settings')) {
        cached = items.settings as SettingsState;
        callback(cached);
      } else {
        setStorageBySettings(INITIAL_STATE);
        callback(INITIAL_STATE);
      }
    }
  });
}

interface ColorSwitchProps {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  switchColor: string;
  label: string;
}

const ColorSwitch: React.FC<ColorSwitchProps> = ({ checked, onChange, name, switchColor, label }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="relative">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <label
        htmlFor={name}
        className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-opacity-100' : 'bg-gray-300'
        }`}
        style={{ backgroundColor: checked ? switchColor : undefined }}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </label>
    </div>
  </div>
);

export default function Popup(): React.ReactElement {
  const [state, setState] = React.useState<SettingsState>(INITIAL_STATE);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const changed = {
      ...state,
      [event.target.name]: event.target.checked,
    };
    setState(changed);
    setStorageBySettings(changed);
  };

  useEffect(() => {
    getStorageBySettings((settings) => {
      setState(settings);
    });
  }, []);

  return (
    <div className="w-52 bg-white border border-gray-200 rounded-lg shadow-sm font-pretendard">
      <div className="p-4 text-center">
        <h1 className="text-lg font-semibold text-gray-800">
          리얼타임 실시간 검색어
        </h1>
      </div>
      <div className="px-4 pb-4">
        <div className="w-full p-3 border border-gray-200 rounded-md bg-gray-50">
          <ColorSwitch
            checked={state.naver}
            onChange={handleChange}
            name="naver"
            switchColor="#19ce60"
            label="Naver"
          />
          <ColorSwitch
            checked={state.google}
            onChange={handleChange}
            name="google"
            switchColor="#000000"
            label="Google"
          />
        </div>
      </div>
    </div>
  );
}
