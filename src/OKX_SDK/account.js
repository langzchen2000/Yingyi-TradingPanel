import { userVerify } from './user-verification'

export const fetchAccountBalance = async (account) => {
    try {
        const baseURL = 'https://www.okx.com'
        const path = `/api/v5/account/balance`
        const userVeriHeader = userVerify(account, '', path, 'GET')
        const response = await fetch(baseURL + path, {
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