/* AEM3R — maquette : effets au scroll et au survol */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* menu mobile */
  const burger = $('.burger');
  burger?.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', document.body.classList.toggle('open'));
  });
  $$('.menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('open')));

  /* titres découpés mot par mot */
  $$('.sp').forEach(el => {
    let i = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++);
          w.append(s); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
    walk(el);
  });

  /* apparition au défilement */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv,.sp,.clip').forEach(el => io.observe(el));
  setTimeout(() => $$('.hero .sp,.hero .rv,.hero .clip,.ph .sp,.ph .rv,.ph .clip').forEach(el => el.classList.add('in')), 120);

  /* compteurs */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    co.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = calm ? 1 : 1800;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-to]').forEach(el => co.observe(el));

  /* scroll : nav, barre, parallaxe, parcours, galerie horizontale */
  const nav = $('.nav'), bar = $('#bar'), tl = $('.tl'), hz = $('.hz');
  const pars = $$('[data-par]');
  let tick = false;
  const frame = () => {
    tick = false;
    const y = scrollY, vh = innerHeight, h = document.documentElement.scrollHeight - vh;
    nav?.classList.toggle('sc', y > 30);
    if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    if (!calm) pars.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const k = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.par);
      el.style.transform = `translate3d(0,${k.toFixed(1)}px,0)`;
    });
    if (tl) {
      const r = tl.getBoundingClientRect();
      tl.style.setProperty('--p', Math.min(1, Math.max(0, (vh * .6 - r.top) / r.height)) * 100 + '%');
      $$('.st', tl).forEach(s => s.classList.toggle('on', s.getBoundingClientRect().top < vh * .62));
    }
    if (hz && innerWidth > 700) {
      const r = hz.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      const t = $('.track', hz), max = t.scrollWidth - innerWidth + 40;
      t.style.transform = `translate3d(${-max * p}px,0,0)`;
      hz.style.setProperty('--hp', p * 100 + '%');
    }
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  /* curseur « Voir » sur les cartes permis + légère parallaxe de la souris */
  if (fine && !calm) {
    const cur = document.createElement('div'); cur.className = 'cur'; cur.textContent = 'Voir';
    document.body.append(cur);
    addEventListener('pointermove', e => { cur.style.setProperty('--x', e.clientX + 'px'); cur.style.setProperty('--y', e.clientY + 'px'); });
    $$('.card').forEach(c => {
      c.addEventListener('pointerenter', () => cur.classList.add('on'));
      c.addEventListener('pointerleave', () => { cur.classList.remove('on'); });
    });
    const col = $('.collage');
    if (col) addEventListener('pointermove', e => {
      const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
      $$('[data-m]', col).forEach(el => el.style.translate = `${x * el.dataset.m}px ${y * el.dataset.m}px`);
    });
  }

  /* onglets de tarifs */
  $$('.tabs').forEach(t => {
    const bs = $$('button', t), ps = $$('.tp', t.parentElement);
    bs.forEach((b, i) => b.addEventListener('click', () => {
      bs.forEach(x => x.setAttribute('aria-selected', x === b));
      ps.forEach((p, j) => p.classList.toggle('on', i === j));
    }));
  });

  /* horaires et « ouvert maintenant » */
  const H = {
    montmerle: { 2: [[13, 19]], 3: [[17, 19]], 5: [[14, 18]] },
    chatillon: { 2: [[14, 18]], 3: [[9, 12]], 4: [[14, 18]], 5: [[14, 18]] },
    jassans: { 2: [[14.5, 19]], 3: [[14.5, 19]], 4: [[14.5, 19]], 5: [[14.5, 19]], 6: [[10, 12]] },
    belleville: { 1: [[9, 12]], 2: [[14, 18.5]], 3: [[14, 19]], 4: [[14, 18.5]], 5: [[14, 18.5]], 6: [[9, 12]] }
  };
  const fmt = n => { const h = Math.floor(n), m = Math.round((n - h) * 60); return h + 'h' + (m ? String(m).padStart(2, '0') : ''); };
  const D = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const now = new Date(), d = now.getDay(), hh = now.getHours() + now.getMinutes() / 60;
  $$('[data-ag]').forEach(el => {
    const sc = H[el.dataset.ag]; if (!sc) return;
    const open = (sc[d] || []).some(([a, b]) => hh >= a && hh < b), o = $('.open', el);
    if (o) { o.classList.toggle('on', open); o.lastChild.textContent = open ? 'Ouvert maintenant' : 'Fermé actuellement'; }
    const ul = $('.hours', el);
    if (ul) ul.innerHTML = [1, 2, 3, 4, 5, 6].map(j => `<li class="${j === d ? 'today' : ''}"><span>${D[j]}</span><span>${(sc[j] || []).map(([a, b]) => fmt(a) + '–' + fmt(b)).join(' · ') || 'Fermé'}</span></li>`).join('');
  });

  /* simulateur de budget */
  const sim = $('#sim');
  if (sim) {
    let kind = 'm';
    const base = { m: 1221, a: 878, c: 1539 }, code = 250;
    const out = $('#simOut'), det = $('#simDet'), rg = $('#simRg'), rl = $('#simRl');
    const upd = () => {
      const aide = +rg.value, reste = Math.max(0, base[kind] + code - aide);
      rl.textContent = aide.toLocaleString('fr-FR') + ' €';
      out.textContent = reste.toLocaleString('fr-FR') + ' €';
      det.textContent = `ou 4 × ${Math.ceil(reste / 4).toLocaleString('fr-FR')} € sans frais`;
    };
    $$('.seg button', sim).forEach(b => b.addEventListener('click', () => {
      $$('.seg button', sim).forEach(x => x.setAttribute('aria-pressed', x === b));
      kind = b.dataset.k; upd();
    }));
    rg.addEventListener('input', upd); upd();
  }

  /* formulaire (maquette : aucun envoi) */
  $$('form.f').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault(); const ok = $('.ok', f); if (ok) ok.style.display = 'block'; f.reset();
  }));
})();
