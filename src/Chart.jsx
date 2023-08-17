import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { fabric } from 'fabric';
import { instContext } from './appContext';
import './Chart.css';
import { throttle } from 'lodash'

const PRICE_HORI_MARGIN = 53;
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

//given a number, return the cloest number of the patter 1/2/5*10Ex x can be any integer number
function closestMultipleOf125(num) {
    const logValue = Math.log10(num);
    const intPart = Math.floor(logValue);
    const decimalValue = Math.pow(10, logValue - intPart);

    let base;

    if (decimalValue < 1.5) {
        base = 1;
    } else if (decimalValue < 3.5) {
        base = 2;
    } else {
        base = 5;
    }

    return base * Math.pow(10, intPart);
}

const styleConfig = {
    backgroundStrockColor: 'rgb(235, 230, 235)',
    redColor: 'red',
    greenColor: 'rgb(3, 179, 3)',
}

// const nextMultipleOf10 = function(num) {
//     switch(true) {
//         case(num < 0.000001): return 0.000001;
//         case(num < 0.00001): return 0.00001;
//         case(num < 0.0001): return 0.0001;
//         case(num < 0.001): return 0.001;
//         case(num < 0.01): return 0.01;
//         case(num < 0.1): return 0.1;
//         case(num < 1): return 1;
//         default: return Math.ceil(value/10) * 10
//     }
// }

