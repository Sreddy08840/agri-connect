const http = require('http');

const id = process.argv[2] || 'cmhrbt1kh0003qtxmeyqz4znl';
const opts = {
  hostname: 'localhost',
  port: 8080,
  path: `/api/orders/${id}`,
  method: 'GET',
  headers: { 'Accept': 'application/json' }
};

const req = http.request(opts, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('body (json):', parsed);
    } catch (e) {
      console.log('body (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('request error:', e.message);
});

req.end();

// paste the login response's accessToken & refreshToken values:
localStorage.setItem('accessToken', '<PASTE_ACCESS_TOKEN>');
location.reload();
