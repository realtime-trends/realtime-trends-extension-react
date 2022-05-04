/* eslint-disable no-console */
/* eslint-disable no-prototype-builtins */
/* global chrome */
import React, { useEffect } from 'react';
import './index.css';
import {
  FormControl, FormControlLabel, FormGroup, Card,
  Switch, CardContent, CardActions, styled, alpha, Typography,
} from '@material-ui/core';

const INITIAL_STATE = {
  naver: true,
  google: true,
};

function setStorageBySettings(content) {
  chrome.storage.local.set({ settings: content }, () => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      console.log({
        status: 'success',
        msg: 'save settings items',
      });
    }
  });
}

export function getStorageBySettings(callback) {
  chrome.storage.local.get('settings', (items) => {
    if (chrome.runtime.lastError) {
      console.error({
        status: 'error',
        msg: chrome.runtime.lastError,
      });
    } else {
      let cached = {};
      if (items.hasOwnProperty('settings')) {
        cached = items.settings;
        callback(cached);
      } else {
        setStorageBySettings(INITIAL_STATE);
        callback(INITIAL_STATE);
      }
    }
  });
}

const ColorSwitch = styled(Switch)(({ theme, switchColor }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: switchColor,
    '&:hover': {
      backgroundColor: alpha(switchColor, theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: switchColor,
  },
}));

export default function Popup() {
  const [state, setState] = React.useState(INITIAL_STATE);

  const handleChange = (event) => {
    const changed = {
      ...state,
      [event.target.name]: event.target.checked,
    };
    setState(changed);
    setStorageBySettings(changed);
  };

  useEffect(() => {
    getStorageBySettings((settings) => {
      setState(settings);
    });
  }, []);

  return (
    <Card variant="outlined" style={{ width: '200px' }}>
      <CardContent>
        <Typography align="center" variant="h6" component="div" style={{ fontWeight: 600 }}>
          리얼타임 실시간 검색어
        </Typography>
      </CardContent>
      <CardActions>
        <FormControl
          component="fieldset"
          variant="standard"
          style={{
            width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5,
          }}
        >
          <FormGroup>
            <FormControlLabel
              control={
                <ColorSwitch checked={state.naver} onChange={handleChange} name="naver" switchColor="#19ce60" />
          }
              label="Naver"
            />
            <FormControlLabel
              control={
                <ColorSwitch checked={state.google} onChange={handleChange} name="google" switchColor="#000000" />
          }
              label="Google"
            />
          </FormGroup>
        </FormControl>
      </CardActions>
    </Card>
  );
}
