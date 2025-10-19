/**
 * 트렌드 크롤러 - 동적 설정 기반 트렌드 데이터 수집
 * 설정 파일(GitHub Pages)에서 크롤링 소스를 동적으로 로드
 * 소스 변경 시 익스텐션 재배포 불필요
 */

import { getCrawlerConfig, getEnabledSources, type CrawlerSource } from '../config/crawlerConfig';

export interface TrendEntry {
  keyword: string;
  score: number;
  maxscore: number;
  hashed: string;
  delta: number;
  rank?: number;
  engine: string;
  created_at?: string;
}

/**
 * 키워드 처리: 특수문자 제거, 공백 정규화
 */
function processKeyword(keyword: string, exceptKeywords: string[] = []): string | null {
  // 특수문자 제거 및 공백 정규화
  keyword = keyword.replace(/[!@#$%^&*\(\)\[\]\{\};:,./<>?\|`]/g, ' ');
  keyword = keyword.replace(/ +/g, ' ').trim();

  // 예외 키워드 체크
  for (const exceptKeyword of exceptKeywords) {
    if (keyword.toLowerCase().includes(exceptKeyword.toLowerCase())) {
      return null;
    }
  }

  return keyword;
}

/**
 * 키워드 해시 생성 (간단한 해시 함수)
 */
async function getKeywordHash(keyword: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(keyword.replace(/ /g, ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * HTML 소스에서 트렌드 크롤링
 */
async function getTrendsFromHTML(
  source: CrawlerSource,
  weights: number[],
  exceptKeywords: string[]
): Promise<TrendEntry[]> {
  try {
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`${source.name} HTTP ${response.status}`);
    }

    const html = await response.text();

    // Regex로 키워드 파싱
    const regex = new RegExp(source.selector!.pattern, 'g');
    const keywordElements: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      keywordElements.push(match[1].trim());
    }

    const trends: TrendEntry[] = [];

    for (let i = 0; i < Math.min(keywordElements.length, weights.length); i++) {
      const keywordText = keywordElements[i];
      const keyword = processKeyword(keywordText, exceptKeywords);

      if (keyword) {
        const score = weights[i] * source.bias;
        const hashed = await getKeywordHash(keyword);
        trends.push({
          keyword,
          score,
          maxscore: score,
          hashed,
          delta: 999, // NEW 표시
          engine: source.id
        });
      }
    }

    console.log(`${source.name}에서 ${trends.length}개 트렌드 수집 완료`);
    return trends;
  } catch (error) {
    console.error(`${source.name} 크롤링 오류:`, error);
    return [];
  }
}

/**
 * JSON 소스에서 트렌드 크롤링
 */
async function getTrendsFromJSON(
  source: CrawlerSource,
  weights: number[],
  exceptKeywords: string[]
): Promise<TrendEntry[]> {
  try {
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`${source.name} HTTP ${response.status}`);
    }

    const data = await response.json();
    const trends: TrendEntry[] = [];

    for (let i = 0; i < Math.min(data.length, weights.length); i++) {
      if (data[i] && data[i][1]) {
        const keyword = processKeyword(data[i][1], exceptKeywords);
        if (keyword) {
          const score = weights[i] * source.bias;
          const hashed = await getKeywordHash(keyword);
          trends.push({
            keyword,
            score,
            maxscore: score,
            hashed,
            delta: 999,
            engine: source.id
          });
        }
      }
    }

    console.log(`${source.name}에서 ${trends.length}개 트렌드 수집 완료`);
    return trends;
  } catch (error) {
    console.error(`${source.name} 크롤링 오류:`, error);
    return [];
  }
}

/**
 * 단일 소스에서 트렌드 크롤링
 */
async function getTrendsFromSource(
  source: CrawlerSource,
  weights: number[],
  exceptKeywords: string[]
): Promise<TrendEntry[]> {
  if (source.type === 'html') {
    return getTrendsFromHTML(source, weights, exceptKeywords);
  } else if (source.type === 'json') {
    return getTrendsFromJSON(source, weights, exceptKeywords);
  } else {
    console.warn(`Unknown source type: ${source.type}`);
    return [];
  }
}

/**
 * 모든 소스에서 트렌드 수집 및 통합 점수 계산
 */
export async function calculateTrends(): Promise<TrendEntry[]> {
  try {
    // 설정 가져오기
    const config = await getCrawlerConfig();
    const sources = await getEnabledSources();

    if (sources.length === 0) {
      console.warn('활성화된 크롤링 소스가 없습니다');
      return [];
    }

    // 병렬로 모든 소스에서 트렌드 수집
    const trendsPromises = sources.map(source =>
      getTrendsFromSource(source, config.weights, config.exceptKeywords)
    );

    const trendsResults = await Promise.all(trendsPromises);
    const allTrends = trendsResults.flat();

    if (allTrends.length === 0) {
      console.warn('수집된 트렌드가 없습니다');
      return [];
    }

    const trendsMap = new Map<string, TrendEntry>();

    // 같은 해시의 트렌드 병합
    for (const trend of allTrends) {
      if (trendsMap.has(trend.hashed)) {
        const existing = trendsMap.get(trend.hashed)!;
        existing.score += trend.score;
        existing.maxscore = Math.max(existing.maxscore, trend.maxscore);
      } else {
        trendsMap.set(trend.hashed, { ...trend });
      }
    }

    // 유사도 처리 (키워드 포함 관계)
    const trends = Array.from(trendsMap.values());
    const toRemove = new Set<string>();

    for (let i = 0; i < trends.length; i++) {
      for (let j = 0; j < trends.length; j++) {
        if (i !== j && !toRemove.has(trends[i].hashed)) {
          if (trends[j].keyword.includes(trends[i].keyword)) {
            trends[j].score += trends[i].score * config.similarityWeight;
            trends[j].maxscore = Math.max(trends[j].maxscore, trends[i].maxscore);
            toRemove.add(trends[i].hashed);
          }
        }
      }
    }

    // 제거 대상 필터링 및 점수로 정렬
    const finalTrends = trends
      .filter(trend => !toRemove.has(trend.hashed))
      .sort((a, b) => b.score - a.score);

    console.log(`최종 ${finalTrends.length}개 트렌드 계산 완료`);
    return finalTrends;
  } catch (error) {
    console.error('트렌드 계산 오류:', error);
    return [];
  }
}

/**
 * 이전 트렌드와 비교하여 delta(순위 변동) 설정
 */
export function setDelta(newTrends: TrendEntry[], oldTrends: TrendEntry[]): TrendEntry[] {
  const oldTrendsMap = new Map<string, number>();

  oldTrends.forEach((trend, index) => {
    oldTrendsMap.set(trend.hashed, index);
  });

  return newTrends.map((trend, newIndex) => {
    const oldIndex = oldTrendsMap.get(trend.hashed);
    if (oldIndex !== undefined) {
      // 순위가 올라간 경우 양수, 내려간 경우 음수
      trend.delta = oldIndex - newIndex;
    } else {
      // 새로운 키워드
      trend.delta = 999;
    }
    trend.rank = newIndex + 1;
    trend.created_at = new Date().toISOString();
    return trend;
  });
}
