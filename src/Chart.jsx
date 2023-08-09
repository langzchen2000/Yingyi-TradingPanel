import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { fabric } from 'fabric';

function Chart({ height, width }) {
    const baseURL = 'https://www.okx.com'
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [timeScale, setTimeScale] = useState('15m');
    const [chartData, setChartData] = useState([]);
    const horiLineRef = useRef(null);
    const lastLineRef = useRef(null);
    const MIN_MAX_MARGIN = 20;
    const PRICE_HORI_MARGIN = 47;
    const STROKE_WIDTH = 3;

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
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(`${baseURL}/api/v5/market/candles?instId=BTC-USDT&bar=${timeScale}`);
                const data = await response.json();
                setChartData(data.data);
            } catch (error) {
                console.log(error);
            }
        }, 150);
        return () => {
            clearInterval(intervalId);
        }
    }, [timeScale])

    //响应画布初始化
    useLayoutEffect(() => {
        if (fabricCanvas) {
            console.log(height);
            console.log(fabricCanvas)
            fabricCanvas.setHeight(height);
            fabricCanvas.selection = false;
            fabricCanvas.setWidth(Math.max(width, 300));
            drawBackground();
            drawChartData();
            const intervalId = setInterval(() => {
                // drawBackground();
                // drawChartData();
                drawLine();
            }, 50);
            fabricCanvas.on('mouse:move', function (event) {
                const pointer = fabricCanvas.getPointer(event.e);
                const posY = pointer.y;
                const posX = pointer.x;
                const newHoriLine = new fabric.Line(
                    [STROKE_WIDTH, posY, fabricCanvas.width - STROKE_WIDTH - PRICE_HORI_MARGIN, posY],
                    {
                        stroke: 'black',
                        strokeWidth: 1,
                        strokeDashArray: [5, 5],
                        selectable: false,
                    }
                );
                horiLineRef.current = newHoriLine;
            });

            fabricCanvas.on('mouse:out', function (event) {
                if (horiLine) {
                    setHoriLine(null);
                }
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
            drawBackground();
            drawChartData();
        }
    }, [height, width])

    const drawBackground = () => {
        if (fabricCanvas) {
            fabricCanvas.clear();  // 清除canvas内容
            const rect = new fabric.Rect({
                left: 0,
                top: 0,
                fill: 'transparent',  // 填充颜色，transparent为透明
                width: fabricCanvas.width - 50,
                height: fabricCanvas.height - 3,
                stroke: 'red',
                strokeWidth: STROKE_WIDTH,
                selectable: false,
                hoverCursor: 'default',
            });

            fabricCanvas.add(rect);
        }
    };

    const drawChartData = () => {
        if (fabricCanvas && chartData.length > 0) {
            let max;
            let min;
            for (let i = 0; i < chartData.length; i++) {
                const item = chartData[i];
                const x = Math.min(15, Math.max((fabricCanvas.width - 50) / 30, 5));
                const leftStart = fabricCanvas.width - PRICE_HORI_MARGIN - STROKE_WIDTH - x * (i + 1)
                if (leftStart < 0) break;
                max = max ? Math.max(max, item[2]) : item[2];
                min = min ? Math.min(min, item[3]) : item[3];
            }
            for (let i = 0; i < chartData.length; i++) {

                const item = chartData[i];
                const x = Math.min(15, Math.max((fabricCanvas.width - 50) / 30, 5));
                const y = (fabricCanvas.height - 2 * MIN_MAX_MARGIN) / (max - min) * (item[1] - item[4]);
                const leftStart = fabricCanvas.width - PRICE_HORI_MARGIN - STROKE_WIDTH - x * (i + 1);
                if (leftStart < 0) break;
                const rect = new fabric.Rect({
                    left: leftStart,
                    top: fabricCanvas.height - (MIN_MAX_MARGIN + (item[1] - min) / (max - min) * (fabricCanvas.height - 2 * MIN_MAX_MARGIN)),
                    fill: item[1] > item[4] ? 'red' : 'green',  // 填充颜色, 红跌绿涨
                    width: x,
                    height: y,
                })
                const wick = new fabric.Line(
                    [
                        leftStart + x / 2,
                        fabricCanvas.height - (MIN_MAX_MARGIN + (item[2] - min) / (max - min) * (fabricCanvas.height - 2 * MIN_MAX_MARGIN)),
                        leftStart + x / 2,
                        fabricCanvas.height - (MIN_MAX_MARGIN + (item[3] - min) / (max - min) * (fabricCanvas.height - 2 * MIN_MAX_MARGIN)),
                    ],
                    {
                        fill: item[1] > item[4] ? 'red' : 'green',
                        stroke: item[1] > item[4] ? 'red' : 'green',
                        strokeWidth: 2,
                        selectable: false,
                    }
                )
                fabricCanvas.add(rect);
                fabricCanvas.add(wick);
            }
            const mintxt = new fabric.Text(min.toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN,
                top: fabricCanvas.height - MIN_MAX_MARGIN,
                fontSize: 10,
                selectable: false,
                hoverCursor: 'default',
            })
            const maxtxt = new fabric.Text(max.toString(), {
                left: fabricCanvas.width - PRICE_HORI_MARGIN,
                top: MIN_MAX_MARGIN,
                fontSize: 10,
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
            fabricCanvas.add(horiLineRef.current);
            lastLineRef.current = horiLineRef.current;
            fabricCanvas.renderAll();
        }
    }

    useEffect(() => {
        drawBackground();
        drawChartData();
    }, [chartData]);

    return (
        <div className="chart">

            <canvas ref={canvasRef} />
            <label >时间刻度</label>
            <select onChange={(e) => setTimeScale(e.target.value)}>
                <option value='15m'>15m</option>
                <option value='30m'>30m</option>
                <option value='1H'>1h</option>
                <option value='4H'>4h</option>
            </select>
        </div>
    );
}

export default Chart;
