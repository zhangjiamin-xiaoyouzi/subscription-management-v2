/**
 * 赠礼发放策略页面 - 本地开发服务器
 * 提供静态文件服务 + API 代理
 * 
 * 使用方式： node server.js
 */
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5173;
const API_TARGET = 'https://sub-admin.seeyouyima.com';
const TARGET_PARSED = new URL(API_TARGET);

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ====== API 代理 ======
  if (pathname.startsWith('/api/')) {
    const proxyOptions = {
      hostname: TARGET_PARSED.hostname,
      port: 443,
      path: `${pathname}${url.search}`,
      method: req.method,
      headers: {
        ...req.headers,
        host: TARGET_PARSED.host,
      },
    };
    const proxyReq = https.request(proxyOptions, (proxyRes) => {
      // 转发 Cookie
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      });
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (e) => {
      console.error(`[Proxy Error] ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
    // 转发请求体
    req.pipe(proxyReq);
    return;
  }

  // ====== 路由映射 ======
  const ROUTES = {
    '/': 'index.html',
    '/popup/list': 'popup-list.html',
    '/popup/create': 'popup-create.html',
    '/gift-strategy/list': 'gift-strategy-list.html',
    '/gift-strategy/create': 'gift-strategy-create.html',
    '/gift-strategy/detail': 'gift-strategy-detail.html',
    '/rights-pay/list': 'rights-pay-list.html',
    '/rights-pay/create': 'rights-pay-create.html',
    '/price-strategy/list': 'price-strategy-list.html',
    '/price-strategy/create': 'price-strategy-create.html',
    '/promotion-strategy/list': 'promotion-strategy-list.html',
    '/event-operations-strategy/list': 'event-operations-strategy-list.html',
    '/event-operations-strategy/create': 'event-operations-strategy-create.html',
    '/event-pricing-strategy/list': 'event-pricing-strategy-list.html',
    '/prize/list': 'prize-list.html',
    '/coupon/list': 'coupon-list.html',
    '/gift/list': 'gift-list.html',
    '/gift/create': 'gift-create.html',
    '/gift/edit': 'gift-edit.html',
    '/gift/detail': 'gift-detail.html',
    '/gift-logistics/list': 'gift-logistics-list-v2.html',
  };

  // ====== 静态文件 ======
  const routeFile = ROUTES[pathname];
  let filePath;
  if (routeFile) {
    filePath = path.join(__dirname, routeFile);
  } else {
    filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    // 如果请求的路径没有扩展名且不是根路径，尝试 index.html
    if (!path.extname(pathname) && pathname !== '/') {
      filePath = path.join(__dirname, pathname, 'index.html');
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 404 回退到首页
        filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err2, data2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data2);
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   赠礼发放策略页面 - 本地开发服务器                       ║
  ║                                                          ║
  ║   Local:   http://localhost:${PORT}                       ║
  ║   API:     ${API_TARGET} (自动代理)                      ║
  ║                                                          ║
  ║   提示: 需登录 sub-admin.seeyouyima.com 后使用           ║
  ║         浏览器 Cookie 会自动通过代理传递                  ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});