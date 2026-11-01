// 이웃 피드 테스트용 서버 (HTTPS 필요 → 아래 안내 참고).  실행: node test-tools/feed-server.mjs
// 터미널에서 Enter를 누를 때마다 "새 글"이 하나씩 추가된다.
import http from 'node:http';
import readline from 'node:readline';
const PORT = process.env.PORT || 8787;
const items = [];
let n = 0;
const add = (extra = {}) => { n++; items.unshift({ id: `post-${n}`, title: `테스트 새 글 ${n}`, url: `${BASE}/p/${n}`, date_published: new Date().toISOString(), ...extra }); };
let BASE = process.env.BASE || `https://localhost:${PORT}`;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.url.startsWith('/feed.json')) return res.end(JSON.stringify({ items }));
  res.statusCode = 404; res.end('{}');
}).listen(PORT, () => console.log(`feed on :${PORT}  (BASE=${BASE})\nEnter = 새 글 추가 / e + Enter = 다른 도메인 링크 글 추가(차단돼야 정상)`));
readline.createInterface({ input: process.stdin }).on('line', l => {
  if (l.trim() === 'e') { add({ title: '가짜 글(다른 도메인)', url: 'https://evil.example.org/x' }); console.log('외부 도메인 글 추가 — 알림에 안 떠야 함'); }
  else { add(); console.log('새 글 추가:', items[0].title); }
});
