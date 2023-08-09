import { useEffect, useState } from 'react'
import './App.css'
import Chart from './Chart'
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
    <>
      <div> 交易面板</div>
      <Operation changePresent={setPresent} />
      <div>{present}</div>
      <div className='centered-chart'>
        <Chart height={600} width={chartWidth} />
      </div>
    </>
  )
}


function Operation({ changePresent }) {
  let handleClickButton = async function (instId) {
    try {
      changePresent('loading...');
      const response = await fetch(`${baseURL}/api/v5/market/index-tickers?instId=${instId}`);
      const data = await response.json();
      changePresent(data.data[0].idxPx);
    } catch (error) {
      console.log(error);
      changePresent('error');
    }
  }

  return (
    <>
      <button onClick={handleClickButton.bind(null, 'BTC-USDT')}>BTC price</button>
      <button onClick={handleClickButton.bind(null, 'ETH-USDT')}>ETH price</button>
      <button onClick={handleClickButton.bind(null, 'DOGE-USDT')}>DOGE price</button>
    </>
  )
}

export default App
