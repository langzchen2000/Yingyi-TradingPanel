import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import 'material-icons/iconfont/material-icons.css';


function Sidebar() {
    return (
        <div className='sidebar'>
            <button>
                 <span className="material-icons"> receipt_long </span>
            </button>
            <button>
                <span className="material-icons"> account_balance </span>
            </button>
            <button id="setting-icon">
                <span className="material-icons"> settings </span>
            </button>
        </div>
    )
}

export default Sidebar;