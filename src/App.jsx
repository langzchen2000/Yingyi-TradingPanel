import { useEffect, useState, useContext } from 'react'
import './App.css'
import { instContext, showLeftPanelContext } from './appContext'
import Chart from './Chart'
import Sidebar from './Sidebar'
import Header from './Header'
import OrderPanel from './OrderPanel'

let instIdTemp = 'BTC-USDT';
if (localStorage.getItem('instId')) {
  instIdTemp = localStorage.getItem('instId');
}
let account = {

}

function App() {
  const [chartWidth, setChartWidth] = useState(window.innerWidth * 0.7)
  const [instId, setInstId] = useState(instIdTemp);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
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
        <Header setInstId={setInstId} />
        <div className='main'>
          <showLeftPanelContext.Provider value={showLeftPanel}>
            <div className='sidebar-wrapper'>
              <Sidebar setShowLeftPanel={setShowLeftPanel} />
            </div>
          </showLeftPanelContext.Provider>
          <div className='panel'>
            {showLeftPanel ? (<div className='left-panel-wrapper'>

            </div>) : null}
            <div className='middle-panel-wrapper'>
              <Chart height={chartHeight} width={chartWidth} />
            </div>
            <div className='right-panel-wrapper'>
              <OrderPanel />
            </div>
          </div>
        </div>
      </instContext.Provider>
    </div>

  )
}

export default App


