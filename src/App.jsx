import { useEffect, useState, useRef } from 'react'
import './App.css'
import { instContext, accountContext } from './appContext'
import Chart from './Chart'
import Header from './Header'
import OrderPanel from './OrderPanel'
import OrderHistory from './OrderHistory'
import Account from './Account'

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
  const [chartWidth, setChartWidth] = useState(window.innerWidth * 0.7)
  const [instId, setInstId] = useState(instIdTemp);
  const [account, setAccount] = useState(tempAccount);

  const chartHeight = window.innerHeight * 0.8;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth) {
        setChartWidth(window.innerWidth * 0.6);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  return (
    <div>
      <instContext.Provider value={instId}>
        <accountContext.Provider value={account}>
          <Header setInstId={setInstId} />
          <div className='main'>
            <div className='panel'>
              <div className='left-panel-wrapper'>
                <OrderHistory />
                <Account />
              </div>
              <div className='middle-panel-wrapper'>
                <Chart height={chartHeight} width={chartWidth} />
              </div>
              <div className='right-panel-wrapper'>
                <OrderPanel />
              </div>
            </div>
          </div>
        </accountContext.Provider>
      </instContext.Provider>
    </div>

  )
}




export default App


