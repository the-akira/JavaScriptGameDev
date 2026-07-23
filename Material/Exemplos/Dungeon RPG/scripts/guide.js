(function(){
  const chapterEls = Array.from(document.querySelectorAll('.chapter[id]'));
  const navScroll  = document.getElementById('nav-scroll');
  const tocInline  = document.getElementById('toc-inline');
  const searchInput = document.getElementById('search-input');
  const searchCount = document.getElementById('search-count');

  // Build an index: id -> {section, title, text, num}
  const index = chapterEls.map((el, i) => ({
    id: el.id,
    section: el.dataset.section || 'Guia',
    title: el.dataset.title || el.id,
    text: (el.textContent || '').toLowerCase(),
    num: i,
  }));

  // ---- Build sidebar nav grouped by section ----
  let currentSection = null;
  let groupEl = null;
  index.forEach(entry => {
    if (entry.section !== currentSection) {
      currentSection = entry.section;
      const h = document.createElement('div');
      h.className = 'nav-group-title';
      h.textContent = currentSection;
      navScroll.appendChild(h);
    }
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.href = '#' + entry.id;
    a.dataset.id = entry.id;
    const numLabel = entry.id === 'cover' ? '·' : String(entry.num).padStart(2,'0');
    a.innerHTML = '<span class="n">' + numLabel + '</span><span>' + entry.title + '</span>';
    navScroll.appendChild(a);
  });

  // ---- Build inline TOC on cover ----
  index.filter(e => e.id !== 'cover').forEach(entry => {
    const a = document.createElement('a');
    a.href = '#' + entry.id;
    a.innerHTML = '<span class="n">' + String(entry.num).padStart(2,'0') + '</span><span>' + entry.title + '</span>';
    tocInline.appendChild(a);
  });

  const navItems = Array.from(document.querySelectorAll('.nav-item'));

  // ---- Active chapter highlight on scroll ----
  const setActive = (id) => {
    navItems.forEach(a => a.classList.toggle('active', a.dataset.id === id));
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
  chapterEls.forEach(el => observer.observe(el));

  // ---- Search: filters sidebar nav items by title+content match ----
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      navItems.forEach(a => a.classList.remove('hidden'));
      document.querySelectorAll('.nav-group-title').forEach(g => g.style.display = '');
      searchCount.style.display = 'none';
      return;
    }
    let matches = 0;
    navItems.forEach(a => {
      const entry = index.find(e => e.id === a.dataset.id);
      const hit = entry && (entry.title.toLowerCase().includes(q) || entry.text.includes(q));
      a.classList.toggle('hidden', !hit);
      if (hit) matches++;
    });
    // Hide empty group headers
    document.querySelectorAll('.nav-group-title').forEach(g => {
      let sib = g.nextElementSibling;
      let anyVisible = false;
      while (sib && !sib.classList.contains('nav-group-title')) {
        if (!sib.classList.contains('hidden')) anyVisible = true;
        sib = sib.nextElementSibling;
      }
      g.style.display = anyVisible ? '' : 'none';
    });
    searchCount.style.display = 'block';
    searchCount.textContent = matches + ' resultado' + (matches === 1 ? '' : 's');
  });

  // Enter on search jumps to first visible match
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = navItems.find(a => !a.classList.contains('hidden'));
      if (first) { window.location.hash = first.getAttribute('href'); closeSidebar(); }
    }
  });

  // ---- Mobile sidebar toggle ----
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebar-toggle');
  const scrim   = document.getElementById('scrim');
  function openSidebar(){ sidebar.classList.add('open'); scrim.classList.add('open'); }
  function closeSidebar(){ sidebar.classList.remove('open'); scrim.classList.remove('open'); }
  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  scrim.addEventListener('click', closeSidebar);
  navScroll.addEventListener('click', (e) => { if (e.target.closest('.nav-item')) closeSidebar(); });

  // ---- Syntax highlighting ----
  if (window.hljs) {
    document.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  }
})();