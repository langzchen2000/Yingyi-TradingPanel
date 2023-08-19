import CryptoJS from 'crypto-js'
const baseURL = 'https://www.okx.com'

export const handleLimitOrder = async (account, instId, price, amount, side ) => {
    try {
        const path = '/api/v5/trade/order'
        const timestamp = new Date().toISOString()
        const SecretKey = account.okSecretKey
        const okAccessKey = account.okAccessKey
        const okPassphrase = account.okPassphrase
        const body = JSON.stringify({
            "instId": instId,
            "tdMode": "cash",
            "side": side,
            "ordType": "limit",
            "px": price,
            "sz": amount,
        })
        const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(timestamp + 'POST' + path + body, SecretKey))
        const response = await fetch(baseURL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'OK-ACCESS-KEY': okAccessKey,
                'OK-ACCESS-SIGN': sign,
                'OK-ACCESS-TIMESTAMP': timestamp,
                'OK-ACCESS-PASSPHRASE': okPassphrase
            },
            body: body,
        })
        const data = await response.json()
        return data
    } catch (error) {
        console.log(error)
    }
}

