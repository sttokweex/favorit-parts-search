import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try { process.loadEnvFile('.env'); } catch { /* .env is optional; environment variables also work. */ }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 3001);
const apiUrl = 'http://api.favorit-parts.ru/hs/hsprice/';
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

export function requestFavorit(number, brand) {
  const url = new URL(apiUrl);
  url.searchParams.set('key', process.env.FAVORIT_API_KEY);
  url.searchParams.set('number', number);
  if (brand) {
    url.searchParams.set('brand', brand);
    url.searchParams.set('analogues', 'on');
  }

  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 12000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
        if (body.length > 5_000_000) req.destroy(new Error('Слишком большой ответ API'));
      });
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`Сервис запчастей вернул HTTP ${response.statusCode}`));
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('Сервис запчастей вернул некорректный JSON')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Превышено время ожидания сервиса запчастей')));
    req.on('error', reject);
  });
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/search') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.method !== 'GET') { res.writeHead(405); return res.end(JSON.stringify({ error: 'Метод не поддерживается' })); }
      if (!process.env.FAVORIT_API_KEY) { res.writeHead(503); return res.end(JSON.stringify({ error: 'Не задан FAVORIT_API_KEY на сервере' })); }
      const number = (url.searchParams.get('number') || '').trim();
      const brand = (url.searchParams.get('brand') || '').trim();
      if (!number) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Укажите артикул детали' })); }
      try {
        const data = await requestFavorit(number, brand);
        res.writeHead(200);
        return res.end(JSON.stringify(data));
      } catch (error) {
        res.writeHead(502);
        return res.end(JSON.stringify({ error: error.message || 'Ошибка подключения к сервису запчастей' }));
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    const requested = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
    const file = requested.startsWith(`${dist}${path.sep}`) && fs.existsSync(requested) && fs.statSync(requested).isFile()
      ? requested : path.join(dist, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Сначала выполните npm run build'); }
    res.setHeader('Content-Type', contentTypes[path.extname(file)] || 'application/octet-stream');
    res.writeHead(200);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createAppServer().listen(port, '127.0.0.1', () => console.log(`API и приложение: http://127.0.0.1:${port}`));
}
