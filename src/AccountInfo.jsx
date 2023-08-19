import {useState, useRef, useCallback} from 'react'
import './AccountInfo.css'
import Account from './Account'
import OrderHistory from './OrderHistory'

function AccountInfo() {
    const [expanded, setExpanded] = useState(false);

    const sidebarRef = useRef(null);

    const handleButtonClick = useCallback((tag) => {
            setExpanded(tag);
    }, [])
    

    return (
        <div className={`account-info-wrapper ${expanded ? 'active' : ''}`}>
            <div className={`sidebar`} ref={sidebarRef}>
                <button className="expand-account" onClick={() => handleButtonClick('account')}>
                    账户余额
                </button>
                <button className="expand-order-history" onClick={() => handleButtonClick('history')} >
                    历史订单
                </button>
            </div>
            {expanded && (<div className='content' >
                <div className='close-button-wrapper'>
                    <button className='close-button' onClick={() => setExpanded(false)}>X</button>
                </div>
                {expanded === 'account' ? <Account setExpanded = {setExpanded}/> : null}
                {expanded === 'history' ? <OrderHistory setExpanded = {setExpanded}/> : null}
            </div>)}
        </div>
    )
}


export default AccountInfo;