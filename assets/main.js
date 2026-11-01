/* AEM3R — maquette immersive (GSAP + ScrollTrigger + Lenis) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasG = typeof gsap !== 'undefined';

  /* menu mobile */
  const burger = $('.burger');
  burger?.addEventListener('click', () => burger.setAttribute('aria-expanded', document.body.classList.toggle('open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('open')));

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
        .from('.top > *', { y: -30, opacity: 0, duration: 1, stagger: .1 }, .2)
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

  /* formulaire (maquette : aucun envoi) */
  $$('form.f').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault(); const ok = $('.ok', f); if (ok) ok.style.display = 'block'; f.reset();
  }));
})();
