/* eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';
import Chart from '../components/Chart';
import { getStorageBySettings } from '../popup';
import { addSearchQuery } from '../searchQueries';
import './content.css';

interface Settings {
  naver: boolean;
  google: boolean;
  [key: string]: boolean;
}

window.onerror = (errorMsg: string | Event, url?: string, lineNumber?: number, column?: number, errorObj?: Error) => {
  console.error('Caught content script error');
  console.error(`errorMsg: ${errorMsg}`);
  console.error(`url: ${url}`);
  console.error(`lineNumber: ${lineNumber}`);
  console.error(`column: ${column}`);
  console.error('errorObj follows:');
  console.error(errorObj);
  return true;
};

const checkElement = (selector: string, callback: (element: Element) => void): void => {
  const check = setInterval(() => {
    const e = document.querySelector(selector);
    if (e) {
      callback(e);
      clearInterval(check);
    }
  }, 100);
};

const chartElement = document.createElement('div');
chartElement.style.height = '100%';

getStorageBySettings((settings: Settings) => {
  if (
    settings.naver &&
    ['www.naver.com', 'naver.com'].includes(window.location.hostname) &&
    ['/'].includes(window.location.pathname)
  ) {
    chartElement.style.position = 'absolute';
    chartElement.style.height = '60px';
    chartElement.style.top = '50px';
    chartElement.style.right = '0px';
    chartElement.style.minWidth = '270px';
    chartElement.style.maxWidth = '270px';

    const elements = document.querySelectorAll('[id^="search-right-"]');
    elements.forEach((element) => {
      element.parentNode?.removeChild(element);
    });

    checkElement('#topSearchWrap', (rightBanner) => {
      rightBanner.appendChild(chartElement);
      const backgroundSeletor = '#search_area';
      ReactDOM.render(
        <Chart
          boxOnly={false}
          engine="naver"
          backgroundSelector={backgroundSeletor}
          boxWidth="270px"
        />,
        chartElement
      );
    });
  } else if (
    settings.naver &&
    ['search.naver.com'].includes(window.location.hostname) &&
    ['/search.naver'].includes(window.location.pathname)
  ) {
    checkElement('#sub_pack', (sidebar) => {
      const section = document.createElement('section');
      section.classList.add('sc_new');
      chartElement.classList.add('api_subject_bx');
      section.appendChild(chartElement);
      sidebar.insertBefore(section, sidebar.firstChild);

      const backgroundSeletor = '#lnb';
      ReactDOM.render(
        <Chart
          boxOnly
          engine="naver"
          backgroundSelector={backgroundSeletor}
          boxWidth="100%"
        />,
        chartElement
      );
    });
  } else if (
    settings.google &&
    ['www.google.com', 'google.com'].includes(window.location.hostname) &&
    ['/', '/webhp', '/search'].includes(window.location.pathname)
  ) {
    chartElement.style.height = '48px';
    chartElement.style.minWidth = '270px';
    chartElement.style.maxWidth = '270px';
    checkElement(
      window.location.pathname === '/search' ? '#gb' : '#gb > div',
      (appBarElement) => {
        appBarElement.insertBefore(chartElement, appBarElement.firstChild);

        const backgroundSeletor = 'body';
        ReactDOM.render(
          <Chart
            boxOnly={false}
            engine="google"
            backgroundSelector={backgroundSeletor}
            boxWidth="270px"
          />,
          chartElement
        );
      }
    );
  }
});

function detectNaverSearchQuery(): void {
  if (['www.naver.com', 'naver.com'].includes(window.location.hostname) && window.location.pathname === '/') {
    const searchForm = document.querySelector('#search_form') as HTMLFormElement;
    if (searchForm) {
      searchForm.addEventListener('submit', () => {
        const inputElement = document.querySelector('#query') as HTMLInputElement;
        if (inputElement && inputElement.value) {
          addSearchQuery(inputElement.value, 'naver');
        }
      });
    }
  }
  
  if (['search.naver.com'].includes(window.location.hostname)) {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    if (query) {
      addSearchQuery(query, 'naver');
    }
  }
}

function detectGoogleSearchQuery(): void {
  if (['www.google.com', 'google.com'].includes(window.location.hostname)) {
    if (window.location.pathname === '/search') {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q');
      if (query) {
        addSearchQuery(query, 'google');
      }
    }
    
    if (['/', '/webhp'].includes(window.location.pathname)) {
      const searchForm = document.querySelector('form[action="/search"]') as HTMLFormElement;
      if (searchForm) {
        searchForm.addEventListener('submit', () => {
          const inputElement = searchForm.querySelector('input[name="q"]') as HTMLInputElement;
          if (inputElement && inputElement.value) {
            addSearchQuery(inputElement.value, 'google');
          }
        });
      }
    }
  }
}

detectNaverSearchQuery();
detectGoogleSearchQuery();
