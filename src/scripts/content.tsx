/* global chrome */
import React from 'react';
import ReactDOM from 'react-dom';
import Chart from '../components/chart';
import { getStorageBySettings } from '../popup';
import './content.css'
import './content.scss'

const checkElement = (selector: string, callback: Function) => {
  var check = setInterval(() => {
    const e = document.querySelector(selector);
    if (e)  {
      callback(e);
      clearInterval(check);
    }
  }, 100);
}

const chartElement = document.createElement('div');
chartElement.style.height = '100%';

getStorageBySettings((settings: { naver: boolean; google: boolean; }) => {
  if (settings.google && ['www.google.com', 'google.com'].includes(window.location.hostname) && ['/', '/webhp', '/search'].includes(window.location.pathname)) {
    const searchEngine = 0;
    const backgroundSeletor = "body";

    chartElement.style.minWidth = '270px';
    chartElement.style.maxWidth = '270px';
    checkElement("#gb > div", (appBarElement: HTMLElement) => {
      appBarElement.insertBefore(chartElement, appBarElement.firstChild);

      ReactDOM.render(<Chart boxOnly={false} searchEngine={searchEngine} backgroundSelector={backgroundSeletor}/>, chartElement);
    });
  } else if (settings.naver && ['www.naver.com', 'naver.com'].includes(window.location.hostname) && ['/'].includes(window.location.pathname)) {
    const searchEngine = 1;
    const backgroundSeletor = "#header"

    chartElement.style.minWidth = '270px';
    chartElement.style.maxWidth = '270px';
    checkElement("#NM_WEATHER", (weatherElement: HTMLElement) => {
      while (weatherElement.hasChildNodes() && weatherElement.firstChild) {
        weatherElement.removeChild(weatherElement.firstChild);
      }
      weatherElement.appendChild(chartElement);

      ReactDOM.render((<Chart boxOnly={false} searchEngine={searchEngine} backgroundSelector={backgroundSeletor}/>), chartElement);
    });
  } else if (settings.naver && ['search.naver.com'].includes(window.location.hostname) && ['/search.naver'].includes(window.location.pathname)) {
    const searchEngine = 1;
    const backgroundSeletor = "#lnb"

    checkElement("#sub_pack", (sidebar: HTMLElement) => {
      const section = document.createElement('section');
      section.classList.add('sc_new');
      chartElement.classList.add('api_subject_bx');
      section.appendChild(chartElement);
      sidebar.insertBefore(section, sidebar.firstChild);
  
      ReactDOM.render(<Chart boxOnly={true} searchEngine={searchEngine} backgroundSelector={backgroundSeletor}/>, chartElement);
    });  
  }
})
