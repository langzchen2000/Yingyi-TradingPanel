import { useEffect, useContext, useState } from 'react'
import { accountContext, instContext } from './appContext.jsx'
import { fetchOrderHistory } from './OKX_SDK/trade.js'

import './OrderHistory.css'
function OrderHistory() {
    const account = useContext(accountContext);
    const instId = useContext(instContext);
    const [isLoading, setIsLoading] = useState(true);
    const [historyData, setHistoryData] = useState(null);
    useEffect(() => {
        setIsLoading(true)
        const data = fetchOrderHistory(account, instId)
        data.then((data) => {
            setHistoryData(data.data);
            setIsLoading(false);
        })
        const intervalId = setInterval(() => {
            const data = fetchOrderHistory(account, instId);
            data.then((data) => {
                setHistoryData(data.data);
            })
        }, 5000)
        return () => {
            clearInterval(intervalId);
        }
    }, [account, instId])

    const getTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    const renderHistory = () => {
        if (isLoading) {
            return <div className="loader"></div>;
        }
        else if (historyData.length > 0) {
            return historyData.map((item) => {
                return (<div key={item.ordId} className={"order-block " + (item.side === 'buy' ? 'buy' : 'sell')}>
                    <div className="wrapper">
                        <div className={item.side === 'buy' ? 'buy' : 'sell'}>{item.side === 'buy' ? '买入' : '卖出'}</div>
                    </div>
                    <div className="price"><em>委托价格：</em>{item.avgPx}</div>
                    <div className="amount"><em>委托数量：</em>{item.sz}</div>
                    <div className="time"><em>订单创建时间：</em>{getTime(Number(item.cTime))}</div>
                    <div className="fill-time"><em>最新成交时间: </em>{getTime(Number(item.fillTime))}</div>
                </div>)
            })
        } else {
            return <div>暂无数据</div>
        }
    }

    return (
        <div className="order-history">
            {!isLoading ? <div className="order-history-title">历史委托</div> : null}
            <div className="order-history-content">
                {renderHistory()}
            </div>
        </div>
    )

}

export default OrderHistory;