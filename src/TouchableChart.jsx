import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { fabric } from 'fabric';
import { instContext } from './appContext';
import './Chart.css';
import 'material-icons/iconfont/material-icons.css';
import { throttle } from 'lodash'

const PRICE_HORI_MARGIN = 53;
const GAP = 3;

const timeScaleSelect = ['1m', '5m', '15m', '30m', '1H', '2H', '4H', '12H', '1D']
const timeScaleToMiliseconds = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '2H': 2 * 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
    '6H': 6 * 60 * 60 * 1000,
    '8H': 8 * 60 * 60 * 1000,
    '12H': 12 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '2D': 2 * 24 * 60 * 60 * 1000,
    '3D': 3 * 24 * 60 * 60 * 1000,
    '7D': 7 * 24 * 60 * 60 * 1000,
    '14D': 14 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000,
    '2M': 60 * 24 * 60 * 60 * 1000,
    '3M': 90 * 24 * 60 * 60 * 1000,
    '6M': 180 * 24 * 60 * 60 * 1000,
}

//given a number, return the closest number of the patter 1/2/5*10Ex, x can be any integer number
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

function timeLevel(num) {
    if (num > timeScaleToMiliseconds['2M']) {
        return '14D';
    } else if(num > timeScaleToMiliseconds['1M']) {
        return '7D'
    } else if(num > timeScaleToMiliseconds['14D']) {
        return '2D';
    } else if (num > timeScaleToMiliseconds['7D']) {
        return '1D';
    } else if (num > timeScaleToMiliseconds['3D']) {
        return '8H';
    } else if (num > timeScaleToMiliseconds['1D']) {
        return '4H'
    } else if (num > timeScaleToMiliseconds['12H']) {
        return '2H'
    } else if (num > timeScaleToMiliseconds['6H']) {
        return '1H'
    } else if (num > timeScaleToMiliseconds['4H']) {
        return '30m'
    } else if (num > timeScaleToMiliseconds['2H']) {
        return '15m'
    } else if (num > timeScaleToMiliseconds['1H']) {
        return '10m'
    } else if (num > timeScaleToMiliseconds['30m']) {
        return '5m'
    } else return timeScaleToMiliseconds['1m'];
}

function formatTime(milliseconds) {
    const date = new Date(milliseconds);

    // 检查是否为年份开始
    if (date.getMonth() === 0 && date.getDate() === 1 && date.getHours() === 8 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
        return date.getFullYear().toString();
    }

    // 检查是否为月份开始
    if (date.getDate() === 1 && date.getHours() === 8 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
        return (date.getMonth() + 1) + '月';  // 月份是从0开始的，所以+1
    }

    // 检查是否为天开始
    if (date.getHours() === 8 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
        return date.getMonth() + 1 + '/' + date.getDate().toString();
    }

    // 检查是否为小时开始
    if (date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
        return date.getHours().toString();
    }

    // 否则，输出小时:分钟
    return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');  // 使用padStart确保分钟是两位数
}

const styleConfig = {
    backgroundStrockColor: 'rgb(235, 230, 235)',
    redColor: 'red',
    greenColor: 'rgb(3, 179, 3)',
}

