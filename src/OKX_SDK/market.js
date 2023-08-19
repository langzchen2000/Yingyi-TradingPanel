
const baseURL = 'https://www.okx.com'


export const fetchMarketPrice = async function (instId) {
    const response = await fetch(`${baseURL}/api/v5/market/ticker?instId=${instId}`);
    const data = await response.json();
    return data.data[0].last;
}