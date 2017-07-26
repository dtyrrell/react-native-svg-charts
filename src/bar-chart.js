import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { ART, StyleSheet, View } from 'react-native'
import * as shape from 'd3-shape'
import * as scale from 'd3-scale'
import * as array from 'd3-array'
import AnimShape from './anim-shape'

const {
          Group,
          Surface,
      } = ART

class BarChart extends Component {

    state = {
        width: 0,
        height: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    _getBar(value, x, y, barIndex, valueIndex, barWidth) {
        return {
            value,
            area: shape.area()
            // place the bar on the x-axis based on valueIndex + its index among the other bars in its group
                .x((point, _index) =>
                    _index === 0 ?
                        x(valueIndex) + (barWidth * barIndex) :
                        x(valueIndex) + barWidth + (barWidth * barIndex),
                )
                .y0(-y(0))
                .y1(point => -y(point))
                .defined(value => value)
                ([ value, value ]),
        }
    }

    render() {

        const {
                  dataPoints,
                  spacing,
                  animate,
                  animationDuration,
                  style,
                  showZeroAxis,
                  fillColor,
                  strokeColor,
                  strokeColorNegative,
                  fillColorNegative,
              } = this.props

        const { height, width } = this.state

        if (dataPoints.length > 0 && typeof dataPoints[ 0 ] === 'object') {
            const lengths = Object.values(dataPoints).map(obj => obj.values.length)
            const extent  = array.extent(lengths)
            if (extent[ 0 ] - extent[ 1 ] !== 0) {
                throw new Error(`value arrays must be of equal length. Lengths are [${lengths}]`)
            }
        }

        const values = array.merge(Object.values(dataPoints).map(obj => obj.values))

        //add zero to extent to always start from at least 0
        const y = scale.scaleLinear()
            .domain(array.extent([ ...values, 0 ]))
            .range([ 10, height - 10 ])

        // use index as domain identifier instead of value since
        // same value can occur at several places in dataPoints
        const x = scale.scaleBand()
            .domain(dataPoints[ 0 ].values.map((_, index) => index))
            .range([ 0, width ])
            .paddingInner([ spacing ])
            .paddingOuter([ spacing ])

        const numberOfDifferentBars = Object.keys(dataPoints).length
        const barWidth              = x.bandwidth() / numberOfDifferentBars
        const dataLength            = dataPoints[ 0 ].values.length

        let areas = []
        for (let i = 0; i < dataLength; i++) {

            //pick up the value from each "bar"
            const currentValues = Object.values(dataPoints)
                .map(obj => obj.values[ i ])

            //for each value calculate the bar area. The object index places a big role
            currentValues.forEach((value, barIndex) => {

                // eslint-disable-next-line no-unused-vars
                const { values, ...colors } = dataPoints[ barIndex ]
                const bar                   = this._getBar(value, x, y, barIndex, i, barWidth)

                areas.push({
                    ...bar,
                    strokeColor,
                    fillColor,
                    strokeColorNegative,
                    fillColorNegative,
                    ...colors,
                })
            })
        }

        return (
            <View style={style}>
                <View
                    style={{ flex: 1 }}
                    onLayout={event => this._onLayout(event)}
                >
                    <Surface width={width} height={height}>
                        <Group x={0} y={height}>
                            {areas.map((bar, index) =>
                                <AnimShape
                                    key={index}
                                    stroke={bar.value < 0 ? bar.strokeColorNegative : bar.strokeColor}
                                    strokeWidth={1}
                                    fill={bar.value < 0 ? bar.fillColorNegative : bar.fillColor}
                                    d={bar.area}
                                    animate={animate}
                                    animationDuration={animationDuration}
                                />,
                            )}
                        </Group>
                    </Surface>
                    {showZeroAxis && <View style={[ styles.zeroAxis, { bottom: y(0) - 1 } ]}/>}
                </View>
            </View>
        )
    }
}

BarChart.propTypes = {
    dataPoints: PropTypes.arrayOf(PropTypes.shape({
        fillColor: PropTypes.string,
        strokeColor: PropTypes.string,
        strokeColorNegative: PropTypes.string,
        fillColorNegative: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number).isRequired,
    })).isRequired,
    style: PropTypes.any,
    strokeColor: PropTypes.string,
    fillColor: PropTypes.string,
    spacing: PropTypes.number,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    fillColorNegative: PropTypes.string,
    strokeColorNegative: PropTypes.string,
    showZeroAxis: PropTypes.bool,
}

BarChart.defaultProps = {
    fillColor: 'rgba(34, 182, 176, 0.2)',
    fillColorNegative: 'rgba(255, 0, 0, 0.2',
    strokeColor: '#22B6B0',
    strokeColorNegative: '#ff0000',
    spacing: 0.05,
    width: 100,
    height: 100,
    showZeroAxis: true,
}

const
    styles = StyleSheet.create({
        zeroAxis: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            // backgroundColor: 'rgba(0,0,0,0.5)',
            backgroundColor: 'black',
        },
    })

export default BarChart
