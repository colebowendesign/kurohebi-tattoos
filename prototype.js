/* ============================================================
   KUROHEBI — Prototype script
   - URL params: ?theme=museum|noir, ?density=editorial|compact
   - postMessage tweak protocol from parent canvas
   - Portfolio data + filter + lightbox
   - Scroll-fade observer
   - Custom cursor
   ============================================================ */
(function () {
  'use strict';

  // ----- Theme / density from URL or parent message -----
  const params = new URLSearchParams(location.search);
  const html = document.documentElement;
  if (params.get('theme'))   html.setAttribute('data-theme', params.get('theme'));
  if (params.get('density')) html.setAttribute('data-density', params.get('density'));
  if (params.get('grain'))   html.style.setProperty('--grain-opacity', params.get('grain'));

  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type !== 'kh:tweak') return;
    if (d.theme)   html.setAttribute('data-theme', d.theme);
    if (d.density) html.setAttribute('data-density', d.density);
    if (typeof d.grain === 'number') html.style.setProperty('--grain-opacity', String(d.grain));
    if (d.typePair) applyTypePair(d.typePair);
  });

  function applyTypePair(p) {
    const r = html.style;
    if (p === 'shippori-noto') {
      r.setProperty('--font-display', '"Shippori Mincho", "Noto Serif JP", serif');
      r.setProperty('--font-body',    '"Noto Serif JP", "Shippori Mincho", serif');
    } else if (p === 'yuji-klee') {
      r.setProperty('--font-display', '"Yuji Mai", "Shippori Mincho", serif');
      r.setProperty('--font-body',    '"Klee One", "Noto Serif JP", serif');
    } else if (p === 'cormorant-grotesk') {
      r.setProperty('--font-display', '"Cormorant Garamond", serif');
      r.setProperty('--font-body',    '"Space Grotesk", sans-serif');
    } else if (p === 'cinzel-inter') {
      r.setProperty('--font-display', '"Cinzel", serif');
      r.setProperty('--font-body',    '"Inter", sans-serif');
    } else if (p === 'ebgaramond-mono') {
      r.setProperty('--font-display', '"EB Garamond", serif');
      r.setProperty('--font-body',    '"JetBrains Mono", monospace');
    }
  }
  // Read typepair from URL on load
  const tp = params.get('typepair');
  if (tp) applyTypePair(tp);

  // ----- Hamburger nav -----
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.navlinks');
  if (navToggle && navMenu) {
    const closeNav = () => {
      navToggle.classList.remove('open');
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('open');
      navMenu.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    document.querySelector('.brand').addEventListener('click', closeNav);
  }

  // ----- Portfolio data -----
  // Each item: id, name (mono), category, hours, kanji label, art (svg fn), redMark, height bias
  const PIECES = [
    { id: 1,  name: 'DRAGON / BACK',     cat: 'dragon', kanji: '龍', hrs: '24', red: 'eye',  bias: 1.6 },
    { id: 2,  name: 'KOI / SLEEVE',      cat: 'koi',    kanji: '鯉', hrs: '14', red: null,    bias: 1.4 },
    { id: 3,  name: 'WAVE / RIBS',       cat: 'wave',   kanji: '波', hrs: '06', red: null,    bias: 1.0 },
    { id: 4,  name: 'PEONY / THIGH',     cat: 'floral', kanji: '牡丹', hrs: '08', red: 'dot',  bias: 1.2 },
    { id: 5,  name: 'ONI / CHEST',       cat: 'yokai',  kanji: '鬼', hrs: '18', red: 'eye',   bias: 1.5 },
    { id: 6,  name: 'SERPENT / FOREARM', cat: 'dragon', kanji: '蛇', hrs: '07', red: 'tongue', bias: 1.3 },
    { id: 7,  name: 'KOI BLACKWORK',     cat: 'koi',    kanji: '黒鯉', hrs: '11', red: null,    bias: 1.5 },
    { id: 8,  name: 'CLOUD / SHOULDER',  cat: 'wave',   kanji: '雲', hrs: '05', red: null,    bias: 1.1 },
    { id: 9,  name: 'CHERRY BRANCH',     cat: 'floral', kanji: '桜', hrs: '04', red: 'dot',    bias: 0.9 },
    { id: 10, name: 'KITSUNE MASK',      cat: 'yokai',  kanji: '狐', hrs: '09', red: null,    bias: 1.3 },
    { id: 11, name: 'GREAT WAVE STUDY',  cat: 'wave',   kanji: '大波', hrs: '12', red: null,    bias: 1.6 },
    { id: 12, name: 'DRAGON / FULL BACK',cat: 'dragon', kanji: '龍王', hrs: '46', red: 'eye',   bias: 1.7 },
  ];

  // ----- SVG art generator -----
  // Five abstract "tattoo placeholder" compositions, by category.
  // Pure ink-on-paper feel: brushstroke arcs, swirls, dot patterns, hairline borders.
  // Reproducibly varied via seed.
  function rng(seed) {
    let s = seed * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function makeArt(piece, opts) {
    const W = 600;
    const H = Math.round(600 * piece.bias);
    const r = rng(piece.id * 17);
    const ink = 'var(--card-fg)';
    const accent = 'var(--accent)';
    const paper = 'var(--card-bg)';

    // Backdrop wash
    let bg = `<rect width="${W}" height="${H}" fill="${paper}"/>`;
    // Subtle paper texture: random dots
    let dots = '';
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = r() * H, sz = r() * 1.2 + 0.2;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${sz.toFixed(2)}" fill="${ink}" opacity="${(r()*0.08).toFixed(2)}"/>`;
    }

    // Composition by category
    let comp = '';
    if (piece.cat === 'dragon') {
      // Coiled S-curve serpentine ink wash
      const cy1 = H * 0.25, cy2 = H * 0.7, cx = W / 2;
      comp += `
        <path d="M ${cx*0.2} ${cy1} C ${cx*0.4} ${cy1*0.4}, ${cx*1.4} ${cy1*1.5}, ${cx*1.7} ${cy2*0.6}
                 S ${cx*0.4} ${cy2*1.2}, ${cx*0.7} ${H*0.95}"
              fill="none" stroke="${ink}" stroke-width="${2 + r()*1.5}" stroke-linecap="round" opacity="0.85"/>
        <path d="M ${cx*0.3} ${cy1*1.05} C ${cx*0.5} ${cy1*0.55}, ${cx*1.35} ${cy1*1.55}, ${cx*1.6} ${cy2*0.65}
                 S ${cx*0.45} ${cy2*1.1}, ${cx*0.78} ${H*0.92}"
              fill="none" stroke="${ink}" stroke-width="0.8" opacity="0.5"/>`;
      // scales — diagonal hash field
      for (let i = 0; i < 18; i++) {
        const x = W*0.25 + r()*W*0.5;
        const y = H*0.3 + r()*H*0.4;
        comp += `<path d="M ${x} ${y} q 6 -3 12 0" fill="none" stroke="${ink}" stroke-width="0.6" opacity="0.55"/>`;
      }
      if (piece.red === 'eye') {
        comp += `<circle cx="${cx*1.45}" cy="${cy1*0.95}" r="6" fill="${accent}"/>
                 <circle cx="${cx*1.45}" cy="${cy1*0.95}" r="14" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.5"/>`;
      }
      if (piece.red === 'tongue') {
        comp += `<path d="M ${cx*0.74} ${H*0.93} l 4 -10 l -2 8 l 4 -6" stroke="${accent}" stroke-width="2" fill="none"/>`;
      }
    }
    else if (piece.cat === 'koi') {
      // Koi body — almond shape with concentric tail strokes
      const cx = W/2, cy = H/2;
      comp += `
        <ellipse cx="${cx}" cy="${cy}" rx="${W*0.32}" ry="${W*0.13}" fill="none" stroke="${ink}" stroke-width="2" opacity="0.85" transform="rotate(-18 ${cx} ${cy})"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${W*0.22}" ry="${W*0.08}" fill="none" stroke="${ink}" stroke-width="0.8" opacity="0.5" transform="rotate(-18 ${cx} ${cy})"/>`;
      for (let i = 0; i < 8; i++) {
        const ang = -18 * Math.PI/180;
        const x0 = cx - W*0.32 * Math.cos(ang), y0 = cy - W*0.32 * Math.sin(ang);
        comp += `<path d="M ${x0} ${y0} q ${-30 - i*4} ${-10 + i*3} ${-60 - i*8} ${-2 + i*5}" fill="none" stroke="${ink}" stroke-width="${0.6 + i*0.1}" opacity="${0.7 - i*0.06}"/>`;
      }
      // ripple arcs
      for (let i = 0; i < 6; i++) {
        const y = H*0.15 + i*H*0.13;
        comp += `<path d="M 30 ${y} q ${W*0.45} -10 ${W-60} 0" fill="none" stroke="${ink}" stroke-width="0.6" opacity="${0.18 + r()*0.18}"/>`;
      }
    }
    else if (piece.cat === 'wave') {
      // Stacked Hokusai-ish curls — abstract
      const baseY = H * 0.55;
      for (let i = 0; i < 7; i++) {
        const y = baseY - i * H * 0.06;
        const amp = 22 + i * 4;
        const op = 0.2 + i * 0.08;
        let d = `M 0 ${y}`;
        for (let x = 0; x <= W; x += 30) {
          d += ` q 15 ${-amp} 30 0`;
        }
        comp += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${1 + i*0.18}" opacity="${op}"/>`;
      }
      // foam dots
      for (let i = 0; i < 24; i++) {
        comp += `<circle cx="${(r()*W).toFixed(1)}" cy="${(r()*H*0.3 + H*0.1).toFixed(1)}" r="${(r()*1.5+0.3).toFixed(2)}" fill="${ink}" opacity="${(r()*0.5).toFixed(2)}"/>`;
      }
      // single curl swirl
      const sx = W*0.7, sy = H*0.35;
      comp += `<path d="M ${sx} ${sy} q -40 -30 -80 -10 q -50 30 0 60 q 50 20 70 -20 q 14 -28 -8 -36" fill="none" stroke="${ink}" stroke-width="1.6" opacity="0.85"/>`;
    }
    else if (piece.cat === 'floral') {
      // Concentric petals + branch
      const cx = W*0.55, cy = H*0.55;
      for (let i = 0; i < 5; i++) {
        const rR = 28 + i*16;
        comp += `<circle cx="${cx}" cy="${cy}" r="${rR}" fill="none" stroke="${ink}" stroke-width="${1.4 - i*0.18}" opacity="${0.85 - i*0.13}"/>`;
      }
      // Petal sweeps
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const x1 = cx + Math.cos(a)*30, y1 = cy + Math.sin(a)*30;
        const x2 = cx + Math.cos(a)*86, y2 = cy + Math.sin(a)*86;
        comp += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} q ${(Math.cos(a+0.6)*12).toFixed(1)} ${(Math.sin(a+0.6)*12).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="0.8" opacity="0.6"/>`;
      }
      // branch
      comp += `<path d="M ${W*0.05} ${H*0.85} q ${W*0.2} -${H*0.1} ${W*0.45} -${H*0.25}" fill="none" stroke="${ink}" stroke-width="2.4" opacity="0.85"/>`;
      if (piece.red === 'dot') {
        comp += `<circle cx="${cx}" cy="${cy}" r="6" fill="${accent}"/>`;
      }
    }
    else if (piece.cat === 'yokai') {
      // Mask: triangular geometric shapes + crescent
      const cx = W/2, cy = H*0.5;
      comp += `
        <path d="M ${cx-W*0.28} ${cy-H*0.15} L ${cx} ${cy-H*0.32} L ${cx+W*0.28} ${cy-H*0.15} L ${cx+W*0.22} ${cy+H*0.22} L ${cx} ${cy+H*0.3} L ${cx-W*0.22} ${cy+H*0.22} Z"
              fill="none" stroke="${ink}" stroke-width="2.4" opacity="0.9"/>`;
      // Eyes (almonds)
      comp += `
        <path d="M ${cx-50} ${cy-20} q 22 -14 44 0 q -22 12 -44 0 Z" fill="${ink}" opacity="0.9"/>
        <path d="M ${cx+6}  ${cy-20} q 22 -14 44 0 q -22 12 -44 0 Z" fill="${ink}" opacity="0.9"/>`;
      // Brow lines
      comp += `<path d="M ${cx-60} ${cy-50} l 50 -10" stroke="${ink}" stroke-width="2" fill="none" opacity="0.85"/>
               <path d="M ${cx+10} ${cy-60} l 50 10"  stroke="${ink}" stroke-width="2" fill="none" opacity="0.85"/>`;
      // Mouth scribble
      comp += `<path d="M ${cx-26} ${cy+30} q 26 14 52 0" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.85"/>`;
      if (piece.red === 'eye') {
        comp += `<rect x="${cx-12}" y="${cy-22}" width="6" height="4" fill="${accent}"/>`;
      }
    }

    // Hairline frame inset
    const frame = `<rect x="14" y="14" width="${W-28}" height="${H-28}" fill="none" stroke="${ink}" stroke-width="0.5" opacity="0.25"/>`;

    // Big kanji watermark, bottom-right corner
    const stamp = `<text x="${W-30}" y="${H-26}" text-anchor="end" font-family="Shippori Mincho, Noto Serif JP, serif" font-weight="600" font-size="44" fill="${ink}" opacity="0.16">${piece.kanji}</text>`;

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${piece.name}">${bg}${dots}${comp}${frame}${stamp}</svg>`;
  }

  // ----- Render masonry -----
  const masonry = document.getElementById('masonry');
  PIECES.forEach((p, idx) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.cat = p.cat;
    card.dataset.idx = idx;
    card.innerHTML = `
      <div class="card-art">
        ${makeArt(p)}
        ${p.red ? `<span class="card-redmark${p.red === 'dot' ? ' dot' : ''}"></span>` : ''}
        <span class="card-tag">${String(idx+1).padStart(2,'0')} · ${p.cat.toUpperCase()}</span>
      </div>
      <div class="card-meta">
        <span class="cm-name">${p.name}</span>
        <span class="cm-num">${p.hrs} HRS</span>
      </div>
    `;
    card.setAttribute('data-fade', '');
    card.setAttribute('data-delay', String((idx % 4) * 120));
    card.addEventListener('click', () => openLightbox(idx));
    masonry.appendChild(card);
  });

  // ----- Filter -----
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      document.querySelectorAll('.masonry .card').forEach(card => {
        const show = (f === 'all') || card.dataset.cat === f;
        card.classList.toggle('hidden', !show);
      });
    });
  });

  // ----- Lightbox -----
  let visiblePieces = () => PIECES.map((_, i) => i);
  let lbIdx = 0;
  const lb = document.getElementById('lightbox');
  const lbContent = document.getElementById('lbContent');
  const lbMeta = document.getElementById('lbMeta');

  function openLightbox(i) {
    lbIdx = i;
    renderLb();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function renderLb() {
    const p = PIECES[lbIdx];
    lbContent.innerHTML = makeArt(p);
    lbMeta.innerHTML = `
      <span>${String(lbIdx+1).padStart(2,'0')} / ${PIECES.length}</span>
      <span>${p.name}</span>
      <span>${p.hrs} HRS</span>
      <span class="lb-redmark">${p.kanji}</span>
    `;
  }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => { lbIdx = (lbIdx - 1 + PIECES.length) % PIECES.length; renderLb(); });
  document.getElementById('lbNext').addEventListener('click', () => { lbIdx = (lbIdx + 1) % PIECES.length; renderLb(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lbPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lbNext').click();
  });
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  // Touch swipe to navigate lightbox on mobile
  let lbTouchX = null;
  lb.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (lbTouchX === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchX;
    lbTouchX = null;
    if (Math.abs(dx) < 40) return;
    lbIdx = dx < 0
      ? (lbIdx + 1) % PIECES.length
      : (lbIdx - 1 + PIECES.length) % PIECES.length;
    renderLb();
  }, { passive: true });

  // ----- Scroll fade — add variants to elements before observing -----
  document.querySelectorAll('.section-marker').forEach(el => {
    el.setAttribute('data-fade', 'left');
  });
  document.querySelectorAll('.phi-kanji').forEach(el => {
    el.setAttribute('data-fade', 'scale');
  });
  ['.phi-h', '.port-h', '.proc-h', '.book-h'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.setAttribute('data-fade', 'heading');
    });
  });
  document.querySelectorAll('.phi-cols').forEach(el => {
    el.setAttribute('data-fade', '');
    el.setAttribute('data-delay', '240');
  });
  document.querySelectorAll('.phi-meta').forEach(el => {
    el.setAttribute('data-fade', '');
    el.setAttribute('data-delay', '360');
  });
  document.querySelectorAll('.port-sub').forEach(el => {
    el.setAttribute('data-fade', '');
    el.setAttribute('data-delay', '200');
  });
  document.querySelectorAll('.book-sub').forEach(el => {
    el.setAttribute('data-fade', '');
    el.setAttribute('data-delay', '200');
  });
  document.querySelectorAll('.book-cta').forEach(el => {
    el.setAttribute('data-fade', '');
    el.setAttribute('data-delay', '320');
  });
  document.querySelectorAll('.contact > div').forEach((el, i) => {
    el.setAttribute('data-fade', '');
    el.setAttribute('data-delay', String(i * 110));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-fade]').forEach(el => io.observe(el));

  // ----- Page loader dismiss -----
  const loader = document.getElementById('site-loader');
  if (loader) {
    const dismiss = () => {
      loader.classList.add('sl-out');
      setTimeout(() => { loader.style.display = 'none'; }, 1100);
    };
    const minMs = 2700;
    const t0 = performance.now();
    const maybeGo = () => {
      const wait = Math.max(0, minMs - (performance.now() - t0));
      setTimeout(dismiss, wait);
    };
    if (document.readyState === 'complete') { maybeGo(); }
    else { window.addEventListener('load', maybeGo); }
  }

  // ----- Custom cursor -----
  const cursor = document.querySelector('.cursor-dot');
  if (cursor && matchMedia('(pointer: fine)').matches) {
    let cx = window.innerWidth/2, cy = window.innerHeight/2;
    let tx = cx, ty = cy;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    function loop() {
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('a, button, .card, .chip').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }
})();
