export interface SearchQuery {
  query: string;
  engine: 'google' | 'naver';
  timestamp: number;
  keywords?: string[];
}

export interface SearchQueriesStorage {
  queries: SearchQuery[];
}
