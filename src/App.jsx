import { useEffect, useState } from 'react'
import './App.css'
import { instContext, accountContext } from './appContext'
import Chart from './Chart'
import Header from './Header'
import OrderPanel from './OrderPanel'
import AccountInfo from './AccountInfo'
import OrderTable from './OrderTable'
import TouchableChart from './TouchableChart'
let instIdTemp = 'BTC-USDT';
if (localStorage.getItem('instId')) {
  instIdTemp = localStorage.getItem('instId');
}
let tempAccount = {
  okAccessKey: localStorage.getItem('okAccessKey') === null ? '' : localStorage.getItem('okAccessKey'),
  okSecretKey: localStorage.getItem('okSecretKey') === null ? '' : localStorage.getItem('okSecretKey'),
  okPassphrase: localStorage.getItem('okPassphrase') === null ? '' : localStorage.getItem('okPassphrase'),
}

function App() {


  const [instId, setInstId] = useState(instIdTemp);
  const [account, setAccount] = useState(tempAccount);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchable, setIsTouchable] = useState(false);


  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    if ('ontouchstart' in window) {
      setIsTouchable(true);
    }
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

    if (!isMobile) {
  return (
    <div>
      <instContext.Provider value={instId}>
        <accountContext.Provider value={account}>
          <Header setInstId={setInstId} setAccount={setAccount} />
          <div className='main'>
            <div className='left-panel-wrapper'>
              <AccountInfo />
            </div>
            <div className='middle-panel-wrapper'>
              {!isTouchable ? <Chart/> : <TouchableChart/>}
            </div>
            <div className='right-panel-wrapper'>
              <OrderPanel />
              <OrderTable />
            </div>
          </div>
        </accountContext.Provider>
      </instContext.Provider>
    </div>

  )
    } else {
        return (
            <div>
                <instContext.Provider value={instId}>
                    <accountContext.Provider value={account}>
                        <Header setInstId={setInstId} setAccount={setAccount} />
                        <div className='main'>
                            <div className='middle-panel-wrapper'>
                            {!isTouchable ? <Chart/> : <TouchableChart/>}
                            </div>
                            <div className='right-panel-wrapper'>
                                <OrderPanel />
                                <OrderTable />
                            </div>
                        </div>
                    </accountContext.Provider>
                </instContext.Provider>
            </div>

        )
    }
}




export default App


