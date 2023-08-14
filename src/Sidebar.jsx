import React, { useEffect, useRef, useState, useLayoutEffect, useContext } from 'react';
import 'material-icons/iconfont/material-icons.css';
import { showLeftPanelContext, accountContext } from './appContext';
import './Sidebar.css'

function Sidebar({ setShowLeftPanel, setChartWidth, setAccount }) {
    const showLeftPanel = useContext(showLeftPanelContext);
    const account = useContext(accountContext);
    const modalRef = useRef(null);
    const [tempAccount, setTempAccount] = useState(Object.assign({}, account));

    const handleClick = (leftPanelContent) => {
        if (showLeftPanel !== leftPanelContent) {
            setShowLeftPanel(leftPanelContent);
            setChartWidth(window.innerWidth * 0.5)
        } else {
            setShowLeftPanel(false);
            setChartWidth(window.innerWidth * 0.7)
        }
    }
    const setModalVisible = () => {
        modalRef.current.showModal();
    }

    const setModalInvisible = () => {
        modalRef.current.close();
    }

    const handleModalSubmit = () => {
        localStorage.setItem('okAccessKey', tempAccount.okAccessKey);
        localStorage.setItem('okSecretKey', tempAccount.okSecretKey);
        localStorage.setItem('okPassphrase', tempAccount.okPassphrase);
        setAccount(tempAccount);
        setModalInvisible();
    }

    return (
        <div className='sidebar'>
            <button>
                <span className="material-icons" onClick={() => { handleClick('order history') }}> receipt_long </span>
            </button>
            <button>
                <span className="material-icons" onClick={() => { handleClick('acount') }}> account_balance </span>
            </button>
            <button id="setting-icon">
                <span className="material-icons" onClick={() => setModalVisible()}> settings </span>
            </button>
            <dialog className="setting-modal" ref={modalRef}>
                <label htmlFor="okAccessKey">okAccessKey</label>
                <input type="text" id="okAccessKey" value={tempAccount.okAccessKey} onChange={(e) => setTempAccount(prev => ({ ...prev, okAccessKey: e.target.value }))} />
                <label htmlFor="okSecretKey">okSecretKey</label>
                <input type="text" id="okSecretKey" value={tempAccount.okSecretKey} onChange={(e) => setTempAccount(prev => ({ ...prev, okSecretKey: e.target.value }))} />
                <label htmlFor="okPassphrase">okPassphrase</label>
                <input type="text" id="okPassphrase" value={tempAccount.okPassphrase} onChange={(e) => setTempAccount(prev => ({ ...prev, okPassphrase: e.target.value }))} />
                <div className="modal-button-wrapper">
                    <button className="exit-modal-button" onClick={() => { setTempAccount(account); setModalInvisible() }}>Exit</button>
                    <button className='save-modal-button' onClick={() => { handleModalSubmit() }}>Save</button>
                </div>
            </dialog>
        </div>
    )
}

export default Sidebar;