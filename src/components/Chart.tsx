import React, { useState, useEffect } from 'react';
import { getStandardTime, updateTrends, setupTrendsListener, TrendItem } from '../trends';
import ChartRow from './ChartRow';

interface ChartProps {
  engine: string;
  backgroundSelector: string;
  boxWidth: string;
}

function Chart({ engine, backgroundSelector, boxWidth }: ChartProps): React.ReactElement {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [boxDisplay, setBoxDisplay] = useState<string>('none');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<string>('');
  const [carouselDisplay, setCarouselDisplay] = useState<string>('block');
  const [donationVisible, setDonationVisible] = useState(false);

  // donation.png URL 직접 계산
  const getDonationQR = () => {
    try {
      return chrome.runtime.getURL('donation.png');
    } catch (e) {
      console.error('Failed to get donation QR URL');
      return '';
    }
  };

  useEffect(() => {
    // IndexedDB에서 데이터 로드 (async)
    const loadData = async () => {
      await updateTrends(setTrends);
      await getStandardTime(setStandardTime);
    };
    loadData();

    // 트렌드 변경 리스너 등록
    const cleanup = setupTrendsListener(setTrends, setStandardTime);

    // cleanup 함수 반환
    return cleanup;
  }, []);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (trends.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.min(trends.length, 10));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [trends.length]);

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
        className="relative"
        onMouseLeave={() => {
          setBoxDisplay('none');
          setCarouselDisplay('block');
        }}
        onMouseEnter={() => {
          setBoxDisplay('flex');
          setCarouselDisplay('none');
        }}
        style={{
          display: boxDisplay,
          width: boxWidth,
        }}
      >
        <div
          className={`realtime-trends-container absolute z-10`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '600px',
          }}
        >
          {/* 헤더 */}
          <div className="trend-header" style={{ flexShrink: 0 }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg className="mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                </svg>
                <span className="font-medium">리얼타임 트렌드</span>
              </div>
              <span className="text-gray-500">{standardTime}</span>
            </div>
          </div>

          {/* 트렌드 리스트 - 전체 10개 항목 표시 (스크롤 가능) */}
          <div className={'p-3 space-y-1'} style={{ flex: 1, overflowY: 'auto' }}>
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

          {/* Footer - 하단 고정 */}
          <div className="py-3 border-t border-gray-100" style={{ flexShrink: 0 }}>
            <div className="flex text-gray-400 font-medium divide-x divide-gray-200">
              <div
                className="w-1/2 text-center cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => window.open('https://chromewebstore.google.com/detail/dmbaagbmhlhdnlmbcncneijndejlalie', '_blank')}
              >
                리뷰하기
              </div>
              <div className="w-1/2 text-center cursor-pointer hover:text-gray-600 transition-colors relative"
                onClick={() => setDonationVisible(true)}
              >
                후원하기
              </div>
            </div>
          </div>
        </div>
        <div className="fixed inset-0 items-center justify-center z-20 h-full w-full bg-white/80" style={{ display: donationVisible ? 'flex' : 'none' }}>
          <div
            className="p-8 rounded-lg text-center relative bg-white border border-gray-200 shadow-lg"
          >
            <button
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => setDonationVisible(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-2">카카오 페이</h2>
            <img src={getDonationQR()} alt="Donation QR Code" className="mx-auto mb-4 w-2/3" />
            <p className="text-gray-600">
              후원해주셔서 감사합니다! 💝
              <br />
              좀 더 나은 서비스를 제공하도록 노력하겠습니다.
            </p>
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
          setBoxDisplay('flex');
          setCarouselDisplay('none');
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
  engine: 'naver',
  backgroundSelector: 'body',
  boxWidth: '100%',
};

export default Chart;
