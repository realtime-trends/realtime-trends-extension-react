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
      <div className="flex items-center text-orange-500">
        <svg className="w-7 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-5 14H9v-2h6v2zm3.5-4L15 10.5 12.5 14 10 10.5 6.5 14H4.5l5.5-7 5.5 7z"/>
        </svg>
      </div>
    );
  } else if (delta > 0) {
    return (
      <div className="flex items-center text-red-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
        <span className="text-xs">{Math.abs(delta)}</span>
      </div>
    );
  } else if (delta < 0) {
    return (
      <div className="flex items-center text-blue-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
        <span className="text-xs">{Math.abs(delta)}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13H5v-2h14v2z"/>
        </svg>
      </div>
    );
  }
}

function ChartRow({ trend, activeRanking, ranking }: ChartRowProps): React.ReactElement {
  const bold = ranking === activeRanking;
  return (
    <div className="flex items-center h-full w-full">
      <div className="flex-shrink-0 w-8 flex items-center justify-center">
        <span className="font-bold text-base text-gray-800">
          {ranking}
        </span>
      </div>
      <div className="flex-1 flex items-center px-2">
        <span 
          className={`text-xs truncate w-full ${
            bold ? 'font-bold' : 'font-normal'
          } text-gray-800`}
        >
          #{trend.keyword}
        </span>
      </div>
      <div className="flex-shrink-0 w-12 flex items-center justify-center">
        {getIconByDelta(trend.delta)}
      </div>
    </div>
  );
}

export default ChartRow;
