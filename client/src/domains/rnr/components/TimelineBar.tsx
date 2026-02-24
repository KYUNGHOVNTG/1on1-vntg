import React from 'react';
import type { RrPeriod } from '../types';

interface TimelineBarProps {
  periods: RrPeriod[];
  year: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * 시작 월에 해당하는 Tailwind grid column start 클래스를 반환합니다.
 */
const getColStartClass = (month: number) => {
  const map: Record<number, string> = {
    1: 'col-start-1',
    2: 'col-start-2',
    3: 'col-start-3',
    4: 'col-start-4',
    5: 'col-start-5',
    6: 'col-start-6',
    7: 'col-start-7',
    8: 'col-start-8',
    9: 'col-start-9',
    10: 'col-start-10',
    11: 'col-start-11',
    12: 'col-start-12',
  };
  return map[month] || 'col-start-1';
};

/**
 * 수행 기간(개월 수)에 해당하는 Tailwind grid column span 클래스를 반환합니다.
 */
const getColSpanClass = (span: number) => {
  const map: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
  };
  return map[span] || 'col-span-1';
};

export const TimelineBar: React.FC<TimelineBarProps> = ({ periods, year }) => {
  return (
    <div className="w-full">
      {/* 바 영역 */}
      <div className="grid grid-cols-12 gap-1 h-2 w-full bg-gray-100 rounded-full mb-1">
        {periods.map((period) => {
          // 'YYYYMM' 형식에서 년/월 추출
          const startYear = period.start_date.substring(0, 4);
          const endYear = period.end_date.substring(0, 4);
          
          // 조회 연도와 무관한 기간은 제외
          if (startYear > year || endYear < year) return null;
          
          let startMonth = parseInt(period.start_date.substring(4, 6), 10);
          let endMonth = parseInt(period.end_date.substring(4, 6), 10);
          
          // 기간이 연도를 걸치는 경우 현재 연도에 맞게 보정
          if (startYear < year) startMonth = 1;
          if (endYear > year) endMonth = 12;
          
          const span = endMonth - startMonth + 1;
          if (span <= 0) return null;
          
          return (
            <div 
              key={period.seq} 
              className={`row-start-1 h-full bg-[#4950DC] rounded-full ${getColStartClass(startMonth)} ${getColSpanClass(span)}`}
              title={`${period.start_date} ~ ${period.end_date}`}
            />
          );
        })}
      </div>
      
      {/* 레이블 영역 */}
      <div className="grid grid-cols-12 text-[10px] text-gray-400 font-medium">
        {MONTHS.map((month, idx) => (
          <div key={idx} className="text-center">
            {month}
          </div>
        ))}
      </div>
    </div>
  );
};
