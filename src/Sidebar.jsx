import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import reactLogo from './assets/react.svg'
import okxLogo from './assets/okx-logo.svg'
import settingsIcon from './assets/setting-icon.svg'
import 'material-icons/iconfont/material-icons.css';


function Sidebar() {
    return (
        <div className='sidebar'>
            <button>
                 <span class="material-icons"> receipt_long </span>
            </button>
            <button>
                <span class="material-icons"> account_balance </span>
            </button>
            <button id="setting-icon">
                <span class="material-icons"> settings </span>
            </button>
        </div>
    )
}

export default Sidebar;