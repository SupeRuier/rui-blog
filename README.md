# Rui Blog

一个极简的静态技术博客，用于记录 AI 数据工程、具身智能、Robot Agent 与持续自我改进。

正文写在 `content/posts/*.md` 里，`npm run build` 生成 `dist/` 静态站点。
`dist/` 不进版本库，由 GitHub Actions 构建后发布到 Pages。

## 本地预览

```bash
npm install        # 首次
npm run serve      # 构建并起本地服务，打开 http://localhost:8000
npm run dev        # 改 content/ 或 templates/ 自动重建
```

## 写一篇新文章

1. 复制一篇现有的 `content/posts/*.md`，改文件名（文件名就是 URL，例如 `foo.md` → `/posts/foo.html`）。
2. 改开头的 front-matter，写正文。
3. 提交并推送到 `main`，GitHub Actions 会自动构建并发布。

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
tools/build.mjs       构建脚本
tools/serve.mjs       本地预览
styles.css toc.js assets/ favicon.svg   原样拷进 dist/
```

`index.html` 的卡片数量、编号、置顶顺序都由 front-matter 推导，不用手工维护。
`styles.css` 和 `toc.js` 的 `?v=` 版本号按文件内容哈希自动生成。
