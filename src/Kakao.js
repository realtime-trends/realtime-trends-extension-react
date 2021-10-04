import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';

class Kakao extends Component {
  componentDidMount() {
    const url = 'https://chrome.google.com/webstore/detail/%EC%8B%A4%EC%8B%9C%EA%B0%84-%EA%B2%80%EC%83%89%EC%96%B4-realtime-trends/dmbaagbmhlhdnlmbcncneijndejlalie'
    
    window.Kakao.init('b06b1e7032d222810c11094ca8ce1f81');

    window.Kakao.Link.createDefaultButton({
      container: '#kakao-link-btn',
      objectType: 'feed',
      content: {
        title: '#실시간 검색어 (Realtime Trends)',
        description: '크롬 확장 프로그램 (PC)',
        imageUrl: 'https://lh3.googleusercontent.com/MjrAFi69V1a9F1dU76Y2Rq-cvU-tIiE3dOfhddNxnIEY-0cl9mwyhUzrN2IAC2f4nJfGQcZpZN3OoAN3bhYg5PMB_A=w440-h280-e365-rj-sc0x00ffffff',
        link: {
          mobileWebUrl: url,
          webUrl: url
        }
      },
      social: {
        likeCount: 849,
      },
      buttons: [
        {
          title: '다운로드 (PC)',
          link: {
            mobileWebUrl: url,
            webUrl: url
          }
        },
      ]
    });
  }
  onClickKakao = () => {
    window.open('https://sharer.kakao.com/talk/friends/picker/link')
  }
    render() {
        return (
              <img id="kakao-link-btn" src={"http://app.stopbook.com/images/img-sub/btn-att-kak.png"} alt="kakao" onClick={this.onClickKakao} style={{display: "table-row", width: "250px", height: "40px"}}/>
        );
    }
}

export default Kakao;
