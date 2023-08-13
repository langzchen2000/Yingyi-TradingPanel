import {useEffect, useContext} from 'react'
import {accountContext} from './appContext.jsx'

function OrderHistory() {
    const account = useContext(accountContext);
    useEffect(() => {
        console.log(account)
    })
    return (
        <div>order history</div>
    )
}

export default OrderHistory;