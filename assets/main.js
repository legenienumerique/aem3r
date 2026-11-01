/* AEM3R — maquette : animations et petites interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobile */
  const burger = $('.burger');
  burger?.addEventListener('click', () => {
    const o = document.body.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });
  $$('.menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('open')));

  /* barre de progression + nav qui se cache + fil du parcours */
  const bar = $('#bar'), nav = $('header.nav');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav?.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('open'));
    lastY = y;
    const tl = $('.tl');
    if (tl) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height));
      tl.style.setProperty('--p', p * 100 + '%');
      $$('.st', tl).forEach(s => s.classList.toggle('on', s.getBoundingClientRect().top < innerHeight * .62));
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* apparition au défilement */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* compteurs */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    co.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = calm ? 1 : 1600;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-to]').forEach(el => co.observe(el));

  if (!calm && matchMedia('(hover:hover)').matches) {
    /* lueur qui suit la souris */
    const g = $('#glow');
    addEventListener('pointermove', e => { if (g) g.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; });
    /* cartes : lumière + inclinaison */
    $$('.card').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
        c.style.transform = `perspective(900px) rotateX(${(.5 - y / r.height) * 7}deg) rotateY(${(x / r.width - .5) * 9}deg) translateY(-6px)`;
      });
      c.addEventListener('pointerleave', () => c.style.transform = '');
    });
    /* boutons magnétiques */
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener('pointerleave', () => b.style.transform = '');
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

  /* horaires : « ouvert maintenant » */
  const H = { // jour 0=dim … 6=sam ; [début, fin] en heures décimales
    montmerle: { 2: [[13, 19]], 3: [[17, 19]], 5: [[14, 18]] },
    chatillon: { 2: [[14, 18]], 3: [[9, 12]], 4: [[14, 18]], 5: [[14, 18]] },
    jassans: { 2: [[14.5, 19]], 3: [[14.5, 19]], 4: [[14.5, 19]], 5: [[14.5, 19]], 6: [[10, 12]] },
    belleville: { 1: [[9, 12]], 2: [[14, 18.5]], 3: [[14, 19]], 4: [[14, 18.5]], 5: [[14, 18.5]], 6: [[9, 12]] }
  };
  const fmt = n => { const h = Math.floor(n), m = Math.round((n - h) * 60); return h + 'h' + (m ? String(m).padStart(2, '0') : ''); };
  const D = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const now = new Date(), d = now.getDay(), hh = now.getHours() + now.getMinutes() / 60;
  $$('[data-ag]').forEach(el => {
    const sched = H[el.dataset.ag]; if (!sched) return;
    const open = (sched[d] || []).some(([a, b]) => hh >= a && hh < b);
    const o = $('.open', el);
    if (o) { o.classList.toggle('on', open); o.lastChild.textContent = open ? 'Ouvert maintenant' : 'Fermé actuellement'; }
    const ul = $('.hours', el);
    if (ul) {
      ul.innerHTML = [1, 2, 3, 4, 5, 6].map(j => `<li class="${j === d ? 'today' : ''}"><span>${D[j]}</span><span>${(sched[j] || []).map(([a, b]) => fmt(a) + '–' + fmt(b)).join(' · ') || 'Fermé'}</span></li>`).join('');
    }
  });

  /* simulateur de budget */
  const sim = $('#sim');
  if (sim) {
    let kind = 'm';
    const base = { m: 1221, a: 878, c: 1539 }; // manuelle, automatique, conduite accompagnée
    const code = 250;
    const out = $('#simOut'), det = $('#simDet'), rg = $('#simRg'), rl = $('#simRl');
    const upd = () => {
      const aide = +rg.value, tot = base[kind] + code, reste = Math.max(0, tot - aide);
      rl.textContent = aide.toLocaleString('fr-FR') + ' €';
      out.textContent = reste.toLocaleString('fr-FR') + ' €';
      det.textContent = `4 fois sans frais : ${Math.ceil(reste / 4).toLocaleString('fr-FR')} € / mois`;
    };
    $$('.seg button', sim).forEach(b => b.addEventListener('click', () => {
      $$('.seg button', sim).forEach(x => x.setAttribute('aria-pressed', x === b));
      kind = b.dataset.k; upd();
    }));
    rg.addEventListener('input', upd); upd();
  }

  /* quiz « quel permis ? » */
  const qz = $('#quiz');
  if (qz) {
    const Q = [
      { q: 'Tu veux rouler en…', o: [['Voiture', 'v'], ['Moto ou scooter', 'm'], ['Voiture + remorque', 'r'], ['Bateau', 'b']] },
      { q: 'Quel est ton âge ?', o: [['Moins de 17 ans', 'j'], ['17 à 24 ans', 'a'], ['25 ans et plus', 'p']] },
      { q: 'Ta priorité ?', o: [['Payer moins', '$'], ['Aller vite', 'v'], ['Être très accompagné·e', 'c']] }
    ];
    const R = {
      v: ['Permis B', 'Code + conduite, boîte manuelle ou automatique. À partir de 878 € de conduite.', 'permis-voiture.html'],
      m: ['Permis moto A1 / A2 / AM', 'Sur notre piste privée à Lurcy. Formations dès 98 €.', 'permis-moto.html'],
      r: ['Remorque B96 ou BE', 'B96 en 7 h dès 470 €, BE dès 851 €.', 'permis-remorque.html'],
      b: ['Bateau', 'Formations en pause jusqu’en 2027. Découvre le code bateau à 29 €.', 'permis-bateau.html']
    };
    let step = 0, pick = '';
    const draw = () => {
      if (step >= Q.length) {
        const r = R[pick];
        qz.innerHTML = `<div class="qm">Ton résultat</div><h3>${r[0]}</h3><p class="lead" style="margin-bottom:1.4rem">${r[1]}</p><div class="hero-row"><a class="btn" href="${r[2]}">Voir la formation</a><button class="btn ghost" id="qr">Recommencer</button></div>`;
        $('#qr').onclick = () => { step = 0; draw(); };
        return;
      }
      const s = Q[step];
      qz.innerHTML = `<div class="qm">Question ${step + 1} / ${Q.length}</div><h3>${s.q}</h3><div class="opts">${s.o.map(([t, v]) => `<button data-v="${v}">${t}</button>`).join('')}</div>`;
      $$('.opts button', qz).forEach(b => b.onclick = () => { if (step === 0) pick = b.dataset.v; step++; draw(); });
    };
    draw();
  }

  /* formulaire (maquette : pas d’envoi réel) */
  $$('form.f').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('.ok', f); if (ok) ok.style.display = 'block';
    f.reset();
  }));
})();
