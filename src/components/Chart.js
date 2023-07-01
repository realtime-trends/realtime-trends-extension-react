/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-array-index-key */
import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { Box, Button, Grid, Typography } from '@material-ui/core';
import FeedbackIcon from '@material-ui/icons/Feedback';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PropTypes from 'prop-types';
import { getStandardTime, updateTrends } from '../trends';
import ChartRow from './ChartRow';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function Chart({ boxOnly, engine, backgroundSelector, boxWidth }) {
  const [trends, setTrends] = useState([]);
  const [boxDisplay, setBoxDisplay] = useState(boxOnly ? 'block' : 'none');
  const [activeIndex, setActiveIndex] = useState(0);
  const [standardTime, setStandardTime] = useState('');
  const [isFooterHover, setIsFooterHover] = useState(false);
  const settings = {
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

  let backgroundElement = document.querySelector(backgroundSelector);
  if (backgroundElement == null) {
    backgroundElement = document.querySelector('body');
  }

  let { backgroundColor } = window.getComputedStyle(backgroundElement);
  if (backgroundColor.includes('rgba')) {
    const colorArr = backgroundColor.slice(
      backgroundColor.indexOf('(') + 1,
      backgroundColor.indexOf(')'),
    ).split(', ');
    backgroundColor = `rgb(${colorArr.slice(0, 3).join(', ')})`;
  }

  return (
    <>
      <Box
        onMouseLeave={() => {
          if (!boxOnly) setBoxDisplay('none');
        }}
        style={{
          zIndex: boxOnly ? 0 : 10,
          display: boxDisplay,
          position: boxOnly ? 'relative' : 'absolute',
          backgroundColor,
          width: boxWidth,
        }}
        border={boxOnly ? 0 : 1}
        borderRadius="borderRadius"
        borderColor="lightgray"
      >
        <Grid
          container
          direction="row"
          spacing={0}
          style={{ height: '100%', padding: '10px' }}
        >
          <Grid item xs={5}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                textAlign: 'left',
                height: '100%',
              }}
            >
              <Typography
                style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'inline-block',
                  width: '100%',
                }}
              >
                급상승 검색어
              </Typography>
            </div>
          </Grid>
          <Grid item xs={7}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                textAlign: 'Right',
                height: '100%',
              }}
            >
              <Typography
                style={{
                  fontWeight: 'normal',
                  fontSize: '9px',
                  display: 'inline-block',
                  width: '100%',
                  color: 'lightgray',
                }}
              >
                {standardTime}
                {' '}
                기준
              </Typography>
            </div>
          </Grid>
        </Grid>

        {trends
          && trends.slice(0, 10).map((trend, index) => (
            <div
              key={index + 1}
              style={{ flexGrow: 1, height: '100%', margin: '10px' }}
              onClick={() => {
                const encodedKeyword = encodeURI(trend.keyword);
                if (engine === 'google') {
                  window.location.href = `https://www.google.com/search?q=${encodedKeyword}`;
                } else if (engine === 'daum') {
                  window.location.href = `https://search.daum.net/search?q=${encodedKeyword}`;
                } else if (engine === 'zum') {
                  window.location.href = `https://search.zum.com/search.zum?query=${encodedKeyword}`;
                } else if (engine === 'nate') {
                  window.location.href = `https://search.daum.net/nate?q=${encodedKeyword}`;
                } else {
                  window.location.href = `https://search.naver.com/search.naver?query=${encodedKeyword}`;
                }
              }}
            >
              <ChartRow trend={trend} activeRanking={activeIndex + 1} ranking={index + 1} />
            </div>
          ))
        }
        <Grid
          container
          direction="row"
          spacing={0}
          style={{ height: '100%', padding: '10px' }}
        >
          <Grid item xs={12}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                textAlign: 'left',
                height: '100%',
              }}
            >
              <Typography
                style={{
                  fontWeight: 'bold',
                  fontSize: '10px',
                  display: 'inline-block',
                  width: '100%',
                  color: 'gray',
                }}
              >
                <HelpOutlineIcon
                  style={{
                    color: 'gray',
                    verticalAlign: 'middle',
                  }}
                />
                &nbsp;확장프로그램 &lsquo;리얼타임 실시간 검색어&rsquo; 제공
              </Typography>
            </div>
          </Grid>
        </Grid>
        <Grid
          container
          direction="row"
          spacing={0}
          style={{
            height: '100%',
            padding: '10px',
            opacity: isFooterHover ? 0.8 : 0.3,
          }}
          onMouseOver={() => {
            setIsFooterHover(true);
          }}
          onMouseOut={() => {
            setIsFooterHover(false);
          }}
        >
          <Grid item xs={12} sx={{ mb: 2 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                textAlign: 'left',
                height: '100%',
              }}
            >
              <Typography
                style={{
                  fontWeight: 'bold',
                  fontSize: '10px',
                  display: 'inline-block',
                  width: '100%',
                  color: 'black',
                }}
              >
                <FeedbackIcon
                  style={{
                    color: 'black',
                    verticalAlign: 'middle',
                  }}
                />
                이 서비스가 마음에 드신다면...
              </Typography>
            </div>
          </Grid>
          <Grid item xs={6}>
            <Button variant="outlined" size="small" href="https://chrome.google.com/webstore/detail/dmbaagbmhlhdnlmbcncneijndejlalie" target="_blank" style={{ width: '100%' }}>
              리뷰쓰기
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="outlined" size="small" href="https://hoyaaaa.github.io/donate" target="_blank" style={{ width: '100%' }}>
              후원하기
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Slider
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...settings}
        style={{
          height: '100%',
          backgroundColor,
          display: boxOnly ? 'none' : 'block',
        }}
      >
        {trends
          && trends.slice(0, 10).map((trend, index) => (
            <div
              key={index + 1}
              style={{ flexGrow: 1, height: '100%' }}
              onMouseEnter={() => {
                setBoxDisplay('block');
              }}
            >
              <ChartRow trend={trend} activeRanking={-1} ranking={index + 1} />
            </div>
          ))}
      </Slider>
    </>
  );
}

Chart.propTypes = {
  boxOnly: PropTypes.bool,
  engine: PropTypes.string,
  backgroundSelector: PropTypes.string,
};

Chart.defaultProps = {
  boxOnly: false,
  engine: 'naver',
  backgroundSelector: 'body',
};

export default Chart;
