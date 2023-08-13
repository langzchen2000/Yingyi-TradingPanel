import { useEffect, useState, useContext } from 'react'
import './App.css'
import { instContext, showLeftPanelContext, accountContext } from './appContext'
import Chart from './Chart'
import Sidebar from './Sidebar'
import Header from './Header'
import OrderPanel from './OrderPanel'
import OrderHistory from './OrderHistory'

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
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [account, setAccount] = useState(tempAccount);
  const chartHeight = 500;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth) {
        setChartWidth(showLeftPanel ? window.innerWidth * 0.5 : window.innerWidth * 0.7);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [showLeftPanel])

  return (
    <div>
      <instContext.Provider value={instId}>
        <accountContext.Provider value={account}>
          <Header setInstId={setInstId} />
          <div className='main'>
            <showLeftPanelContext.Provider value={showLeftPanel}>
              <div className='sidebar-wrapper'>
                <Sidebar setShowLeftPanel={setShowLeftPanel} setChartWidth={setChartWidth} setAccount={setAccount}/>
              </div>
            </showLeftPanelContext.Provider>
            <div className='panel'>
              {showLeftPanel ? (<div className='left-panel-wrapper'>
                {showLeftPanel === 'order history' ? (<OrderHistory />) : null}
                {showLeftPanel === 'acount' ? (<div>acount</div>) : null}
              </div>) : null}
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


