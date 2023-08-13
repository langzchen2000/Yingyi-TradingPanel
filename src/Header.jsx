import React, { useContext} from 'react';
import { instContext } from './appContext';
import './Header.css'

function Header() {
    const instId = useContext(instContext);
    return (
        <div className='header-wrapper'>
            <div className='logo'>
                <div>盈益终端 V0</div>
            </div> 
            
        </div>
    )
}
export default Header;