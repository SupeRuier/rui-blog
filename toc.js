(() => {
  const article = document.querySelector('.article-body');
  if (!article) return;

  // 窄屏阈值：必须与 styles.css 里 .article-toc 的 @media (max-width: 1299px) 保持一致。
  // 低于此宽度时目录是右上角浮层，需要「点外部/点链接自动收起」。
  const OVERLAY_MAX = 1300;
  const isOverlay = () => window.innerWidth < OVERLAY_MAX;

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
})();
