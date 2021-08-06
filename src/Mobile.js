import React, { Component } from 'react';
import Chart from './Chart';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

class Mobile extends Component {
  componentDidMount() {
    window.Kakao.init('b06b1e7032d222810c11094ca8ce1f81');

    window.Kakao.Link.createDefaultButton({
      container: '#kakao-link-btn',
      objectType: 'feed',
      content: {
        title: '#실시간 검색어 (Realtime Trends)',
        description: '크롬 확장 프로그램 (PC)',
        imageUrl: 'https://lh3.googleusercontent.com/MjrAFi69V1a9F1dU76Y2Rq-cvU-tIiE3dOfhddNxnIEY-0cl9mwyhUzrN2IAC2f4nJfGQcZpZN3OoAN3bhYg5PMB_A=w440-h280-e365-rj-sc0x00ffffff',
        link: {
          mobileWebUrl: window.location.host + "/" + process.env.REACT_APP_MOBILE_WEB_ENDPOINT,
          webUrl: window.location.host + "/" + process.env.REACT_APP_WEB_ENDPOINT
        }
      },
      social: {
        likeCount: 849,
      },
      buttons: [
        {
          title: '다운로드 (PC)',
          link: {
            mobileWebUrl: 'https://chrome.google.com/webstore/detail/%EC%8B%A4%EC%8B%9C%EA%B0%84-%EA%B2%80%EC%83%89%EC%96%B4-realtime-trends/dmbaagbmhlhdnlmbcncneijndejlalie',
            webUrl: 'https://chrome.google.com/webstore/detail/%EC%8B%A4%EC%8B%9C%EA%B0%84-%EA%B2%80%EC%83%89%EC%96%B4-realtime-trends/dmbaagbmhlhdnlmbcncneijndejlalie'
          }
        },
        {
          title: '웹페이지 방문',
          link: {
            mobileWebUrl: window.location.host + "/" + process.env.REACT_APP_MOBILE_WEB_ENDPOINT,
            webUrl: window.location.host + "/" + process.env.REACT_APP_WEB_ENDPOINT
          }
        }
      ]
    });
  }
  onClickKakao = () => {
    window.open('https://sharer.kakao.com/talk/friends/picker/link')
  }
    render() {
        return (
          <Container maxWidth="sm">
            <Grid container spacing={0}
  alignItems="center"
  justify="center"
  direction="column"
  item={true}
  style={{ minHeight: '100vh' }}>
            <Grid item xs={12}>
            <Paper elevation={10}>
              <Chart width="100%"/>
              <Typography align="center" variant="subtitle2" style={{'font-weight': 'bold'}}>
                  PC 크롬에 설치하기 위해 자신 또는 친구에게 공유합니다.
                </Typography>
              <img id="kakao-link-btn" src={"http://app.stopbook.com/images/img-sub/btn-att-kak.png"} alt="kakao" onClick={this.onClickKakao} style={{display: "table-row"}}/>
              </Paper>
              </Grid>
              </Grid>
            </Container>
        );
    }
}

export default Mobile;
