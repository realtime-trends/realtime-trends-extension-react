/**
 * 트렌드 서비스 - 크롤링, 저장, 분석 통합
 */

import { calculateTrends, setDelta, type TrendEntry } from './trendsCrawler';
import {
  saveLatestTrends,
  getLatestTrends,
  getPreviousTrends,
  notifyTrendsChange,
  type TrendsData
} from '../utils/indexedDB';

/**
 * 트렌드 데이터 업데이트 (크롤링 → 분석 → 저장)
 */
export async function updateTrendsData(): Promise<TrendsData | null> {
  try {
    console.log('트렌드 업데이트 시작...');

    // 1. 이전 트렌드 데이터 가져오기 (delta 계산용)
    const previousTrendsData = await getLatestTrends();
    const oldTrends = previousTrendsData?.trends || [];

    // 2. 새로운 트렌드 크롤링 및 계산
    const newTrends = await calculateTrends();

    if (newTrends.length === 0) {
      console.warn('크롤링된 트렌드 데이터가 없습니다');
      return null;
    }

    // 3. Delta(순위 변동) 계산
    const trendsWithDelta = setDelta(newTrends, oldTrends);

    // 4. 데이터 구조 생성
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const trendsData: TrendsData = {
      timestamp: currentTimestamp,
      trends: trendsWithDelta,
      updated: new Date().toISOString()
    };

    // 5. IndexedDB에 저장
    await saveLatestTrends(trendsData);

    // 6. 변경사항 알림
    notifyTrendsChange(trendsData);

    console.log(`트렌드 업데이트 완료: ${trendsWithDelta.length}개 키워드`);
    console.log(`Top 1: ${trendsWithDelta[0]?.keyword || 'None'}`);

    return trendsData;

  } catch (error) {
    console.error('트렌드 업데이트 실패:', error);
    return null;
  }
}

/**
 * Top N 트렌드 가져오기
 */
export async function getTopTrends(limit: number = 10): Promise<TrendEntry[]> {
  try {
    const trendsData = await getLatestTrends();
    if (!trendsData) {
      return [];
    }

    return trendsData.trends.slice(0, limit);
  } catch (error) {
    console.error('Top 트렌드 가져오기 실패:', error);
    return [];
  }
}

/**
 * 모든 트렌드 가져오기
 */
export async function getAllTrends(): Promise<TrendEntry[]> {
  try {
    const trendsData = await getLatestTrends();
    if (!trendsData) {
      return [];
    }

    return trendsData.trends;
  } catch (error) {
    console.error('전체 트렌드 가져오기 실패:', error);
    return [];
  }
}

/**
 * 트렌드 데이터 타임스탬프 가져오기
 */
export async function getTrendsTimestamp(): Promise<number | null> {
  try {
    const trendsData = await getLatestTrends();
    return trendsData?.timestamp || null;
  } catch (error) {
    console.error('트렌드 타임스탬프 가져오기 실패:', error);
    return null;
  }
}
