(() => {
  const article = document.querySelector('.article-body');
  if (!article) return;

  // 窄屏阈值：必须与 styles.css 里 .article-toc 的 @media (max-width: 1299px) 保持一致。
  // 低于此宽度时目录是左上角浮层，需要「点外部/点链接自动收起」。
  const OVERLAY_MAX = 1300;
  const isOverlay = () => window.innerWidth < OVERLAY_MAX;

  setupMarginReferences(article);

  const headings = [...article.querySelectorAll('h2, h3')];
  if (!headings.length) return;

  const aside = document.createElement('aside');
  aside.className = 'article-toc';
  aside.setAttribute('aria-label', '文章目录');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toc-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'article-toc-panel');
  button.innerHTML = '<span>目录</span><span class="toc-chevron" aria-hidden="true">⌄</span>';

  const panel = document.createElement('nav');
  panel.id = 'article-toc-panel';
  panel.className = 'toc-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', '文章章节');

  const list = document.createElement('ol');
  headings.forEach((heading, index) => {
    const anchor = heading.id || heading.closest('.rsi-axis')?.id || `section-${index + 1}`;
    if (!heading.id && !heading.closest('.rsi-axis')?.id) heading.id = anchor;
    const item = document.createElement('li');
    if (heading.tagName === 'H3') item.className = 'toc-subsection';
    const link = document.createElement('a');
    link.href = `#${anchor}`;
    link.textContent = heading.textContent.trim();
    item.append(link);
    list.append(item);
  });
  panel.append(list);
  aside.append(button, panel);
  article.before(aside);

  // 目录默认展开：所有文章一进入就显示完整章节列表；窄屏下仍是浮层，
  // 点外部、点链接或按 Esc 可收起。
  setOpen(true);

  function setOpen(open) {
    panel.hidden = !open;
    aside.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  }

  button.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a') && isOverlay()) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!panel.hidden && isOverlay() && !aside.contains(event.target)) setOpen(false);
  });

  /**
   * 把文末参考文献复制到每一次正文引用旁边：宽屏排在正文右侧，窄屏紧跟
   * 引用显示。原始 reference-list 完整保留，仍是引用链接的跳转目标。
   */
  function setupMarginReferences(root) {
    const references = new Map(
      [...root.querySelectorAll('.reference-list > li[id^="ref-"]')]
        .map((item) => [item.id, item.innerHTML]),
    );
    if (!references.size) return;

    const citations = [...root.querySelectorAll('.citation[href^="#ref-"]')]
      .filter((citation) => !citation.closest('.reference-list'));

    const pairs = [];
    citations.forEach((citation, index) => {
      const refId = citation.getAttribute('href').slice(1);
      const reference = references.get(refId);
      if (!reference) return;

      const note = document.createElement('span');
      note.className = 'citation-sidenote';
      note.id = `sidenote-${index + 1}`;
      note.setAttribute('role', 'note');
      note.innerHTML = `<span class="sidenote-number">${citation.textContent}</span><span class="sidenote-text">${reference}</span>`;
      citation.setAttribute('aria-describedby', note.id);
      citation.after(note);
      pairs.push({ citation, note });
    });

    const media = window.matchMedia(`(min-width: ${OVERLAY_MAX}px)`);
    let frame;

    function layout() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.removeProperty('--sidenote-overflow');
        pairs.forEach(({ citation, note }) => {
          note.style.removeProperty('--sidenote-top');
          if (media.matches) root.append(note);
          else citation.after(note);
        });
        if (!media.matches) return;

        const articleTop = root.getBoundingClientRect().top;
        let nextTop = 0;
        pairs.forEach(({ citation, note }) => {
          const citedTop = citation.getBoundingClientRect().top - articleTop;
          const top = Math.max(citedTop, nextTop);
          note.style.setProperty('--sidenote-top', `${top}px`);
          nextTop = top + note.offsetHeight + 14;
        });
        root.style.setProperty('--sidenote-overflow', `${Math.max(0, nextTop - root.scrollHeight)}px`);
      });
    }

    layout();
    window.addEventListener('resize', layout, { passive: true });
    media.addEventListener('change', layout);
    document.fonts?.ready.then(layout);
  }
})();
