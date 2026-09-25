# Rui Blog

一个极简的静态技术博客，用于记录 AI 数据工程、具身智能、Robot Agent 与持续自我改进。

正文写在 `content/posts/*.md` 里，`npm run build` 生成 `dist/` 静态站点。
`dist/` 不进版本库，由 GitHub Actions 构建后发布到 Pages。

## 本地服务的运行方式

日常写作只需要一个进程常驻：

```bash
npm install   # 首次
npm run dev   # 默认 http://localhost:8000
```

### 它做了什么

启动时按顺序做三件事，之后一直挂着：

1. **构建** —— 把 `content/` 渲染成 `dist/`（等同于 `npm run build`）。
2. **起静态服务** —— 服务的是 `dist/`，不是源文件。`/` 是首页，`/posts/<文件名>.html` 是文章页。
3. **监听源文件** —— 变化后自动重建，再通过 SSE 通知浏览器刷新。

于是你的循环就变成：改 `content/posts/*.md` → 存盘 → 终端出现
`↻ 源文件已更新，已通知浏览器刷新` → **页面自己刷新**，不用按 F5。

即使监听漏了事件（云盘目录偶发），手动刷新一次也一定是最新内容：服务端在返回
HTML 前会先确认一次源文件指纹，变了就先重建再响应。

### 监听范围

| 你改了什么 | 会触发重建吗 |
| --- | --- |
| `content/posts/*.md`、`content/site.json` | 会，并刷新页面 |
| `templates/*.html`（页面骨架） | 会，并刷新页面 |
| `assets/**`（换图、加图） | 会，并重新拷进 `dist/assets/` |
| `styles.css`、`toc.js`、`favicon.svg` | 会，且 `?v=` 版本号自动更新 |
| `dist/` 里的任何东西 | 不会。`dist/` 是产物，每次构建整个重建，别往里放东西 |
| `tools/`、`package.json` | 不会。改了构建脚本要重启服务 |

### 停止

终端里按 `Ctrl-C`。

### 换端口

```bash
npm run dev -- 9000      # 跟在命令后面
PORT=9000 npm run dev    # 用环境变量
```

端口被占用时会直接告诉你换哪个：

```
✗ 端口 8000 已被占用。换一个：npm run dev -- 8001
```

### 四个命令的分工

| 命令 | 构建 | 起服务 | 监听 + 自动刷新 | 用途 |
| --- | :---: | :---: | :---: | --- |
| `npm run dev` | ✓ | ✓ | ✓ | **日常写作**，改完存盘页面自己刷新 |
| `npm run preview` | ✓ | ✓ | — | 看生产产物长什么样（不做任何注入） |
| `npm run build` | ✓ | — | — | 只要 `dist/`；CI 用的就是它 |
| `npm run verify` | ✓ | — | — | 与 `main` 上的原始站点逐页比对，确认内容没被改坏 |

`dev` 注入的自动刷新脚本只存在于服务响应里，`dist/` 里的 HTML 始终是干净的，
所以直接双击 `dist/index.html` 也能打开看（只是没有自动刷新）。

### 常见问题

- **改完页面没变** —— 先手动刷新一次；还是没变，看终端有没有构建报错。构建失败时
  `dist/` 会停在上一版，页面看起来「没更新」。
- **改 `tools/build.mjs` 后不生效** —— 构建脚本本身不参与监听，重启 `npm run dev`。
- **提示目录被占用** —— 多半是另一个 `npm run dev` 还在跑，先关掉那个终端。

## 写一篇新文章

1. 复制一篇现有的 `content/posts/*.md`，改文件名（文件名就是 URL，例如 `foo.md` → `/posts/foo.html`）。
2. 改开头的 front-matter，写正文。
3. 本地 `npm run dev` 看效果，满意后提交并推送到 `main`，GitHub Actions 会自动构建并发布。

## front-matter 字段

```yaml
---
title: 文章标题                      # 必填。文章页 <h1>，也是首页卡片标题
tabTitle: 短标题                     # 浏览器标签用，省略则用 title
description: 搜索引擎和分享摘要
order: "11"                          # 首页卡片编号，数字越大越靠前
meta: EMBODIED DATA · FRAMEWORK      # 文章页顶部的分类行
cardMeta: Embodied Data              # 首页卡片右上角，一般比 meta 短
summary: 首页卡片上的一句话摘要
pinned: 置顶 · 持续更新               # 写上就置顶（卡片会加 .is-pinned 样式）
index: false                         # 不生成首页卡片，只从父文章内链进入
back: agent-robo-rsi.html#agent-rsi  # 返回链接指向哪里，默认首页
backLabel: ← 返回 Agent RSI 主文章    # 返回链接文案
footer: Embodied Data                # 页脚右侧文字
---
```

## 正文语法

标准 Markdown（标题、列表、引用、`**加粗**`、`[链接](url)`、`` `代码` ``），外加四个约定：

- **引用编号**：正文写 `[@1]`，自动指向文末 `## 参考文献` 里的第 1 条。不要手写 `[1]` 和 `id="ref-1"`。
- **标题锚点**：`## 数据量 {#data-scale}` 生成 `id="data-scale"`。不写就由 `toc.js` 在运行时自动编号。
- **参考文献**：文末写 `## 参考文献 {#references}`，下面用普通有序列表，构建时自动补 `class="reference-list"` 和 `id="ref-N"`。
- **块指令**：

  ```markdown
  ::: note            <!-- 灰色提示框 .draft-note -->
  ::: question        <!-- RSI 提问句 .rsi-question -->
  ::: method-link     <!-- 方法目录入口 .rsi-method-link -->
  ::: date 2026-08    <!-- 时间标签 .frontier-entry-date -->
  ::: axis axis-what  <!-- 六轴小节 .rsi-axis，内部按完整 Markdown 渲染 -->
  ::: list method-list <!-- 带样式的列表，参数是 class -->
  ```

  指令内部按 Markdown 渲染，长句可以随便折行。

正文里可以直接写 HTML——现有的 `figure.rsi-*` 示意图就是这么存的。

## 目录结构

```
content/site.json     首页标题、lede、scope、页脚等站点文案
content/posts/*.md    文章源文件
templates/            页面骨架（post.html / index.html / card.html）
tools/build.mjs       构建脚本（导出 build / watchSources）
tools/serve.mjs       本地开发服务器（自动重建 + 页面自动刷新）
tools/verify-against-main.py  与 main 分支的原始站点做等价性比对
styles.css toc.js assets/ favicon.svg   原样拷进 dist/
```

`index.html` 的卡片数量、编号、置顶顺序都由 front-matter 推导，不用手工维护。
`styles.css` 和 `toc.js` 的 `?v=` 版本号按文件内容哈希自动生成。