const baseURL = 'https://www.okx.com'
console.log('not touchable')
// eslint-disable-next-line react/prop-types
function Chart() {


    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const priceCanvasRef = useRef(null);
    const fabricPriceCanvasRef = useRef(null);
    const timeCanvasRef = useRef(null);
    const fabricTimeCanvasRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const [timeScale, setTimeScale] = useState('15m');

    const maxPriceRef = useRef(0);
    const minPriceRef = useRef(0);

    const horiLineRef = useRef(null);
    const vertiLineRef = useRef(null);
    const horiLinePriceTag = useRef(null);
    const priceTagRef = useRef(null);
    const horiGridRef = useRef([]);
    const horiLineGridTag = useRef([]);
    const vertiLineGridRef = useRef([]);
    const vertiLineGridTag = useRef([]);
    

    const XRenderStartRef = useRef(0);
    const lastRenderRange = useRef([]);
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
        fabricCanvasRef.current.selection = false;
        //初始化价格画布（上层）
        fabricPriceCanvasRef.current = new fabric.Canvas(priceCanvasRef.current);
        fabricPriceCanvasRef.current.imageSmoothingEnabled = false;
        fabricPriceCanvasRef.current.backgroundColor = 'white';
        fabricPriceCanvasRef.current.setWidth(PRICE_HORI_MARGIN);
        fabricPriceCanvasRef.current.selection = false;
        //初始化时间画布
        fabricTimeCanvasRef.current = new fabric.Canvas(timeCanvasRef.current);
        fabricTimeCanvasRef.current.imageSmoothingEnabled = false;
        fabricTimeCanvasRef.current.backgroundColor = 'white';
        fabricTimeCanvasRef.current.setHeight(40);
        fabricTimeCanvasRef.current.selection = false;
        //设置价格画布container的样式
        const container = fabricPriceCanvasRef.current.wrapperEl
        container.style.position = 'absolute';
        container.style.top = '0';
        //初始化k线画布container的样式
        const lowerContainer = fabricCanvasRef.current.wrapperEl;
        lowerContainer.style.position = 'absolute';
        lowerContainer.style.top = '0';
        lowerContainer.style.left = '0';
        //初始化时间画布container的样式
        const timeContainer = fabricTimeCanvasRef.current.wrapperEl;
        timeContainer.style.position = 'absolute';
        timeContainer.style.left = '0';

        function handleResize() {
            if (canvasWrapperRef.current) {
            fabricCanvasRef.current.setWidth(canvasWrapperRef.current.clientWidth);
            fabricCanvasRef.current.setHeight(window.innerHeight * 0.8)
            const container = fabricPriceCanvasRef.current.wrapperEl;
            container.style.left = fabricCanvasRef.current.width - PRICE_HORI_MARGIN + 'px';
            container.style.zIndex = '2';
            fabricPriceCanvasRef.current.setHeight(window.innerHeight * 0.8);
            const timeContainer = fabricTimeCanvasRef.current.wrapperEl;
            timeContainer.style.top = fabricCanvasRef.current.height + 'px';
            fabricTimeCanvasRef.current.setWidth(canvasWrapperRef.current.clientWidth - 20);
            }
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvasWrapperRef.current);
        handleResize();
        return () => {
            fabricCanvasRef.current.dispose();
            fabricPriceCanvasRef.current.dispose();
            fabricTimeCanvasRef.current.dispose();
            resizeObserver.disconnect();
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
            //计算价格尺度，确定网格线数量，确保每条网格线之间间距在100px左右
            const priceOf100pxs = priceChangePerPixel * 100;
            const cloestInterval = closestMultipleOf125(priceOf100pxs);
            const numOfLines = Math.ceil(fabricCanvasRef.current.height / (cloestInterval * heightFactor)) + 1;
            const topHoriLine = maxPriceRef.current % cloestInterval * heightFactor

            //清除多余的网格线和价格标签
            if (numOfLines < horiGridRef.current.length) {
                for (let i = numOfLines - 1; i < horiGridRef.current.length; i++) {
                    fabricCanvasRef.current.remove(horiGridRef.current[i]);
                    horiGridRef.current[i] = null;
                }
            }
            if (numOfLines < horiLineGridTag.current.length) {
                for (let i = numOfLines - 1; i < horiLineGridTag.current.length; i++) {
                    fabricPriceCanvasRef.current.remove(horiLineGridTag.current[i]);
                    horiLineGridTag.current[i] = null;
                }
            }
            //更新网格线位置和价格标签
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
                    const newhoriLineGridTag = new fabric.Text(((Math.floor(maxPriceRef.current / cloestInterval) - i) * cloestInterval).toFixed(1).toString(), {
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
            //计算时间尺度
            const time = Math.floor(1500 / (lineWidthRef.current + GAP)) * timeScaleToMiliseconds[timeScale];
            const timeLevelString = timeLevel(time);
            const numOfVertiLines = Math.ceil(fabricCanvasRef.current.width / (lineWidthRef.current + GAP) * timeScaleToMiliseconds[timeScale] / timeScaleToMiliseconds[timeLevelString]) + 5;
            //开始绘制k线的坐标与canvas宽度之间间隔k线个数
            const kLinesInBetween =  Math.ceil((fabricCanvasRef.current.width - PRICE_HORI_MARGIN - XRenderStartRef.current - lineWidthRef.current / 2) / (lineWidthRef.current + GAP) + 1)
            //在canvas之外接近canvas右边缘的k线的时间戳
            const canvasStartTime = Number(chartDataRef.current[0][0]) + kLinesInBetween * timeScaleToMiliseconds[timeScale];
            //计算最靠近canvas右边缘的时间网格线的时间戳
            const gridStartTime = Math.floor(canvasStartTime / timeScaleToMiliseconds[timeLevelString]) * timeScaleToMiliseconds[timeLevelString];
            const gridInterval = timeScaleToMiliseconds[timeLevelString] / timeScaleToMiliseconds[timeScale] * (lineWidthRef.current + GAP);
            //计算最靠近canvas右边缘的时间网格线的x坐标
            const gridStartX = (gridStartTime - Number(chartDataRef.current[0][0])) / timeScaleToMiliseconds[timeScale] * (lineWidthRef.current + GAP) + XRenderStartRef.current - (lineWidthRef.current / 2 + GAP);
            //清除多余的时间网格线和时间标签
            if (numOfVertiLines < vertiLineGridRef.current.length) {
                for (let i = numOfVertiLines; i < vertiLineGridRef.current.length; i++) {
                    fabricCanvasRef.current.remove(vertiLineGridRef.current[i]);
                    vertiLineGridRef.current[i] = null;
                }
            }
            if (numOfVertiLines < vertiLineGridTag.current.length) {
                for (let i = numOfVertiLines; i < vertiLineGridTag.current.length; i++) {
                    fabricTimeCanvasRef.current.remove(vertiLineGridTag.current[i]);
                    vertiLineGridTag.current[i] = null;
                }
            }
            //更新时间网格线和时间标签
            for (let i = 0; i < numOfVertiLines; i++) {
                let xPos = gridStartX - i * gridInterval;
                if (vertiLineGridRef.current[i]) {
                    vertiLineGridRef.current[i].set({
                        x1: xPos,
                        x2: xPos,
                        y1: 0,
                        y2: fabricCanvasRef.current.height,
                    })
                    vertiLineGridRef.current[i].setCoords();
                } else {
                    const newVertiLine = new fabric.Line(
                        [xPos, 0, xPos, fabricCanvasRef.current.height],
                        {
                            stroke: styleConfig.backgroundStrockColor,
                            strokeWidth: 1,
                            selectable: false,
                            hoverCursor: 'default',
                        }
                    )
                    fabricCanvasRef.current.add(newVertiLine);
                    vertiLineGridRef.current.push(newVertiLine);
                }
            }
            for (let i = 0; i < numOfVertiLines; i++) {
                let xPos = gridStartX - i * gridInterval;
                const tempDate = formatTime(gridStartTime - i * timeScaleToMiliseconds[timeLevelString]);
                if (vertiLineGridTag.current[i]) {
                    vertiLineGridTag.current[i].set({
                        text: tempDate,
                        left: xPos,
                        top: 0,
                    })
                    vertiLineGridTag.current[i].setCoords();
                } else {
                    const newVertiLineGridTag = new fabric.Text(tempDate, {
                        left: xPos,
                        top: 0,
                        fontSize: 15,
                        selectable: false,
                        color: 'black',
                        hoverCursor: 'default',
                        originX: 'center',
                    })
                    fabricTimeCanvasRef.current.add(newVertiLineGridTag);
                    vertiLineGridTag.current.push(newVertiLineGridTag);
                }
            }


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
                fabricPriceCanvasRef.current.bringToFront(priceTagRef.current);
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
            if (lastRenderRange.current.length == 2) {
                for (let i = lastRenderRange.current[0]; i <= Math.min(lastRenderRange.current[1], chartDataRef.current.length - 1); i++) {
                    if (rects[i]) rects[i].set({
                        visible: false,
                    })
                    if (wicks[i]) wicks[i].set({
                        visible: false,
                    })
                }
            }
            const rangeStart = Math.max(Math.floor((XRenderStartRef.current - fabricCanvasRef.current.width) / (lineWidthRef.current + GAP)), 0);
            const rangeEnd = Math.max(Math.floor((XRenderStartRef.current - lineWidthRef.current) / (lineWidthRef.current + GAP)), 0);
            lastRenderRange.current = [rangeStart, rangeEnd];
            for (let i = rangeStart; i <= Math.min(chartDataRef.current.length - 1, rangeEnd) ; i++) {
                const item = chartDataRef.current[i];
                const y = Math.abs(heightFactor * (item[1] - item[4])) < 1 ? 1 : heightFactor * (item[1] - item[4]);
                const gap = lineWidthRef.current + GAP;
                const leftStart = Math.round(XRenderStartRef.current - gap * (i + 1));
                if (rects[i]) {
                    rects[i].set({
                        left: leftStart,
                        top: item[1] > item[4] ? (maxPriceRef.current - item[1]) * heightFactor : (maxPriceRef.current - item[4]) * heightFactor,
                        fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        width: lineWidthRef.current,
                        height: Math.abs(y),
                        visible: true,
                    })
                    rects[i].setCoords();
                    rects[i].bringToFront();
                } else {
                    const rect = new fabric.Rect({
                        left: leftStart,
                        top: (maxPriceRef.current - item[1]) * heightFactor,
                        fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        width: lineWidthRef.current,
                        height: y,
                        selectable: false,
                        hoverCursor: 'default',
                        visible: true,
                    })
                    fabricCanvasRef.current.add(rect);
                    rect.bringToFront();
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
                        visible: true,
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
                            strokeWidth: 1,
                            selectable: false,
                            hoverCursor: 'default',
                            visible: true,
                        }
                    );
                    fabricCanvasRef.current.add(wick);
                    wicks.push(wick);

                }
            }

            fabricCanvasRef.current.renderAll();
            fabricPriceCanvasRef.current.renderAll();
            fabricTimeCanvasRef.current.renderAll();
        }
    }, [fetchMoreData, timeScale]);

        
        
        

    useEffect(() => {
        XRenderStartRef.current = Math.round(fabricCanvasRef.current.width - PRICE_HORI_MARGIN)
        if (lastRenderRange.current.length == 2) {
            let rects = chartObjectsRef.current.rects;
            let wicks = chartObjectsRef.current.wicks;
            if (lastRenderRange.current.length == 2) {
                for (let i = lastRenderRange.current[0]; i <= Math.min(lastRenderRange.current[1], chartDataRef.current.length - 1); i++) {
                    rects[i].set({
                        visible: false,
                    })
                    wicks[i].set({
                        visible: false,
                    })
                }
            }
            fabricCanvasRef.current.renderAll();
        }
    }, [timeScale, instId, drawChartData])

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
                    
                
                if (calcMinAndMax) {
                    maxPriceRef.current = Math.max(...data.data.map(item => item[2]));
                    minPriceRef.current = Math.min(...data.data.map(item => item[3]));
                }
                drawChartData()
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
    }, [timeScale, instId, drawChartData])




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
                horiLinePriceTag.current.bringToFront();
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
                horiLinePriceTag.current.bringToFront();
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

        fabricCanvasRef.current.on('mouse:move', function (event) {
            handleMouseMove(event)
        });

        fabricCanvasRef.current.on('mouse:out', function () {
            fabricCanvasRef.current.remove(horiLineRef.current);
            fabricCanvasRef.current.remove(vertiLineRef.current);
            fabricCanvasRef.current.remove(datetextRef.current);
            fabricPriceCanvasRef.current.remove(horiLinePriceTag.current);
            horiLineRef.current = null;
            vertiLineRef.current = null
            datetextRef.current = null;
            horiLinePriceTag.current = null;
        });


        fabricCanvasRef.current.on('mouse:wheel', function (event) {
            event.e.preventDefault();
            console.log('wheel')
            if (event.e.deltaY > 0) {
                lineWidthRef.current = Math.max(lineWidthRef.current - 2, 2);
                drawChartData();
            } else {
                lineWidthRef.current = Math.min(lineWidthRef.current + 2, 20);
                drawChartData();
            }
        });

        fabricPriceCanvasRef.current.on('mouse:wheel', function (event) {
            event.e.preventDefault();
            const priceChangePerPixel = (maxPriceRef.current - minPriceRef.current) / (fabricCanvasRef.current.height);
            const priceOf100pxs = priceChangePerPixel * 100;
            const cloestInterval = closestMultipleOf125(priceOf100pxs);
            if (event.e.deltaY < 0) {
                maxPriceRef.current = maxPriceRef.current + cloestInterval;
                minPriceRef.current = Math.max(minPriceRef.current - cloestInterval, 0);
                drawChartData();

            } else {
                maxPriceRef.current = Math.max(maxPriceRef.current - cloestInterval, minPriceRef.current + cloestInterval);
                minPriceRef.current = Math.min(minPriceRef.current + cloestInterval, maxPriceRef.current - cloestInterval);
                drawChartData();
            }
        });

        return () => {
            fabricCanvasRef.current.off('mouse:move');
            fabricCanvasRef.current.off('mouse:down');
            fabricCanvasRef.current.off('mouse:up');
            fabricCanvasRef.current.off('mouse:wheel');
            fabricPriceCanvasRef.current.off('mouse:wheel')
        }
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

            <div className="canvas-wrapper" ref={canvasWrapperRef}>
                <canvas ref={canvasRef} className="inner-canvas" />
                <canvas ref={priceCanvasRef} className="price-canvas" />
                <canvas ref={timeCanvasRef} className="time-canvas" />
            </div>

            <div className="time-scale-wrapper">
                {timeScaleButtons}
            </div>
        </div>
    );
}

export default Chart;
