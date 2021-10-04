/* global chrome */
import React, { useState, useEffect, useRef } from 'react';
import TextTransition, { presets } from "react-text-transition";

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import RemoveIcon from '@material-ui/icons/Remove';
import FiberNewIcon from '@material-ui/icons/FiberNew';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import MenuItem from '@material-ui/core/MenuItem';

import { EngineIcon } from './EngineIcon'
import { Tips } from './Tips'
import { updateRanking } from './issue';

const engineCandidates = ["NAVER", "Google", "Daum", "ZUM", "nate"];

const useStyles = makeStyles((theme) => ({
  // root: {
  //   width: '100%',
  //   maxWidth: 360,
  //   backgroundColor: theme.palette.background.paper,
  // },
  'fade-in': {
    opacity: "1",
    transition: "opacity 500ms",
  },
  'fade-out': {
    opacity: "0",
    visibility: "hidden",
    transition: "opacity 500ms , visibility 500ms",
  },
  paper: {
    width: '100%',
  },
  formControl: {
    width: '100%',
  },
  select: {
    minHeight: '50px',
  },
  help: {
    display: 'inline-block',
    position: 'absolute',
    top: 0,
    right: 2,
    zIndex: 1,
    overflow: 'hidden'
  }
}));


function getEngineColor(engine) {
  var color = "rgb(43, 200, 67)";
  if (engine === "google") {
    color = "rgb(0, 0, 0)";
  } else if (engine === "daum") {
    color = "rgb(78, 139, 230)";
  } else if (engine === "zum") {
    color = "rgb(27, 82, 237)";
  } else if (engine === "nate") {
    color = "rgb(255, 44, 46)";
  }
  return color;
}

function Chart(props) {
  const classes = useStyles();
  const [ranking, setRanking] = useState([]);
  const [bold, setBold] = useState(0);
  const handlerRef = useRef(false);
  const [defaultEngine, setDefaultEngine] = React.useState('');

  function query(event, engine, term) {
    const encodedTerm = encodeURI(term);
    var url = "";
    if (engine === "google") {
      url = 'https://www.google.com/search?q=' + encodedTerm;
    } else if (engine === "daum") {
      url = 'https://search.daum.net/search?q=' + encodedTerm;
    } else if (engine === "zum") {
      url = 'https://search.zum.com/search.zum?query=' + encodedTerm;
    } else if (engine === "nate") {
      url = 'https://search.daum.net/nate?q=' + encodedTerm;
    } else {
      url = 'https://search.naver.com/search.naver?query=' + encodedTerm;
    }

    if (typeof chrome === "undefined" || chrome.tab === undefined) {
      window.open(url, '_blank').focus();
    } else {
      if (event.ctrlKey) {
        chrome.tabs.create({url: url});
      } else {
        chrome.tabs.update({url: url});
      }
    }
  }

  const useOutlinedInputStyles = makeStyles(() => {
    var color = getEngineColor(defaultEngine);
  
    return {
      root: {
        "& $notchedOutline": {
          borderColor: color,
          borderWidth: "3px"
        },
        "&:hover $notchedOutline": {
          borderColor: color,
          borderWidth: "3px"
        },
        "&$focused $notchedOutline": {
          borderColor: color,
          borderWidth: "3px"
        }
      },
      focused: {},
      notchedOutline: {},
      input: {
        padding: "10px 10px"
      }
    }
  });

  const outlinedInputClasses = useOutlinedInputStyles();

  const handleChange = (event) => {
    setDefaultEngine(event.target.value);
  };

  useEffect(() => {
    if(!handlerRef.current) {
        updateRanking(600, 10, setRanking);
      setInterval(() => {
        updateRanking(600, 10, setRanking)
      }, 60000);

      setInterval(() => {
        const len = 10;
        setBold(bold => (bold + 1) % len);
      }, 5000);
      if(typeof chrome === "undefined" || chrome.tab === undefined) {
        setDefaultEngine("naver");
      } else {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          var hostname = "naver";
          const url = new URL(tabs[0].url);
          let domainNames = url.hostname.split(".");
          for (var domainName of domainNames) {
            if (engineCandidates.map(v => v.toLowerCase()).includes(domainName)) {
              hostname = domainName;
              break;
            }
          }
          if (hostname === "daum" && url.pathname === "/nate") {
            hostname = "nate";
          }
          setDefaultEngine(hostname);
        });
      }
    }
  }, []);
  useEffect(() => {
    handlerRef.current = true;
  });
  return (
    <>
    <Tips className={classes.help}><HelpOutlineIcon style={{ color: 'gray', fontSize: "15px" }}></HelpOutlineIcon></Tips>

      <FormControl width="100%" variant="outlined" className={classes.formControl}>
      <Select
        id="demo-simple-select-outlined"
        value={defaultEngine}
        onChange={handleChange}
        label="Engine"
        className={classes.select}
        autoWidth={true}
        input={
          <OutlinedInput
            name="engine"
            id="outlined-engine-simple"
            classes={outlinedInputClasses}
          />
        }
      >
        {engineCandidates.map((engine, index) => (
          <MenuItem key={index} value={engine.toLowerCase()}>
        <div style={{ display: 'flex', alignItems: 'center'}}>
            <EngineIcon engine={engine.toLowerCase()} color={getEngineColor(engine.toLowerCase())}/>
            <div style={{ 'marginLeft': '10px' }}>{engine}</div>
          </div>
        </MenuItem>
        ))}
      </Select>
    </FormControl>
    <Table className={classes.table} aria-label="custom pagination table" style={{width: "250px"}}>
    <TableBody>
    {ranking && ranking.map((issue, index) => {
      return (
      <TableRow key={issue.rank} role={undefined} onClick={event => query(event, defaultEngine, issue.keyword)} hover={true}>
      <TableCell align='left' width="10%" style={{padding: "5px 10px 5px 10px", height: "30px", border: "0px"}}>
        <Typography style={{ 'fontWeight': (index === bold) ? 'bold' : 'normal', 'fontSize': '12px' }}>{issue.rank}.</Typography>
        </TableCell>
      <TableCell align='left' width="75%" style={{padding: "5px 10px 5px 10px", height: "30px", border: "0px"}}>
      <TextTransition
        text={"#"+issue.keyword}
        direction="down"
        springConfig={presets.gentle}
        style={{ 'fontWeight': (index === bold) ? 'bold' : 'normal', 'fontSize': '12px' }}
      />
    </TableCell>
    <TableCell align='left' width="15%" style={{padding: "5px 10px 5px 10px", height: "30px", border: "0px"}}>
      {issue.delta === 999 ? <FiberNewIcon style={{ color: 'orange', width: "35px", height: "25px"}} /> :
      issue.delta > 0 ? <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
    }}><ArrowDropUpIcon style={{ color: 'red', width: "15px", height: "15px" }} /><span>{Math.abs(issue.delta)}</span></div>  :
        issue.delta < 0 ? <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
      }}><ArrowDropDownIcon style={{ color: 'blue', width: "15px", height: "15px" }} /><span>{Math.abs(issue.delta)}</span></div>  : 
                              <RemoveIcon style={{ color: 'lightgray' }} />}
                              </TableCell>
    </TableRow>
      );
    }
      )}
       </TableBody>
       </Table>
       </>
  );
}

export default Chart;
