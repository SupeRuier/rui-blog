/**
 * mermaid 规格图的缩放控制。
 *
 * 这些图的原始尺寸是两千多像素（架构图 2767×1980，时序图 2207×3102），
 * 按原尺寸放进 720px 的正文宽度只能看到一角。所以：
 *
 *   1. 默认**适应容器宽度**——先看清整体结构（无 JS 时由 CSS 兜底，效果相同）；
 *   2. 需要看细节时用 − ／ ＋ 手动放大，放不下就横向滚动；
 *   3. `适应宽度` 复位。
 *
 * 只用原生 DOM，不引入任何库。工具条由本脚本注入，因此禁用 JS 时不会留下
 * 一排按不动的按钮。
 */
(() => {
  const MIN = 1
  const MAX = 8
  const STEP = 1.25

  const controls = [
    ['out', '−', '缩小'],
    ['label', null, null],
    ['in', '＋', '放大'],
    ['reset', '适应宽度', '恢复到适应容器宽度'],
  ]

  for (const figure of document.querySelectorAll('.diagram')) {
    const canvas = figure.querySelector('.diagram-canvas')
    const svg = canvas?.querySelector('svg')
    if (!canvas || !svg) continue

    // 原始宽度：优先取 viewBox，它不随 CSS 变化
    const box = svg.viewBox?.baseVal
    const natural = box?.width || svg.getBoundingClientRect().width || 1200
    let zoom = 1

    const bar = document.createElement('div')
    bar.className = 'diagram-bar'

    const label = document.createElement('span')
    label.className = 'diagram-zoom'

    const apply = () => {
      // 减掉左右 padding 与可能出现的滚动条，避免适应宽度后仍然溢出
      const usable = canvas.clientWidth - 28
      svg.style.width = `${Math.max(80, natural * (usable / natural) * zoom)}px`
      svg.style.height = 'auto'
      label.textContent = `${Math.round(zoom * 100)}%`
      bar.querySelector('[data-zoom="out"]').disabled = zoom <= MIN
      bar.querySelector('[data-zoom="in"]').disabled = zoom >= MAX
    }

    const setZoom = (next) => {
      zoom = Math.min(MAX, Math.max(MIN, next))
      apply()
    }

    for (const [kind, text, title] of controls) {
      if (kind === 'label') {
        bar.append(label)
        continue
      }
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.zoom = kind
      button.textContent = text
      button.title = title
      button.setAttribute('aria-label', title)
      button.addEventListener('click', () => {
        if (kind === 'in') setZoom(zoom * STEP)
        else if (kind === 'out') setZoom(zoom / STEP)
        else setZoom(1)
      })
      bar.append(button)
    }

    figure.insertBefore(bar, canvas)
    apply()

    // 窗口尺寸变化后「适应宽度」的基准会变，重新计算一次
    let timer
    addEventListener('resize', () => {
      clearTimeout(timer)
      timer = setTimeout(apply, 150)
    })
  }
})()
