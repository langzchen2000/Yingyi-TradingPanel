import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import './OrderPanel.css'
function OrderPanel() {
    const buyRef = useRef(null);
    const sellRef = useRef(null);
    const limitRef = useRef(null);
    const marketRef = useRef(null);
    const batchRef = useRef(null);
    const [buyOrSell, setBuyOrSell] = useState('buy');
    const [orderType, setOrderType] = useState('limit');
    useEffect(() => {
        if (buyRef.current) {
            buyRef.current.style.backgroundColor = 'green'
            setBuyOrSell('buy')
        }
        if (limitRef.current) {
            limitRef.current.style.borderBottom = 'solid black 2px'
            setOrderType('Limit')
        }
        if (buyRef.current && sellRef.current) {
            buyRef.current.addEventListener('click', () => {
                buyRef.current.style.backgroundColor = 'green'
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
        }
        if (limitRef.current && marketRef.current) {
            limitRef.current.addEventListener('click', () => {
                limitRef.current.style.borderBottom = 'solid black 2px'
                marketRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
                batchRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
                setOrderType('Limit')
            });
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
        }
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

function LimitForm({buyOrSell}) {
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [total, setTotal] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        switch (name) {
            case 'price':
                setPrice(value);
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
                setAmount(value);
                if (total && price && value) {
                    setTotal(value * price);
                    break;
                }
                if (!value) {
                    setTotal('');
                    break;
                }
                if (price) setTotal(value * price);
                else if (total) setPrice(total / value);
                break;
            case 'total':
                setTotal(value);
                console.log(typeof value);
                if (value && amount && price) {
                    setAmount(value / price);
                    break;
                }
                if (!value) {
                    setAmount('');
                    break;
                }
                if (price) setAmount(value / price);
                else if (amount) setPrice(value / amount);
                break;
            default:
                break;
        }
    };

    return (
        <form>
            <div className="price-input-wrapper">
                <label htmlFor="price">价格</label>
                <input type="number" id="price" name="price" value={price} onChange={handleInputChange}/>
            </div>
            <div className="price-input-wrapper">
            <label htmlFor="amount">数量</label>
            <input type="number" id="amount" name="amount" value={amount} onChange={handleInputChange}/>
            </div>
            <div className="price-input-wrapper">
                <label htmlFor="total">金额</label>
                <input type="number" id="total" name="total" value={total} onChange={handleInputChange}/>
            </div>
            {buyOrSell === 'buy' ? <div className="order-panel-button buy-button">买入</div> : <div className="order-panel-button sell-button">卖出</div>}
        </form>
    )
}

function MarketForm({buyOrSell}) {
    return (
        <form>
            <label htmlFor="amount">数量</label>
            <input type="number" id="amount" name="amount" />
            {buyOrSell === 'buy' ? <div className="order-panel-button buy-button">买入</div> : <div className="order-panel-button sell-button">卖出</div>}
        </form>

    )
}

function BatchForm({buyOrSell}) {
    return (
        <form>
            <label htmlFor="amount">数量</label>
            <input type="number" id="amount" name="amount" />
            {buyOrSell === 'buy' ? <div className="order-panel-button buy-button">买入</div> : <div className="order-panel-button sell-button">卖出</div>}
        </form>

    )
}

export default OrderPanel;