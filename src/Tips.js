import React from 'react';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  popover: {
    pointerEvents: 'none',
  },
  paper: {
    padding: theme.spacing(0.5),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
}));

export function Tips({className, children}) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div className={className}>
      <Typography
        aria-owns={open ? 'mouse-over-popover' : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        style={{'lineHeight': '0px'}}
      >
        {children}
      </Typography>
      <Popover
        id="mouse-over-popover"
        className={classes.popover}
        classes={{
          paper: classes.paper,
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
          <Typography variant="body1" color="primary" gutterBottom style={{fontWeight: 'bold'}}>
          #실시간 트렌드<br/>(Realtime Trends)
        </Typography>
        <Typography variant="body2" style={{fontWeight: 'bold'}}>
          - 실시간 급상승 검색어를 팝업으로 제공
          <br/>
          - 원하는 검색엔진을 선택 가능
          <br/>
          - 검색어를 클릭하면 검색
          <br/>(Ctrl+클릭: 새 탭)
          </Typography>      
          <Typography variant="body2" color="secondary" style={{fontWeight: 'bold'}}>
          "감사합니다. 언제나 새로운 아이디어는 환영입니다."
        </Typography>
      </Popover>
    </div>
  );
}