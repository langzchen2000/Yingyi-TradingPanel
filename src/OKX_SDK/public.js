
export const fetchInstInfo = async function (instType, instId) {
    const response = await fetch(`/api/v5/public/instruments?instType=${instType}&instId=${instId}`);
    const data = await response.json();
    return data.data[0];
}