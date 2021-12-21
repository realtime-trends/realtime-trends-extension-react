import ReactDOM from 'react-dom';
import Chart from '../components/Chart';
import './content.css';

const checkElement = (selector, callback) => {
  var check = setInterval(() => {
    const e = document.querySelector(selector);
    if (e)  {
      callback(e);
      clearInterval(check);
    }
  }, 100);
}


const chartElement = document.createElement('div');
chartElement.style.height = '100%';

if (['www.naver.com', 'naver.com'].includes(window.location.hostname) && ['/'].includes(window.location.pathname)) {
  chartElement.style.minWidth = '270px';
  chartElement.style.maxWidth = '270px';
  checkElement("#NM_WEATHER", (weatherElement) => {
    while (weatherElement.hasChildNodes()) {
      weatherElement.removeChild(weatherElement.firstChild);
    }
    weatherElement.appendChild(chartElement);

    let backgroundSeletor = "#header"
  
    ReactDOM.render(<Chart boxOnly={false} engine="naver" backgroundSelector={backgroundSeletor}/>, chartElement);
  });
} else if (['search.naver.com'].includes(window.location.hostname) && ['/search.naver'].includes(window.location.pathname)) {
  checkElement("#sub_pack", (sidebar) => {
    const section = document.createElement('section');
    section.classList.add('sc_new');
    chartElement.classList.add('api_subject_bx');
    section.appendChild(chartElement);
    sidebar.insertBefore(section, sidebar.firstChild);

    let backgroundSeletor = "#lnb"

    ReactDOM.render(<Chart boxOnly={true} engine="naver" backgroundSelector={backgroundSeletor}/>, chartElement);
  });  
} else if (['www.google.com', 'google.com'].includes(window.location.hostname) && ['/', '/webhp', '/search'].includes(window.location.pathname)) {
  chartElement.style.minWidth = '270px';
  chartElement.style.maxWidth = '270px';
  checkElement("#gb > div", (appBarElement) => {
    appBarElement.insertBefore(chartElement, appBarElement.firstChild);

    let backgroundSeletor = (window.location.pathname == "/search") ? "#searchform > div > div" : "body";

    ReactDOM.render(<Chart boxOnly={false} engine="google" backgroundSelector={backgroundSeletor}/>, chartElement);
  });
}
