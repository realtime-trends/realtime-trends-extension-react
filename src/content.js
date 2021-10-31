import ReactDOM from 'react-dom';

import { Naver } from './webWidget';

import "./content.css";

const chartElement = document.createElement("div");
chartElement.style.height = "100%";
const weatherElement = document.getElementById("NM_WEATHER");
while (weatherElement.hasChildNodes()) {
    weatherElement.removeChild( weatherElement.firstChild );
}
weatherElement.appendChild(chartElement);
ReactDOM.render(<Naver/>, chartElement);
