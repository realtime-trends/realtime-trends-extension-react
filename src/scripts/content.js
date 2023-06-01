/* eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';
import Chart from '../components/Chart';
import { getStorageBySettings } from '../popup';
import './content.css';

window.onerror = (errorMsg, url, lineNumber, column, errorObj) => {
  console.error('Caught content script error');
  console.error(`errorMsg: ${errorMsg}`);
  console.error(`url: ${url}`);
  console.error(`lineNumber: ${lineNumber}`);
  console.error(`column: ${column}`);
  console.error('errorObj follows:');
  console.error(errorObj);
  return true;
};

const checkElement = (selector, callback) => {
  const check = setInterval(() => {
    const e = document.querySelector(selector);
    if (e) {
      callback(e);
      clearInterval(check);
    }
  }, 1000);
};

const chartElement = document.createElement('div');
chartElement.style.height = '100%';

getStorageBySettings((settings) => {
  if (settings.naver && ['www.naver.com', 'naver.com'].includes(window.location.hostname) && ['/'].includes(window.location.pathname)) {
    checkElement('#right-content-area > div', (sidebar) => {
      sidebar.insertBefore(chartElement, sidebar.firstChild);

      const backgroundSeletor = '#account';

      ReactDOM.render(<Chart boxOnly={false} engine="naver" backgroundSelector={backgroundSeletor} />, chartElement);
    });
  } else if (settings.naver && ['search.naver.com'].includes(window.location.hostname) && ['/search.naver'].includes(window.location.pathname)) {
    checkElement('#sub_pack', (sidebar) => {
      const section = document.createElement('section');
      section.classList.add('sc_new');
      chartElement.classList.add('api_subject_bx');
      section.appendChild(chartElement);
      sidebar.insertBefore(section, sidebar.firstChild);

      const backgroundSeletor = '#lnb';

      ReactDOM.render(<Chart boxOnly engine="naver" backgroundSelector={backgroundSeletor} />, chartElement);
    });
  } else if (settings.google && ['www.google.com', 'google.com'].includes(window.location.hostname) && ['/', '/webhp', '/search'].includes(window.location.pathname)) {
    chartElement.style.minWidth = '270px';
    chartElement.style.maxWidth = '270px';
    checkElement('#gb > div', (appBarElement) => {
      appBarElement.insertBefore(chartElement, appBarElement.firstChild);

      const backgroundSeletor = 'body';

      ReactDOM.render(<Chart boxOnly={false} engine="google" backgroundSelector={backgroundSeletor} />, chartElement);
    });
  }
});
