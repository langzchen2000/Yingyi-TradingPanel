import { useContext, useEffect, useState } from 'react'
import { fetchMarketPrice, fetchMarketBooks } from './OKX_SDK/market.js'
import { instContext } from './appContext'
import './OrderTable.css'

export default function OrderTable() {
    const [display, setDisplay] = useState('order-book')

    return (
        <div className='order-table-wrapper'>
            <div className='selection-wrapper'>
                <div className='levels-button button' onClick={() => setDisplay('order-book')}>
                    订单表
                </div>
                <div className='latest-transactions-button button' onClick={() => setDisplay('latest-trans')}>
                    最新成交
                </div>
            </div>
            <div className='table-wrapper'>
                {display === 'order-book' ? <OrderBook /> : <Transactions />}
            </div>

        </div>
    )
}

function OrderBook() {
    const instId = useContext(instContext)
    const [marketPrice, setMarketPrice] = useState(0)
    const [size, setSize] = useState(7)
    const [asks, setAsks] = useState([])
    const [bids, setBids] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchMarketPrice(instId).then((data) => {
                setMarketPrice(data)
            })
        }, 1000)

        const intervalId2 = setInterval(() => {
            fetchMarketBooks(instId, size).then((data) => {
                setAsks(data.asks)
                setBids(data.bids)
            })
        }, 1000)
        setIsLoading(true);
        Promise.all([fetchMarketPrice(instId), fetchMarketBooks(instId, size)]).then((data) => {
            setMarketPrice(data[0])
            setAsks(data[1].asks)
            setBids(data[1].bids)
            setIsLoading(false)
        })
        return () => {
            clearInterval(intervalId);
            clearInterval(intervalId2);
        }
    }, [instId, size])

    return (
        <div className='orders-wrapper'>
            {isLoading ? <div className='loader-wrapper'> <div className='loader'></div> </div>: (
                <>            <div className='sell-order-table'>
                {asks.map((item, idx) => {
                    return (
                        <div className='order-row' key={idx}>
                            <div className='order-price'>{item[0]}</div>
                            <div className='order-amount'>{item[1]}</div>
                            <div className='order-number'>{item[3]}</div>
                        </div>
                    )
                })
                }
            </div>
            <div className='current-price'>
                {marketPrice}
            </div>
            <div className='buy-order-table'>
            {bids.map((item, idx) => {
                    return (
                        <div className='order-row' key={idx}>
                            <div className='order-price'>{item[0]}</div>
                            <div className='order-amount'>{item[1]}</div>
                            <div className='order-number'>{item[3]}</div>
                        </div>
                    )
                })
                }
            </div> </>)}
        </div>
    )
}

function Transactions() {
    return (
        <div className='transactions-wrapper'>
            <div className='transactions-table'>

            </div>
        </div>
    )
}