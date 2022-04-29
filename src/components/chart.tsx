/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import Trend from '../models/trend';
import ChartRow from './chart-row';
import { getStandardTime, updateTrends } from '../trends';
import ChartBox from './chart-box';
// import '../tailwind.css'

interface PropsType {
  boxOnly: boolean,
  searchEngine: number,
  backgroundSelector: string
}

const getBackgroundColor = (backgroundSelector: string) => {
  let backgroundElement = document.querySelector(backgroundSelector);
  if (backgroundElement == null) {
    backgroundElement = document.querySelector("body");
  }

  if (backgroundElement == null) {
    return "rgb(256,256,256)"
  }
  let backgroundColor = window.getComputedStyle(backgroundElement).backgroundColor;
  if (backgroundColor.includes("rgba")) {
    let colorArr = backgroundColor.slice(
      backgroundColor.indexOf("(") + 1, 
      backgroundColor.indexOf(")")
    ).split(", ");
    backgroundColor = "rgb(" + colorArr.slice(0, 3).join(", ") + ")";
  }
  return backgroundColor;
}
/**
 * ChartBox for web.
 *
 * @component
 * @example
 * return (
 *  <ChartBox/>
 * )
 * @return {JSX.Element}
 */
const Chart = ({boxOnly, searchEngine, backgroundSelector}: PropsType): JSX.Element => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [boxDisplay, setBoxDisplay] = useState(boxOnly ? 'block' : 'none');
  const [activeIndex, setActiveIndex] = useState(0);
  const [standardTime, setStandardTime] = useState('');
  const backgroundColor = getBackgroundColor(backgroundSelector);
  const css = chrome.extension.getURL("/static/css/content.css");
  var settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    vertical: true,
    arrows: false,
    centerMode: true,
    pauseOnHover: false,
    afterChange: setActiveIndex,
  };

  useEffect(() => {
    updateTrends(setTrends);
    getStandardTime(setStandardTime);
  }, []);



  return (
    <div id="#chart">
      <ChartBox trends={trends} searchEngine={searchEngine} />
    </div>
  );
};

export default Chart;