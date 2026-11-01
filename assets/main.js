/* AEM3R — maquette immersive (GSAP + ScrollTrigger + Lenis) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasG = typeof gsap !== 'undefined';

  /* menu mobile */
  const burger = $('.burger');
  burger?.addEventListener('click', () => {
    const o = document.body.classList.toggle('mopen');
    burger.setAttribute('aria-expanded', o);
    window.__lenis && (o ? window.__lenis.stop() : window.__lenis.start());
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('mopen'); window.__lenis && window.__lenis.start(); }));

  /* découpe : mots (titres) et lettres (mot géant) */
  const splitWords = (el, cls) => {
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
  };
  $$('.sp').forEach(el => splitWords(el));
  const word = $('.word');
  if (word) {
    word.setAttribute('aria-label', word.textContent);
    const t = word.textContent; word.textContent = '';
    [...t].forEach((ch, i) => {
      const m = document.createElement('span'); m.className = 'm'; m.setAttribute('aria-hidden', 'true');
      const c = document.createElement('span'); c.className = 'c' + (i === 0 ? ' b' : ''); c.textContent = ch === ' ' ? ' ' : ch;
      m.append(c); word.append(m);
    });
    // ajuste la taille du mot pour qu'il remplisse la largeur
    const fit = () => {
      word.style.setProperty('--ws', '20vw');
      const w = [...word.children].reduce((a, e) => a + e.getBoundingClientRect().width, 0);
      const k = (innerWidth * .96) / w;
      word.style.setProperty('--ws', (20 * k).toFixed(2) + 'vw');
      const hero = $('.hero');
      if (hero) hero.style.setProperty('--wh', (20 * k).toFixed(2) + 'vw');
    };
    document.fonts.ready.then(fit); addEventListener('resize', fit); fit();
  }

  /* apparition simple (pages sans GSAP ou éléments secondaires) */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv,.sp').forEach(el => io.observe(el));
  setTimeout(() => $$('.ph .sp,.ph .rv').forEach(el => el.classList.add('in')), 150);

  /* barre de progression */
  const bar = $('#bar');
  const prog = () => { const h = document.documentElement.scrollHeight - innerHeight; if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  addEventListener('scroll', prog, { passive: true });

  if (hasG && !calm) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({ lerp: .09 });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); }
      }));
    }

    /* ---- hero : entrée ---- */
    const hero = $('.hero');
    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.word .c', { yPercent: 115, duration: 1.5, stagger: .07 }, .1)
        .from(innerWidth > 900 ? '.top > *' : '.top > *:not(.nav)', { y: -30, opacity: 0, duration: 1, stagger: .1, clearProps: 'all' }, .2)
        .from('.hero .cap,.hero .go,.hero .para,.hero .chips .tag', { y: 24, opacity: 0, duration: 1.1, stagger: .06 }, .7)
        .from('.hero .tile', { scale: 0, rotation: () => gsap.utils.random(-22, 22), opacity: 0, duration: 1.3, stagger: .1, ease: 'back.out(1.5)' }, .5);
      $$('.hero .tile').forEach((t, i) => {
        gsap.to($('.fl', t), { y: gsap.utils.random(8, 18) * (i % 2 ? 1 : -1), duration: gsap.utils.random(3, 5), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      });
      if (matchMedia('(hover:hover)').matches) {
        const qs = $$('.hero .tile').map((t, i) => {
          const el = $('.in', t), d = (i % 3 + 1) * 10;
          return { x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }), d };
        });
        addEventListener('pointermove', e => {
          const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
          qs.forEach(q => { q.x(nx * q.d * 2); q.y(ny * q.d * 2); });
        });
      }
      gsap.to('.hero .word', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero .tile', { yPercent: (i) => -30 - i * 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* ---- révélation de lettres/mots génériques ---- */
    gsap.utils.toArray('.sec h2.sp').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 85%', onEnter: () => el.classList.add('in') }));

    const mm = gsap.matchMedia();

    mm.add('(min-width: 801px)', () => {
      /* ---- histoire : texte net/flou + cascade de photos ---- */
      const st = $('.story');
      if (st) {
        const words = $$('.story h2 .w');
        const tiles = $$('.stack .tile');
        const tl = gsap.timeline({ scrollTrigger: { trigger: st, start: 'top top', end: '+=260%', pin: true, scrub: .8 } });
        tl.to(words, { opacity: 1, filter: 'blur(0px)', stagger: .35, duration: .6, ease: 'none' }, 0);
        tiles.forEach((t, i) => {
          tl.fromTo(t, { x: '55vw', y: '70vh', rotationZ: 30, rotationY: -35, rotationX: 20, scale: .7, opacity: 0 },
            { x: () => -i * innerWidth * .052, y: () => -i * innerHeight * .012, rotationZ: -12 + i * 2.6, rotationY: -8, rotationX: 4, scale: 1, opacity: 1, duration: 1.4, ease: 'power3.out' }, .6 + i * .32);
        });
        tl.to({}, { duration: .6 });
      }
      /* ---- mur 3D ---- */
      const wl = $('.wall');
      if (wl) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: wl, start: 'top top', end: '+=180%', pin: true, scrub: .8 } });
        tl.fromTo('.wall .grid', { scale: 2.6, rotationX: 58, rotationZ: -26, yPercent: 14 }, { scale: 1.05, rotationX: 28, rotationZ: -12, yPercent: -4, ease: 'none', duration: 1 }, 0)
          .fromTo('.wall .mid > *', { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: .15, duration: .4 }, .45);
      }
      /* ---- piste : défilement horizontal ---- */
      const hz = $('.hz');
      if (hz) {
        const tr = $('.track', hz);
        gsap.to(tr, { x: () => -(tr.scrollWidth - innerWidth + 60), ease: 'none', scrollTrigger: { trigger: hz, start: 'top top', end: () => '+=' + (tr.scrollWidth - innerWidth), pin: true, scrub: .8, invalidateOnRefresh: true } });
      }
    });

    mm.add('(max-width: 800px)', () => {
      $$('.story h2 .w').forEach(w => gsap.to(w, { opacity: 1, filter: 'blur(0px)', scrollTrigger: { trigger: w, start: 'top 90%', end: 'top 60%', scrub: true } }));
      gsap.fromTo('.wall .grid', { scale: 1.6, rotationZ: -14 }, { scale: 1, rotationZ: -6, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---- parallaxe d'images ---- */
    $$('[data-par]').forEach(el => gsap.fromTo(el, { yPercent: -+el.dataset.par }, { yPercent: +el.dataset.par, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

    /* ---- parcours ---- */
    gsap.from('.stp', { y: 60, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 80%' } });

    /* ---- liste des permis : aperçu photo qui suit la souris ---- */
    const pl = $('.plist'), pv = $('.prev');
    if (pl && pv && matchMedia('(hover:hover) and (min-width:801px)').matches) {
      const xs = gsap.quickTo(pv, 'x', { duration: .7, ease: 'power3' }), ys = gsap.quickTo(pv, 'y', { duration: .7, ease: 'power3' });
      const rot = gsap.quickTo(pv, 'rotation', { duration: .6, ease: 'power3' });
      let lx = 0;
      addEventListener('pointermove', e => {
        xs(e.clientX + 30); ys(e.clientY - pv.offsetHeight / 2);
        rot(gsap.utils.clamp(-10, 10, (e.clientX - lx) * .25)); lx = e.clientX;
      });
      const tiles = $$('.tile', pv);
      $$('a', pl).forEach((a, i) => {
        a.addEventListener('pointerenter', () => {
          pl.classList.add('hv'); tiles.forEach((t, j) => t.classList.toggle('on', i === j));
          gsap.to(pv, { opacity: 1, scale: 1, duration: .6, ease: 'expo.out' });
        });
      });
      pl.addEventListener('pointerleave', () => { pl.classList.remove('hv'); gsap.to(pv, { opacity: 0, scale: .7, duration: .5, ease: 'power3.in' }); });
    }

    /* ---- pied de page : mot géant qui monte ---- */
    gsap.from('.fw', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top 85%', end: 'bottom bottom', scrub: true } });
  } else {
    $$('.story h2 .w').forEach(w => { w.style.opacity = 1; w.style.filter = 'none'; });
  }

  /* compteurs */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    co.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = calm ? 1 : 1800;
    const tick = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-to]').forEach(el => co.observe(el));

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
    el.addEventListener('click', () => el.classList.toggle('act'));
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
      $$('.seg button', sim).forEach(x => x.setAttribute('aria-pressed', x === b)); kind = b.dataset.k; upd();
    }));
    rg.addEventListener('input', upd); upd();
  }

  /* filtres (avis, actualités) */
  $$('.flt').forEach(f => {
    const items = $$(f.dataset.t);
    $$('button', f).forEach(b => b.addEventListener('click', () => {
      $$('button', f).forEach(x => x.classList.toggle('on', x === b));
      items.forEach(i => i.classList.toggle('hide', b.dataset.f !== '*' && i.dataset.c !== b.dataset.f));
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }));
  });

  /* paiement : montant libre (maquette, aucun paiement réel) */
  const pay = $('#pay');
  if (pay) {
    const inp = $('#amt'), out = $('#payOut'), qs = $$('.quick button', pay);
    const get = () => Math.max(0, parseFloat(String(inp.value).replace(',', '.')) || 0);
    const upd = () => { out.textContent = get().toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €'; qs.forEach(b => b.classList.toggle('on', +b.dataset.v === get())); };
    $$('.amt [data-s]', pay).forEach(b => b.addEventListener('click', () => { inp.value = Math.max(0, get() + +b.dataset.s); upd(); }));
    qs.forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.v; upd(); }));
    inp.addEventListener('input', upd);
    $('#payGo', pay).addEventListener('click', e => { e.preventDefault(); $('.ok', pay).style.display = 'block'; });
    upd();
  }

  /* formulaire (maquette : aucun envoi) */
  $$('form.f').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault(); const ok = $('.ok', f); if (ok) ok.style.display = 'block'; f.reset();
  }));
})();

