import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import './OrderPanel.css'
import { instContext, accountContext } from './appContext';
import Decimal from 'decimal.js'
import {handleLimitOrder} from './OKX_SDK/trade.js'
const baseURL = 'https://www.okx.com';

function OrderPanel() {
    const buyRef = useRef(null);
    const sellRef = useRef(null);
    const limitRef = useRef(null);
    const marketRef = useRef(null);
    const batchRef = useRef(null);
    const [buyOrSell, setBuyOrSell] = useState('buy');
    const [orderType, setOrderType] = useState('Limit');



    useEffect(() => {

        limitRef.current.style.borderBottom = 'solid black 2px'
        buyRef.current.addEventListener('click', () => {
            buyRef.current.style.backgroundColor = 'rgb(3, 179, 3)'
            buyRef.current.style.color = 'black'
            sellRef.current.style.backgroundColor = 'rgb(183, 183, 183)'
            sellRef.current.style.color = 'grey'
            setBuyOrSell('buy')
        })

        sellRef.current.addEventListener('click', () => {
            buyRef.current.style.backgroundColor = 'rgb(183, 183, 183)'
            buyRef.current.style.color = 'grey'
            sellRef.current.style.backgroundColor = 'red'
            sellRef.current.style.color = 'black'
            setBuyOrSell('sell')
        })


        limitRef.current.addEventListener('click', () => {
            limitRef.current.style.borderBottom = 'solid black 2px'
            marketRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
            batchRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
            setOrderType('Limit')
        })
        marketRef.current.addEventListener('click', () => {
            limitRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
            marketRef.current.style.borderBottom = 'solid black 2px'
            batchRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
            setOrderType('Market')
        });
        batchRef.current.addEventListener('click', () => {
            limitRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
            marketRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
            batchRef.current.style.borderBottom = 'solid black 2px'
            setOrderType('Batch')
        });

        return () => {
            console.log('OrderPanel unmounted');
        }
    }, [])


    return (
        <div className='order-panel' >
            <div className='buy-sell-wrapper'>
                <div className='button button-left' ref={buyRef}>买入</div>
                <div className='button button-right' ref={sellRef}>卖出</div>
            </div>
            <div className='order-type-wrapper'>
                <div className='order-type-button' ref={limitRef}>限价</div>
                <div className='order-type-button' ref={marketRef}>市价</div>
                <div className='order-type-button' ref={batchRef}>批量下单</div>
            </div>
            <div className='form-wrapper' >
                <Form buyOrSell={buyOrSell} orderType={orderType} />
            </div>

        </div>
    )
}

// eslint-disable-next-line react/prop-types
function Form({ buyOrSell, orderType }) {
    if (orderType === 'Limit') {
        return (
            <LimitForm buyOrSell={buyOrSell} />
        )
    } else if (orderType === 'Market') {
        return (
            <MarketForm buyOrSell={buyOrSell} />
        )
    } else if (orderType === 'Batch') {
        return (
            <BatchForm buyOrSell={buyOrSell} />
        )
    } else {
        return (
            <div>something went wrong...</div>
        )
    }
}

function isValidInput(value, precision) {
    console.log(value, precision)
    const x = new Decimal(value);
    const y = new Decimal(precision);
    return x.mod(y).equals(0);
}

function calcAmount(total, price, precision) {
    const x = new Decimal(total);
    const y = new Decimal(price);
    const p = new Decimal(precision);
    return x.div(y).dividedToIntegerBy(p).mul(p).toString();
}

// eslint-disable-next-line react/prop-types
function LimitForm({ buyOrSell }) {
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [total, setTotal] = useState('');
    const pricePricision = useRef(1);
    const sizePricision = useRef(1);
    const instId = useContext(instContext);
    const account = useContext(accountContext);

    const fetchMarketPrice = useCallback(async function () {
        const response = await fetch(`${baseURL}/api/v5/market/ticker?instId=${instId}`);
        const data = await response.json();
        setPrice(data.data[0].last);
    }, [instId])

    const fetchInstInfo = useCallback(async function () {
        const response = await fetch(`${baseURL}/api/v5/public/instruments?instType=SPOT&instId=${instId}`);
        const data = await response.json();
        console.log(data.data[0])
        pricePricision.current = data.data[0].tickSz;
        sizePricision.current = data.data[0].lotSz;
    }, [instId])

    useEffect(() => {
        fetchMarketPrice();
        fetchInstInfo();
    }, [fetchMarketPrice, fetchInstInfo])

    useEffect(() => {
        fetchMarketPrice();
    }, [buyOrSell, fetchMarketPrice])

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;

        switch (name) {
            case 'price':
                if (isValidInput(value, pricePricision.current)) {
                    setPrice(value);
                } else {
                    break;
                }
                if (total && amount && value) {
                    setTotal(value * amount);
                    break;
                }
                if (!value) {
                    setTotal('');
                    break;
                }
                if (amount) setTotal(value * amount);
                else if (total) setAmount(total / value);
                break;
            case 'amount':
                if (!value) {
                    setTotal('');
                    setAmount('');
                    break;
                }
                if (value && isValidInput(value, sizePricision.current)) {
                    setAmount(value);
                } else {
                    break;
                }
                if (total && price && value) {
                    setTotal((value * price).toFixed(1));
                    break;
                }

                if (price) setTotal(value * price);
                else if (total) setPrice(total / value);
                break;
            case 'total':
                if (!value) {
                    setAmount('');
                    setTotal('');
                    break;
                }
                if (isValidInput(value, 0.1)) {
                    setTotal(value);
                } else {
                    break;
                }
                if (price) setAmount(calcAmount(value, price, sizePricision.current));
                else if (amount) setPrice(value / amount);
                break;
            default:
                break;
        }
    }, [amount, price, total]);

    


    return (
        <form>
            <div className="price-input-wrapper">
                <label htmlFor="price">价格</label>
                <input type="number" id="price" name="price" value={price} onChange={handleInputChange} />
            </div>
            <div className="price-input-wrapper">
                <label htmlFor="amount">数量</label>
                <input type="number" id="amount" name="amount" value={amount} onChange={handleInputChange} />
            </div>
            <div className="price-input-wrapper">
                <label htmlFor="total">金额</label>
                <input type="number" id="total" name="total" value={total} onChange={handleInputChange} />
            </div>
            {buyOrSell === 'buy' ? <div className="order-panel-button buy-button" onClick={() => handleLimitOrder(account, instId, price, amount, 'buy')}>买入</div> : <div className="order-panel-button sell-button" onClick={() => handleLimitOrder(account, instId, price, amount, 'sell')}>卖出</div>}
        </form>
    )
}

// eslint-disable-next-line react/prop-types
function MarketForm({ buyOrSell }) {
    return (
        <form>
            <label htmlFor="amount">数量</label>
            <input type="number" id="amount" name="amount" />
            {buyOrSell === 'buy' ? <div className="order-panel-button buy-button">买入</div> : <div className="order-panel-button sell-button">卖出</div>}
        </form>

    )
}

// eslint-disable-next-line react/prop-types
function BatchForm({ buyOrSell }) {
    return (
        <form>
            <label htmlFor="amount">数量</label>
            <input type="number" id="amount" name="amount" />
            {buyOrSell === 'buy' ? <div className="order-panel-button buy-button">买入</div> : <div className="order-panel-button sell-button">卖出</div>}
        </form>

    )
}

export default OrderPanel;