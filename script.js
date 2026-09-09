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
  const cube = document.getElementById('cube3d');
  const heroSec = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  const markSec = document.querySelector('.mark');
  const lerp = (a, b, t) => a + (b - a) * t;
  const st = { heroP: 0, spin: 24, fill: 0, line: 0, bg: [10, 10, 10] };
  const tg = { heroP: 0, spin: 24, fill: 0, line: 0, bg: [10, 10, 10] };

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
    if (markSec) {
      const r = markSec.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.max(-0.2, Math.min(1.2, -r.top / span)) : 0;
      tg.spin = 24 + p * 540; // a full-and-a-half turntable turn while pinned
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
        if (r.top <= mid && r.bottom >= mid) { tg.bg = z.rgb; break; }
      }
    }
  };

  const applyMotion = () => {
    st.heroP = lerp(st.heroP, tg.heroP, 0.09);
    st.spin = lerp(st.spin, tg.spin, 0.09);
    st.fill = lerp(st.fill, tg.fill, 0.12);
    st.line = lerp(st.line, tg.line, 0.12);
    if (heroInner) {
      heroInner.style.transform = `translateY(${(-st.heroP * 60).toFixed(1)}px) scale(${(1 - st.heroP * 0.16).toFixed(3)})`;
      heroInner.style.opacity = Math.max(0, 1 - st.heroP * 1.1).toFixed(3);
    }
    if (heroPhoto) heroPhoto.style.transform = `translate3d(0, ${(st.heroP * 130).toFixed(1)}px, 0) scale(${(1 + st.heroP * 0.1).toFixed(3)})`;
    if (cube) cube.style.setProperty('--spin', `${st.spin.toFixed(2)}deg`);
    if (scrollName) scrollName.style.setProperty('--fill', `${st.fill.toFixed(2)}%`);
    if (rmProgress) rmProgress.style.height = `${st.line.toFixed(2)}%`;
    if (zones.length) {
      st.bg = st.bg.map((v, i) => lerp(v, tg.bg[i], 0.08));
      document.body.style.backgroundColor = `rgb(${st.bg.map((v) => Math.round(v)).join(',')})`;
    }
    requestAnimationFrame(applyMotion);
  };

  window.addEventListener('scroll', computeTargets, { passive: true });
  window.addEventListener('resize', computeTargets, { passive: true });
  computeTargets();
  if (!reduceMotion) {
    requestAnimationFrame(applyMotion);
  } else if (scrollName) {
    scrollName.style.setProperty('--fill', '100%');
  }

  /* ---------- active nav link per section in view ---------- */
  if (navSections.length && 'IntersectionObserver' in window) {
    const setActive = (id) => navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
    new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' }
    ).observe && navSections.forEach((s) => {
      new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
        { rootMargin: '-40% 0px -55% 0px' }
      ).observe(s);
    });
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
  fetch('https://codeforces.com/api/user.status?handle=Arvin2417')
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
      rnCard.innerHTML = `<h6>${rnMarkedAt ? 'ATTENDANCE MARKED' : c.card[1]}</h6><p>${rnMarkedAt ? `Verified at ${rnMarkedAt}` : c.card[2]}</p><div class="rn-count"></div><small>${SCHED}</small>`;
      if (rnMarkedAt) {
        rnAction.innerHTML = `<div class="rn-success"><b>🎉</b><h6>Attendance Recorded</h6><p>Marked at ${rnMarkedAt} • Server Verified</p><div class="rn-vchips"><i>✓ Face Biometric Valid</i><i>✓ Geofence Verified</i><i>✓ Wi-Fi Validated</i></div></div>`;
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
    });

    SIM_BTNS.forEach(([time, label, key, full]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = key === 'open' ? 'rn-sim on' : 'rn-sim';
      b.innerHTML = `<b>${time}</b><small>${label}</small>`;
      b.addEventListener('click', () => {
        rnState = key;
        rnSimLabel.textContent = full;
        rnSims.querySelectorAll('.rn-sim').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
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
