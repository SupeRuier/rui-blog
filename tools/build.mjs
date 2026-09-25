#!/usr/bin/env node
/**
 * 把 content/posts/*.md 渲染成 dist/ 下的静态站点。
 *
 *   content/site.json      站点级文案（首页标题、lede、scope、页脚）
 *   content/posts/*.md     文章，带 front-matter
 *   templates/*.html       页面骨架
 *   styles.css toc.js assets/ favicon.svg   原样拷进 dist/
 *
 * 用法：
 *   node tools/build.mjs            构建一次
 *   node tools/build.mjs --watch    监听源文件，改动即重建
 */
import { readFile, writeFile, mkdir, cp, rm, readdir, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { existsSync, watch } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { marked } from 'marked'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'dist')
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const TEMPLATES = path.join(ROOT, 'templates')

/* ---------------------------------------------------------------- 工具 */

const read = (p) => readFile(p, 'utf8')

/** 属性值里只需要防住引号和 &，正文里的中文标点不动。 */
const attr = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] === undefined ? '' : vars[key])
}

/** 读一个文件的 sha256 前 8 位，用来做缓存失效版本号。 */
async function version(file) {
  const buf = await readFile(path.join(ROOT, file))
  return createHash('sha256').update(buf).digest('hex').slice(0, 8)
}

/* ---------------------------------------------------------- front-matter */

/**
 * 极简 front-matter：只支持扁平的 `key: value`，外加 `key: |` 多行块。
 * 够用即可 —— 不引 YAML 依赖，出问题一眼能看懂。
 */
function parseFrontMatter(raw, file) {
  const lines = raw.split('\n')
  if (lines[0]?.trim() !== '---') {
    throw new Error(`${file}: 缺少 front-matter（文件必须以 --- 开头）`)
  }
  const end = lines.indexOf('---', 1)
  if (end < 0) throw new Error(`${file}: front-matter 没有闭合的 ---`)

  const meta = {}
  let i = 1
  while (i < end) {
    const line = lines[i]
    if (!line.trim() || line.trimStart().startsWith('#')) { i++; continue }
    const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (!m) throw new Error(`${file}:${i + 1}: 看不懂的 front-matter 行：${line}`)
    const [, key, rest] = m

    if (rest.trim() === '|') {                       // 多行块
      const buf = []
      i++
      while (i < end && (lines[i].startsWith('  ') || !lines[i].trim())) {
        buf.push(lines[i].replace(/^ {2}/, ''))
        i++
      }
      while (buf.length && !buf.at(-1).trim()) buf.pop()
      meta[key] = buf.join('\n')
      continue
    }
    meta[key] = unquote(rest.trim())
    i++
  }
  return { meta, body: lines.slice(end + 1).join('\n').replace(/^\n+/, '') }
}

function unquote(v) {
  v = stripComment(v)
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1)
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

/**
 * 去掉值后面的行内注释。
 *
 * `#` 前必须有空白，所以 `C#` 这类值不受影响；但 `key:   # 说明` 这种
 * 「值为空、只有注释」的写法要能正确解析成空值 —— 调用方传进来的值已经
 * trim 过，前导空白没了，所以这里必须单独允许行首的 `#`。
 */
function stripComment(v) {
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v
  return v.replace(/(?:^|\s+)#.*$/, '').trim()
}

/**
 * front-matter 的 date 统一成 YYYY-MM-DD。格式写错直接报错，
 * 否则它会被静默当成「没有日期」而排到列表最后，很难发现。
 */
function normalizeDate(v, file) {
  if (v === undefined || v === null || String(v).trim() === '') return ''
  const s = String(v).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
    throw new Error(`${file}: date 必须是 YYYY-MM-DD，现在是「${s}」`)
  }
  return s
}

/* ------------------------------------------------- 块级指令 ::: name */

/**
 * 指令分两类。
 *
 * 行内指令（代码块/短语级，内部只按行内 Markdown 渲染，软换行折成空格）：
 *
 *   ::: note                     ::: question
 *   顶部提示内容                 RSI 提问句
 *   :::                          :::
 *
 *   ::: method-link              ::: date 2026-08
 *   [链接](x.html) 说明          发布时间 · 2026 年 8 月
 *   :::                          :::
 *
 * 块指令（内部按完整 Markdown 渲染，可以放段落、列表、加粗）：
 *
 *   ::: tldr                     ::: my-take
 *   - 讨论什么问题                真正重要的个人判断
 *   - 最重要的结论                :::
 *   :::
 *
 *   ::: axis axis-what           （section.rsi-axis，需要 id 参数）
 *   ## 标题
 *   :::
 *
 *   ::: list method-list         （内容必须是一个列表，参数是 class）
 *   - 条目
 *   :::
 */
