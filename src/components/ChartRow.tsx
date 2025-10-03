import React from 'react';

interface TrendItem {
  keyword: string;
  delta: number;
}

interface ChartRowProps {
  trend: TrendItem;
  activeRanking: number;
  ranking: number;
}

function getIconByDelta(delta: number): React.ReactNode {
  if (delta === 999) {
    return (
      <div className="flex items-center">
        <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded">NEW</span>
      </div>
    );
  } else if (delta > 0) {
    return (
      <div className="flex items-center text-red-500">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
        <span className="text-xs font-medium ml-0.5">{Math.abs(delta)}</span>
      </div>
    );
  } else if (delta < 0) {
    return (
      <div className="flex items-center text-blue-500">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
        <span className="text-xs font-medium ml-0.5">{Math.abs(delta)}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-400">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13H5v-2h14v2z"/>
        </svg>
      </div>
    );
  }
}

function ChartRow({ trend, activeRanking, ranking }: ChartRowProps): React.ReactElement {
  const bold = ranking === activeRanking;
  const isTopThree = ranking <= 3;
  
  return (
    <div className="flex items-center rounded-md hover:bg-gray-50 transition-colors">
      {/* 순위 */}
      <div className="flex-shrink-0 w-6 flex items-center justify-center">
        <span className={`text-sm font-bold ${
          isTopThree ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {ranking}
        </span>
      </div>
      
      {/* 키워드 */}
      <div className="flex-1 px-2 min-w-0">
        <span className={`text-sm truncate block ${
          bold ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
        }`}>
          {trend.keyword}
        </span>
      </div>
      
      {/* 변화량 */}
      <div className="flex-shrink-0 flex items-center justify-end">
        {getIconByDelta(trend.delta)}
      </div>
    </div>
  );
}

export default ChartRow;
