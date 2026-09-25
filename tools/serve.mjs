#!/usr/bin/env node
/**
 * 本地开发服务器：构建 → 起服务 → 监听源文件自动重建 → 页面自动刷新。
 *
 *   node tools/serve.mjs            日常用：改 content/ 存盘后浏览器自己刷新
 *   node tools/serve.mjs --static   只服务 dist/，不监听、不注入刷新脚本
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { build, watchSources } from './build.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', 'dist')
const PORT = Number(process.env.PORT || process.argv.find((a) => /^\d+$/.test(a)) || 8000)
const STATIC = process.argv.includes('--static')

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

/** 注入到每个 HTML 里：订阅重建事件，重建完成后自己 location.reload()。 */
const LIVE_RELOAD = `<script>
(() => {
  const es = new EventSource('/__reload');
  es.onmessage = () => location.reload();
})();
</script>`

const clients = new Set()
let watcher = null

async function prepare() {
  await build()
  if (STATIC) return
  watcher = await watchSources(() => {
    for (const res of clients) res.write('data: reload\n\n')
    console.log('↻ 源文件已更新，已通知浏览器刷新')
  })
}

await prepare()
console.log(
  STATIC
    ? `预览：http://localhost:${PORT}  (dist/，静态模式)`
    : `预览：http://localhost:${PORT}  (改 content/ 存盘后浏览器自动刷新；Ctrl-C 退出)`)

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  // 页面通过这条长连接等待重建通知
  if (url.pathname === '/__reload') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return
  }

  let file = path.join(ROOT, decodeURIComponent(url.pathname))
  if (!file.startsWith(ROOT)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('forbidden')
    return
  }

  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html')
  const isHtml = file.endsWith('.html')

  try {
    // 万一看门狗漏了事件（云盘目录偶发），至少保证「刷新一次就是最新的」
    if (isHtml && watcher) await watcher.checkNow()

    let body = await readFile(file)
    if (isHtml && !STATIC) {
      body = Buffer.from(body.toString('utf8').replace('</body>', `${LIVE_RELOAD}\n</body>`))
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404')
  }
}).listen(PORT)
