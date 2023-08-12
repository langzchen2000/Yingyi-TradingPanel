import { useEffect, useState, useRef } from 'react'
import './App.css'
import Chart from './Chart'
import Sidebar from './Sidebar'
import Header from './Header'
import OrderPanel from './OrderPanel'

const APIKey = '1298d094-92cb-4844-9e97-a0d842da8cc8'
const secretKey = '688857AE3D2441F20755F39DACA15DF9'
const baseURL = 'https://www.okx.com'

function App() {
  const [chartWidth, setChartWidth] = useState(0)
  const panelRef = useRef(null)
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
      <Header />
      <div className='main'>
        <div className='sidebar-wrapper'>
          <Sidebar />
        </div>
        <div className='panel'>
          <div className='left-panel-wrapper'>
            
          </div>
          <div className='middle-panel-wrapper' ref={panelRef}>
            <Chart height={700} width={chartWidth} />
          </div>
          <div className='right-panel-wrapper'>
            <OrderPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App


