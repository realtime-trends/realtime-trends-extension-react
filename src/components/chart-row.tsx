/* eslint-disable max-len */
import React from 'react';
import {ArrowUpIcon} from '@heroicons/react/solid';
import {ArrowDownIcon} from '@heroicons/react/solid';
import {MinusIcon} from '@heroicons/react/solid';
import {TrendingUpIcon} from '@heroicons/react/solid';
import Trend from '../models/trend';
// import '../tailwind.css'

interface propTypes {
    trend: Trend,
    ranking: number,
    bold: boolean
}

/**
 * ChartRow for ChartBox.
 *
 * @param {Trend} trend Trend type.
 * @param {int} ranking Ranking number.
 * @return {JSX.Element}
 */
function ChartRow({trend, ranking, bold}: propTypes) {
  return (
    <div className={'grid grid-cols-12 ' + (bold ? 'font-bold': '')}>
      <div className='col-span-2 text-center'>{ranking}</div>
      <div className='col-span-7 truncate'>{'#' + trend.keyword}</div>
      <div className='col-span-3 flex justify-center items-center'>
        {trend.delta === 999 ? (
                                 <TrendingUpIcon className='h-5 w-5 text-orange-500'/>
                             ) : trend.delta > 0 ? (
                                <>
                                  <ArrowUpIcon className='h-4 w-4 text-red-500'/>
                                  {Math.abs(trend.delta)}</>
                             ) : trend.delta < 0 ? (
                                <>
                                  <ArrowDownIcon className='h-4 w-4 text-blue-500'
                                  />
                                  {Math.abs(trend.delta)}</>
                             ) : (
                                 <MinusIcon className='h-5 w-5 text-gray-500'
                                 />
                             )}
      </div>
    </div>
  );
};

export default ChartRow;