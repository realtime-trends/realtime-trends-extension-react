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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          padding: '2px 6px',
          fontSize: '10px',
          fontWeight: '600',
          backgroundColor: '#fed7aa',
          color: '#ea580c',
          borderRadius: '4px'
        }}>NEW</span>
      </div>
    );
  } else if (delta > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', color: '#ef4444' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', marginRight: '2px' }}>
          {Math.abs(delta)}
        </span>
        <span style={{ 
          width: '0', 
          height: '0', 
          borderLeft: '4px solid transparent', 
          borderRight: '4px solid transparent', 
          borderBottom: '6px solid #ef4444' 
        }}></span>
      </div>
    );
  } else if (delta < 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', marginRight: '2px' }}>
          {Math.abs(delta)}
        </span>
        <span style={{ 
          width: '0', 
          height: '0', 
          borderLeft: '4px solid transparent', 
          borderRight: '4px solid transparent', 
          borderTop: '6px solid #3b82f6' 
        }}></span>
      </div>
    );
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
        <span style={{ 
          width: '12px', 
          height: '2px', 
          backgroundColor: '#9ca3af',
          borderRadius: '1px'
        }}></span>
      </div>
    );
  }
}

function ChartRow({ trend, activeRanking, ranking }: ChartRowProps): React.ReactElement {
  const bold = ranking === activeRanking;
  const isTopThree = ranking <= 3;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderRadius: '6px',
      padding: '4px 0',
      transition: 'background-color 0.2s'
    }}>
      {/* 순위 */}
      <div style={{
        flexShrink: 0,
        width: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '700',
          color: isTopThree ? '#2563eb' : '#6b7280'
        }}>
          {ranking}
        </span>
      </div>
      
      {/* 키워드 */}
      <div style={{
        flex: 1,
        padding: '0 8px',
        minWidth: 0
      }}>
        <span style={{
          fontSize: '13px',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: bold ? '600' : '500',
          color: bold ? '#111827' : '#374151'
        }}>
          {trend.keyword}
        </span>
      </div>
      
      {/* 변화량 */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
        {getIconByDelta(trend.delta)}
      </div>
    </div>
  );
}

export default ChartRow;
