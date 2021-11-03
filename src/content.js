import ReactDOM from 'react-dom';

import { Naver } from './webWidget';

import './content.css';

const chartElement = document.createElement('div');
chartElement.style.height = '100%';

if (['www.naver.com', 'naver.com'].includes(window.location.hostname)) {
  const weatherElement = document.getElementById('NM_WEATHER');
  while (weatherElement.hasChildNodes()) {
    weatherElement.removeChild(weatherElement.firstChild);
  }
  weatherElement.appendChild(chartElement);

  ReactDOM.render(<Naver boxOnly={false} />, chartElement);
} else if (['search.naver.com'].includes(window.location.hostname)) {
  const sidebar = document.getElementById('sub_pack');
  const section = document.createElement('section');
  section.classList.add('sc_new');
  chartElement.classList.add('api_subject_bx');
  section.appendChild(chartElement);
  sidebar.insertBefore(section, sidebar.firstChild);

  ReactDOM.render(<Naver boxOnly={true} />, chartElement);
}
