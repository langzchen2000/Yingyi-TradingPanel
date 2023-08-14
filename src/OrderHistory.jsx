import { useEffect, useContext, useState } from 'react'
import { accountContext, instContext } from './appContext.jsx'
import CryptoJS from 'crypto-js'
import './OrderHistory.css'
function OrderHistory() {
    const account = useContext(accountContext);
    const instId = useContext(instContext);
    const [isLoading, setIsLoading] = useState(true);
    const [historyData, setHistoryData] = useState(null);
    useEffect(() => {
        setIsLoading(true)
        const fetchOrderHistory = async () => {
            try {
                const baseURL = 'https://www.okx.com'
                const path = `/api/v5/trade/orders-history-archive?instType=SPOT&instId=${instId}`
                let timestamp = new Date().toISOString()
                const SecretKey = account.okSecretKey
                const okAccessKey = account.okAccessKey
                const okPassphrase = account.okPassphrase
                let sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(timestamp + 'GET' + path, SecretKey))
                const response = await fetch(baseURL + path, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'OK-ACCESS-KEY': okAccessKey,
                        'OK-ACCESS-SIGN': sign,
                        'OK-ACCESS-TIMESTAMP': timestamp,
                        'OK-ACCESS-PASSPHRASE': okPassphrase
                    }
                })
                
                const data = await response.json()
                console.log(data.data)
                setIsLoading(false)
                setHistoryData(data.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchOrderHistory();
        const intervalId = setInterval(() => {
            fetchOrderHistory();
        }, 3000)
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
            <div className="order-history-title">历史委托</div>
            <div className="order-history-content">
                {renderHistory()}
            </div>
        </div>
    )

}

export default OrderHistory;