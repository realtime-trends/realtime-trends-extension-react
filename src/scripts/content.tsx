/* eslint-disable no-console */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Chart from '../components/Chart';
import { getStorageBySettings } from '../popup';
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

// CSS를 Shadow DOM에 주입
const getFloatingStyles = (): string => {
  return `
    * {
      box-sizing: border-box;
    }

    .realtime-trends-floating {
      position: fixed;
      z-index: 2147483647;
      width: 280px;
      max-height: 500px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(225, 229, 233, 0.8);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: floatingIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes floatingIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .realtime-trends-floating:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 20px rgba(0, 0, 0, 0.12);
      background: rgba(255, 255, 255, 1);
      border: 1px solid rgba(225, 229, 233, 1);
    }

    .drag-handle {
      cursor: move;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .trend-content {
      height: 100%;
    }
  `;
};

// 플로팅 컨테이너 생성 (Shadow DOM 사용)
const createFloatingContainer = (): { host: HTMLElement; shadowRoot: ShadowRoot; container: HTMLElement } => {
  const host = document.createElement('div');
  host.id = 'realtime-trends-host';

  // Shadow DOM 생성
  const shadowRoot = host.attachShadow({ mode: 'open' });

  // CSS 주입
  const style = document.createElement('style');
  style.textContent = getFloatingStyles();
  shadowRoot.appendChild(style);

  // content.css 파일 로드
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = chrome.runtime.getURL('static/css/content.css');
  shadowRoot.appendChild(cssLink);

  // 컨테이너
  const container = document.createElement('div');
  container.className = 'realtime-trends-floating';
  container.id = 'realtime-trends-floating';

  // 차트 컨테이너
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'trend-content';
  chartWrapper.appendChild(chartElement);
  container.appendChild(chartWrapper);

  shadowRoot.appendChild(container);

  return { host, shadowRoot, container };
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

  const existingHost = document.getElementById('realtime-trends-host');

  // 네이버나 구글 사이트에서 설정이 활성화된 경우 플로팅 차트 표시
  const shouldShowFloating =
    (settings.naver && ['www.naver.com', 'naver.com', 'search.naver.com'].includes(window.location.hostname)) ||
    (settings.google && ['www.google.com', 'google.com'].includes(window.location.hostname));

  if (shouldShowFloating) {
    let floatingHost = existingHost;
    let floatingContainer: HTMLElement;

    // 컨테이너가 없으면 새로 생성
    if (!floatingHost) {
      if (isDev) {
        console.log('Creating new floating trends chart...');
      }
      const result = createFloatingContainer();
      floatingHost = result.host;
      floatingContainer = result.container;

      // 헤더에 드래그 핸들 클래스 추가
      const trendHeader = chartElement.querySelector('.trend-header');
      if (trendHeader) {
        trendHeader.classList.add('drag-handle');
      }

      // body에 호스트 추가
      document.body.appendChild(floatingHost);

      // 드래그 기능 활성화 (Shadow DOM 내부 컨테이너에)
      makeDraggable(floatingContainer);

      // 엔진 결정
      const engine = ['www.naver.com', 'naver.com', 'search.naver.com'].includes(window.location.hostname) ? 'naver' : 'google';

      // React 차트 렌더링
      const root = createRoot(chartElement);
      root.render(
        <Chart
          engine={engine}
          backgroundSelector="body"
          boxWidth="100%"
        />
      );
    } else {
      // 기존 컨테이너 찾기
      floatingContainer = (floatingHost.shadowRoot?.getElementById('realtime-trends-floating') as HTMLElement);
    }

    // 설정에 따른 위치 및 스타일 업데이트
    const position = settings.position || 'bottom-right';
    const bottomOffset = settings.bottomOffset ?? 80;
    const sideOffset = settings.sideOffset ?? 20;
    const opacitySetting = settings.opacity ?? 30;
    const opacity = 1 - (opacitySetting / 100);

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
    if (existingHost) {
      existingHost.remove();
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
