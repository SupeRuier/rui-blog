#!/usr/bin/env node
/** 起一个只读的本地预览服务，指向 dist/。用法：node tools/serve.mjs [port] */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', 'dist')
const PORT = Number(process.argv[2] || process.env.PORT || 8000)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
}

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = path.join(ROOT, url)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return }

  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
  } catch {
    try { file = `${file.replace(/\/$/, '')}.html` } catch { /* 保持原样 */ }
  }

  try {
    const body = await readFile(file)
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404')
  }
}).listen(PORT, () => console.log(`预览：http://localhost:${PORT}  (dist/)`))
