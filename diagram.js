/**
 * 内联 SVG 图的缩放与全屏展开。
 *
 * 学习曲线这类带固定坐标轴的图要保持原始比例，缩到 720px 的正文宽度后
 * 细节会变小。因此提供两档阅读方式：
 *
 *   1. **页内**——默认适应容器宽度，先看清整体结构；需要细节时 − ／ ＋ 放大。
 *   2. **全屏**——`展开大图` 打开浮层，按视口铺开，可继续放大、可拖动平移；
 *      Esc / 点背景 / `关闭` 退出。
 *
 * 只用原生 DOM，不引入任何库，两档共用同一套缩放逻辑。
 * 工具条由本脚本注入，因此禁用 JS 时不会留下一排按不动的按钮；
 * 「适应宽度」那一档由 CSS 兜底，无 JS 时效果相同。
 */
(() => {
  const MIN = 1
  const MAX = 8
  const STEP = 1.25
  const PAD = 28 // canvas 左右 padding，算「适应宽度」时要减掉

  /** 缩放器。zoom 是相对「适应容器宽度」的倍数，不是绝对像素比。 */
  function createZoomer(canvas, svg, onZoom) {
    let zoom = 1

    const apply = () => {
      // 减掉 padding 与可能出现的滚动条，避免适应宽度之后仍然溢出
      const usable = Math.max(120, canvas.clientWidth - PAD)
      // 适应宽度 = usable；zoom 是在此基础上的倍数
      svg.style.width = `${usable * zoom}px`
      svg.style.height = 'auto'
      onZoom(zoom)
    }

    const api = {
      apply,
      get zoom() {
        return zoom
      },
      set(next) {
        zoom = Math.min(MAX, Math.max(MIN, next))
        apply()
      },
      by(factor) {
        api.set(zoom * factor)
      },
      reset() {
        api.set(1)
        canvas.scrollTo(0, 0)
      },
    }
    return api
  }

  /** 工具条：− 百分比 ＋ 复位。refresh 同时负责按边界禁用按钮。 */
  function createToolbar(resetLabel) {
    const bar = document.createElement('div')
    bar.className = 'diagram-bar'

    const label = document.createElement('span')
    label.className = 'diagram-zoom'
    label.textContent = '100%'

    const button = (kind, text, title) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.dataset.zoom = kind
      b.textContent = text
      b.title = title
      b.setAttribute('aria-label', title)
      bar.append(b)
      return b
    }

    const out = button('out', '−', '缩小')
    bar.append(label)
    const inn = button('in', '＋', '放大')
    const reset = button(
      'reset',
      resetLabel,
      resetLabel === '适应宽度' ? '恢复到适应容器宽度' : '恢复到适应窗口',
    )

    const refresh = (zoom) => {
      label.textContent = `${Math.round(zoom * 100)}%`
      out.disabled = zoom <= MIN
      inn.disabled = zoom >= MAX
    }
    return { bar, refresh, out, inn, reset }
  }

  /** 拖动平移。只在内容确实超出视口时启用，避免误拖。 */
  function enablePan(canvas) {
    let start = null
    const canPan = () =>
      canvas.scrollWidth > canvas.clientWidth + 2 || canvas.scrollHeight > canvas.clientHeight + 2

    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !canPan()) return
      start = { x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop }
      canvas.setPointerCapture(event.pointerId)
      canvas.classList.add('is-panning')
    })
    canvas.addEventListener('pointermove', (event) => {
      if (!start) return
      canvas.scrollLeft = start.left - (event.clientX - start.x)
      canvas.scrollTop = start.top - (event.clientY - start.y)
    })
    const end = (event) => {
      if (!start) return
      start = null
      canvas.classList.remove('is-panning')
      try {
        canvas.releasePointerCapture(event.pointerId)
      } catch {
        /* 指针已经释放，忽略 */
      }
    }
    canvas.addEventListener('pointerup', end)
    canvas.addEventListener('pointercancel', end)
  }

  /* --------------------------------------------------------------- 全屏浮层 */

  let modal = null
  let lastFocus = null

  function closeModal() {
    if (!modal || modal.hidden) return
    modal.hidden = true
    modal.querySelector('.diagram-canvas').replaceChildren()
    document.body.classList.remove('is-diagram-modal')
    lastFocus?.focus?.()
  }

  function openModal(sourceSvg, title) {
    lastFocus = document.activeElement

    if (!modal) {
      modal = document.createElement('div')
      modal.className = 'diagram-modal'
      modal.hidden = true
      modal.setAttribute('role', 'dialog')
      modal.setAttribute('aria-modal', 'true')
      modal.innerHTML = '<div class="diagram-modal-inner"><div class="diagram-canvas diagram-canvas--modal"></div></div>'
      document.body.append(modal)
      enablePan(modal.querySelector('.diagram-canvas'))
      // 点背景关闭；点内容不关
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal()
      })
    }

    const inner = modal.querySelector('.diagram-modal-inner')
    const canvas = modal.querySelector('.diagram-canvas')

    // 克隆一份：内联那份继续留在页面上，两边互不影响。
    // 克隆体与原图同 id 会造成重复 id，且 SVG 内的箭头 marker 用的是
    // url(#id)，必须把内部引用一起改掉，否则会解析到内联那一份。
    const clone = sourceSvg.cloneNode(true)
    clone.removeAttribute('style')
    const idBase = sourceSvg.id
    if (idBase) {
      clone.innerHTML = clone.innerHTML.split(idBase).join(`${idBase}-modal`)
      clone.id = `${idBase}-modal`
    }
    canvas.replaceChildren(clone)

    const toolbar = createToolbar('适应窗口')
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'diagram-modal-close'
    close.textContent = '关闭 ✕'
    close.setAttribute('aria-label', '关闭大图')
    close.addEventListener('click', closeModal)
    toolbar.bar.append(close)
    inner.replaceChildren(toolbar.bar, canvas)
    modal.setAttribute('aria-label', title || '大图')

    // 必须先显示再量宽度：hidden 元素的 clientWidth 是 0
    modal.hidden = false
    document.body.classList.add('is-diagram-modal')

    const zoomer = createZoomer(canvas, clone, toolbar.refresh)
    toolbar.out.addEventListener('click', () => zoomer.by(1 / STEP))
    toolbar.inn.addEventListener('click', () => zoomer.by(STEP))
    toolbar.reset.addEventListener('click', () => zoomer.reset())

    canvas.scrollTo(0, 0)
    zoomer.apply()
    close.focus()
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal()
  })

  /* ----------------------------------------------------- 页内图：工具条与展开 */

  for (const figure of document.querySelectorAll('.diagram')) {
    const canvas = figure.querySelector('.diagram-canvas')
    const svg = canvas?.querySelector('svg')
    if (!canvas || !svg) continue

    const toolbar = createToolbar('适应宽度')
    const expand = document.createElement('button')
    expand.type = 'button'
    expand.className = 'diagram-expand'
    expand.textContent = '展开大图 ⤢'
    expand.setAttribute('aria-label', '展开大图')
    expand.addEventListener('click', () =>
      openModal(svg, figure.querySelector('figcaption')?.textContent?.trim()),
    )
    toolbar.bar.append(expand)
    figure.insertBefore(toolbar.bar, canvas)

    const zoomer = createZoomer(canvas, svg, toolbar.refresh)
    toolbar.out.addEventListener('click', () => zoomer.by(1 / STEP))
    toolbar.inn.addEventListener('click', () => zoomer.by(STEP))
    toolbar.reset.addEventListener('click', () => zoomer.reset())
    zoomer.apply()

    // 窗口尺寸变化后「适应宽度」的基准会变，重算一次
    let timer
    addEventListener('resize', () => {
      clearTimeout(timer)
      timer = setTimeout(() => zoomer.apply(), 150)
    })
  }
})()
