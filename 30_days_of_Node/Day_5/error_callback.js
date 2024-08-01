const fs = require('fs');

function nSCallback(error, data) {
  if (error) {
    console.error('No file found');
    return;
  }
  console.log(data);
}
fs.readFile('data.txt', nSCallback);
fs.readFile('no_data.txt', nSCallback);	