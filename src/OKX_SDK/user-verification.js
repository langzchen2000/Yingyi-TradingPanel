import CryptoJS from 'crypto-js'


export function userVerify(account, body, path, method) {
    const SecretKey = account.okSecretKey
    const okAccessKey = account.okAccessKey
    const okPassphrase = account.okPassphrase
    const timestamp = new Date().toISOString()
    const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(timestamp + method + path + body, SecretKey))
    return {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': okAccessKey,
        'OK-ACCESS-SIGN': sign,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': okPassphrase
    }
}