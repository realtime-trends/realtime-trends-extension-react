import React, { useState, useEffect } from 'react';
import { getStorageBySearchQueries, exportSearchQueriesToJSON } from './searchQueries';
import { SearchQuery } from './types/searchQueries';

const QueriesPage: React.FC = () => {
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [filter, setFilter] = useState<'all' | 'google' | 'naver'>('all');
  
  useEffect(() => {
    loadQueries();
  }, []);
  
  const loadQueries = () => {
    getStorageBySearchQueries((data) => {
      // 최신 쿼리가 위에 오도록 정렬
      const sortedQueries = [...data.queries].sort((a, b) => b.timestamp - a.timestamp);
      setQueries(sortedQueries);
    });
  };
  
  const handleExport = async () => {
    const jsonString = await exportSearchQueriesToJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-queries-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ko-KR');
  };
  
  const filteredQueries = queries.filter((q) => {
    if (filter === 'all') return true;
    return q.engine === filter;
  });
  
  return (
    <div className="queries-container">
      <h1>저장된 검색 쿼리</h1>
      
      <div className="filter-controls">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          모두 보기
        </button>
        <button 
          className={filter === 'google' ? 'active' : ''} 
          onClick={() => setFilter('google')}
        >
          구글
        </button>
        <button 
          className={filter === 'naver' ? 'active' : ''} 
          onClick={() => setFilter('naver')}
        >
          네이버
        </button>
      </div>
      
      <button className="export-button" onClick={handleExport}>
        JSON으로 내보내기
      </button>
      
      <table className="queries-table">
        <thead>
          <tr>
            <th>검색 엔진</th>
            <th>검색어</th>
            <th>검색 시간</th>
          </tr>
        </thead>
        <tbody>
          {filteredQueries.length > 0 ? (
            filteredQueries.map((query, index) => (
              <tr key={index}>
                <td>{query.engine === 'google' ? '구글' : '네이버'}</td>
                <td>{query.query}</td>
                <td>{formatDate(query.timestamp)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>저장된 검색 쿼리가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default QueriesPage;
