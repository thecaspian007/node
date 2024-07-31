const axios = require('axios');

async function fetchData(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
}

async function main() {
  const url = 'http://127.0.0.1:5000/keys';

  try {
    // const [response1, response2] = await Promise.all([fetchData(url), fetchData(url)]);
    const response1 = await fetchData(url);
    const response2 = await fetchData(url);
    console.log('Response from first request:', response1);
    console.log('Response from second request:', response2);
  } catch (error) {
    console.error('Error during API requests:', error);
  }
}

main();
