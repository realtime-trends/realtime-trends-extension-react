/**
 * 크롤러 설정 동적 로더
 * GitHub Pages에서 설정을 가져와서 사용
 * 소스 변경 시 익스텐션 재배포 불필요
 */

export interface CrawlerSource {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  type: 'html' | 'json';
  selector?: {
    type: 'regex' | 'css';
    pattern: string;
  };
  dataPath?: string;
  bias: number;
}

export interface CrawlerConfig {
  sources: CrawlerSource[];
  weights: number[];
  similarityWeight: number;
  exceptKeywords: string[];
}

const CONFIG_URL = 'https://gist.githubusercontent.com/hoyaaaa/e5fbdcfaeba38a9c5e092fcb6db8d679/raw/crawler-config.json';

// 기본 설정 (fallback)
const DEFAULT_CONFIG: CrawlerConfig = {
  sources: [
    {
      id: 'zum',
      name: 'Zum',
      enabled: true,
      url: 'https://zum.com/',
      type: 'html',
      selector: {
        type: 'regex',
        pattern: '<span[^>]*class="[^"]*issue-word-list__keyword[^"]*"[^>]*>([^<]+)<\\/span>'
      },
      bias: 1.0
    },
    {
      id: 'nate',
      name: 'Nate',
      enabled: true,
      url: 'https://www.nate.com/js/data/jsonLiveKeywordDataV1.js',
      type: 'json',
      dataPath: '[i][1]',
      bias: 0.7
    }
  ],
  weights: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
  similarityWeight: 0.7,
  exceptKeywords: ['Yesbet88', 'sanopk']
};

let cachedConfig: CrawlerConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1시간

/**
 * 외부에서 설정 파일 가져오기
 */
async function fetchConfig(url: string): Promise<CrawlerConfig> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const config: CrawlerConfig = await response.json();
    console.log('크롤러 설정 로드 완료');
    return config;
  } catch (error) {
    console.error('설정 파일 로드 실패:', error);
    throw error;
  }
}

/**
 * 크롤러 설정 가져오기 (캐시 포함)
 */
export async function getCrawlerConfig(forceRefresh = false): Promise<CrawlerConfig> {
  const now = Date.now();

  // 캐시가 유효한 경우
  if (!forceRefresh && cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('캐시된 크롤러 설정 사용');
    return cachedConfig;
  }

  try {
    // 외부에서 설정 가져오기
    const config = await fetchConfig(CONFIG_URL);
    cachedConfig = config;
    lastFetchTime = now;
    return config;
  } catch (error) {
    console.warn('외부 설정 로드 실패, 기본 설정 사용');

    // 실패 시 기본 설정 사용
    if (cachedConfig) {
      return cachedConfig;
    }

    return DEFAULT_CONFIG;
  }
}

/**
 * 활성화된 소스만 가져오기
 */
export async function getEnabledSources(): Promise<CrawlerSource[]> {
  const config = await getCrawlerConfig();
  return config.sources.filter(source => source.enabled);
}

/**
 * 특정 소스 가져오기
 */
export async function getSourceById(id: string): Promise<CrawlerSource | null> {
  const config = await getCrawlerConfig();
  return config.sources.find(source => source.id === id) || null;
}
