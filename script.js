(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header: shrink + brand morph with hysteresis ---------- */
  const header = document.getElementById('siteHeader');
  const scrollName = document.getElementById('scrollName');
  const heroPhoto = document.querySelector('.hero-photo');
  const rmRows = document.querySelector('.roadmap-rows');
  let rmProgress = null;
  if (rmRows) {
    rmProgress = document.createElement('span');
    rmProgress.className = 'rm-progress';
    rmProgress.setAttribute('aria-hidden', 'true');
    rmRows.appendChild(rmProgress);
  }
  const navLinks = Array.from(document.querySelectorAll('nav a[data-nav]'));
  const navSections = navLinks
    .map((a) => document.getElementById(a.dataset.nav))
    .filter(Boolean);

  /* ---------- lerped motion engine: values chase the scroll with easing ---------- */
  const heroSec = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  const topoLayer = document.getElementById('topoLayer');
  const heroKicker = document.querySelector('.hero-kicker');
  const heroFirst = document.querySelector('.name-first');
  const heroLast = document.querySelector('.name-last');
  const heroCard = document.querySelector('.next-card');
  const heroCue = document.querySelector('.hero .scroll-cue');
  const heroMeter = document.querySelector('.scroll-meter b');
  const dome = document.getElementById('heroDome');
  const domePaths = dome ? Array.from(dome.querySelectorAll('path')) : [];
  const domeNode = dome ? dome.querySelector('.d-node') : null;
  const ocSec = document.querySelector('.offclock');
  const fanCards = Array.from(document.querySelectorAll('.fan-card'));
  const scrollProg = document.getElementById('scrollProgress');

  /* ---------- cursor ring: desktop pointers only, eased in the motion loop ---------- */
  let curRing = null;
  let parallaxX = 0, parallaxY = 0, parallaxTX = 0, parallaxTY = 0;
  let curX = 0, curY = 0, ringX = 0, ringY = 0, curSeen = false;
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    curRing = document.createElement('span');
    curRing.className = 'cur-ring';
    curRing.setAttribute('aria-hidden', 'true');
    document.body.appendChild(curRing);
    window.addEventListener('mousemove', (e) => {
      curX = e.clientX; curY = e.clientY;
      parallaxTX = (e.clientX / window.innerWidth - .5) * 2;
      parallaxTY = (e.clientY / window.innerHeight - .5) * 2;
      if (!curSeen) { curSeen = true; ringX = curX; ringY = curY; curRing.classList.add('show'); }
      wake();
    }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      curRing.classList.toggle('grow', !!(e.target.closest && e.target.closest('a,button,.fan-card,.g-card,.phone,.mf-photo')));
    });
    document.documentElement.addEventListener('mouseleave', () => curRing.classList.remove('show'));
    document.documentElement.addEventListener('mouseenter', () => { if (curSeen) curRing.classList.add('show'); });
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const st = { heroP: 0, oc: 0, fill: 0, line: 0, topo: 1, prog: 0, bg: [244, 244, 239] };
  const tg = { heroP: 0, oc: 0, fill: 0, line: 0, topo: 1, prog: 0, bg: [244, 244, 239] };

  // color worlds: the page background cross-fades between each section's declared color
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const zones = Array.from(document.querySelectorAll('[data-bg]')).map((el) => ({ el, rgb: hexRgb(el.dataset.bg) }));

  const computeTargets = () => {
    if (header) {
      // hysteresis: collapse past 40px, expand under 10px — never flickers
      if (window.scrollY > 40) header.classList.add('is-scrolled');
      else if (window.scrollY < 10) header.classList.remove('is-scrolled');
    }
    if (heroSec) {
      const r = heroSec.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      tg.heroP = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    }
    if (ocSec) {
      const r = ocSec.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      tg.oc = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    }
    if (scrollName) {
      const r = scrollName.getBoundingClientRect();
      tg.fill = Math.min(100, Math.max(0, ((window.innerHeight * 0.9 - r.top) / (window.innerHeight * 0.6)) * 100));
    }
    if (rmRows) {
      const r = rmRows.getBoundingClientRect();
      tg.line = Math.min(100, Math.max(0, ((window.innerHeight * 0.75 - r.top) / r.height) * 100));
    }
    if (zones.length) {
      const mid = window.innerHeight * 0.55;
      for (const z of zones) {
        const r = z.el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          tg.bg = z.rgb;
          // topo contour lines live only on the paper-white worlds
          tg.topo = (z.rgb[0] + z.rgb[1] + z.rgb[2]) > 700 ? 1 : 0;
          break;
        }
      }
    }
    // only pages with color worlds drive the header ink (the app page keeps its own)
    if (header && zones.length) {
      const lum = 0.299 * tg.bg[0] + 0.587 * tg.bg[1] + 0.114 * tg.bg[2];
      header.classList.toggle('on-light', lum > 140);
    }
    tg.prog = Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));
    if (reduceMotion) {
      if (zones.length) document.body.style.backgroundColor = `rgb(${tg.bg.join(',')})`;
      if (topoLayer) topoLayer.style.opacity = tg.topo;
      if (scrollProg) scrollProg.style.width = `${(tg.prog * 100).toFixed(2)}%`;
    }
    wake();
  };

  /* the rAF loop sleeps once every value has settled and wakes on scroll/resize/mouse */
  let rafOn = false;
  let heroMotionReady = reduceMotion || !heroSec;
  if (!heroMotionReady) setTimeout(() => { heroMotionReady = true; wake(); }, 1450);
  const wake = () => {
    if (!rafOn && !reduceMotion) { rafOn = true; requestAnimationFrame(applyMotion); }
  };

  const applyMotion = () => {
    st.heroP = lerp(st.heroP, tg.heroP, 0.12);
    st.oc = lerp(st.oc, tg.oc, 0.09);
    st.fill = lerp(st.fill, tg.fill, 0.12);
    st.line = lerp(st.line, tg.line, 0.12);
    st.topo = lerp(st.topo, tg.topo, 0.1);
    if (topoLayer) topoLayer.style.opacity = st.topo.toFixed(3);
    // Hero is a continuously scrubbed composition: each physical layer has
    // a distinct depth, then exits through the marquee rather than simply scrolling away.
    const hp = st.heroP;
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const ease = (v) => v * v * (3 - 2 * v);
    const drawP = clamp01(hp * 2.15);
    const limeP = clamp01((hp - .34) * 3.2);
    const exitP = ease(clamp01((hp - .46) / .54));
    const midP = ease(clamp01(hp / .62));
    const exitE = exitP * exitP;
    parallaxX = lerp(parallaxX, parallaxTX, .075);
    parallaxY = lerp(parallaxY, parallaxTY, .075);
    if (heroMotionReady && heroInner) {
      heroInner.style.transform = `translate3d(${(parallaxX * 2.4 + hp * 8).toFixed(1)}px, ${(-midP * 26 - exitP * 148 + parallaxY * 1.2).toFixed(1)}px, 0) scale(${(1 + midP * .035 - exitP * .1).toFixed(3)})`;
      heroInner.style.opacity = Math.max(0, 1 - exitP * 1.18).toFixed(3);
    }
    if (heroMotionReady && heroFirst) heroFirst.style.transform = `translate3d(${(-midP * 18 - exitP * 90 + parallaxX * 1.5).toFixed(1)}px, 0, 0)`;
    if (heroMotionReady && heroLast) heroLast.style.transform = `translate3d(${(midP * 20 + exitP * 112 + parallaxX * 2.2).toFixed(1)}px, ${(-exitP * 24).toFixed(1)}px, 0)`;
    if (heroMotionReady && heroKicker) heroKicker.style.transform = `translate3d(${(parallaxX * .8).toFixed(1)}px, ${(-midP * 10 - exitP * 50).toFixed(1)}px, 0)`;
    if (heroMotionReady && heroPhoto) heroPhoto.style.transform = `translate3d(${(parallaxX * 10 + midP * 14).toFixed(1)}px, ${(midP * -18 + exitE * 178 + parallaxY * 7).toFixed(1)}px, 0) scale(${(1 + midP * .105 - exitP * .035).toFixed(3)})`;
    if (heroMotionReady && heroCard) {
      heroCard.style.transform = `translate3d(${(parallaxX * 6 + midP * 32).toFixed(1)}px, ${(midP * -20 + exitP * 132 + parallaxY * 4).toFixed(1)}px, 0) scale(${(1 - exitP * .08).toFixed(3)})`;
      heroCard.style.opacity = Math.max(0, 1 - exitP * 1.4).toFixed(3);
    }
    if (heroMotionReady && heroCue) heroCue.style.opacity = Math.max(0, 1 - ease(clamp01((hp - .36) * 2.1))).toFixed(3);
    if (heroMotionReady && heroMeter) heroMeter.style.transform = `scaleX(${clamp01(hp * 1.35).toFixed(3)})`;
    if (heroMotionReady && topoLayer) topoLayer.style.transform = `translate3d(${(parallaxX * 3 - hp * 16).toFixed(1)}px, ${(parallaxY * 2 - hp * 28).toFixed(1)}px, 0) scale(${(1 + hp * .035).toFixed(3)})`;
    if (heroMotionReady && dome) {
      domePaths.forEach((p, i) => {
        p.style.strokeDashoffset = (100 * (1 - clamp01(drawP * 1.15 - i * 0.12))).toFixed(2);
        const g = Math.round(139 + (184 - 139) * limeP);
        p.style.stroke = `rgb(${Math.round(139 - limeP * (139 - 143))},${g},${Math.round(131 - limeP * 131)})`;
      });
      if (domeNode) domeNode.style.opacity = clamp01((drawP - 0.85) * 6).toFixed(2);
      dome.style.transform = `translate3d(${(parallaxX * 4).toFixed(1)}px, ${(-34 * (1 - drawP) - midP * 14 + exitE * 176 + parallaxY * 3).toFixed(1)}px, 0) rotate(${(exitP * -8).toFixed(2)}deg)`;
    }
    if (fanCards.length) {
      // deck starts half-fanned (CSS default) and deals fully open early in the pin
      const p = 0.5 + 0.5 * Math.min(1, st.oc * 1.9);
      const mid = (fanCards.length - 1) / 2;
      fanCards.forEach((el, i) => {
        const k = i - mid;
        const lift = Math.abs(k) * 1.4 * p;
        el.style.transform = `translateY(${(6 + lift).toFixed(2)}%) rotate(${(k * 8.5 * p).toFixed(2)}deg)`;
      });
    }
    if (scrollName) scrollName.style.setProperty('--fill', `${st.fill.toFixed(2)}%`);
    if (rmProgress) rmProgress.style.height = `${st.line.toFixed(2)}%`;
    if (scrollProg) {
      st.prog = lerp(st.prog, tg.prog, 0.2);
      scrollProg.style.width = `${(st.prog * 100).toFixed(2)}%`;
    }
    if (curRing && curSeen) {
      ringX = lerp(ringX, curX, 0.22);
      ringY = lerp(ringY, curY, 0.22);
      curRing.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`;
    }
    if (zones.length) {
      st.bg = st.bg.map((v, i) => lerp(v, tg.bg[i], 0.08));
      document.body.style.backgroundColor = `rgb(${st.bg.map((v) => Math.round(v)).join(',')})`;
    }
    const settled =
      Math.abs(st.heroP - tg.heroP) < 0.001 &&
      Math.abs(st.oc - tg.oc) < 0.001 &&
      Math.abs(st.fill - tg.fill) < 0.05 &&
      Math.abs(st.line - tg.line) < 0.05 &&
      Math.abs(st.topo - tg.topo) < 0.002 &&
      Math.abs(st.prog - tg.prog) < 0.001 &&
      Math.abs(st.bg[0] - tg.bg[0]) < 0.4 &&
      Math.abs(st.bg[1] - tg.bg[1]) < 0.4 &&
      Math.abs(st.bg[2] - tg.bg[2]) < 0.4 &&
      (!curRing || !curSeen || (Math.abs(ringX - curX) < 0.5 && Math.abs(ringY - curY) < 0.5));
    if (settled) { rafOn = false; return; }
    requestAnimationFrame(applyMotion);
  };

  window.addEventListener('scroll', computeTargets, { passive: true });
  window.addEventListener('resize', computeTargets, { passive: true });
  computeTargets();
  if (reduceMotion && scrollName) {
    scrollName.style.setProperty('--fill', '100%');
  }

  /* ---------- active nav link per section in view ---------- */
  if (navSections.length && 'IntersectionObserver' in window) {
    const setActive = (id) => navLinks.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    const navIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' }
    );
    navSections.forEach((s) => navIO.observe(s));
  }

  /* scene hand-offs: major visual worlds open as the viewport enters them */
  const scenes = Array.from(document.querySelectorAll('main > section, main > figure, main > .marquee'));
  if (scenes.length && 'IntersectionObserver' in window) {
    const sceneIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('scene-active', entry.isIntersecting));
    }, { rootMargin: '-12% 0px -12% 0px', threshold: 0.01 });
    scenes.forEach((scene) => sceneIO.observe(scene));
  } else {
    scenes.forEach((scene) => scene.classList.add('scene-active'));
  }

  /* ---------- scroll reveals ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !reduceMotion) {
    const groups = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        const idx = groups.has(parent) ? groups.get(parent) : 0;
        groups.set(parent, idx + 1);
        el.style.transitionDelay = `${Math.min(idx * 0.1, 0.5)}s`;
        el.classList.add('is-visible');
        io.unobserve(el);
        setTimeout(() => groups.set(parent, Math.max(0, (groups.get(parent) || 1) - 1)), 700);
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
      if (open) {
        mobileMenu.hidden = false;
        requestAnimationFrame(() => mobileMenu.classList.add('open'));
      } else {
        mobileMenu.classList.remove('open');
        mobileMenu.hidden = true;
      }
    };
    menuBtn.addEventListener('click', () => setMenu(mobileMenu.hidden));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileMenu.hidden) setMenu(false); });
  }

  /* ---------- numbers count up when they enter view ---------- */
  const countNums = document.querySelectorAll('.count-num');
  if (countNums.length && 'IntersectionObserver' in window && !reduceMotion) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        nio.unobserve(el);
        const target = parseInt(el.dataset.target, 10) || 0;
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / 700, 1);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    countNums.forEach((el) => nio.observe(el));
  }

  /* ---------- marquee pauses offscreen ---------- */
  const marqueeEl = document.querySelector('.marquee');
  if (marqueeEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => marqueeEl.classList.toggle('offscreen', !e.isIntersecting)),
      { threshold: 0 }
    ).observe(marqueeEl);
  }

  /* ---------- live Codeforces stats ---------- */
  // Public API misses private group-contest solves; profile showed 89 when the
  // public count was 66, so display = live public + 23, floored at 89.
  const CF_PRIVATE_OFFSET = 23;
  const CF_SOLVED_FLOOR = 89;
  const cfEls = () => document.querySelectorAll('.cf-count');
  if (cfEls().length) fetch('https://codeforces.com/api/user.status?handle=Arvin2417')
    .then((r) => r.json())
    .then((data) => {
      if (data.status !== 'OK') return;
      const solved = new Set();
      data.result.forEach((sub) => {
        if (sub.verdict === 'OK' && sub.problem) solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
      });
      const target = Math.max(solved.size + CF_PRIVATE_OFFSET, CF_SOLVED_FLOOR);
      cfEls().forEach((el) => {
        if (reduceMotion) { el.textContent = `${target}+`; return; }
        const t0 = performance.now();
        const dur = 1300;
        const stepFrame = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${Math.round(target * eased)}+`;
          if (p < 1) requestAnimationFrame(stepFrame);
        };
        requestAnimationFrame(stepFrame);
      });
    })
    .catch(() => { /* the floor value in the markup stands */ });

  /* =========================================================
     HOSTEL APP SIMULATOR (project page) — faithful recreation
     of the real app's screens, strings and check-in pipeline
     ========================================================= */
  const rnAction = document.getElementById('rnAction');
  if (rnAction) {
    const $id = (x) => document.getElementById(x);
    const rnBadge = $id('rnBadge'), rnCard = $id('rnCard'), rnSims = $id('rnSims'), rnSimLabel = $id('rnSimLabel');
    const rnCamera = $id('rnCamera'), rnCamStatus = $id('rnCamStatus'), rnVerify = $id('rnVerify');
    const rnVTitle = $id('rnVTitle'), rnVSub = $id('rnVSub'), rnVSteps = $id('rnVSteps'), rnVFoot = $id('rnVFoot'), rnVDone = $id('rnVDone');
    $id('rnDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const SCHED = 'Open: 10:30 PM • Deadline: 11:00 PM • Grace: 11:10 PM';
    const RN = {
      notstarted: { badge: ['⏳', 'NOT STARTED', 'ns'], card: ['ns', 'ATTENDANCE NOT STARTED', 'Opens tonight at 10:30 PM', 'Opens in {t}'], btn: ['🔒', 'ATTENDANCE NOT OPEN', 'Opens tonight at 10:30 PM', false, ''], seed: 899 },
      open: { badge: ['🟢', 'ATTENDANCE OPEN', 'open'], card: ['open', 'ATTENDANCE OPEN', 'Please mark your attendance before 11:00 PM', 'Normal time ends in {t}'], btn: ['📸', 'MARK ATTENDANCE', 'Face + Location + Wi-Fi Verification', true, ''], seed: 1499, marked: '10:37 PM' },
      grace: { badge: ['⚠️', 'GRACE PERIOD', 'grace'], card: ['grace', 'GRACE PERIOD ACTIVE', '⚠️ Normal attendance closed. Final grace countdown!', 'Final closing in {t}'], btn: ['⚠️', 'MARK ATTENDANCE (GRACE)', 'Face + Location + Wi-Fi Verification', true, 'rn-btn-grace'], seed: 599, marked: '11:05 PM' },
      closed: { badge: ['❌', 'ABSENT', 'closed'], card: ['closed', 'MARKED ABSENT', 'Attendance closed permanently at 11:10 PM', 'Attendance closed for tonight'], btn: ['🔒', 'ATTENDANCE CLOSED', 'Closed at 11:10 PM', false, ''], seed: null },
    };
    const SIM_BTNS = [
      ['10:15 PM', 'Not Started', 'notstarted', '10:15 PM (Not Started)'],
      ['10:35 PM', 'Open (Normal)', 'open', '10:35 PM (Normal Open)'],
      ['11:05 PM', '⚠️ Grace (10m)', 'grace', '11:05 PM (Grace)'],
      ['11:15 PM', 'Closed / Absent', 'closed', '11:15 PM (Closed)'],
    ];
    let rnState = 'open';
    let rnMarkedAt = null;
    let rnFlow = false;
    let rnTick = null;
    let rnRemain = 0;

    const flowRoad = document.querySelectorAll('#appFlow > li');
    const lightFlow = (i) => { const li = flowRoad[i]; if (li) li.classList.add('done'); };
    const resetFlow = () => flowRoad.forEach((li) => li.classList.remove('done'));

    const rnCount = () => {
      const c = RN[rnState];
      const line = rnMarkedAt
        ? 'Attendance recorded successfully for tonight'
        : c.card[3].replace('{t}', `${Math.floor(rnRemain / 60)}m ${String(rnRemain % 60).padStart(2, '0')}s`);
      const el = rnCard.querySelector('.rn-count');
      if (el) el.textContent = line;
    };

    let rnStartFlow = null;
    const rnRender = () => {
      clearInterval(rnTick);
      const c = RN[rnState];
      rnBadge.className = `rn-badge b-${rnMarkedAt ? 'present' : c.badge[2]}`;
      rnBadge.textContent = rnMarkedAt ? '✅ PRESENT' : `${c.badge[0]} ${c.badge[1]}`;
      rnCard.className = `rn-card b-${rnMarkedAt ? 'present' : c.card[0]}`;
      rnCard.innerHTML = `<p class="rn-ch">${rnMarkedAt ? 'ATTENDANCE MARKED' : c.card[1]}</p><p>${rnMarkedAt ? `Verified at ${rnMarkedAt}` : c.card[2]}</p><div class="rn-count"></div><small>${SCHED}</small>`;
      if (rnMarkedAt) {
        rnAction.innerHTML = `<div class="rn-success"><b>🎉</b><p class="rn-sh">Attendance Recorded</p><p>Marked at ${rnMarkedAt} • Server Verified</p><div class="rn-vchips"><i>✓ Face Biometric Valid</i><i>✓ Geofence Verified</i><i>✓ Wi-Fi Validated</i></div></div>`;
      } else {
        rnAction.innerHTML = `<button type="button" class="rn-mark ${c.btn[4]}" ${c.btn[3] ? '' : 'disabled'}><b>${c.btn[0]} ${c.btn[1]}</b><small>${c.btn[2]}</small></button>`;
        if (c.btn[3]) rnAction.querySelector('.rn-mark').addEventListener('click', () => rnStartFlow && rnStartFlow());
      }
      rnRemain = c.seed || 0;
      rnCount();
      if (!rnMarkedAt && c.seed) {
        rnTick = setInterval(() => { if (rnRemain > 0) { rnRemain--; rnCount(); } }, 1000);
      }
    };

    const CHALLENGES = [
      'Great — now blink naturally',
      'Great — now blink twice',
      'Great — now turn your head left, then back to center',
      'Great — now turn your head right, then back to center',
    ];
    const V_STEPS = [
      ['Identity & Session', 'Checking session window and student enrollment'],
      ['Facial Verification', 'Comparing live selfie against your enrolled photo'],
      ['Hostel Geofence', 'Verifying device is within the hostel property boundary'],
      ['Hostel Wi-Fi Challenge', 'Validating authorized network gateway connection'],
      ['Server Confirmation', 'Issuing tamper-proof attendance record'],
    ];

    const rnFeed = $id('rnCamFeed');
    const rnFacemoji = $id('rnFacemoji');
    if (rnFacemoji) rnFacemoji.textContent = 'AA';
    let rnStream = null;
    const rnStopCam = () => {
      if (rnStream) { rnStream.getTracks().forEach((t) => t.stop()); rnStream = null; }
      if (rnFeed) { rnFeed.srcObject = null; rnFeed.hidden = true; }
      if (rnFacemoji) rnFacemoji.hidden = false;
    };

    const rnRunVerify = () => {
      rnVerify.hidden = false;
      const vcard = rnVerify.querySelector('.rn-vcard');
      if (vcard) vcard.focus();
      rnVTitle.textContent = '⚡ Live Attendance Verification';
      rnVSub.textContent = 'Performing server-authoritative multi-factor checks.';
      rnVFoot.hidden = false;
      rnVDone.hidden = true;
      rnVSteps.innerHTML = '';
      const rows = V_STEPS.map(([label, desc], i) => {
        const row = document.createElement('div');
        row.className = 'rn-step';
        row.innerHTML = `<span class="rn-snum">${i + 1}</span><div><b>${label}</b><small>${desc}</small></div><em>QUEUED</em>`;
        rnVSteps.appendChild(row);
        return row;
      });
      const step = (i) => {
        if (i >= rows.length) {
          rnVTitle.textContent = '✅ Attendance Verified';
          rnVSub.textContent = 'Your attendance has been recorded on the server.';
          rnVFoot.hidden = true;
          rnVDone.hidden = false;
          return;
        }
        rows[i].classList.add('checking');
        rows[i].querySelector('em').textContent = 'CHECKING';
        setTimeout(() => {
          rows[i].classList.remove('checking');
          rows[i].classList.add('passed');
          rows[i].querySelector('.rn-snum').textContent = '✓';
          rows[i].querySelector('em').textContent = 'PASSED';
          if (i >= 1) lightFlow(i + 1);
          setTimeout(() => step(i + 1), 170);
        }, 700);
      };
      step(0);
    };

    rnStartFlow = () => {
      if (rnFlow) return;
      rnFlow = true;
      rnCamera.hidden = false;
      rnCamStatus.textContent = 'Position your face in the frame';
      lightFlow(0);
      if (rnFeed && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
          .then((stream) => {
            if (rnCamera.hidden) { stream.getTracks().forEach((t) => t.stop()); return; }
            rnStream = stream;
            rnFeed.srcObject = stream;
            rnFeed.hidden = false;
            if (rnFacemoji) rnFacemoji.hidden = true;
          })
          .catch(() => {});
      }
      const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      setTimeout(() => { rnCamStatus.textContent = challenge; }, 800);
      setTimeout(() => { rnCamStatus.textContent = 'Hold steady…'; }, 1700);
      setTimeout(() => { rnCamStatus.textContent = '✓ Got it'; lightFlow(1); }, 2500);
      setTimeout(() => { rnStopCam(); rnCamera.hidden = true; rnRunVerify(); }, 3000);
    };

    rnVDone.addEventListener('click', () => {
      rnVerify.hidden = true;
      rnMarkedAt = RN[rnState].marked || '10:37 PM';
      rnFlow = false;
      rnRender();
      lightFlow(6);
      const rb = $id('rnReset');
      if (rb) rb.focus();
    });

    SIM_BTNS.forEach(([time, label, key, full]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = key === 'open' ? 'rn-sim on' : 'rn-sim';
      b.setAttribute('aria-pressed', String(key === 'open'));
      b.innerHTML = `<b>${time}</b><small>${label}</small>`;
      b.addEventListener('click', () => {
        rnState = key;
        rnSimLabel.textContent = full;
        rnSims.querySelectorAll('.rn-sim').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('on');
        b.setAttribute('aria-pressed', 'true');
        rnRender();
      });
      rnSims.appendChild(b);
    });
    $id('rnReset').addEventListener('click', () => {
      rnMarkedAt = null;
      rnFlow = false;
      rnVerify.hidden = true;
      rnCamera.hidden = true;
      rnStopCam();
      resetFlow();
      rnRender();
    });
    rnRender();
  }
})();
