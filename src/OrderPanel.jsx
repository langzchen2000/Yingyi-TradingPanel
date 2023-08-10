import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import './OrderPanel.css'
function OrderPanel() {
    const buyRef = useRef(null);
    const sellRef = useRef(null);
    const limitRef = useRef(null);
    const marketRef = useRef(null);
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
                setOrderType('Limit')
            });
            marketRef.current.addEventListener('click', () => {
                limitRef.current.style.borderBottom = 'solid rgb(183, 183, 183) 2px'
                marketRef.current.style.borderBottom = 'solid black 2px'
                setOrderType('Market')
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
    } else {
        return (
            <div>something went wrong...</div>
        )
    }
}

function LimitForm({buyOrSell}) {
    
}

export default OrderPanel;