import { useEffect, useState } from 'react'
import './App.css'
import Chart from './Chart'
import Sidebar from './Sidebar'
import Header from './Header'
const APIKey = '1298d094-92cb-4844-9e97-a0d842da8cc8'
const secretKey = '688857AE3D2441F20755F39DACA15DF9'
const baseURL = 'https://www.okx.com'
function App() {
  const [present, setPresent] = useState(0)
  const [chartData, setChartData] = useState([])
  const [chartWidth, setChartWidth] = useState(window.innerWidth / 2)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth) {
        setChartWidth(window.innerWidth / 2);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  return (
    <div>
      <Header />
      <div className='main'>
        <Sidebar />
        <div className='centered-chart'>
          <Chart height={600} width={chartWidth} />
        </div>
      </div>
    </div>
  )
}

export default App


