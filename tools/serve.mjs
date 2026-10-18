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

/**
 * 注入到每个 HTML 里：订阅重建事件，只有「自己这页受影响」时才 reload。
 * 服务端发来 {"reload":["/posts/foo.html"]}；认不准时发 {"reload":"*"}。
 */
const LIVE_RELOAD = `<script>
(() => {
  const here = location.pathname === '/index.html' ? '/' : location.pathname;
  const es = new EventSource('/__reload');
  es.onmessage = (e) => {
    let pages;
    try { pages = JSON.parse(e.data).reload; } catch { pages = '*'; }
    if (pages === '*' || pages.includes(here)) location.reload();
  };
})();
</script>`

const clients = new Set()
let watcher = null
/** 页面 → 依赖的源文件（build() 返回）。 */
let deps = new Map()
/** slug → 卡片字段指纹，用来判断首页要不要跟着刷。 */
let cardSigs = new Map()

/**
 * 这次改动波及哪些页面。返回 '*' 表示认不准，宁可整站都刷。
 * 依赖表由构建产出，所以「改一篇文章只刷那一篇」不需要在这里写死规则。
 */
function affectedPages(changed) {
  if (!deps.size) return '*'
  const pages = new Set()
  for (const f of changed) {
    let hit = false
    for (const [page, set] of deps) {
      if (set.has(f)) { pages.add(page); hit = true }
    }
    if (hit) continue
    // 新增/删除的文章：它自己还没有页面（或页面已删除），但首页卡片会变
    if (f.startsWith('content/posts/')) { pages.add('/'); continue }
    // 没被任何页面引用的资产：不用刷新
    if (f.startsWith('assets/')) continue
    return '*'
  }
  return pages
}

function cardsChanged(before, after) {
  if (!before.size || before.size !== after.size) return true
  for (const [slug, sig] of after) if (before.get(slug) !== sig) return true
  return false
}

function notify(changed, result) {
  let pages = affectedPages(changed)

  if (result) {
    // 正文改动不动卡片；标题、summary、order 这些变了首页才需要跟着刷
    if (pages !== '*' && cardsChanged(cardSigs, result.cardSigs)) pages.add('/')
    // 页面已经删掉了就没有客户端可刷；新增页面的刷新由上面的 '/' 覆盖
    if (pages !== '*') for (const p of [...pages]) if (!result.deps.has(p)) pages.delete(p)
    deps = result.deps
    cardSigs = result.cardSigs
  }

  // 所有页面都受影响时不必逐个列 URL，直接发 '*'
  const all = pages === '*' || pages.size === deps.size
  const payload = `data: ${JSON.stringify({ reload: all ? '*' : [...pages] })}\n\n`
  for (const res of clients) res.write(payload)

  const where = all ? '全部页面' : (pages.size ? [...pages].join('、') : '无需刷新')
  console.log(`↻ ${changed.join('、')} → ${where}`)
}

async function prepare() {
  const result = await build()
  deps = result.deps
  cardSigs = result.cardSigs
  if (STATIC) return
  watcher = await watchSources(notify)
}

try {
  await prepare()
} catch (e) {
  console.error(`✗ 启动失败：${e.message}`)
  console.error('  如果提示端口或目录被占用，确认没有另一个 npm run dev 还在跑。')
  process.exit(1)
}
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
})
  .on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`✗ 端口 ${PORT} 已被占用。换一个：npm run dev -- ${PORT + 1}`)
    } else {
      console.error(`✗ 服务启动失败：${e.message}`)
    }
    process.exit(1)
  })
  .listen(PORT)
