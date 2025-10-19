/* eslint-disable no-console */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Chart from '../components/Chart';
import { getSettingsFromBackground } from '../services/messaging';
import type { SettingsState } from '../utils/indexedDB';
import './content.css';

// 개발 모드 또는 크롬 개발자 모드에서 로드된 경우 로그 표시
const isDev = process.env.NODE_ENV === 'development' || !('update_url' in (chrome.runtime as any).getManifest());

if (isDev) {
  console.log('Content script loaded!', window.location.href);
}

// Settings 타입은 indexedDB에서 가져옴
type Settings = SettingsState;

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
    console.log('Settings details:', JSON.stringify(settings, null, 2));
  }

  const existingContainer = document.getElementById('realtime-trends-floating');

  // 네이버나 구글 사이트에서 설정이 활성화된 경우 플로팅 차트 표시
  const shouldShowFloating =
    (settings.naver && ['www.naver.com', 'naver.com', 'search.naver.com'].includes(window.location.hostname)) ||
    (settings.google && ['www.google.com', 'google.com'].includes(window.location.hostname));

  if (isDev) {
    console.log('shouldShowFloating:', shouldShowFloating);
    console.log('hostname:', window.location.hostname);
    console.log('settings.naver:', settings.naver);
    console.log('settings.google:', settings.google);
  }

  if (shouldShowFloating) {
    let floatingContainer = existingContainer;

    // 설정 값 미리 계산
    const position = settings.position || 'bottom-right';
    const bottomOffset = settings.bottomOffset ?? 80;
    const sideOffset = settings.sideOffset ?? 20;
    const opacitySetting = settings.opacity ?? 30;
    const opacity = 1 - (opacitySetting / 100);
    const allowClickBehind = settings.allowClickBehindChart ?? false;

    if (isDev) {
      console.log(`Opacity setting: ${opacitySetting} -> CSS opacity: ${opacity}`);
      console.log(`Allow click behind: ${allowClickBehind}`);
    }

    // 컨테이너가 없으면 새로 생성
    if (!floatingContainer) {
      if (isDev) {
        console.log('Creating new floating trends chart...');
      }
      floatingContainer = createFloatingContainer();

      // 컨테이너를 DOM에 추가하기 전에 초기 스타일 설정
      floatingContainer.style.transform = '';

      // 위치 설정
      if (position === 'bottom-left') {
        floatingContainer.style.setProperty('left', `${sideOffset}px`, 'important');
        floatingContainer.style.setProperty('right', 'auto', 'important');
      } else {
        floatingContainer.style.setProperty('right', `${sideOffset}px`, 'important');
        floatingContainer.style.setProperty('left', 'auto', 'important');
      }
      floatingContainer.style.setProperty('bottom', `${bottomOffset}px`, 'important');

      // 투명도 초기 설정
      floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');

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
          engine={engine}
          backgroundSelector="body"
          boxWidth="100%"
        />
      );

      // React 렌더링 후 pointer-events 설정 적용
      setTimeout(() => {
        if (!floatingContainer) return;

        if (allowClickBehind) {
          // 클릭 허용 모드 클래스 추가
          floatingContainer.classList.add('click-through-mode');

          // 플로팅 컨테이너는 완전히 클릭/hover 통과
          floatingContainer.style.setProperty('pointer-events', 'none', 'important');

          // 모든 하위 요소에도 pointer-events: none 적용
          const allElements = floatingContainer.querySelectorAll('*');
          allElements.forEach((element) => {
            (element as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
          });

          if (isDev) {
            console.log(`차트 뒤 클릭 허용 모드 활성화 (투명도: ${Math.round(opacity * 100)}%, hover 비활성화)`);
            console.log(`총 ${allElements.length}개 요소에 pointer-events: none 적용됨`);
          }
        } else {
          // 일반 모드 설정
          floatingContainer.style.setProperty('pointer-events', 'auto', 'important');

          // hover 시 투명도 1.0으로 변경
          const handleMouseEnter = () => {
            if (!floatingContainer) return;
            floatingContainer.style.setProperty('opacity', '1.0', 'important');
          };

          const handleMouseLeave = () => {
            if (!floatingContainer) return;
            floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');
          };

          floatingContainer.addEventListener('mouseenter', handleMouseEnter);
          floatingContainer.addEventListener('mouseleave', handleMouseLeave);

          if (isDev) {
            console.log('차트 일반 모드');
          }
        }

        if (isDev) {
          console.log(`Applied styles: position=${position}, bottom=${bottomOffset}px, side=${sideOffset}px, opacity=${opacity}`);
          console.log('Floating chart created successfully!');
        }
      }, 100);
    } else {
      // 기존 컨테이너가 있는 경우 설정 업데이트
      floatingContainer.style.transform = '';

      if (position === 'bottom-left') {
        floatingContainer.style.setProperty('left', `${sideOffset}px`, 'important');
        floatingContainer.style.setProperty('right', 'auto', 'important');
      } else {
        floatingContainer.style.setProperty('right', `${sideOffset}px`, 'important');
        floatingContainer.style.setProperty('left', 'auto', 'important');
      }
      floatingContainer.style.setProperty('bottom', `${bottomOffset}px`, 'important');

      // 차트 뒤 클릭 허용 설정
      if (allowClickBehind) {
        floatingContainer.classList.add('click-through-mode');
        floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');
        floatingContainer.style.setProperty('pointer-events', 'none', 'important');

        const allElements = floatingContainer.querySelectorAll('*');
        allElements.forEach((element) => {
          (element as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
        });

        if (isDev) {
          console.log(`차트 뒤 클릭 허용 모드 활성화 (투명도: ${Math.round(opacity * 100)}%, hover 비활성화)`);
        }
      } else {
        floatingContainer.classList.remove('click-through-mode');
        floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');
        floatingContainer.style.setProperty('pointer-events', 'auto', 'important');

        const allElements = floatingContainer.querySelectorAll('*');
        allElements.forEach((element) => {
          (element as HTMLElement).style.removeProperty('pointer-events');
        });

        // hover 시 투명도 1.0으로 변경
        const handleMouseEnter = () => {
          if (!floatingContainer) return;
          floatingContainer.style.setProperty('opacity', '1.0', 'important');
        };

        const handleMouseLeave = () => {
          if (!floatingContainer) return;
          floatingContainer.style.setProperty('opacity', opacity.toString(), 'important');
        };

        // 기존 이벤트 리스너 제거 (중복 방지)
        floatingContainer.removeEventListener('mouseenter', handleMouseEnter);
        floatingContainer.removeEventListener('mouseleave', handleMouseLeave);

        // 새 이벤트 리스너 추가
        floatingContainer.addEventListener('mouseenter', handleMouseEnter);
        floatingContainer.addEventListener('mouseleave', handleMouseLeave);

        if (isDev) {
          console.log('차트 일반 모드');
        }
      }

      if (isDev) {
        console.log(`Applied styles: position=${position}, bottom=${bottomOffset}px, side=${sideOffset}px, opacity=${opacity}`);
        console.log('Floating chart updated successfully!');
      }
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

// 설정 변경 메시지 리스너
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (message.type === 'SETTINGS_CHANGED') {
    if (isDev) {
      console.log('설정 변경 감지:', message.data);
    }
    updateFloatingWidget(message.data);
  }
});

// 초기 로드 (Background Worker에서 가져오기)
// DOM이 완전히 로드된 후 실행하도록 지연
const initializeWidget = async () => {
  try {
    if (isDev) {
      console.log('위젯 초기화 시작...');
    }

    const settings = await getSettingsFromBackground();

    if (isDev) {
      console.log('초기 설정 로드 결과:', settings);
    }

    if (settings) {
      // 설정이 로드되었으면 바로 위젯 업데이트
      updateFloatingWidget(settings);
      if (isDev) {
        console.log('초기 설정 로드 완료 및 위젯 업데이트:', settings);
      }
    } else {
      console.warn('초기 설정을 불러올 수 없습니다');

      // 설정이 없어도 기본값으로 한 번 더 시도
      setTimeout(async () => {
        const retrySettings = await getSettingsFromBackground();
        if (retrySettings) {
          if (isDev) {
            console.log('재시도로 설정 로드 성공:', retrySettings);
          }
          updateFloatingWidget(retrySettings);
        }
      }, 500);
    }
  } catch (error) {
    console.error('초기 설정 로드 실패:', error);
  }
};

// DOM이 준비되면 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
  // 이미 로드된 경우 바로 실행
  initializeWidget();
}
