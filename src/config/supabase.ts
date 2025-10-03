import { createClient } from '@supabase/supabase-js';

// Supabase 설정 - anon key 사용 (안전함)
export const SUPABASE_URL = 'https://ylrreuqbmlucrgwjtwob.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscnJldXFibWx1Y3Jnd2p0d29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzI4OTAsImV4cCI6MjA3NTA0ODg5MH0.5sRM4uwYnJs1T5ux_Kf0NfLzaAbf-A_E9Nw3-wmyfVQ';

// anon key로 읽기 전용 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 트렌드 데이터 타입 정의
export interface SupabaseTrendEntry {
  id: number;
  timestamp: number;
  keyword: string;
  score: number;
  maxscore: number;
  hashed: string;
  delta: number;
  rank: number;
  engine: string;
  created_at: string;
}

// 최신 트렌드 데이터 가져오기
export async function getLatestTrends(): Promise<SupabaseTrendEntry[]> {
  try {
    const { data, error } = await supabase
      .from('latest_trends')
      .select('*')
      .order('score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase에서 트렌드 데이터 가져오기 실패:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('트렌드 데이터 조회 중 오류:', error);
    return [];
  }
}

// 특정 타임스탬프의 트렌드 데이터 가져오기
export async function getTrendsByTimestamp(timestamp: number): Promise<SupabaseTrendEntry[]> {
  try {
    const { data, error } = await supabase
      .from('trend_entries')
      .select('*')
      .eq('timestamp', timestamp)
      .order('rank', { ascending: true });

    if (error) {
      console.error('Supabase에서 타임스탬프별 트렌드 데이터 가져오기 실패:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('타임스탬프별 트렌드 데이터 조회 중 오류:', error);
    return [];
  }
}

// 최근 타임스탬프 목록 가져오기
export async function getRecentTimestamps(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('trend_entries')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase에서 타임스탬프 목록 가져오기 실패:', error);
      return [];
    }

    // 중복 제거하고 정렬
    const timestamps = [...new Set(data.map(item => item.timestamp))];
    return timestamps.sort((a, b) => b - a);
  } catch (error) {
    console.error('타임스탬프 목록 조회 중 오류:', error);
    return [];
  }
}