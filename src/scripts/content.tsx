/* eslint-disable no-console */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Chart from '../components/Chart';
import { getStorageBySettings } from '../popup';
import { addSearchQuery } from '../searchQueries';
import './content.css';

// 개발 모드 또는 크롬 개발자 모드에서 로드된 경우 로그 표시
const isDev = process.env.NODE_ENV === 'development' || !('update_url' in (chrome.runtime as any).getManifest());

if (isDev) {
  console.log('Content script loaded!', window.location.href);
}

interface Settings {
  naver: boolean;
  google: boolean;
  position: 'bottom-left' | 'bottom-right';
  bottomOffset: number;
  sideOffset: number;
  opacity: number;
  [key: string]: boolean | string | number;
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

// 플로팅 위젯을 업데이트하는 함수
const updateFloatingWidget = (settings: Settings) => {
  if (isDev) {
    console.log('Updating floating widget with settings:', settings);
  }
  
  const existingContainer = document.getElementById('realtime-trends-floating');
  
  // 네이버나 구글 사이트에서 설정이 활성화된 경우 플로팅 차트 표시
  const shouldShowFloating = 
    (settings.naver && ['www.naver.com', 'naver.com', 'search.naver.com'].includes(window.location.hostname)) ||
    (settings.google && ['www.google.com', 'google.com'].includes(window.location.hostname));
  
  if (shouldShowFloating) {
    let floatingContainer = existingContainer;
    
    // 컨테이너가 없으면 새로 생성
    if (!floatingContainer) {
      if (isDev) {
        console.log('Creating new floating trends chart...');
      }
      floatingContainer = createFloatingContainer();
      
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
    }
    
    // 설정에 따른 위치 및 스타일 업데이트
    const position = settings.position || 'bottom-right';
    const bottomOffset = settings.bottomOffset ?? 80; // 설정 없으면 기본값 80
    const sideOffset = settings.sideOffset ?? 20; // 설정 없으면 기본값 20
    const opacitySetting = settings.opacity ?? 30; // 0-70 범위, 설정 없으면 기본값 30
    const opacity = 1 - (opacitySetting / 100); // 0(불투명) -> 1.0, 70(투명) -> 0.3
    
    if (isDev) {
      console.log(`Opacity setting: ${opacitySetting} -> CSS opacity: ${opacity}`);
    }
    
    // 기존 transform과 위치 스타일 초기화
    floatingContainer.style.transform = '';
    
    if (position === 'bottom-left') {
      floatingContainer.style.setProperty('left', `${sideOffset}px`, 'important');
      floatingContainer.style.setProperty('right', 'auto', 'important');
    } else {
      floatingContainer.style.setProperty('right', `${sideOffset}px`, 'important');
      floatingContainer.style.setProperty('left', 'auto', 'important');
    }
    floatingContainer.style.setProperty('bottom', `${bottomOffset}px`, 'important');
    floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');
    
    // hover 시 투명도 1.0으로 강제 변경하는 이벤트 리스너
    const handleMouseEnter = () => {
      floatingContainer.style.setProperty('opacity', '1.0', 'important');
    };
    
    const handleMouseLeave = () => {
      floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');
    };
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    floatingContainer.removeEventListener('mouseenter', handleMouseEnter);
    floatingContainer.removeEventListener('mouseleave', handleMouseLeave);
    
    // 새 이벤트 리스너 추가
    floatingContainer.addEventListener('mouseenter', handleMouseEnter);
    floatingContainer.addEventListener('mouseleave', handleMouseLeave);
    
    if (isDev) {
      console.log(`Applied styles: position=${position}, bottom=${bottomOffset}px, side=${sideOffset}px, opacity=${opacity}`);
      console.log('Floating chart updated successfully!');
    }
  } else {
    // 설정이 비활성화되면 위젯 제거
    if (existingContainer) {
      existingContainer.remove();
      if (isDev) {
        console.log('Floating chart removed due to disabled settings');
      }
    }
  }
};

// 설정 변경 감지 리스너
if (typeof chrome !== 'undefined' && chrome.storage && (chrome.storage as any).onChanged) {
  (chrome.storage as any).onChanged.addListener((changes: any, areaName: string) => {
    if (areaName === 'local' && changes.settings) {
      if (isDev) {
        console.log('Settings changed, updating widget...');
      }
      updateFloatingWidget(changes.settings.newValue);
    }
  });
}

// 초기 로드
getStorageBySettings(updateFloatingWidget);

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
