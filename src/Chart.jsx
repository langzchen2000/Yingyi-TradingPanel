import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { fabric } from 'fabric';
import { instContext } from './appContext';
import './Chart.css';
import { throttle } from 'lodash'
const MIN_MAX_MARGIN = 20;
const PRICE_HORI_MARGIN = 53;
const STROKE_WIDTH = 1;
const DATE_AXIS_HEIGHT = 20;
const GAP = 3;

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


// eslint-disable-next-line react/prop-types
function Chart({ height, width }) {
    const baseURL = 'https://www.okx.com'
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const [timeScale, setTimeScale] = useState('15m');
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(0);

    const horiLineRef = useRef(null);
    const vertiLineRef = useRef(null);
    const priceTagRef = useRef(null);
    const minPriceTagRef = useRef(null);
    const maxPriceTagRef = useRef(null);

    const XRenderStartRef = useRef(Math.round(width - PRICE_HORI_MARGIN - STROKE_WIDTH - 15));
    const YRenderOffsetRef = useRef(0);
    const lastDateTimeRef = useRef(null);
    const datetextRef = useRef(null);
    const lineWidthRef = useRef(10);

    const chartObjectsRef = useRef(
        {
            rects: [],
            wicks: [],
        }
    )
    const priceLineRef = useRef(null);

    const chartDataRef = useRef([]);

    const instId = useContext(instContext);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current);
        console.log(`canvas initialized ${canvas}`);
        fabricCanvasRef.current = canvas;
        fabricCanvasRef.current.imageSmoothingEnabled = false;
        return () => {
            fabricCanvasRef.current.dispose();
        };

    }, []);

    const fetchMoreData = useCallback(async () => {
        const response = await fetch(`${baseURL}/api/v5/market/candles?instId=${instId}&bar=${timeScale}&after=${chartDataRef.current[chartDataRef.current.length - 1][0] - 1}&limit=100`);
        const data = await response.json();
        console.log('fetching more data')
        if (chartDataRef.current[chartDataRef.current.length - 1][0] - data.data[0][0] == timeScaleToMiliseconds[timeScale]) {
            chartDataRef.current = [...chartDataRef.current, ...data.data]
        }
    }, [timeScale, instId])

    const drawChartData = useCallback(() => {
        if (chartDataRef.current.length > 0) {
            
            const rects = chartObjectsRef.current.rects;
            const wicks = chartObjectsRef.current.wicks;
            const heightFactor = (fabricCanvasRef.current.height - 2 * MIN_MAX_MARGIN - DATE_AXIS_HEIGHT) / (priceMax - priceMin);
            const priceChangePerPixel = (priceMax - priceMin) / (fabricCanvasRef.current.height - 2 * MIN_MAX_MARGIN - DATE_AXIS_HEIGHT);

            if (chartDataRef.current.length < 1440 && XRenderStartRef.current - lineWidthRef.current * chartDataRef.current.length > 0) {
                fetchMoreData();
            }
            for (let i = 0; i < chartDataRef.current.length; i++) {
                const item = chartDataRef.current[i];
                const y = Math.abs(heightFactor * (item[1] - item[4])) < 1 ? 1 : Math.round(heightFactor * (item[1] - item[4]));
                const gap = lineWidthRef.current + 3;
                const leftStart = Math.round(XRenderStartRef.current - gap * (i + 1));
                if (rects[i]) {
                    rects[i].set({
                        left: leftStart,
                        top: Math.round(fabricCanvasRef.current.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[1] - priceMin) * heightFactor) + YRenderOffsetRef.current),
                        fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        width: lineWidthRef.current,
                        height: y,
                    })
                    rects[i].setCoords();
                } else {
                    const rect = new fabric.Rect({
                        left: leftStart,
                        top: Math.round(fabricCanvasRef.current.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[1] - priceMin) * heightFactor) + YRenderOffsetRef.current),
                        fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        width: lineWidthRef.current,
                        height: y,
                        selectable: false,
                        hoverCursor: 'default',
                    })
                    fabricCanvasRef.current.add(rect);
                    rects.push(rect);
                }
                const wickColor = item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor;
                if (wicks[i]) {
                    wicks[i].set({
                        x1: leftStart + lineWidthRef.current / 2,
                        y1: fabricCanvasRef.current.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[2] - priceMin) * heightFactor) + YRenderOffsetRef.current,
                        x2: leftStart + lineWidthRef.current / 2,
                        y2: fabricCanvasRef.current.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[3] - priceMin) * heightFactor) + YRenderOffsetRef.current,
                        stroke: wickColor,
                    })
                    wicks[i].setCoords();
                } else {
                    const wick = new fabric.Line(
                        [
                            leftStart + lineWidthRef.current / 2,
                            fabricCanvasRef.current.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[2] - priceMin) * heightFactor) + YRenderOffsetRef.current,
                            leftStart + lineWidthRef.current / 2,
                            fabricCanvasRef.current.height - (DATE_AXIS_HEIGHT + MIN_MAX_MARGIN + (item[3] - priceMin) * heightFactor) + YRenderOffsetRef.current,
                        ],
                        {
                            stroke: wickColor,
                            strokeWidth: 2,
                            selectable: false,
                            hoverCursor: 'default',
                        }
                    );
                    fabricCanvasRef.current.add(wick);
                    wicks.push(wick);
                    
                }
            }
            if (minPriceTagRef.current) {
                minPriceTagRef.current.set({
                    text: (priceMin + YRenderOffsetRef.current * priceChangePerPixel).toFixed(1).toString(),
                    left: fabricCanvasRef.current.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                })
                minPriceTagRef.current.setCoords();
            } else {
                const mintxt = new fabric.Text((priceMin + YRenderOffsetRef.current * priceChangePerPixel).toFixed(1).toString(), {
                    left: fabricCanvasRef.current.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                    top: fabricCanvasRef.current.height - MIN_MAX_MARGIN - DATE_AXIS_HEIGHT,
                    fontSize: 15,
                    selectable: false,
                    hoverCursor: 'default',
                    originY: 'center',
                })
                minPriceTagRef.current = mintxt;
                fabricCanvasRef.current.add(mintxt);
            }
            if (maxPriceTagRef.current) {
                maxPriceTagRef.current.set({
                    left: fabricCanvasRef.current.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                    text: (priceMax + YRenderOffsetRef.current * priceChangePerPixel).toFixed(1).toString(),
                })
                maxPriceTagRef.current.setCoords();
            } else {
                const maxtxt = new fabric.Text((priceMax + YRenderOffsetRef.current * priceChangePerPixel).toFixed(1).toString(), {
                    left: fabricCanvasRef.current.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                    top: MIN_MAX_MARGIN,
                    fontSize: 15,
                    selectable: false,
                    hoverCursor: 'default',
                    originY: 'center',
                })
                maxPriceTagRef.current = maxtxt;
                fabricCanvasRef.current.add(maxtxt);
            }

            const priceY = (priceMax - chartDataRef.current[0][4]) * heightFactor + YRenderOffsetRef.current + MIN_MAX_MARGIN;
            if (priceLineRef.current) {
                priceLineRef.current.set({
                    y1: priceY,
                    y2: priceY,
                    x2: fabricCanvasRef.current.width - PRICE_HORI_MARGIN,
                })
                priceLineRef.current.setCoords();
            } else {
                const priceLine = new fabric.Line(
                    [STROKE_WIDTH, priceY, fabricCanvasRef.current.width - PRICE_HORI_MARGIN, priceY],
                    {
                        stroke: 'grey',
                        strokeWidth: 1,
                        strokeDashArray: [5, 5],
                        selectable: false,
                        hoverCursor: 'default',

                    }
                )
                priceLineRef.current = priceLine;
                fabricCanvasRef.current.add(priceLine);
            }
            if (priceTagRef.current) {
                priceTagRef.current.set({
                    top: priceY,
                    text: Number(chartDataRef.current[0][4]).toFixed(1).toString(),
                    left: fabricCanvasRef.current.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                })
                priceTagRef.current.setCoords();
            } else {

                const priceTag = new fabric.Text(Number(chartDataRef.current[0][4]).toFixed(1).toString(), {
                    left: fabricCanvasRef.current.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                    top: priceY,
                    originY: 'center',
                    fontSize: 15,
                    selectable: false,
                    hoverCursor: 'default',
                    backgroundColor: 'black',
                    fill: 'white',
                })
                priceTagRef.current = priceTag;
                fabricCanvasRef.current.add(priceTag);
            }
            fabricCanvasRef.current.renderAll();
        }
    }, [priceMax, priceMin, fetchMoreData]);

    useEffect(() => {
        fabricCanvasRef.current.setHeight(height);
        fabricCanvasRef.current.selection = false;
        fabricCanvasRef.current.setWidth(Math.max(width, 100));
        if (chartDataRef.current.length > 0) {
            drawChartData()
        }
    }, [height, width, drawChartData]);




    //响应时间刻度的变化
    useEffect(() => {
        let ignore = false;
        const fetchKLineData = async (calcMinAndMax, limit, initialFetch = false) => {
            try {
                const response = await fetch(`${baseURL}/api/v5/market/candles?instId=${instId}&bar=${timeScale}&after=${Date.now()}&limit=${limit || 2}`);
                const data = await response.json();
                lastDateTimeRef.current = Number(data.data[0][0]);
                if (!ignore) {
                    if (chartDataRef.current.length === 0 || initialFetch) {
                        console.log('initial data fetched');
                        chartDataRef.current = data.data;
                    } else {
                        const lastData = chartDataRef.current[0];
                        const newData = data.data[0];
                        if (newData[0] > lastData[0]) {
                            const updatedData = [newData, ...chartDataRef.current];
                            updatedData[1] = data.data[1];
                            chartDataRef.current = updatedData;
                        } else if (newData[0] === lastData[0] && newData[4] !== lastData[4]) {
                            const updatedData = [...chartDataRef.current];
                            updatedData[0] = newData;
                            chartDataRef.current = updatedData;
                        }
                    }
                }

                if (calcMinAndMax) {
                    const maxVal = Math.max(...data.data.map(item => item[2]));
                    const minVal = Math.min(...data.data.map(item => item[3]));
                    setPriceMax(maxVal);
                    setPriceMin(minVal);
                }
                drawChartData()
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
    }, [timeScale, instId, drawChartData])


    useEffect(() => {
        XRenderStartRef.current = width - PRICE_HORI_MARGIN - STROKE_WIDTH;
    }, [timeScale, instId, width])

    useEffect(() => {

            const handleMouseMove = (event) => {
                const pointer = fabricCanvasRef.current.getPointer(event.e);
                const posY = pointer.y;
                let posX = Math.min(pointer.x, fabricCanvasRef.current.width - PRICE_HORI_MARGIN);
                const numOfKLineInBetween = Math.floor((posX - XRenderStartRef.current) / (lineWidthRef.current + GAP));
                posX = XRenderStartRef.current + lineWidthRef.current / 2 + numOfKLineInBetween * (lineWidthRef.current + GAP);
                const tempDate = new Date(lastDateTimeRef.current + (numOfKLineInBetween + 1) * timeScaleToMiliseconds[timeScale]);
                const displayDateString = tempDate.toLocaleDateString() + ' ' + tempDate.toLocaleTimeString();
                if (horiLineRef.current) {
                    horiLineRef.current.set({
                        y1: posY,
                        y2: posY,
                    })
                    horiLineRef.current.setCoords();
                } else {
                    const newHoriLine = new fabric.Line(
                        [STROKE_WIDTH, posY, fabricCanvasRef.current.width - STROKE_WIDTH - PRICE_HORI_MARGIN, posY],
                        {
                            stroke: 'black',
                            strokeWidth: 1,
                            strokeDashArray: [5, 5],
                            selectable: false,
                            needRemove: false,
                            hoverCursor: 'default',
                        }
                    );
                    horiLineRef.current = newHoriLine;
                    fabricCanvasRef.current.add(horiLineRef.current);
                }
                if (vertiLineRef.current) {
                    vertiLineRef.current.set({
                        x1: posX,
                        x2: posX,
                    })
                    vertiLineRef.current.setCoords();
                } else {
                    const newVertiLine = new fabric.Line(
                        [posX, STROKE_WIDTH, posX, fabricCanvasRef.current.height - STROKE_WIDTH - DATE_AXIS_HEIGHT],
                        {
                            stroke: 'black',
                            strokeWidth: 1,
                            strokeDashArray: [5, 5],
                            selectable: false,
                            needRemove: false,
                            hoverCursor: 'default',
                        }
                    )
                    vertiLineRef.current = newVertiLine;
                    fabricCanvasRef.current.add(newVertiLine);
                }

                if (datetextRef.current) {
                    datetextRef.current.set({
                        left: posX,
                        text: displayDateString,
                    })
                    datetextRef.current.setCoords();
                } else {
                    const newDatetext = new fabric.Text(
                        displayDateString, {
                        left: posX,
                        top: fabricCanvasRef.current.height - DATE_AXIS_HEIGHT - 2,
                        originX: 'center',
                        fontSize: 20,
                        backgroundColor: 'black',
                        fill: 'white',
                    });
                    datetextRef.current = newDatetext;
                    fabricCanvasRef.current.add(newDatetext);
                }
                fabricCanvasRef.current.renderAll();
            }
            const throttledHandleMouseMove = throttle(handleMouseMove, 10);
            const throttledDrawChartData = throttle(drawChartData, 20);

            fabricCanvasRef.current.on('mouse:move', function (event) {
                handleMouseMove(event)
            });

            fabricCanvasRef.current.on('mouse:out', function () {
                fabricCanvasRef.current.remove(horiLineRef.current);
                fabricCanvasRef.current.remove(vertiLineRef.current);
                fabricCanvasRef.current.remove(datetextRef.current);
                horiLineRef.current = null;
                vertiLineRef.current = null
                datetextRef.current = null;
            });


            fabricCanvasRef.current.on('mouse:down', function (event) {
                const initialMouseX = event.e.clientX;
                const initialMouseY = event.e.clientY;
                let initXRenderStart = XRenderStartRef.current;
                let initYRenderOffset = YRenderOffsetRef.current;
                fabricCanvasRef.current.defaultCursor = 'grabbing';
                fabricCanvasRef.current.hoverCursor = 'grabbing';
                fabricCanvasRef.current.off('mouse:move');
                fabricCanvasRef.current.on('mouse:move', function (event) {
                    throttledHandleMouseMove(event);
                    const movementX = event.e.clientX - initialMouseX
                    const movementY = event.e.clientY - initialMouseY;
                    //console.log(movementX);
                    XRenderStartRef.current = initXRenderStart + movementX;
                    YRenderOffsetRef.current = initYRenderOffset + movementY;
                    throttledDrawChartData();
                });
            });

            fabricCanvasRef.current.on('mouse:up', function () {
                fabricCanvasRef.current.defaultCursor = 'default';
                fabricCanvasRef.current.hoverCursor = 'default';
                fabricCanvasRef.current.off('mouse:move');
                fabricCanvasRef.current.on('mouse:move', (event) => throttledHandleMouseMove(event));
            });

            fabricCanvasRef.current.on('mouse:wheel', function (event) {
                event.e.preventDefault();
                if (event.e.deltaY > 0) {
                    lineWidthRef.current = Math.max(lineWidthRef.current - 1, 2);
                    throttledDrawChartData();                    
                } else {
                    lineWidthRef.current = Math.min(lineWidthRef.current + 1, 20);
                    throttledDrawChartData();
                }
            });
        }, [timeScale, instId, drawChartData])

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
