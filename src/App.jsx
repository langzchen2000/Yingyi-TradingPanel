import { useEffect, useState, useContext } from 'react'
import './App.css'
import { instContext } from './appContext'
import Chart from './Chart'
import Sidebar from './Sidebar'
import Header from './Header'
import OrderPanel from './OrderPanel'

let instId = 'BTC-USDT';
if (localStorage.getItem('instId')) {
  instId = localStorage.getItem('instId');
}

function App() {
  const [chartWidth, setChartWidth] = useState(0)
  const [inst, setInst] = useState(instId);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth) {
        setChartWidth(window.innerWidth - 1000);
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
        <Header />
        <div className='main'>
          <div className='sidebar-wrapper'>
            <Sidebar />
          </div>
          <div className='panel'>
            <div className='left-panel-wrapper'>
              
            </div>
            <div className='middle-panel-wrapper'>
              <Chart height={700} width={chartWidth} />
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


