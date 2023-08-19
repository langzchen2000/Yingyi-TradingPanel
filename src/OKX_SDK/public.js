const baseURL = 'https://www.okx.com'

export const fetchInstInfo = async function (instType, instId) {
    const response = await fetch(`${baseURL}/api/v5/public/instruments?instType=${instType}&instId=${instId}`);
    const data = await response.json();
    return data.data[0];
}