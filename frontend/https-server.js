// server.js
const fs = require('fs');
const https = require('https');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https
    .createServer(
      {
        key: fs.readFileSync('./certs/test11.gamerbuild.co/privkey.pem'),  // 생성된 키 파일
        cert: fs.readFileSync('./certs/test11.gamerbuild.co/fullchain.pem'),     // 생성된 인증서 파일
      },
      (req, res) => {
        handle(req, res);
      }
    )
    .listen(9002, (err) => {
      if (err) throw err;
      console.log('> Ready on https://localhost:9002');
    });
});
