import React, { useState, useEffect } from 'react';
import { getStandardTime, updateTrends, TrendItem } from '../trends';
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
  const [donationQR, setDonationQR] = useState('');
  const [donationOptionsVisible, setDonationOptionsVisible] = useState(false);

  const donationOptions = [
    { name: '박카스 한병', amount: '1000원', comment: '응원의 박카스 감사합니다! 💪', qr: 'donation/1000.png' },
    { name: '초콜릿 하나', amount: '3000원', comment: '달달한 초콜릿 감사합니다! 🍫', qr: 'donation/3000.png' },
    { name: '커피 한잔', amount: '5000원', comment: '카페인 충전 감사합니다! ☕', qr: 'donation/5000.png' },
    { name: '국밥 한그릇', amount: '10000원', comment: '든든한 국밥 감사합니다! 🍲', qr: 'donation/10000.png' },
    { name: '기타', comment: '후원해주셔서 감사합니다! 💝', qr: 'donation/custom.png' },
  ];

  const [donationOptionsWithUrls, setDonationOptionsWithUrls] = useState<any[]>([]);

  useEffect(() => {
    try {
      const optionsWithUrls = donationOptions.map(option => ({
        ...option,
        qrUrl: chrome.runtime.getURL(option.qr)
      }));
      setDonationOptionsWithUrls(optionsWithUrls);
    } catch (e: any | Error) {
      if (e.message.includes('Extension context invalidated')) {
        console.error("Extension context invalidated. Please reload the page to see donation QR codes.");
      }
    }
  }, []);

  const [selectedDonation, setSelectedDonation] = useState<any>(null);

  const handleDonationOptionClick = (option: any) => {
    setSelectedDonation(option);
    setDonationQR(option.qrUrl);
    setDonationVisible(true);
    setDonationOptionsVisible(false);
  };

  useEffect(() => {
    updateTrends(setTrends);
    getStandardTime(setStandardTime);
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
        >
          {/* 헤더 */}
          <div className="trend-header">
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

          {/* 트렌드 리스트 - 전체 10개 항목 표시 */}
          <div className={'p-3 space-y-1'}>
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

          {/* Footer */}
          <div className="py-3 border-t border-gray-100">
            <div className="flex text-xs text-gray-400 font-medium">
              <div
                className="w-1/2 text-center cursor-pointer hover:text-gray-600"
                onClick={() => window.open('https://chromewebstore.google.com/detail/dmbaagbmhlhdnlmbcncneijndejlalie', '_blank')}
              >
                리뷰하기
              </div>
              <div className="w-1/2 text-center cursor-pointer hover:text-gray-600 relative"
                onMouseEnter={() => setDonationOptionsVisible(true)}
                onMouseLeave={() => setDonationOptionsVisible(false)}
              >
                후원하기
                {donationOptionsVisible && (
                  <div
                    className="absolute bottom-full w-40 bg-white border border-gray-200 rounded-md shadow-lg text-left"
                    onMouseEnter={() => setDonationOptionsVisible(true)}
                    onMouseLeave={() => setDonationOptionsVisible(false)}
                  >
                    {donationOptionsWithUrls.map((option) => (
                      <div
                        key={option.amount || option.name}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDonationOptionClick(option);
                        }}
                      >
                        {option.amount ? `${option.name} (${option.amount})` : option.name}
                      </div>
                    ))}
                  </div>
                )}
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
            {selectedDonation && selectedDonation.amount && (
              <h3 className="text-gray-600 mb-4">{selectedDonation.name} ({selectedDonation.amount})</h3>
            )}
            <img src={donationQR} alt="Donation QR Code" className="mx-auto mb-4 w-2/3" />
            <p className="text-gray-600">
              {selectedDonation?.comment || '후원해주셔서 감사합니다!'}
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
