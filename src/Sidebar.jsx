import React, { useEffect, useRef, useState, useLayoutEffect, useContext} from 'react';
import 'material-icons/iconfont/material-icons.css';
import {showLeftPanelContext} from './appContext';

function Sidebar({setShowLeftPanel}) {
    const showLeftPanel = useContext(showLeftPanelContext);
    const handleClick = (leftPanelContent) => {
        if (showLeftPanel !== leftPanelContent) {
            setShowLeftPanel(leftPanelContent);
        } else {
            setShowLeftPanel(false);
        }
    }
    return (
        <div className='sidebar'>
            <button>
                 <span className="material-icons" onClick={() => {handleClick('order history')}}> receipt_long </span>
            </button>
            <button>
                <span className="material-icons" onClick={() => {handleClick('acount')}}> account_balance </span>
            </button>
            <button id="setting-icon">
                <span className="material-icons"> settings </span>
            </button>
        </div>
    )
}

export default Sidebar;