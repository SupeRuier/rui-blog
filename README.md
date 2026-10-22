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
3. **监听源文件** —— 变化后自动重建，并且**只通知受影响的页面**刷新。

于是你的循环就变成：改 `content/posts/*.md` → 存盘 → 终端出现
`↻ content/posts/foo.md → /posts/foo.html` → **那一页自己刷新**，别的标签页不动。

哪些改动刷哪些页面，由构建时记录的「页面 → 依赖」表决定：

| 你改了什么 | 谁会刷新 |
| --- | --- |
| 某篇文章的正文 | 只有 `posts/<该文章>.html` |
| 某篇文章的 `title` / `summary` / `order` / `pinned` / `cardMeta` | 该文章页 + 首页（卡片变了） |
| 新增或删除文章 | 首页（新文章页会出现在下一次打开时） |
| `styles.css`、`toc.js`、`diagram.js`、`favicon.svg`、`content/site.json` | 全部页面 |
| `templates/*.html` | 用到该模板的页面 |
| `assets/**` 里被文章引用的图 | 引用它的那几篇文章 |

认不出依赖关系时会保守地全站刷新（日志里显示「全部页面」），宁可多刷一次也不留旧页面。

即使监听漏了事件（云盘目录偶发），手动刷新一次也一定是最新内容：服务端在返回
HTML 前会先确认一次源文件指纹，变了就先重建再响应。

### 监听范围

| 你改了什么 | 会触发重建吗 |
| --- | --- |
| `content/posts/*.md`、`content/site.json` | 会，按上表定向刷新 |
| `templates/*.html`（页面骨架） | 会，按上表定向刷新 |
| `assets/**`（换图、加图） | 会，并重新拷进 `dist/assets/` |
| `styles.css`、`toc.js`、`diagram.js`、`favicon.svg` | 会，全站刷新，且 `?v=` 版本号自动更新 |
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
- **引用边注**：页面会把每个 `[@N]` 对应的完整条目同时显示在引用位置右侧；窄屏改为紧跟引用的内联卡片。文末参考文献列表仍完整保留。
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
styles.css toc.js diagram.js assets/ favicon.svg   原样拷进 dist/
```

`index.html` 的卡片数量、日期、排序和置顶状态都由 front-matter 推导，不用手工维护。
`styles.css` 和 `toc.js` 的 `?v=` 版本号按文件内容哈希自动生成。

## 图

站点**不引入任何前端图形库**。两种画法：

| 方式 | 写法 | 适合 |
| --- | --- | --- |
| HTML/CSS 图 | 直接写 `<figure class="wire-map">`、`seq-map`、`loop-map`、`arch-map`、`rsi-mini` 等（见 `WRITING.md` §3.2） | 概览、流程、架构、时序——多数情况用这个 |
| 内联 SVG 图 | 手工写 `assets/*.svg`，正文写 `::: diagram <图名>` | 需要真实坐标轴或曲线的图，例如主动学习页的学习曲线 |

图表优先用 HTML/CSS：文字随版心重排，不依赖图片缩放，暗色模式也能跟随 CSS 变量。只有坐标轴、曲线这类 HTML/CSS 不擅长的内容才用静态 SVG。

`::: diagram <图名>` 会把 `assets/<图名>.svg` 在构建时**内联**进页面（文字可选中、可检索），图名不存在会直接构建失败。

图的尺寸由 `diagram.js` 控制（约 60 行原生 DOM，无依赖）：

- **默认适应容器宽度**——先看清整体结构；这一档由 CSS 兜底，禁用 JS 时效果相同；
- **− / ＋ 手动放大缩小**（1×–8×，步进 1.25），放不下就横向滚动，`适应宽度` 复位；
- **`展开大图` 打开全屏浮层**——按视口铺开，可继续缩放，放大后可**拖动平移**；
  Esc / 点背景 / `关闭` 退出，打开时锁页面滚动、焦点移到关闭按钮，关闭后焦点还原；
- 工具条由脚本注入，所以禁用 JS 时不会留下一排按不动的按钮。

浮层里是原图的**克隆**，内联那份继续留在页面上。克隆时会把它所有的 id 加 `-modal`
后缀（连同 SVG 内箭头 marker 的 `url(#…)` 引用一起改），避免同页出现重复 id。

图按原始尺寸绘制，缩到 720px 正文宽度后细节靠放大——这是刻意的取舍：**默认不给一个需要横向拖动的巨图**。

`.diagram-canvas` 的底色**固定为白**，不跟随暗色模式：SVG 里的字色写死成深色，跟随主题会直接看不见。