/** 行内指令体按行内渲染；软换行折成空格，因此长句可以随便折行写。 */
const oneLine = (s) => s.trim().replace(/\s*\n\s*/g, ' ')

const INLINE_DIRECTIVES = {
  note: (body) => `<div class="draft-note">${marked.parseInline(oneLine(body))}</div>`,
  question: (body) => `<p class="rsi-question">${marked.parseInline(oneLine(body))}</p>`,
  'method-link': (body) => `<p class="rsi-method-link">${marked.parseInline(oneLine(body))}</p>`,
  date: (body, arg) =>
    `<p class="frontier-entry-date"><time datetime="${attr(arg)}">${marked.parseInline(oneLine(body))}</time></p>`,
}

/** 需要内部按完整 Markdown 渲染的块指令，用于错误提示里的可用清单。 */
const BLOCK_DIRECTIVES = ['axis', 'list', 'tldr', 'my-take']

function extractDirectives(md, file) {
  const lines = md.split('\n')
  const out = []
  const blocks = []
  for (let i = 0; i < lines.length; i++) {
    const m = /^:::\s*([a-z][\w-]*)\s*(.*)$/.exec(lines[i])
    if (!m) { out.push(lines[i]); continue }
    const [, name, arg] = m
    const body = []
    i++
    for (; i < lines.length && !/^:::\s*$/.test(lines[i]); i++) body.push(lines[i])
    if (i >= lines.length) throw new Error(`${file}: ::: ${name} 没有闭合的 :::`)
    blocks.push({ name, arg: arg.trim(), body: body.join('\n') })
    out.push(`<!--directive:${blocks.length - 1}-->`)
  }
  return { md: out.join('\n'), blocks }
}

function renderDirective(block, file) {
  const { name, arg, body } = block
  if (INLINE_DIRECTIVES[name]) return INLINE_DIRECTIVES[name](body, arg)
  if (name === 'axis') {
    if (!arg) throw new Error(`${file}: ::: axis 需要一个 id，例如 ::: axis axis-what`)
    return `<section class="rsi-axis" id="${attr(arg)}">\n${renderMarkdown(body, file)}</section>`
  }
  if (name === 'list') {
    const html = renderMarkdown(body, file).trim()
    if (!/^<(ol|ul)>/.test(html)) {
      throw new Error(`${file}: ::: list 的内容必须是一个有序或无序列表`)
    }
    return arg ? html.replace(/^<(ol|ul)>/, `<$1 class="${attr(arg)}">`) : html
  }
  if (name === 'tldr') {
    return `<aside class="tldr">\n<p class="tldr-label">TL;DR</p>\n${renderMarkdown(body, file)}</aside>`
  }
  if (name === 'my-take') {
    if (arg) throw new Error(`${file}: ::: my-take 不接受参数`)
    return `<aside class="my-take">\n<p class="my-take-label">My Take</p>\n${renderMarkdown(body, file)}</aside>`
  }
  throw new Error(
    `${file}: 未知指令 ::: ${name}（可用：${[...Object.keys(INLINE_DIRECTIVES), ...BLOCK_DIRECTIVES].join(', ')}）`)
}

/* ------------------------------------------------------------- 渲染 */

// `[@1]` → 指向文末第 1 条参考文献的引用链接
const citationExtension = {
  name: 'citation',
  level: 'inline',
  start: (src) => src.indexOf('[@'),
  tokenizer(src) {
    const m = /^\[@([\w-]+)\]/.exec(src)
    if (m) return { type: 'citation', raw: m[0], id: m[1] }
  },
  renderer: (token) =>
    `<a class="citation" href="#ref-${token.id}" aria-label="跳转到参考文献 ${token.id}">[${token.id}]</a>`,
}

