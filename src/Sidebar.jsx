import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import reactLogo from './assets/react.svg'
import okxLogo from './assets/okx-logo.svg'
import settingsIcon from './assets/setting-icon.svg'
function Sidebar() {
    return (
        <div className='sidebar'>
            <button>
                <img src={reactLogo} alt='react logo' />
                
            </button>
            <button>
                <img src={okxLogo} alt='okx logo' />
            </button>
            <button id="setting-icon">
                <img src={settingsIcon} alt='settings icon' />
            </button>
        </div>
    )
}

export default Sidebar;