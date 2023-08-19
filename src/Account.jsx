import {useEffect, useState, useContext} from 'react';
import { accountContext} from './appContext.jsx'
import { fetchAccountBalance } from './OKX_SDK/account.js';
import './Account.css'

function Account() {
    const account = useContext(accountContext);
    const [isLoading, setIsLoading] = useState(true);
    const [accountDetails, setAccountDetails] = useState([]);
    const [accountTotalEquity, setAccountTotalEquity] = useState(0);
    useEffect(() => {
        setIsLoading(true)
        fetchAccountBalance(account).then((data) => {
            setIsLoading(false)
            setAccountDetails(data.data[0].details);
            setAccountTotalEquity(data.data[0].totalEq);
        })
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
            <div className="account-title">
                <span>总账户资产 {Number(accountTotalEquity) < 0.01 ? '<$0.01' : '$' + Number(accountTotalEquity).toFixed(2).toString()}</span>
                <span className="close-expand">收起</span>
            </div>
            <div className="account-list">
                {renderAccount()}
            </div>
        </div>
    )
}

export default Account;