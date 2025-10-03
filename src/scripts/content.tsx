/* eslint-disable no-console */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Chart from '../components/Chart';
import { getStorageBySettings } from '../popup';
import { addSearchQuery } from '../searchQueries';
import './content.css';

console.log('Content script loaded!', window.location.href);

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


const chartElement = document.createElement('div');
chartElement.style.height = '100%';

// 플로팅 컨테이너 생성
const createFloatingContainer = (): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'realtime-trends-floating';
  container.id = 'realtime-trends-floating';
  
  
  // 차트 컨테이너
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'trend-content';
  chartWrapper.appendChild(chartElement);
  container.appendChild(chartWrapper);
  
  return container;
};

// 드래그 기능 구현
const makeDraggable = (element: HTMLElement): void => {
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;
  
  const dragStart = (e: MouseEvent) => {
    
    initialX = e.clientX - currentX;
    initialY = e.clientY - currentY;
    
    if (e.target === element || (e.target as HTMLElement).closest('.drag-handle')) {
      isDragging = true;
      element.style.cursor = 'grabbing';
    }
  };
  
  const dragEnd = () => {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    element.style.cursor = 'grab';
  };
  
  const drag = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      const rect = element.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));
      
      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.left = '0';
      element.style.top = '0';
    }
  };
  
  element.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
};

getStorageBySettings((settings: Settings) => {
  console.log('Settings loaded:', settings);
  console.log('Current hostname:', window.location.hostname);
  
  // 네이버나 구글 사이트에서 설정이 활성화된 경우 플로팅 차트 표시
  const shouldShowFloating = 
    (settings.naver && ['www.naver.com', 'naver.com', 'search.naver.com'].includes(window.location.hostname)) ||
    (settings.google && ['www.google.com', 'google.com'].includes(window.location.hostname));
  
  if (shouldShowFloating) {
    console.log('Creating floating trends chart...');
    
    // 기존 플로팅 컨테이너가 있다면 제거
    const existingContainer = document.getElementById('realtime-trends-floating');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const floatingContainer = createFloatingContainer();
    
    // 헤더에 드래그 핸들 클래스 추가
    const trendHeader = chartElement.querySelector('.trend-header');
    if (trendHeader) {
      trendHeader.classList.add('drag-handle');
    }
    
    // body에 플로팅 컨테이너 추가
    document.body.appendChild(floatingContainer);
    
    // 드래그 기능 활성화
    makeDraggable(floatingContainer);
    
    // 엔진 결정
    const engine = ['www.naver.com', 'naver.com', 'search.naver.com'].includes(window.location.hostname) ? 'naver' : 'google';
    
    // React 차트 렌더링
    const root = createRoot(chartElement);
    root.render(
      <Chart
        boxOnly={false}
        engine={engine}
        backgroundSelector="body"
        boxWidth="100%"
      />
    );
    
    
    console.log('Floating chart rendered successfully!');
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