// eslint-disable-next-line react/prop-types
function Chart({ height, width }) {
    const baseURL = 'https://www.okx.com'
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const priceCanvasRef = useRef(null);
    const fabricPriceCanvasRef = useRef(null);

    const [timeScale, setTimeScale] = useState('15m');

    const maxPriceRef = useRef(0);
    const minPriceRef = useRef(0);

    const horiLineRef = useRef(null);
    const vertiLineRef = useRef(null);
    const horiLinePriceTag = useRef(null);
    const priceTagRef = useRef(null);
    const horiGridRef = useRef([]);
    const horiLineGridTag = useRef([]);
    

    const XRenderStartRef = useRef(Math.round(width - PRICE_HORI_MARGIN - 15));

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
        //初始化k-线画布
        fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
        fabricCanvasRef.current.imageSmoothingEnabled = false;
        //初始化价格画布（上层）
        fabricPriceCanvasRef.current = new fabric.Canvas(priceCanvasRef.current);
        fabricPriceCanvasRef.current.imageSmoothingEnabled = false;
        fabricPriceCanvasRef.current.backgroundColor = 'white';
        //设置价格画布container的样式
        const container = fabricPriceCanvasRef.current.wrapperEl
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = fabricCanvasRef.current.width - PRICE_HORI_MARGIN + 'px';
        container.style.zIndex = '2';
        //初始化k线画布container的样式
        const lowerContainer = fabricCanvasRef.current.wrapperEl;
        lowerContainer.style.position = 'absolute';
        lowerContainer.style.top = '0';
        lowerContainer.style.left = '0';
        return () => {
            fabricCanvasRef.current.dispose();
            fabricPriceCanvasRef.current.dispose();
        };
    }, []);

    const fetchMoreData = useCallback(async () => {
        try {
            const response = await fetch(`${baseURL}/api/v5/market/candles?instId=${instId}&bar=${timeScale}&after=${chartDataRef.current[chartDataRef.current.length - 1][0] - 1}&limit=100`);
            const data = await response.json();
            console.log('fetching more data')
            if (data.data && chartDataRef.current[chartDataRef.current.length - 1][0] - data.data[0][0] == timeScaleToMiliseconds[timeScale]) {
                chartDataRef.current = [...chartDataRef.current, ...data.data]
            }
        } catch (error) {
            console.log(error);
        }
    }, [timeScale, instId])



    const drawChartData = useCallback(() => {
        if (chartDataRef.current.length > 0) {
            const rects = chartObjectsRef.current.rects;
            const wicks = chartObjectsRef.current.wicks;
            const heightFactor = (fabricCanvasRef.current.height) / (maxPriceRef.current - minPriceRef.current);
            const priceChangePerPixel = (maxPriceRef.current - minPriceRef.current) / (fabricCanvasRef.current.height);
            const throttledFetchMoreData = throttle(fetchMoreData, 1500);
            if (chartDataRef.current.length < 1440 && XRenderStartRef.current - lineWidthRef.current * chartDataRef.current.length > 0) {
                throttledFetchMoreData();
            }
            const priceOf100pxs = priceChangePerPixel * 100;
            const cloestInterval = closestMultipleOf125(priceOf100pxs);
            const numOfLines = Math.ceil(fabricCanvasRef.current.height / (cloestInterval * heightFactor)) + 1;
            const topHoriLine = maxPriceRef.current % cloestInterval * heightFactor
            if (numOfLines < horiGridRef.current.length) {
                for (let i = numOfLines; i < horiGridRef.current.length; i++) {
                    fabricCanvasRef.current.remove(horiGridRef.current[i]);
                    horiGridRef.current[i] = null;
                }
            }
            if (numOfLines < horiLineGridTag.current.length) {
                for (let i = numOfLines; i < horiLineGridTag.current.length; i++) {
                    fabricPriceCanvasRef.current.remove(horiLineGridTag.current[i]);
                    horiLineGridTag.current[i] = null;
                }
            }
            for (let i = 0; i < numOfLines; i++) {
                let yPos = topHoriLine + i * cloestInterval * heightFactor
                if (horiGridRef.current[i]) {
                    horiGridRef.current[i].set({
                        y1: yPos,
                        y2: yPos,
                        x1: 0,
                        x2: fabricCanvasRef.current.width,
                    })
                    horiGridRef.current[i].setCoords();
                } else {
                    const newHoriLine = new fabric.Line(
                        [0, yPos, fabricCanvasRef.current.width, yPos],
                        {
                            stroke: styleConfig.backgroundStrockColor,
                            strokeWidth: 1,
                            selectable: false,
                            hoverCursor: 'default',
                        }
                    );
                    fabricCanvasRef.current.add(newHoriLine);
                    fabricCanvasRef.current.sendToBack(newHoriLine)
                    horiGridRef.current.push(newHoriLine);
                }
                if (horiLineGridTag.current[i]) {
                    horiLineGridTag.current[i].set({
                        text: ((Math.floor(maxPriceRef.current / cloestInterval) - i) * cloestInterval).toFixed(1).toString(),
                        left: 0,
                        top: yPos,
                    })
                    horiLineGridTag.current[i].setCoords();
                } else {
                    const newhoriLineGridTag = new fabric.Text((maxPriceRef.current - i * cloestInterval).toFixed(1).toString(), {
                        left: 0,
                        top: yPos,
                        fontSize: 15,
                        selectable: false,
                        color: 'black',
                        hoverCursor: 'default',
                        originY: 'center',
                    })
                    fabricPriceCanvasRef.current.add(newhoriLineGridTag);
                    horiLineGridTag.current.push(newhoriLineGridTag);
                }
            }
            for (let i = 0; i < chartDataRef.current.length; i++) {
                const item = chartDataRef.current[i];
                const y = Math.abs(heightFactor * (item[1] - item[4])) < 1 ? 1 : Math.round(heightFactor * (item[1] - item[4]));
                const gap = lineWidthRef.current + 3;
                const leftStart = Math.round(XRenderStartRef.current - gap * (i + 1));
                if (rects[i]) {
                    rects[i].set({
                        left: leftStart,
                        top: Math.round(fabricCanvasRef.current.height - (item[1] - minPriceRef.current) * heightFactor),
                        fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        width: lineWidthRef.current,
                        height: y,
                    })
                    rects[i].setCoords();
                } else {
                    const rect = new fabric.Rect({
                        left: leftStart,
                        top: Math.round(fabricCanvasRef.current.height - ((item[1] - minPriceRef.current) * heightFactor)),
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
                        y1: fabricCanvasRef.current.height - ((item[2] - minPriceRef.current) * heightFactor),
                        x2: leftStart + lineWidthRef.current / 2,
                        y2: fabricCanvasRef.current.height - ((item[3] - minPriceRef.current) * heightFactor),
                        stroke: wickColor,
                    })
                    wicks[i].setCoords();
                } else {
                    const wick = new fabric.Line(
                        [
                            leftStart + lineWidthRef.current / 2,
                            fabricCanvasRef.current.height - ((item[2] - minPriceRef.current) * heightFactor),
                            leftStart + lineWidthRef.current / 2,
                            fabricCanvasRef.current.height - ((item[3] - minPriceRef.current) * heightFactor),
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

            //使得gridLine之间的间距大于100px

            const priceY = (maxPriceRef.current - chartDataRef.current[0][4]) * heightFactor;
            if (priceLineRef.current) {
                priceLineRef.current.set({
                    y1: priceY,
                    y2: priceY,
                    x2: fabricCanvasRef.current.width - PRICE_HORI_MARGIN,
                })
                priceLineRef.current.setCoords();
            } else {
                const priceLine = new fabric.Line(
                    [0, priceY, fabricCanvasRef.current.width - PRICE_HORI_MARGIN, priceY],
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
                    left: 0,
                })
                priceTagRef.current.setCoords();
            } else {
                const priceTag = new fabric.Text(Number(chartDataRef.current[0][4]).toFixed(1).toString(), {
                    left: 0,
                    top: priceY,
                    originY: 'center',
                    fontSize: 15,
                    selectable: false,
                    hoverCursor: 'default',
                    backgroundColor: 'black',
                    fill: 'white',
                })
                priceTagRef.current = priceTag;
                fabricPriceCanvasRef.current.add(priceTag);
                fabricPriceCanvasRef.current.bringToFront(priceTagRef.current);
            }
            fabricCanvasRef.current.renderAll();
            fabricPriceCanvasRef.current.renderAll();
            
        }
    }, [fetchMoreData]);

    useEffect(() => {
        fabricCanvasRef.current.setHeight(height);
        fabricCanvasRef.current.selection = false;
        fabricCanvasRef.current.setWidth(Math.max(width, 100));

        fabricPriceCanvasRef.current.setHeight(height - 2);
        fabricPriceCanvasRef.current.setWidth(PRICE_HORI_MARGIN);
        fabricPriceCanvasRef.current.selection = false;
        const container = fabricPriceCanvasRef.current.wrapperEl
        container.style.position = 'absolute';
        container.style.left = fabricCanvasRef.current.width - PRICE_HORI_MARGIN + 'px';

        if (chartDataRef.current.length > 0) {
            drawChartData()
        }

        return () => {

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
                    maxPriceRef.current = Math.max(...data.data.map(item => item[2]));
                    minPriceRef.current = Math.min(...data.data.map(item => item[3]));
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
        XRenderStartRef.current = fabricCanvasRef.current.width - PRICE_HORI_MARGIN
    }, [timeScale, instId])

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
                    [0, posY, fabricCanvasRef.current.width - PRICE_HORI_MARGIN, posY],
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
            const posYPrice = (maxPriceRef.current - (posY / fabricCanvasRef.current.height) * (maxPriceRef.current - minPriceRef.current)).toFixed(1);
            if (horiLinePriceTag.current) {
                horiLinePriceTag.current.set({
                    text: posYPrice.toString(),
                    top: posY,
                })
                horiLinePriceTag.current.setCoords();
            } else {
                const newHoriLinePriceTag = new fabric.Text(posYPrice.toString(), { 
                    left: 0,
                    top: posY,
                    fontSize: 15,
                    selectable: false,
                    fill: 'white',
                    hoverCursor: 'default',
                    originY: 'center',
                    backgroundColor: 'grey',
                })
                horiLinePriceTag.current = newHoriLinePriceTag;
                fabricPriceCanvasRef.current.add(newHoriLinePriceTag);
            }

            if (vertiLineRef.current) {
                vertiLineRef.current.set({
                    x1: posX,
                    x2: posX,
                })
                vertiLineRef.current.setCoords();
            } else {
                const newVertiLine = new fabric.Line(
                    [posX, 0, posX, fabricCanvasRef.current.height],
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
                    top: fabricCanvasRef.current.height - 20 - 2,
                    originX: 'center',
                    fontSize: 20,
                    backgroundColor: 'grey',
                    fill: 'white',
                });
                datetextRef.current = newDatetext;
                fabricCanvasRef.current.add(newDatetext);
            }
            fabricCanvasRef.current.renderAll();
            fabricPriceCanvasRef.current.renderAll();
        }
        const throttledHandleMouseMove = throttle(handleMouseMove, 10);
        const throttledDrawChartData = throttle(drawChartData, 50);

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
            let initminPrice = minPriceRef.current;
            let initmaxPrice = maxPriceRef.current;
            const priceChangePerPixel = (maxPriceRef.current - minPriceRef.current) / (fabricCanvasRef.current.height);
            fabricCanvasRef.current.defaultCursor = 'grabbing';
            fabricCanvasRef.current.hoverCursor = 'grabbing';
            fabricCanvasRef.current.off('mouse:move');
            fabricCanvasRef.current.on('mouse:move', function (event) {
                throttledHandleMouseMove(event);
                const movementX = event.e.clientX - initialMouseX
                const movementY = event.e.clientY - initialMouseY;
                //console.log(movementX);
                XRenderStartRef.current = initXRenderStart + movementX;
                minPriceRef.current = initminPrice + movementY * priceChangePerPixel;
                maxPriceRef.current = initmaxPrice + movementY * priceChangePerPixel;
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
                lineWidthRef.current = Math.max(lineWidthRef.current - 0.5, 5);
                throttledDrawChartData();
            } else {
                lineWidthRef.current = Math.min(lineWidthRef.current + 0.5, 20);
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
            <div className="canvas-wrapper">
                <canvas ref={canvasRef} className="inner-canvas" />
                <canvas ref={priceCanvasRef} className="price-canvas" />
            </div>
            <div className="time-scale-wrapper">
                {timeScaleButtons}
            </div>
        </div>
    );
}

export default Chart;
