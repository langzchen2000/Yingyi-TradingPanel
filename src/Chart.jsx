import React, { useEffect, useRef, useState, useLayoutEffect, useContext } from 'react';
import { fabric } from 'fabric';
import { instContext } from './appContext';
import './Chart.css';

function Chart({ height, width }) {
    const baseURL = 'https://www.okx.com'
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [timeScale, setTimeScale] = useState('15m');
    const [chartData, setChartData] = useState([]);
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(0);

    const horiLineRef = useRef(null);
    const lastLineRef = useRef(null);
    const vertLineRef = useRef(null);
    const lastVertLineRef = useRef(null);
    const initialMouseXRef = useRef(null);
    const initialMouseYRef = useRef(null);
    const initialXRenderStartRef = useRef(null);
    const initialYRenderOffsetRef = useRef(null);
    const lastDateTimeRef = useRef(null);
    const datetextRef = useRef(null);
    const lastDateTextRef = useRef(null);
    const lineWidthRef = useRef(10);

    const MIN_MAX_MARGIN = 20;
    const PRICE_HORI_MARGIN = 53;
    const STROKE_WIDTH = 1;
    const DATE_AXIS_HEIGHT = 20;
    const instId = useContext(instContext);
    const [xRenderStart, setXRenderStart] = useState(width - PRICE_HORI_MARGIN - STROKE_WIDTH - 15);
    const [YRenderOffset, setYRenderOffset] = useState(0);

    const timeScaleSelect = ['1m', '5m', '15m', '30m', '1H', '2H', '4H', '12H', '1D']
    const timeScaleToMiliseconds = {
        '1m': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '30m': 30 * 60 * 1000,
        '1H': 60 * 60 * 1000,
        '2H': 2 * 60 * 60 * 1000,
        '4H': 4 * 60 * 60 * 1000,
        '12H': 12 * 60 * 60 * 1000,
        '1D': 24 * 60 * 60 * 1000,
    }
    const styleConfig = {
        backgroundStrockColor: 'rgb(183, 183, 183)',
        redColor: 'red',
        greenColor: 'rgb(3, 179, 3)',
    }

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current);
        console.log(`canvas initialized ${canvas}`);
        setFabricCanvas(canvas);
        return () => {
            canvas.dispose();
        };
    }, []);


    //响应时间刻度的变化
    useEffect(() => {
        let ignore = false;
        const fetchKLineData = async (calcMinAndMax, limit, initialFetch = false) => {
            try {
                const response = await fetch(`${baseURL}/api/v5/market/candles?instId=${instId}&bar=${timeScale}&after=${Date.now()}&limit=${limit || 2}`);
                const data = await response.json();
                lastDateTimeRef.current = Number(data.data[0][0]);
                if (!ignore) {
                    setChartData(prevChartData => {
                        if (prevChartData.length === 0 || initialFetch) {
                            console.log('initial data fetched');
                            return data.data;
                        } else {
                            const lastData = prevChartData[0];
                            const newData = data.data[0];
                            if (newData[0] > lastData[0]) {
                                const updatedData = [newData, ...prevChartData];
                                updatedData[1] = data.data[1];
                                return updatedData;
                            } else if (newData[0] === lastData[0] && newData[4] !== lastData[4]) {
                                const updatedData = [...prevChartData];
                                updatedData[0] = newData;
                                return updatedData;
                            }
                        }
                        return prevChartData; // 如果没有任何更新，返回原先的数据
                    });

                    if (calcMinAndMax) {
                        const maxVal = Math.max(...data.data.map(item => item[2]));
                        const minVal = Math.min(...data.data.map(item => item[3]));
                        setPriceMax(maxVal);
                        setPriceMin(minVal);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchKLineData(true, 200, true);
        const intervalId = setInterval(() => fetchKLineData(false), 300);
        return () => {
            clearInterval(intervalId);
            ignore = true;
        }
    }, [timeScale, instId])

    useEffect(() => {
        drawChartData();
    }, [xRenderStart]);

    useEffect(() => {
        setXRenderStart(width - PRICE_HORI_MARGIN - STROKE_WIDTH);
    }, [timeScale, instId])

    useEffect(() => {
        initialXRenderStartRef.current = xRenderStart;
    }, [xRenderStart]);

    useEffect(() => {
        initialYRenderOffsetRef.current = YRenderOffset;
    })


    //响应画布初始化
    useLayoutEffect(() => {
        if (fabricCanvas) {
            console.log(height);
            console.log(fabricCanvas)
            fabricCanvas.setHeight(height);
            fabricCanvas.selection = false;
            fabricCanvas.setWidth(Math.max(width, 100));
            drawChartData();
            return () => {
                fabricCanvas.dispose();
            };
        }

    }, [fabricCanvas])

    useEffect(() => {
        if (fabricCanvas) {
            const handleMouseMove = (event) => {
                const pointer = fabricCanvas.getPointer(event.e);
                const posY = pointer.y;
                let posX = Math.min(pointer.x, fabricCanvas.width - PRICE_HORI_MARGIN);
                const numOfKLineInBetween = Math.floor((posX - initialXRenderStartRef.current) / lineWidthRef.current);
                posX = initialXRenderStartRef.current + lineWidthRef.current / 2 + numOfKLineInBetween * lineWidthRef.current;
                const tempDate = new Date(lastDateTimeRef.current + (numOfKLineInBetween + 1) * timeScaleToMiliseconds[timeScale]);
                const displayDateString = tempDate.toDateString() + ' ' + tempDate.toTimeString();
                const newHoriLine = new fabric.Line(
                    [STROKE_WIDTH, posY, fabricCanvas.width - STROKE_WIDTH - PRICE_HORI_MARGIN, posY],
                    {
                        stroke: 'black',
                        strokeWidth: 1,
                        strokeDashArray: [5, 5],
                        selectable: false,
                        needRemove: false,
                        hoverCursor: 'default',
                    }
                );
                const newVertiLine = new fabric.Line(
                    [posX, STROKE_WIDTH, posX, fabricCanvas.height - STROKE_WIDTH - DATE_AXIS_HEIGHT],
                    {
                        stroke: 'black',
                        strokeWidth: 1,
                        strokeDashArray: [5, 5],
                        selectable: false,
                        needRemove: false,
                        hoverCursor: 'default',
                    }
                )
                const newDatetext = new fabric.Text(
                    displayDateString, {
                    left: posX,
                    top: fabricCanvas.height - DATE_AXIS_HEIGHT - 2,
                    originX: 'center',
                    fontSize: 20,
                    backgroundColor: 'black',
                    fill: 'white',
                }
                );
                horiLineRef.current = newHoriLine;
                vertLineRef.current = newVertiLine;
                datetextRef.current = newDatetext;
                drawLine();
            }

            fabricCanvas.on('mouse:move', function (event) {
                handleMouseMove(event)
            });

            fabricCanvas.on('mouse:out', function (event) {
                if (horiLineRef.current) {
                    horiLineRef.current = null;
                    vertLineRef.current = null;
                    datetextRef.current = null;
                    drawLine();
                }
            });

            fabricCanvas.on('mouse:down', function (event) {
                initialMouseXRef.current = event.e.clientX;
                initialMouseYRef.current = event.e.clientY;
                let xRenderStart = initialXRenderStartRef.current;
                let YRenderOffset = initialYRenderOffsetRef.current;
                fabricCanvas.defaultCursor = 'grabbing';
                fabricCanvas.hoverCursor = 'grabbing';
                fabricCanvas.off('mouse:move');
                fabricCanvas.on('mouse:move', function (event) {
                    handleMouseMove(event);
                    const movementX = event.e.clientX - initialMouseXRef.current
                    const movementY = event.e.clientY - initialMouseYRef.current;
                    //console.log(movementX);
                    setXRenderStart(xRenderStart + movementX);
                    setYRenderOffset(YRenderOffset + movementY);
                });
            });
            fabricCanvas.on('mouse:up', function (event) {
                fabricCanvas.defaultCursor = 'default';
                fabricCanvas.hoverCursor = 'default';
                fabricCanvas.off('mouse:move');
                fabricCanvas.on('mouse:move', (event) => handleMouseMove(event));
            });
        }
    }, [fabricCanvas, timeScale, instId]
    )

    //响应长宽的变化
    useEffect(() => {
        if (fabricCanvas) {
            fabricCanvas.setHeight(height);
            fabricCanvas.setWidth(Math.max(width, 300));
            drawChartData();
            drawLine();
        }
    }, [height, width])



    const drawChartData = () => {

        if (fabricCanvas && chartData.length > 0) {

            fabricCanvas.getObjects('text').forEach(text => {
                fabricCanvas.remove(text);
            });
            fabricCanvas.getObjects('rect').forEach(rect => {
                fabricCanvas.remove(rect);
            });
            fabricCanvas.getObjects('line').forEach(line => {
                if (line.needRemove !== false) {
                    fabricCanvas.remove(line);
                }
            });
            const heightFactor = (fabricCanvas.height - 2 * MIN_MAX_MARGIN - DATE_AXIS_HEIGHT) / (priceMax - priceMin);
            const priceChangePerPixel = (priceMax - priceMin) / (fabricCanvas.height - 2 * MIN_MAX_MARGIN - DATE_AXIS_HEIGHT);
            const startIndex = xRenderStart - fabricCanvas.width - PRICE_HORI_MARGIN - STROKE_WIDTH > 0 ? Math.floor((xRenderStart - fabricCanvas.width + PRICE_HORI_MARGIN + STROKE_WIDTH) / lineWidthRef.current) : 0;
            for (let i = startIndex; i < chartData.length; i++) {
                const item = chartData[i];
                const y = heightFactor * (item[1] - item[4]);
                const leftStart = xRenderStart - lineWidthRef.current * (i + 1);
                if (leftStart < -lineWidthRef.current) break;
                if (leftStart > fabricCanvas.width - PRICE_HORI_MARGIN - lineWidthRef.current) continue;
                const rect = new fabric.Rect({
                    left: leftStart,
                    top: fabricCanvas.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[1] - priceMin) * heightFactor) + YRenderOffset,
                    fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,  // 填充颜色, 红跌绿涨
                    width: lineWidthRef.current,
                    height: y,
                    selectable: false,
                    hoverCursor: 'default',
                })
                const wickColor = item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor;
                const wick = new fabric.Line(
                    [
                        leftStart + lineWidthRef.current / 2,
                        fabricCanvas.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[2] - priceMin) * heightFactor) + YRenderOffset,
                        leftStart + lineWidthRef.current / 2,
                        fabricCanvas.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[3] - priceMin) * heightFactor) + YRenderOffset,
                    ],
                    {
                        fill: wickColor,
                        stroke: wickColor,
                        strokeWidth: 2,
                        selectable: false,
                        hoverCursor: 'default',
                    }
                )
                fabricCanvas.add(rect);
                fabricCanvas.add(wick);
            }
            const mintxt = new fabric.Text((priceMin + YRenderOffset * priceChangePerPixel).toFixed(2).toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                top: fabricCanvas.height - MIN_MAX_MARGIN - DATE_AXIS_HEIGHT,
                fontSize: 15,
                selectable: false,
                hoverCursor: 'default',
            })
            const maxtxt = new fabric.Text((priceMax + YRenderOffset * priceChangePerPixel).toFixed(2).toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                top: MIN_MAX_MARGIN,
                fontSize: 15,
                selectable: false,
                hoverCursor: 'default',
            })
            const priceY = (priceMax - chartData[0][4]) * heightFactor + YRenderOffset + MIN_MAX_MARGIN;
            const priceLine = new fabric.Line(
                [STROKE_WIDTH, priceY, fabricCanvas.width - PRICE_HORI_MARGIN, priceY],
                {
                    stroke: 'grey',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: false,
                    hoverCursor: 'default',

                }
            )
            const priceTag = new fabric.Text(Number(chartData[0][4]).toFixed(2).toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                top: (priceMax - chartData[0][4]) * heightFactor + YRenderOffset + MIN_MAX_MARGIN - 10,
                fontSize: 15,
                selectable: false,
                hoverCursor: 'default',
                backgroundColor: 'black',
                fill: 'white',
            })
            fabricCanvas.add(mintxt);
            fabricCanvas.add(maxtxt);
            fabricCanvas.add(priceLine);
            fabricCanvas.add(priceTag);
        }
    };

    const drawLine = () => {
        if (fabricCanvas) {
            if (lastLineRef.current) {
                fabricCanvas.remove(lastLineRef.current);
                lastLineRef.current = null;
            }
            if (lastVertLineRef.current) {
                fabricCanvas.remove(lastVertLineRef.current);
                lastVertLineRef.current = null;
            }
            if (lastDateTextRef.current) {
                fabricCanvas.remove(lastDateTextRef.current);
                lastDateTextRef.current = null;
            }
            if (horiLineRef.current) {
                fabricCanvas.add(horiLineRef.current);
                lastLineRef.current = horiLineRef.current;
            }
            if (vertLineRef.current) {
                fabricCanvas.add(vertLineRef.current);
                lastVertLineRef.current = vertLineRef.current;
            }
            if (datetextRef.current) {
                fabricCanvas.add(datetextRef.current);
                lastDateTextRef.current = datetextRef.current;
            }

        }
    }


    useEffect(() => {
        drawChartData();
    }, [chartData]);

    const timeScaleButtons = timeScaleSelect.map((item) => {
        return (
            <button key={item} onClick={() => { if (item !== timeScale) setTimeScale(item) }} className={item === timeScale ? 'selected' : ''}>
                {item}
            </button>
        )
    })

    return (
        <div className="chart">
            <canvas ref={canvasRef} className="inner-canvas" />
            <div className="time-scale-wrapper">
                {timeScaleButtons}
            </div>
        </div>
    );
}

export default Chart;
