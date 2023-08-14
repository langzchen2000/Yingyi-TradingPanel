import React, { useEffect, useRef, useState, useLayoutEffect, useContext } from 'react';
import { fabric } from 'fabric';
import { instContext } from './appContext';
import './Chart.css';

function Chart({ height, width}) {
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


    const MIN_MAX_MARGIN = 20;
    const PRICE_HORI_MARGIN = 53;
    const STROKE_WIDTH = 1;
    const instId = useContext(instContext);
    const [xRenderStart, setXRenderStart] = useState(width - PRICE_HORI_MARGIN - STROKE_WIDTH);

    const timeScaleSelect = ['1m', '5m', '15m', '30m', '1H', '2H', '4H', '12H', '1D']
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
        const fetchKLineData = async (calcMinAndMax) => {
            try {
                const response = await fetch(`${baseURL}/api/v5/market/candles?instId=${instId}&bar=${timeScale}&after=${Date.now()}`);
                const data = await response.json();
                if (!ignore) {
                    setChartData(data.data);
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
        fetchKLineData(true);
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

    const handleMouseMove = (event) => {
        const pointer = fabricCanvas.getPointer(event.e);
        const posY = pointer.y;
        const posX = Math.min(pointer.x, fabricCanvas.width - PRICE_HORI_MARGIN);

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
            [posX, STROKE_WIDTH, posX, fabricCanvas.height - STROKE_WIDTH],
            {
                stroke: 'black',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                needRemove: false,
                hoverCursor: 'default',
            }
        )
        horiLineRef.current = newHoriLine;
        vertLineRef.current = newVertiLine;
        drawLine();
    }

    //响应画布初始化
    useLayoutEffect(() => {
        if (fabricCanvas) {
            console.log(height);
            console.log(fabricCanvas)
            fabricCanvas.setHeight(height);
            fabricCanvas.selection = false;
            fabricCanvas.setWidth(Math.max(width, 100));
            drawChartData();
            fabricCanvas.on('mouse:move', handleMouseMove);

            fabricCanvas.on('mouse:out', function (event) {
                if (horiLineRef.current) {
                    horiLineRef.current = null;
                }
            });
            fabricCanvas.on('mouse:down', function (event) {
                fabricCanvas.off('mouse:move');
                fabricCanvas.on('mouse:move', function (event) {
                    handleMouseMove(event);
                    const movementX = event.e.movementX;
                    setXRenderStart(prevXRenderStart => prevXRenderStart + movementX);
                });
            });
            fabricCanvas.on('mouse:up', function (event) {
                fabricCanvas.off('mouse:move');
                fabricCanvas.on('mouse:move', handleMouseMove);
            });

            return () => {
                fabricCanvas.dispose();
                clearInterval(intervalId);
            };
        }

    }, [fabricCanvas])

    //响应长宽的变化
    useEffect(() => {
        if (fabricCanvas) {
            fabricCanvas.setHeight(height);
            fabricCanvas.setWidth(Math.max(width, 300));
            //fabricCanvas.renderAll();

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
            const x = Math.min(15, Math.max((fabricCanvas.width - 50) / 30, 5));
            for (let i = 0; i < chartData.length; i++) {
                const item = chartData[i];
                const y = (fabricCanvas.height - 2 * MIN_MAX_MARGIN) / (priceMax -priceMin) * (item[1] - item[4]);
                const leftStart = xRenderStart - x * (i + 1);
                if (leftStart < -x) break;
                if (leftStart > fabricCanvas.width - PRICE_HORI_MARGIN - 2 * x) continue;
                const rect = new fabric.Rect({
                    left: leftStart,
                    top: fabricCanvas.height - (MIN_MAX_MARGIN + (item[1] - priceMin) / (priceMax - priceMin) * (fabricCanvas.height - 2 * MIN_MAX_MARGIN)),
                    fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,  // 填充颜色, 红跌绿涨
                    width: x,
                    height: y,
                    selectable: false,
                    hoverCursor: 'default',
                })
                const wick = new fabric.Line(
                    [
                        leftStart + x / 2,
                        fabricCanvas.height - (MIN_MAX_MARGIN + (item[2] - priceMin) / (priceMax - priceMin) * (fabricCanvas.height - 2 * MIN_MAX_MARGIN)),
                        leftStart + x / 2,
                        fabricCanvas.height - (MIN_MAX_MARGIN + (item[3] - priceMin) / (priceMax - priceMin) * (fabricCanvas.height - 2 * MIN_MAX_MARGIN)),
                    ],
                    {
                        fill: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        stroke: item[1] > item[4] ? styleConfig.redColor : styleConfig.greenColor,
                        strokeWidth: 2,
                        selectable: false,
                        hoverCursor: 'default',
                    }
                )
                fabricCanvas.add(rect);
                fabricCanvas.add(wick);
            }
            const mintxt = new fabric.Text(priceMin.toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                top: fabricCanvas.height - MIN_MAX_MARGIN,
                fontSize: 15,
                selectable: false,
                hoverCursor: 'default',
            })
            const maxtxt = new fabric.Text(priceMax.toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN + STROKE_WIDTH,
                top: MIN_MAX_MARGIN,
                fontSize: 15,
                selectable: false,
                hoverCursor: 'default',
            })
            fabricCanvas.add(mintxt);
            fabricCanvas.add(maxtxt);
        }
    };

    const drawLine = () => {
        if (fabricCanvas && horiLineRef.current) {
            if (lastLineRef.current) fabricCanvas.remove(lastLineRef.current);
            if (lastVertLineRef.current) fabricCanvas.remove(lastVertLineRef.current);
            fabricCanvas.add(horiLineRef.current);
            fabricCanvas.add(vertLineRef.current);
            lastLineRef.current = horiLineRef.current;
            lastVertLineRef.current = vertLineRef.current;
            //fabricCanvas.renderAll();
        }
    }

    useEffect(() => {
        drawChartData();
        drawLine();
    }, [chartData]);
    
    const timeScaleButtons = timeScaleSelect.map((item) => {
        return (
            <button key={item} onClick={() => {if(item !== timeScale) setTimeScale(item)}} className={item === timeScale ? 'selected' : ''}>
                {item}
            </button>
        )
    })

    return (
        <div className="chart">
            <canvas ref={canvasRef} className="inner-canvas"/>
            <div className="time-scale-wrapper">
                {timeScaleButtons}
            </div>
        </div>
    );
}

export default Chart;
