import { useEffect, useState, useContext } from 'react'
import './App.css'
import { instContext } from './appContext'
import Chart from './Chart'
import Sidebar from './Sidebar'
import Header from './Header'
import OrderPanel from './OrderPanel'

let instIdTemp = 'BTC-USDT';
if (localStorage.getItem('instId')) {
  instIdTemp = localStorage.getItem('instId');
}

function App() {
  const [chartWidth, setChartWidth] = useState(window.innerWidth * 0.5)
  const [instId, setInstId] = useState(instIdTemp);
  const chartHeight = 400;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth) {
        setChartWidth(window.innerWidth * 0.5);
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
        <Header setInstId={setInstId}/>
        <div className='main'>
          <div className='sidebar-wrapper'>
            <Sidebar />
          </div>
          <div className='panel'>
            <div className='left-panel-wrapper'>
              
            </div>
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