// 中文写作里 `**加粗**` 后面紧跟汉字时（例如 `：**结论**根`），CommonMark 的
// 右侧定界符规则会判定它不能闭合，于是 `**` 被原样输出。这里放宽规则：
// 只要闭合的 `**` 前面不是空白就接受，让 **…** 在中文语境下正常工作。
const strongExtension = {
  name: 'strong',
  level: 'inline',
  start: (src) => src.indexOf('**'),
  tokenizer(src) {
    const m = /^\*\*(?=\S)([\s\S]*?\S)\*\*/.exec(src)
    if (!m) return
    return { type: 'strong', raw: m[0], text: m[1], tokens: this.lexer.inlineTokens(m[1]) }
  },
  renderer(token) {
    return `<strong>${this.parser.parseInline(token.tokens)}</strong>`
  },
}

// 标题里的 `{#some-id}` 转成 id 属性；没写就不生成 id（保持与旧版一致，交给 toc.js）
const postRenderer = {
  heading(token) {
    const html = this.parser.parseInline(token.tokens)
    const m = /\s*\{#([\w-]+)\}\s*$/.exec(html)
    const id = m ? ` id="${m[1]}"` : ''
    const text = m ? html.slice(0, m.index) : html
    return `<h${token.depth}${id}>${text}</h${token.depth}>\n`
  },

  // 引用块里只有一句话时不要包 <p>：原站点就是这么写的，
  // 多出来的 <p> 会叠加上 .article-body p 的样式。
  blockquote(token) {
    const body = this.parser.parse(token.tokens).trim()
    const single = /^<p>([\s\S]*?)<\/p>$/.exec(body)
    return `<blockquote>${single ? single[1] : `\n${body}\n`}</blockquote>\n`
  },
}

marked.use({
  extensions: [citationExtension, strongExtension],
  renderer: postRenderer,
  gfm: true,
  breaks: false,
})

/**
 * `## 参考文献` 下面那个有序列表：自动加 class 和 id="ref-N"，
 * 于是正文只写 [@1]，不用再手工维护 [1] / id="ref-1" 两处编号。
 */
function tagReferences(html) {
  const h = html.indexOf('<h2 id="references"')
  if (h < 0) return html
  const olStart = html.indexOf('<ol>', h)
  if (olStart < 0) return html
  const olEnd = html.indexOf('</ol>', olStart)
  if (olEnd < 0) return html
  let n = 0
  const inner = html.slice(olStart + 4, olEnd).replace(/<li>/g, () => `<li id="ref-${++n}">`)
  return `${html.slice(0, olStart)}<ol class="reference-list">${inner}</ol>${html.slice(olEnd + 5)}`
}

function renderMarkdown(md, file) {
  const { md: stripped, blocks } = extractDirectives(md, file)
  const rendered = blocks.map((b) => renderDirective(b, file))
  const html = marked.parse(stripped)
  return tagReferences(html.replace(/<!--directive:(\d+)-->/g, (_, i) => rendered[Number(i)]))
}

/* ------------------------------------------------------- 文章与首页 */

async function loadPosts() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'))
  const posts = []
  for (const f of files.sort()) {
    const full = path.join(POSTS_DIR, f)
    const { meta, body } = parseFrontMatter(await read(full), `content/posts/${f}`)
    const slug = meta.slug || f.replace(/\.md$/, '')
    if (!meta.title) throw new Error(`content/posts/${f}: front-matter 缺少 title`)
    const date = normalizeDate(meta.date, `content/posts/${f}`)
    posts.push({ ...meta, date, slug, body, file: `content/posts/${f}` })
  }
  return posts
}

/**
 * 首页顺序由 order 决定（编辑选择的阅读顺序）；order 越大越靠前。
 * 数字可以留空档，方便以后往中间插文章而不用全部重排。
 */
const orderValue = (p) => (p.order === undefined ? -1 : Number(p.order) || -1)

