import { Component } from "react";

import { Grid, Typography } from '@material-ui/core';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import RemoveIcon from '@material-ui/icons/Remove';
import FiberNewIcon from '@material-ui/icons/FiberNew';

class ChartRow extends Component {
    render() {
        const { trend, activeRanking, ranking } = this.props;
        const bold = ranking === activeRanking;
        return (
            <Grid container direction="row" spacing={0} style={{ height: '100%' }}>
                <Grid item xs={1}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        textAlign: 'center',
                        height: '100%',
                    }}
                >
                    <Typography
                    style={{
                        fontWeight: 'bold',
                        fontSize: '15px',
                        display: 'inline-block',
                        width: '100%',
                    }}
                    >
                    {ranking}
                    </Typography>
                </div>
                </Grid>
                <Grid item xs={9}>
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
                        noWrap
                        style={{
                            fontWeight: bold ? 'bold' : 'normal',
                            fontSize: '12px',
                            display: 'inline-block',
                            width: '100%',
                        }}
                        >
                        {'#' + trend.keyword}
                        </Typography>
                    </div>
                </Grid>
                <Grid item xs={2}>
                    <div
                        style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        textAlign: 'center',
                        height: '100%',
                        }}
                    >
                        <Typography
                            style={{
                                fontWeight: 'bold',
                                fontSize: '12px',
                                display: 'inline-block',
                                width: '100%',
                            }}
                        >
                        {trend.delta === 999 ? (
                            <FiberNewIcon
                                style={{
                                    color: 'orange',
                                    width: '35px',
                                    height: '25px',
                                    verticalAlign: 'middle',
                                }}
                            />
                        ) : trend.delta > 0 ? (
                            <>
                            <ArrowDropUpIcon
                                style={{
                                color: 'red',
                                width: '15px',
                                height: '15px',
                                verticalAlign: 'middle',
                                }}
                            />
                            <span>{Math.abs(trend.delta)}</span>
                            </>
                        ) : trend.delta < 0 ? (
                            <>
                            <ArrowDropDownIcon
                                style={{
                                color: 'blue',
                                width: '15px',
                                height: '15px',
                                verticalAlign: 'middle',
                                }}
                            />
                            <span>{Math.abs(trend.delta)}</span>
                            </>
                        ) : (
                            <RemoveIcon
                                style={{ color: 'lightgray', verticalAlign: 'middle' }}
                            />
                        )}
                        </Typography>
                    </div>
                </Grid>
            </Grid>
        );
    }
}

export default ChartRow;