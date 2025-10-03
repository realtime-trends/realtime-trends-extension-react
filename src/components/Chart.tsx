import React, { useState, useEffect } from 'react';
import { getStandardTime, updateTrends, TrendItem } from '../trends';
import ChartRow from './ChartRow';

interface ChartProps {
  boxOnly: boolean;
  engine: string;
  backgroundSelector: string;
    boxWidth: string;
  disablePadding?: boolean;
}

function Chart({ boxOnly, engine, backgroundSelector, boxWidth, disablePadding }: ChartProps): React.ReactElement {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [boxDisplay, setBoxDisplay] = useState<string>(boxOnly ? 'block' : 'none');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<string>('');
  const [carouselDisplay, setCarouselDisplay] = useState<string>(boxOnly ? 'none' : 'block');

  useEffect(() => {
    updateTrends(setTrends);
    getStandardTime(setStandardTime);
  }, []);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (!boxOnly && trends.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.min(trends.length, 10));
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [boxOnly, trends.length]);

  let backgroundElement = document.querySelector(backgroundSelector);
  if (backgroundElement == null) {
    backgroundElement = document.querySelector('body');
  }

  let { backgroundColor } = window.getComputedStyle(backgroundElement || document.body);
  if (backgroundColor.includes('rgba')) {
    const colorArr = backgroundColor.slice(
      backgroundColor.indexOf('(') + 1,
      backgroundColor.indexOf(')'),
    ).split(', ');
    backgroundColor = `rgb(${colorArr.slice(0, 3).join(', ')})`;
  }

  return (
    <>
      <div
        onMouseLeave={() => {
          if (!boxOnly) {
            setBoxDisplay('none');
            setCarouselDisplay('block');
          }
        }}
        onMouseEnter={() => {
          if (!boxOnly) {
            setBoxDisplay('block');
            setCarouselDisplay('none');
          }
        }}
        className={`realtime-trends-container ${boxOnly ? 'relative' : 'absolute'}`}
        style={{
          zIndex: boxOnly ? 0 : 10,
          display: boxDisplay,
          width: boxWidth,
        }}
      >
        {/* 헤더 */}
        <div className="trend-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
              <span className="font-semibold text-sm text-gray-800">실시간 급상승</span>
            </div>
            <span className="text-xs text-gray-500">{standardTime}</span>
          </div>
        </div>

        {/* 트렌드 리스트 - 전체 10개 항목 표시 */}
                <div className={disablePadding ? 'space-y-1' : 'p-3 space-y-1'}>
          {trends && trends.slice(0, 10).map((trend, index) => (
            <div
              key={index + 1}
              className="trend-item"
              onClick={() => {
                const encodedKeyword = encodeURI(trend.keyword);
                if (engine === 'google') {
                  window.location.href = `https://www.google.com/search?q=${encodedKeyword}`;
                } else if (engine === 'daum') {
                  window.location.href = `https://search.daum.net/search?q=${encodedKeyword}`;
                } else if (engine === 'zum') {
                  window.location.href = `https://search.zum.com/search.zum?query=${encodedKeyword}`;
                } else if (engine === 'nate') {
                  window.location.href = `https://search.daum.net/nate?q=${encodedKeyword}`;
                } else {
                  window.location.href = `https://search.naver.com/search.naver?query=${encodedKeyword}`;
                }
              }}
            >
              <ChartRow trend={trend} activeRanking={currentIndex + 1} ranking={index + 1} />
            </div>
          ))}
        </div>
        
        {/* 간단한 footer */}
                <div className={disablePadding ? 'py-2 border-t border-gray-100' : 'px-3 py-2 border-t border-gray-100'}>
          <div className="text-center text-xs text-gray-400">
            리얼타임 실시간검색어
          </div>
        </div>
      </div>
      {/* 자체 구현 캐러셀 */}
      <div
        className="realtime-trends-container"
        style={{
          height: '100%',
          backgroundColor,
          display: carouselDisplay,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={() => {
          if (!boxOnly) {
            setBoxDisplay('block');
            setCarouselDisplay('none');
          }
        }}
      >
        {trends && trends.length > 0 && (
          <div
            className="trend-item"
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => {
              const trend = trends[currentIndex];
              if (!trend) return;
              
              const encodedKeyword = encodeURI(trend.keyword);
              if (engine === 'google') {
                window.location.href = `https://www.google.com/search?q=${encodedKeyword}`;
              } else if (engine === 'daum') {
                window.location.href = `https://search.daum.net/search?q=${encodedKeyword}`;
              } else if (engine === 'zum') {
                window.location.href = `https://search.zum.com/search.zum?query=${encodedKeyword}`;
              } else if (engine === 'nate') {
                window.location.href = `https://search.daum.net/nate?q=${encodedKeyword}`;
              } else {
                window.location.href = `https://search.naver.com/search.naver?query=${encodedKeyword}`;
              }
            }}
          >
            <ChartRow 
              trend={trends[currentIndex]} 
              activeRanking={-1} 
              ranking={currentIndex + 1} 
            />
          </div>
        )}
      </div>
    </>
  );
}

Chart.defaultProps = {
  boxOnly: false,
  engine: 'naver',
  backgroundSelector: 'body',
    boxWidth: '100%',
  disablePadding: false,
};

export default Chart;