/* curseur : petit véhicule qui suit la souris (voiture, moto, remorque, bateau selon la page) */
(() => {
  const v = document.body.dataset.v || 'voiture';
  const W = '#fff', B = '#008cf7', D = '#050d17';
  const wheel = (x, r = 2.7) => `<circle cx="${x}" cy="14.8" r="${r}" fill="${D}" stroke="${W}" stroke-width="1.5"/>`;
  const art = {
    voiture: `<path d="M2.5 14.4v-3.3c0-1 .6-1.8 1.6-2.1l4.6-1.6 2.7-3.2C12 3.5 12.8 3 13.8 3h6.4c.9 0 1.7.4 2.3 1.1l2.6 3.4 3.2.8c1.1.3 1.9 1.3 1.9 2.4v3.7z" fill="${W}"/><path d="M12.4 5.4h3.5v2.4h-5.4zM17.3 5.4h3.2l1.8 2.4h-5z" fill="${B}"/>${wheel(8.8)}${wheel(23.2)}`,
    moto: `<path d="M6 14.8l5-5.3h6.4l2.4-3.4h3.4M17.4 9.5l3.6 5.3M11 9.5L9.6 7H7.2" fill="none" stroke="${W}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6 9.3l1.4-2.7h5l1 2.7z" fill="${B}"/>${wheel(5.8, 3)}${wheel(26.2, 3)}`,
    remorque: `<rect x="7" y="3.6" width="22" height="8.6" rx="1.6" fill="${W}"/><rect x="7" y="8.6" width="22" height="2" fill="${B}"/><path d="M7 10.6H2.4" stroke="${W}" stroke-width="1.7" stroke-linecap="round"/><circle cx="2.2" cy="10.6" r="1.4" fill="${B}"/>${wheel(18, 2.8)}`,
    bateau: `<path d="M16 1.6v9.2" stroke="${W}" stroke-width="1.5" stroke-linecap="round"/><path d="M16.8 2.4l8 8h-8z" fill="${B}"/><path d="M15.2 4l-6 6.8h6z" fill="${W}"/><path d="M2.4 11.6h27.2l-3.6 4.6H6z" fill="${W}"/><path d="M1.5 18.6q2-1.6 4 0t4 0 4 0 4 0 4 0 4 0 4 0" fill="none" stroke="${B}" stroke-width="1.4" stroke-linecap="round"/>`
  };
  const start = () => {
  const el = document.createElement('div');
  el.className = 'veh ' + v;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg viewBox="0 0 32 20">${art[v] || art.voiture}</svg>`;
  document.body.append(el);
  document.documentElement.classList.add('vc');
  let tx = -99, ty = -99, x = tx, y = ty, dir = 1, tilt = 0, shown = false;
  addEventListener('pointermove', e => {
    const dx = e.clientX - tx;
    if (Math.abs(dx) > 1.5) dir = dx > 0 ? 1 : -1;
    tilt = Math.max(-14, Math.min(14, (e.clientY - ty) * .6 * dir));
    tx = e.clientX; ty = e.clientY;
    if (!shown) { x = tx; y = ty; shown = true; el.classList.add('on'); }
    el.classList.toggle('hot', !!(e.target.closest && e.target.closest('a,button,summary,input,select,textarea,label')));
  }, { passive: true });
  document.addEventListener('pointerleave', () => { el.classList.remove('on'); shown = false; });
  const loop = () => {
    x += (tx - x) * .3; y += (ty - y) * .3;
    tilt *= .92;
    el.style.transform = `translate(${(x - 13).toFixed(1)}px,${(y - 8).toFixed(1)}px) scaleX(${dir}) rotate(${tilt.toFixed(1)}deg)`;
    requestAnimationFrame(loop);
  };
  loop();
  };
  addEventListener('pointermove', function f(e) {
    if (e.pointerType !== 'mouse') return;
    removeEventListener('pointermove', f);
    start();
    dispatchEvent(new PointerEvent('pointermove', { clientX: e.clientX, clientY: e.clientY, pointerType: 'mouse' }));
  }, { passive: true });
})();

/* feu tricolore du bouton menu : vert → orange → rouge, durées aléatoires */
(() => {
  const tl = document.querySelector('.burger .tl');
  if (!tl) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { tl.dataset.s = 'r'; return; }
  const seq = ['g', 'o', 'r'], dur = { g: [1800, 4200], o: [800, 1300], r: [1800, 4200] };
  let i = Math.floor(Math.random() * 3);
  const step = () => {
    const k = seq[i], [a, b] = dur[k];
    tl.dataset.s = k;
    setTimeout(() => { i = (i + 1) % 3; step(); }, a + Math.random() * (b - a));
  };
  step();
  document.querySelector('.stop')?.addEventListener('click', () => document.querySelector('.burger').click());
})();
