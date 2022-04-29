/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import Trend from '../models/trend';
import ChartRow from './chart-row';
// import '../tailwind.css'
// import ExtensionDownloadButton from './extension-download-button';
// import KakaotalkShareButton from './kakaotalk-share-button';
// import NaverOpenmainButton from './naver-openmain-button';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
      Kakao: any;
  }
}

interface PropsType {
  trends: Trend[];
  searchEngine: number;
}

const searchEngines = [
  {
    name: 'Google',
    logo: './google.svg',
    searchUrl: 'https://www.google.com/search?q=',
  },
  {
    name: 'Naver',
    logo: './naver.svg',
    searchUrl: 'https://search.naver.com/search.naver?query=',
  },
];

/**
 * ChartBox for web.
 *
 * @component
 * @example
 * return (
 *  <ChartBox/>
 * )
 * @return {JSX.Element}
 */
const ChartBox = ({trends, searchEngine}: PropsType): JSX.Element => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(()=>{
    const interval = setInterval(()=>{
      setActiveIndex((i) => (i + 1) % 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div>
      <section>
        <div className='flex justify-between items-center'>
          <div className='flex justify-center items-center'>
            <h4 className="font-bold text-2xl">급상승 검색어</h4>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="grid">
          {trends?.slice(0, 10).map((trend: Trend, index: number) => {
            return (
              <div
                className='p-2 md:hover:bg-blue-300'
                key={index + 1}
                style={{flexGrow: 1, height: '100%'}}
                onClick={() => {
                  const encodedKeyword = encodeURI(trend.keyword);
                  window.open(searchEngines[searchEngine].searchUrl + encodedKeyword);
                }}
              >
                <ChartRow trend={trend} ranking={index + 1} bold={index == activeIndex}/>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
      </section>
    </div>
  );
};

export default ChartBox;