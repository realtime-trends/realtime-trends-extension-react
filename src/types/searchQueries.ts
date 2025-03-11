export interface SearchQuery {
  query: string;
  engine: 'google' | 'naver';
  timestamp: number;
}

export interface SearchQueriesStorage {
  queries: SearchQuery[];
}