function validate(posts) {
  const warn = []
  const seen = new Map()
  for (const p of posts) {
    if (seen.has(p.slug)) warn.push(`slug 重复：${p.slug}（${seen.get(p.slug)} 与 ${p.file}）`)
    seen.set(p.slug, p.file)

    const refs = (p.body.match(/^##\s+参考文献/gm) || []).length
    const cited = [...p.body.matchAll(/\[@([\w-]+)\]/g)].map((m) => m[1])
    if (cited.length && !refs) warn.push(`${p.file}: 用了 [@N] 但没有「## 参考文献」章节`)
    if (refs > 1) warn.push(`${p.file}: 出现了 ${refs} 个「## 参考文献」章节`)

    if (p.index !== false && !p.summary) warn.push(`${p.file}: 会显示在首页，但没有 summary`)
    if (p.index !== false && !(p.cardMeta || p.meta)) {
      warn.push(`${p.file}: 会显示在首页，但没有 cardMeta / meta（卡片右上角分类）`)
    }
    if (p.index !== false && p.order === undefined && !p.pinned) {
      warn.push(`${p.file}: 会显示在首页，但没有 order，位置会落到最后`)
    }
  }
  return warn
}

async function buildPost(post, vars) {
  const body = renderMarkdown(post.body, post.file)
    .split('\n')
    .map((l) => (l.trim() ? `      ${l}` : l))
    .join('\n')
    .replace(/\s+$/, '')

  return fill(await read(path.join(TEMPLATES, 'post.html')), {
    ...vars,
    title: post.title,
    tabTitle: post.tabTitle || post.title,
    description: attr(post.description || post.summary || ''),
    // 文章页眉的分类行后面接发布日期，模板不用额外加槽位
    meta: [post.meta, post.date].filter(Boolean).join(' · '),
    footer: post.footer || post.title,
    backHref: post.back || '../',
    backLabel: post.backLabel || '← 返回技术笔记',
    body,
  })
}

async function buildIndex(posts, vars) {
  const card = await read(path.join(TEMPLATES, 'card.html'))
  const cardPinned = await read(path.join(TEMPLATES, 'card-pinned.html'))

  const visible = posts.filter((p) => p.index !== false)

  // 首页顺序 = 编辑选择的阅读顺序，order 越大越靠前。
  // order 相同时用 slug 兜底，保证每次构建的顺序都一致。
  const byHomeOrder = (a, b) => {
    const pin = (p) => (p.pinned ? 1 : 0)
    if (pin(a) !== pin(b)) return pin(b) - pin(a)
    const d = orderValue(b) - orderValue(a)
    return d !== 0 ? d : a.slug.localeCompare(b.slug)
  }

  const render = (list) =>
    list
      .map((p) =>
        fill(p.pinned ? cardPinned : card, {
          slug: p.slug,
          order: p.order ?? '',
          // 卡片上写的是短分类，通常比文章页眉短，没写就退回页眉
          meta: p.cardMeta || p.meta || '',
          pinned: p.pinned === true ? '置顶 · 持续更新' : p.pinned,
          title: p.title,
          summary: p.summary ?? '',
        }).replace(/\s+$/, ''))
      .join('\n')

  // section: references 的文章不进主列表，单独归到页面底部的文献目录栏
  const main = visible.filter((p) => p.section !== 'references').sort(byHomeOrder)
  const refs = visible.filter((p) => p.section === 'references').sort(byHomeOrder)

  const refSection = refs.length
    ? fill(await read(path.join(TEMPLATES, 'ref-section.html')), {
        refsHeading: vars.refsHeading || '方法文献目录',
        refsEyebrow: vars.refsEyebrow || 'REFERENCES',
        refCount: refs.length,
        refCards: render(refs),
      }).replace(/\s+$/, '')
    : ''

  const index = fill(await read(path.join(TEMPLATES, 'index.html')), {
    ...vars,
    description: attr(vars.description),
    noteCount: main.length,
    cards: render(main),
    refSection,
  })
  return { html: index, listed: visible, main, refs }
}

/* ------------------------------------------------------------- 主流程 */

export async function build() {
  const site = JSON.parse(await read(path.join(ROOT, 'content', 'site.json')))
  const vars = {
    ...site,
    cssVersion: await version('styles.css'),
    tocVersion: await version('toc.js'),
  }

  const posts = await loadPosts()
  const warnings = validate(posts)

  await rm(OUT, { recursive: true, force: true })
  await mkdir(path.join(OUT, 'posts'), { recursive: true })

  for (const post of posts) {
    await writeFile(path.join(OUT, 'posts', `${post.slug}.html`), await buildPost(post, vars))
  }

  const { html, main, refs } = await buildIndex(posts, vars)
  await writeFile(path.join(OUT, 'index.html'), html)

  for (const f of ['styles.css', 'toc.js', 'favicon.svg', '.nojekyll']) {
    if (existsSync(path.join(ROOT, f))) await cp(path.join(ROOT, f), path.join(OUT, f))
  }
  if (existsSync(path.join(ROOT, 'assets'))) {
    await cp(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true })
  }

  for (const w of warnings) console.warn(`  ⚠ ${w}`)
  console.log(
    `✓ dist/ · ${posts.length} 篇文章（首页 ${main.length} 张卡片 + 文献 ${refs.length} 篇）` +
    ` · css v${vars.cssVersion} toc v${vars.tocVersion}`)
}

/**
 * 监听源文件，变化时重建。返回 { stop, checkNow }。
 *
 * onRebuild 只在「确实重建了」之后调用（开发服务器用它通知浏览器刷新）。
 * checkNow() 会等到构建真正结束才 resolve，因此可以安全地「先确保最新再响应请求」。
 */
export async function watchSources(onRebuild) {
  // 注意用 node:fs 的回调版 watch。fs/promises 的 watch() 是惰性异步迭代器，
  // 不去消费它就不会真正开始监听。
  const { watch: watchCb } = await import('node:fs')

  let print = await sourceFingerprint()
  let timer
  let current = null
  let queued = false

  // 云盘目录（iCloud / Dropbox）常常为一次保存抛出一串事件，所以既防抖、
  // 又压掉构建期间的重复触发，最后用源文件指纹兜底：内容没变就不重建。
  function rebuild() {
    if (current) { queued = true; return current }
    current = (async () => {
      try {
        const now = await sourceFingerprint()
        if (now !== print) {
          await build()
          print = now
          onRebuild?.()
        }
      } catch (e) {
        console.error(`✗ 构建失败：${e.message}`)
      } finally {
        current = null
      }
      if (queued) { queued = false; return rebuild() }
    })()
    return current
  }

  const watchers = []
  const onChange = () => {
    clearTimeout(timer)
    timer = setTimeout(rebuild, 150)
  }

  // 目录递归监听；根目录单独非递归地听一次，覆盖 styles.css / toc.js /
  // favicon.svg 这类散落文件（直接监听单个文件的话，编辑器用「写临时文件再
  // 改名」保存会换掉 inode，监听就失效了）。
  for (const [target, opts] of [
    ['content', { recursive: true }],
    ['templates', { recursive: true }],
    ['assets', { recursive: true }],
    ['.', {}],
  ]) {
    const full = path.join(ROOT, target)
    try {
      watchers.push(watchCb(full, opts, onChange)
        .on('error', (e) => console.error(`⚠ 监听 ${target} 出错：${e.message}`)))
    } catch (e) {
      console.error(`⚠ 无法监听 ${target}：${e.message}`)
    }
  }

  return {
    checkNow: rebuild,
    stop() {
      clearTimeout(timer)
      for (const w of watchers) w.close()
    },
  }
}

async function main() {
  await build()
  if (!process.argv.includes('--watch')) return
  console.log('监听 content/、templates/、assets/ 与根目录样式文件 …（Ctrl-C 退出）')
  await watchSources()
}

// 被 serve.mjs import 时不要执行 CLI 入口
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`✗ 构建失败：${e.message}`)
    process.exit(1)
  })
}

const SOURCE_DIRS = ['content', 'templates', 'assets']
const SOURCE_FILES = ['styles.css', 'toc.js', 'favicon.svg']

/** 所有源文件的 路径 + 大小 + mtime 指纹，用来判断是否真的需要重建。 */
async function sourceFingerprint() {
  const files = []
  for (const dir of SOURCE_DIRS) {
    const base = path.join(ROOT, dir)
    if (!existsSync(base)) continue
    for (const rel of await readdir(base, { recursive: true })) {
      const full = path.join(base, rel)
      if (!(await stat(full)).isDirectory()) files.push(full)
    }
  }
  for (const f of SOURCE_FILES) {
    if (existsSync(path.join(ROOT, f))) files.push(path.join(ROOT, f))
  }

  const parts = []
  for (const f of files.sort()) {
    const s = await stat(f)
    parts.push(`${f}:${s.size}:${s.mtimeMs}`)
  }
  return createHash('sha256').update(parts.join('\n')).digest('hex')
}
