import {useEffect, useRef, useState, useContext} from 'react';
import { accountContext, instContext } from './appContext.jsx'
import CryptoJS from 'crypto-js'
import './Account.css'

function Account() {
    const account = useContext(accountContext);
    const instId = useContext(instContext);
    const [isLoading, setIsLoading] = useState(true);
    const [accountDetails, setAccountDetails] = useState([]);
    const [accountTotalEquity, setAccountTotalEquity] = useState(0);
    useEffect(() => {
        setIsLoading(true)
        const fetchAccountBalance = async () => {
            try {
                const baseURL = 'https://www.okx.com'
                const path = `/api/v5/account/balance`
                const timestamp = new Date().toISOString()
                const SecretKey = account.okSecretKey
                const okAccessKey = account.okAccessKey
                const okPassphrase = account.okPassphrase
                const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(timestamp + 'GET' + path, SecretKey))
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
                console.log(data.data[0])
                setIsLoading(false)
                if(data.data[0].details !== undefined) setAccountDetails(data.data[0].details);
                if(data.data[0].totalEq !== undefined) setAccountTotalEquity(data.data[0].totalEq);
            } catch (error) {
                console.log(error)
            }
        }
        fetchAccountBalance();
        return () => {
            
        }
    }, [account])

    const renderAccount = () => {
        if (isLoading) {
            return <div className="loader"></div>;
        }
        else if (accountDetails.length > 0) {
            return accountDetails.map((item) => {
                return (<div key={item.ccy} className="account-block">
                    <div className="account-name">{item.ccy} <span className="USD worth">{`${Number(item.eqUsd) < 0.01 ? '<$0.01' : Number(item.eqUsd).toFixed(4).toString()}`}</span></div>
                    <div className="account-balance">{item.eq}</div>
                </div>)
            })
        }
        else {
            return <div className="no-data">没有数据</div>
        }
    }

    return (
        <div className="account">
            <div className="account-title">账户资产 {Number(accountTotalEquity) < 0.01 ? '<$0.01' : '$' + Number(accountTotalEquity).toFixed(4).toString()}</div>
            <div className="account-list">
                {renderAccount()}
            </div>
        </div>
    )
}

export default Account;