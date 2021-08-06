/* global chrome */
import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Chart from './Chart';
import Mobile from './Mobile';
import 'bulma/css/bulma.min.css';
// import { Container } from 'react-bulma-components';

class App extends Component {
    render() {
      const reload = () => window.location.reload();
      if (typeof chrome === 'undefined' || chrome.extension === undefined) {
        return (
          <Router>
            <Switch>
              <Route exact path="/mobile" component={Mobile}/>
              <Route path="/privacy.html" onEnter={reload} />
            </Switch>
          </Router>
        );
      } else {
        return (
          <Chart />
        );
      }
    }
}

export default App;