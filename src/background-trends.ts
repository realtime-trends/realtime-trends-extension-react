import { getRecentTimestamps, getTrendsByTimestamp, type SupabaseTrendEntry } from './config/github-data';

interface TrendsObject {
  timestamps: number[];
  [key: number]: SupabaseTrendEntry[];
}

// GitHub에서 트렌드 데이터를 가져와 Chrome Storage 형식으로 변환
export async function setStorageByTrends(trendsObject?: TrendsObject): Promise<void> {
  try {
    let finalTrendsObject: TrendsObject;
    
    if (trendsObject) {
      // 기존 방식 (매개변수로 받은 경우)
      finalTrendsObject = trendsObject;
    } else {
      // 새로운 방식: GitHub에서 데이터 가져오기
      const timestamps = await getRecentTimestamps();
      finalTrendsObject = { timestamps };
      
      // 각 타임스탬프별 트렌드 데이터 가져오기
      for (const timestamp of timestamps) {
        const trends = await getTrendsByTimestamp(timestamp);
        finalTrendsObject[timestamp] = trends;
      }
    }

    // Chrome Storage에 저장
    chrome.storage.local.set({ trends: finalTrendsObject }, () => {
      if (chrome.runtime.lastError) {
        console.error({
          status: 'error',
          msg: chrome.runtime.lastError,
        });
      } else {
        console.log('트렌드 데이터가 Chrome Storage에 저장되었습니다');
      }
    });
  } catch (error) {
    console.error('GitHub 트렌드 데이터 처리 중 오류:', error);
  }
}