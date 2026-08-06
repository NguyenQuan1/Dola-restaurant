const http = require('http');

const data = JSON.stringify({
  message: 'Mình muốn đặt bàn ăn cho 4 người vào tối nay',
  history: [],
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/chatbot/message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  },
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('RESPONSE:', body);
    });
  },
);

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.write(data);
req.end();
