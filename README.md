# Rui Blog

一个极简的静态技术博客，用于记录 AI 数据工程、具身智能、Robot Agent 与持续自我改进。

正文写在 `content/posts/*.md` 里，`npm run build` 生成 `dist/` 静态站点。
`dist/` 不进版本库，由 GitHub Actions 构建后发布到 Pages。

## 先看哪一份文档

| 我想…… | 看这里 |
| --- | --- |
| 写一篇新文章 / 改已有文章 | **[`WRITING.md`](./WRITING.md)** —— 内容标准，写作前必读 |
| 跑起来、看 front-matter 字段和正文语法 | 本文件 |
| 用 AI 协作改这个仓库 | [`AGENTS.md`](./AGENTS.md) —— 操作硬约束 |

本文件只讲**仓库怎么用**；文章应该写成什么样，以 `WRITING.md` 为准，不要在这里重复。

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

0. 先读 [`WRITING.md`](./WRITING.md)，确认这篇属于哪种认知单元、需要哪些核心元素（TL;DR / Overview Figure / `My Take`）。
1. 复制一篇现有的 `content/posts/*.md`，改文件名（文件名就是 URL，例如 `foo.md` → `/posts/foo.html`）。
2. 改开头的 front-matter，写正文。
3. 本地 `npm run dev` 看效果，满意后提交并推送到 `main`，GitHub Actions 会自动构建并发布。

## front-matter 字段

```yaml
---
title: 文章标题                      # 必填。文章页 <h1>，也是首页卡片标题
order: "11"                          # 首页位置，数字越大越靠前。留空档（10/20/30）方便往中间插文章
tabTitle: 短标题                     # 浏览器标签用，省略则用 title
description: 搜索引擎和分享摘要
date:                                # 占位，暂不填。填 YYYY-MM-DD 后只显示在文章页页眉，不参与排序
meta: EMBODIED DATA · FRAMEWORK      # 文章页顶部的分类行（填了 date 会自动接在后面）
cardMeta: Embodied Data              # 首页卡片右上角，一般比 meta 短
summary: 首页卡片上的一句话摘要
pinned: 置顶 · 持续更新               # 写上就置顶（卡片会加 .is-pinned 样式），且不用写 order
index: false                         # 不生成首页卡片，只从父文章内链进入
section: references                  # 不进首页主列表，改放页面底部的「方法文献目录」栏
back: agent-robo-rsi.html#agent-rsi  # 返回链接指向哪里，默认首页
backLabel: ← 返回 Agent RSI 主文章    # 返回链接文案
footer: Embodied Data                # 页脚右侧文字
---
```

**首页排序规则：`pinned` 最优先，其余按 `order` 从大到小。** 顺序是编辑决定的阅读顺序，
不是发布时间 —— 这个站点是「少而重」的认知地图，不是持续输出的信息流。理由见
[`WRITING.md`](./WRITING.md) §2。

`date` 是**占位字段，目前全部留空**。它回答的是「这篇有多新」，只用于文章页的时间标注，
卡片上不显示，也不参与排序 —— 顺序由 `order` 单独决定，两件事不要混。格式写错会直接构建失败。

会显示在首页却没有 `order` 的文章会落到最后，构建时给警告。

**首页分两栏。** 主栏是讨论性文章（`技术主题`）；标了 `section: references` 的文章单独放进页面
最下方的「方法文献目录」栏 —— 这类文章以文献罗列为主、讨论性弱，放在最后不占首屏。两栏内部
各自按 `order` 从大到小排。栏目标题与角标文案在 `content/site.json` 的 `refsHeading` /
`refsEyebrow` 里改。

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
  ::: axis axis-what  <!-- 六轴小节 .rsi-axis，参数是 id -->
  ::: list method-list <!-- 带样式的列表，参数是 class -->
  ```

  以上是行内指令，指令体内部按**行内** Markdown 渲染（软换行折成空格，长句可以随便折行）。

- 下面两个是块指令，指令体按**完整** Markdown 渲染，可以放段落、列表和多个块：

  ```markdown
  ::: tldr            <!-- 文首 TL;DR 摘要框，标题自动生成 -->
  - 讨论什么问题
  - 最重要的结论
  :::

  ::: my-take         <!-- 强调真正重要的个人判断，标题自动生成 -->
  I find it more useful to distinguish ... from ...
  :::
  ```

  写什么、什么时候用，见 [`WRITING.md`](./WRITING.md)。用错指令名会直接构建失败，不会静默忽略。

正文里可以直接写 HTML——现有的 `figure.rsi-*` 示意图就是这么存的。

## 目录结构

```
content/site.json     首页标题、lede、scope、页脚等站点文案
content/posts/*.md    文章源文件
WRITING.md            撰写标准（文章写成什么样，写作前必读）
AGENTS.md             AI 协作的操作硬约束
templates/            页面骨架（post.html / index.html / card.html）
tools/build.mjs       构建脚本（导出 build / watchSources）
tools/serve.mjs       本地开发服务器（自动重建 + 页面自动刷新）
tools/verify-against-main.py  与 main 分支的原始站点做等价性比对
styles.css toc.js assets/ favicon.svg   原样拷进 dist/
```

`index.html` 的卡片数量、日期、排序和置顶状态都由 front-matter 推导，不用手工维护。
`styles.css` 和 `toc.js` 的 `?v=` 版本号按文件内容哈希自动生成。
