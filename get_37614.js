const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

download('https://static.arasaac.org/pictograms/37614/37614_500.png', 'test_37614.png')
  .then(() => console.log('Downloaded 37614! Size:', fs.statSync('test_37614.png').size))
  .catch(console.error);

