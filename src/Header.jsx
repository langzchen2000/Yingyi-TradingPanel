import { useContext, useRef, useState } from 'react';
import { instContext, accountContext } from './appContext';
import './Header.css'

// eslint-disable-next-line react/prop-types
function Header({ setInstId, setAccount }) {
    const instId = useContext(instContext);
    const instIdOption = ['BTC-USDT', 'ETH-USDT', 'XRP-USDT'];
    const handleInstIdChange = (e) => {
        setInstId(e.target.value);
        localStorage.setItem('instId', e.target.value);
    }
    const account = useContext(accountContext);
    const modalRef = useRef(null);
    const [tempAccount, setTempAccount] = useState(Object.assign({}, account));

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
        <div className='header-wrapper'>
            <div className='left-header'>
                <div className='logo'>
                    <div>盈易终端 V0</div>
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

            <div className='middle-header'>
                <a href="https://github.com/langzchen2000/Yingyi-TradingPanel">
            <svg xmlns="http://www.w3.org/2000/svg" width='30' viewBox="0 0 24 24" className="github-icon"><path fill='white' d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
            </div>
            <div className='right-header'>
                <button id="setting-icon" onClick={() => setModalVisible()}>
                    <span className="material-icons" > settings </span>
                </button>
            </div>
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
        </div >
    )
}

export default Header;