/* global chrome */
import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { getStandardTime, updateRanking, getTableRow } from './issue';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Box, Grid, Typography } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

export function Chart({ boxOnly = false, engine = "naver" }) {
  const [ranking, setRanking] = useState([]);
  const [boxDisplay, setBoxDisplay] = useState(boxOnly ? 'block' : 'none');
  const [activeIndex, setActiveIndex] = useState(0);
  const [standardTime, setStandardTime] = useState('');
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
    updateRanking(setRanking, 600);
    getStandardTime(setStandardTime);
  }, []);

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
          backgroundColor: boxOnly ? 'transparent' : 'white',
          width: boxOnly ? '100%' : '300px',
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
                {standardTime} 기준
              </Typography>
            </div>
          </Grid>
        </Grid>

        {ranking &&
          ranking.slice(0, 10).map((issue) => (
            <div
              key={issue.rank}
              style={{ flexGrow: 1, height: '100%', margin: '10px' }}
              onClick={() => {
                const encodedKeyword = encodeURI(issue.keyword);
                if (engine === 'google') {
                  window.location.href = 'https://www.google.com/search?q=' + encodedKeyword;
                } else if (engine === 'daum') {
                  window.location.href = 'https://search.daum.net/search?q=' + encodedKeyword;
                } else if (engine === 'zum') {
                  window.location.href = 'https://search.zum.com/search.zum?query=' + encodedKeyword;
                } else if (engine === 'nate') {
                  window.location.href = 'https://search.daum.net/nate?q=' + encodedKeyword;
                } else {
                  window.location.href = 'https://search.naver.com/search.naver?query=' + encodedKeyword;
                }
              }}
            >
              {getTableRow('naver', issue.rank === activeIndex + 1)(issue)}
            </div>
          ))}
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
                onClick={() => {
                  window.location.href =
                    'https://chrome.google.com/webstore/detail/%EC%8B%A4%EC%8B%9C%EA%B0%84-%EA%B2%80%EC%83%89%EC%96%B4-realtime-trends/dmbaagbmhlhdnlmbcncneijndejlalie';
                }}
              >
                <HelpOutlineIcon
                  style={{
                    color: 'gray',
                    verticalAlign: 'middle',
                  }}
                />
                &nbsp;확장프로그램 '#실시간 검색어' 제공
              </Typography>
            </div>
          </Grid>
        </Grid>
      </Box>
      <Slider
        {...settings}
        style={{
          height: '100%',
          backgroundColor: 'white',
          display: boxOnly ? 'none' : 'block',
        }}
      >
        {ranking &&
          ranking.slice(0, 10).map((issue) => (
            <div
              key={issue.rank}
              style={{ flexGrow: 1, height: '100%' }}
              onMouseEnter={() => {
                setBoxDisplay('block');
              }}
            >
              {getTableRow('naver', false)(issue)}
            </div>
          ))}
      </Slider>
    </>
  );
}
