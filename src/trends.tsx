import React from 'react';
import { getTrendsFromBackground } from './services/messaging';
import type { TrendEntry } from './services/trendsCrawler';

export interface TrendItem {
  keyword: string;
  delta: number;
}


/**
 * 트렌드 업데이트 (Background Worker에서 가져오기)
 */
export async function updateTrends(setTrends: React.Dispatch<React.SetStateAction<TrendItem[]>>): Promise<void> {
  const trendsData = await getTrendsFromBackground();

  if (!trendsData || !trendsData.trends || trendsData.trends.length === 0) {
    // 데이터가 없어도 조용히 처리 (확장 프로그램 업데이트 시 정상)
    setTrends([]);
    return;
  }

  // TrendEntry를 TrendItem으로 변환
  const trendItems: TrendItem[] = trendsData.trends.map((trend: TrendEntry) => ({
    keyword: trend.keyword,
    delta: trend.delta
  }));

  setTrends(trendItems);
}

/**
 * 트렌드 시간 가져오기 (Background Worker에서)
 */
export async function getStandardTime(setStandardTime: (time: string) => void): Promise<void> {
  const trendsData = await getTrendsFromBackground();

  if (!trendsData) {
    setStandardTime('데이터 없음');
    return;
  }

  const standardTime = new Date(trendsData.timestamp * 1000);
  const year = standardTime.getFullYear();
  const month = (`0${standardTime.getMonth() + 1}`).slice(-2);
  const day = (`0${standardTime.getDate()}`).slice(-2);
  const hour = (`0${standardTime.getHours()}`).slice(-2);
  const minute = (`0${standardTime.getMinutes()}`).slice(-2);

  setStandardTime(`${year}년 ${month}월 ${day}일 ${hour}:${minute}`);
}

/**
 * 트렌드 변경 리스너 등록
 * 5분마다 자동 새로고침
 */
export function setupTrendsListener(
  setTrends: React.Dispatch<React.SetStateAction<TrendItem[]>>,
  setStandardTime?: (time: string) => void
): () => void {
  // 5분마다 데이터 새로고침
  const interval = setInterval(async () => {
    await updateTrends(setTrends);
    if (setStandardTime) {
      await getStandardTime(setStandardTime);
    }
  }, 5 * 60 * 1000); // 5분

  // cleanup 함수
  return () => {
    clearInterval(interval);
  };
}
