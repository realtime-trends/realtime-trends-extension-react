import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { getStandardTime, updateTrends, TrendItem } from '../trends';
import ChartRow from './ChartRow';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ChartProps {
  boxOnly: boolean;
  engine: string;
  backgroundSelector: string;
  boxWidth: string;
}

function Chart({ boxOnly, engine, backgroundSelector, boxWidth }: ChartProps): React.ReactElement {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [boxDisplay, setBoxDisplay] = useState<string>(boxOnly ? 'block' : 'none');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<string>('');
  const [isFooterHover, setIsFooterHover] = useState<boolean>(false);
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    vertical: true,
    arrows: false,
    centerMode: true,
    pauseOnHover: false,
    afterChange: setActiveIndex,
  };

  useEffect(() => {
    updateTrends(setTrends);
    getStandardTime(setStandardTime);
  }, []);

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
          if (!boxOnly) setBoxDisplay('none');
        }}
        className={`${boxOnly ? 'relative' : 'absolute'} ${boxOnly ? '' : 'border border-gray-300 rounded-md'}`}
        style={{
          zIndex: boxOnly ? 0 : 10,
          display: boxDisplay,
          backgroundColor,
          width: boxWidth,
        }}
      >
        <div className="flex h-full p-2.5">
          <div className="flex-[5] flex items-center flex-wrap text-left h-full">
            <span className="font-bold text-sm block w-full font-pretendard">
              급상승 검색어
            </span>
          </div>
          <div className="flex-[7] flex items-center flex-wrap text-right h-full">
            <span className="font-normal text-xs block w-full text-gray-400 font-pretendard">
              {standardTime} 기준
            </span>
          </div>
        </div>

        {trends && trends.slice(0, 10).map((trend, index) => (
          <div
            key={index + 1}
            className="flex-grow h-full m-2.5 cursor-pointer hover:bg-gray-50 rounded transition-colors"
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
            <ChartRow trend={trend} activeRanking={activeIndex + 1} ranking={index + 1} />
          </div>
        ))}
        <div className="flex h-full p-2.5">
          <div className="w-full flex items-center flex-wrap text-left h-full">
            <span className="font-bold text-xs block w-full text-gray-500 font-pretendard">
              <svg className="inline w-4 h-4 text-gray-500 align-middle mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v4z"/>
              </svg>
              확장프로그램 '리얼타임 실시간 검색어' 제공
            </span>
          </div>
        </div>
        <div
          className="flex flex-col h-full p-2.5 transition-opacity duration-200"
          style={{
            opacity: isFooterHover ? 0.8 : 0.3,
          }}
          onMouseOver={() => {
            setIsFooterHover(true);
          }}
          onMouseOut={() => {
            setIsFooterHover(false);
          }}
        >
          <div className="w-full mb-1">
            <div className="flex items-center flex-wrap text-left h-full">
              <span className="font-bold text-xs block w-full text-black font-pretendard">
                <svg className="inline w-4 h-4 text-black align-middle mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 13.5l-6-6 1.5-1.5L13 12.5l7.5-7.5L22 6.5l-9 9z"/>
                </svg>
                이 서비스가 마음에 드신다면...
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a 
              href="https://chrome.google.com/webstore/detail/dmbaagbmhlhdnlmbcncneijndejlalie"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-center hover:bg-gray-50 transition-colors font-pretendard"
            >
              리뷰쓰기
            </a>
            <a
              href="https://hoyaaaa.github.io/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-center hover:bg-gray-50 transition-colors font-pretendard"
            >
              후원하기
            </a>
          </div>
        </div>
      </div>
      <Slider
        {...settings}
        style={{
          height: '100%',
          backgroundColor,
          display: boxOnly ? 'none' : 'block',
        }}
      >
        {trends && trends.slice(0, 10).map((trend, index) => (
          <div
            key={index + 1}
            className="flex-grow h-full"
            onMouseEnter={() => {
              setBoxDisplay('block');
            }}
          >
            <ChartRow trend={trend} activeRanking={-1} ranking={index + 1} />
          </div>
        ))}
      </Slider>
    </>
  );
}

Chart.defaultProps = {
  boxOnly: false,
  engine: 'naver',
  backgroundSelector: 'body',
  boxWidth: '100%',
};

export default Chart;
