import React, { useContext} from 'react';
import { instContext } from './appContext';
import './Header.css'

function Header({setInstId}) {
    const instId = useContext(instContext);
    const instIdOption = ['BTC-USDT', 'ETH-USDT', 'XRP-USDT'];
    const handleInstIdChange = (e) => {
        setInstId(e.target.value);
        localStorage.setItem('instId', e.target.value);
    }
    return (
        <div className='header-wrapper'>
            <div className='logo'>
                <div>盈益终端 V0</div>
            </div> 
            <div className='instId-selection'>
                <select value={instId} onChange={handleInstIdChange}>
                    {instIdOption.map((item, index) => {
                        return (
                            <option key={index} value={item}>{item}</option>
                        )
                    })}
                </select>
            </div>
        </div>
    )
}

export default Header;