const http = require('http');

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = { statusCode: res.statusCode, headers: res.headers, body: data };
        resolve(result);
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  try {
    // 1) create admin (dev-only)
    console.log('Creating dev admin...');
    const createOpts = { hostname: 'localhost', port: 8080, path: '/api/setup/create-admin', method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const createRes = await request(createOpts, JSON.stringify({}));
    console.log('create-admin ->', createRes.statusCode, createRes.body);

    // 2) login with admin phone/password
    console.log('Logging in as admin...');
    const loginBody = JSON.stringify({ phone: '+919606860853', password: 'Santosh@123' });
    const loginOpts = { hostname: 'localhost', port: 8080, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const loginRes = await request(loginOpts, loginBody);
    console.log('login ->', loginRes.statusCode);
    let token = null;
    try {
      const parsed = JSON.parse(loginRes.body || '{}');
      token = parsed.accessToken || parsed.token || parsed.refreshToken || parsed.idToken || parsed?.access_token || parsed?.token;
      if (!token && parsed?.accessToken === undefined && parsed?.token === undefined) {
        // possibly tokens named differently
        token = parsed?.accessToken || parsed?.token;
      }
      console.log('login body:', parsed);
    } catch (e) {
      console.error('Failed to parse login response:', e.message);
    }

    if (!token) {
      console.error('No token found in login response; cannot authenticate request');
      return;
    }

    // 3) fetch order with token
    const id = process.argv[2] || 'cmhrbt1kh0003qtxmeyqz4znl';
    console.log('Fetching order', id, 'with token...');
    const opts = { hostname: 'localhost', port: 8080, path: `/api/orders/${id}`, method: 'GET', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } };
    const orderRes = await request(opts);
    console.log('order ->', orderRes.statusCode, orderRes.body);
  } catch (e) {
    console.error('error:', e && e.message ? e.message : e);
  }
}

run();
