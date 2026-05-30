require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ZHIPU_API_KEY;
const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API 代理 → 智谱 GLM-4
  if (req.url === '/api/chat' && req.method === 'POST') {
    if (!API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'API Key 未配置' }));
    }

    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { messages, system } = JSON.parse(body);
        console.log('[GLM] 收到:', messages[0]?.content?.substring(0, 40));

        const aiRes = await fetch(BASE_URL + '/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY,
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            max_tokens: 60,
            temperature: 0.6,
            messages: [
              { role: 'system', content: system },
              ...messages,
            ],
          }),
        });

        const data = await aiRes.json();
        console.log('[GLM] 状态:', aiRes.status,
          data.error ? 'ERR:' + data.error.message : 'OK');

        if (data.error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: data.error.message }));
        }
        const reply = data.choices?.[0]?.message?.content || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (e) {
        console.log('[GLM] 异常:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 静态文件
  const filePath = req.url === '/' ? '/crab-game.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);

  try {
    const content = fs.readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🦀 游戏服务已启动: http://localhost:${PORT}`);
  console.log(API_KEY ? '✅ 智谱 Key 已配置，AI 聊天可用' : '⚠️  未配置 API Key');
});
