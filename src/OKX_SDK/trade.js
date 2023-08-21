import { userVerify } from './user-verification.js'

export const handleLimitOrder = async (account, instId, price, amount, side ) => {
    try {
        const path = '/api/v5/trade/order'
        const body = JSON.stringify({
            "instId": instId,
            "tdMode": "cash",
            "side": side,
            "ordType": "limit",
            "px": price,
            "sz": amount,
        })
        const userVeriHeader = userVerify(account, body, path, 'POST')
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                ...userVeriHeader,
            },
            body: body,
        })
        const data = await response.json()
        return data
    } catch (error) {
        console.log(error)
    }
}

export const fetchOrderHistory = async (account, instId) => {
    try {
        const path = `/api/v5/trade/orders-history-archive?instType=SPOT&instId=${instId}`
        const userVeriHeader = userVerify(account, '', path, 'GET')
        const response = await fetch(path, {
            method: 'GET',
            headers: {
                ...userVeriHeader,
            }
        })
        const data = await response.json()
        return data;
    } catch (error) {
        console.log(error)
    }
}
