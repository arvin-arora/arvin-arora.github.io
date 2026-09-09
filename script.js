(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  // Slower typing cadence on touch devices = fewer layouts per second = smoother.
  const pace = finePointer ? 1 : 1.8;

  // Pause the hero's JS loops (typewriter + terminal) while the hero is offscreen,
  // so scrolling the rest of the page never competes with their layout work.
  let heroActive = true;
  const heroResume = [];
  const heroSection = document.querySelector('.hero');
  if (heroSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          heroActive = entry.isIntersecting;
          if (heroActive) {
            while (heroResume.length) heroResume.shift()();
          }
        });
      },
      { threshold: 0.03 }
    ).observe(heroSection);
  }

  // Likewise pause the marquee ribbon's animation while it's offscreen.
  const marqueeEl = document.querySelector('.marquee');
  if (marqueeEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((entry) => marqueeEl.classList.toggle('offscreen', !entry.isIntersecting)),
      { threshold: 0 }
    ).observe(marqueeEl);
  }

  /* ---------- particle constellation background (desktop only — too costly on phones) ---------- */
  const canvas = document.getElementById('bgCanvas');
  if (canvas && !reduceMotion && finePointer) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w, h, particles;
    const mouse = { x: -9999, y: -9999 };
    const COUNT = () => Math.min(90, Math.floor((w * h) / 16000));

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: COUNT() }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    const LINK_DIST = 110;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const md = Math.hypot(dx, dy);
        if (md < 120 && md > 0.1) {
          p.x += (dx / md) * 0.6;
          p.y += (dy / md) * 0.6;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167,139,250,.5)';
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(167,139,250,${0.14 * (1 - d / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------- custom cursor (desktop only) ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring && finePointer && !reduceMotion) {
    document.body.classList.add('has-cursor');
    let rx = -100, ry = -100, tx = -100, ty = -100;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.left = `${tx}px`;
      dot.style.top = `${ty}px`;
    });
    const follow = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(follow);
    };
    follow();
    document.querySelectorAll('a, button, .button, .stat-chip, .floating-card, .terminal, .project-card, .details-btn').forEach((el) => {
      el.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* ---------- typewriter headline ---------- */
  const typeText = document.getElementById('typeText');
  if (typeText && !reduceMotion) {
    const words = ['Software Developer.', 'Web Developer.', 'Problem Solver.', 'Competitive Programmer.'];
    let wi = 0, ci = words[0].length, deleting = true;
    // Start by deleting the pre-rendered first word after a pause.
    const step = () => {
      if (!heroActive) {
        heroResume.push(step);
        return;
      }
      const word = words[wi];
      if (deleting) {
        ci--;
        typeText.textContent = word.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          wi = (wi + 1) % words.length;
        }
        setTimeout(step, 38 * pace);
      } else {
        ci++;
        typeText.textContent = words[wi].slice(0, ci);
        if (ci === words[wi].length) {
          deleting = true;
          setTimeout(step, 2200);
        } else {
          setTimeout(step, 75 * pace);
        }
      }
    };
    setTimeout(step, 2400);
  }

  /* ---------- Codeforces solved-count display ---------- */
  // The public API only returns public submissions; Arvin's profile total also
  // includes private group-contest solves the API can't see. As of Sep 2026 the
  // profile showed 89 total while the API showed 66 public — a gap of 23 private
  // solves. Display = live public count + that offset, so every new public solve
  // moves the number immediately; the floor is a safety net if the fetch fails.
  const CF_PRIVATE_OFFSET = 23;
  const CF_SOLVED_FLOOR = 89;
  const CF_STREAK_FLOOR = 15; // profile max streak incl. private group-contest days
  const cfDisplay = (n) => `${Math.max((n || 0) + CF_PRIVATE_OFFSET, CF_SOLVED_FLOOR)}+`;

  /* ---------- live terminal in hero ---------- */
  let cfSolvedCount = cfDisplay(0); // refined by the Codeforces fetch below
  const termBody = document.getElementById('termBody');
  if (termBody) {
    const lines = () => [
      { cmd: true, text: 'whoami' },
      { cls: 'out', text: 'arvin · year-1 @ scaler sst' },
      { cmd: true, text: 'vim solve.cpp' },
      { cls: 'code', text: '#include <bits/stdc++.h>' },
      { cls: 'code', text: 'using namespace std;' },
      { cls: 'code', text: 'int main() {' },
      { cls: 'code', text: '  solve(); // one problem at a time' },
      { cls: 'code', text: '}' },
      { cmd: true, text: 'g++ -O2 solve.cpp && ./a.out' },
      { cls: 'out hi', text: 'tests: ✓ ✓ ✓  →  Accepted' },
      { cmd: true, text: 'ls ~/projects' },
      { cls: 'out', text: 'hostel-attendance-app/  (react-native · ts)' },
      { cmd: true, text: 'codeforces --user Arvin2417 --solved' },
      { cls: 'out hi', text: `${cfSolvedCount} problems accepted ✓` },
      { cmd: true, text: 'echo $STATUS' },
      { cls: 'out', text: 'building the foundation' },
    ];

    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const highlightCode = (t) =>
      esc(t)
        .replace(/(\/\/.*)$/, '<span class="t-cm">$1</span>')
        .replace(/(&lt;bits\/stdc\+\+\.h&gt;)/, '<span class="t-str">$1</span>')
        .replace(/(#include|using|namespace|int|return)(?![\w-])/g, '<span class="t-kw">$1</span>');

    const renderLine = (line) => {
      const div = document.createElement('div');
      div.className = `t-line ${line.cmd ? '' : line.cls || 'out'}`;
      if (line.cmd) {
        const prompt = document.createElement('span');
        prompt.className = 't-prompt';
        prompt.textContent = '$ ';
        div.appendChild(prompt);
      }
      const span = document.createElement('span');
      div.appendChild(span);
      termBody.appendChild(div);
      return span;
    };

    const finishLine = (line, span) => {
      if (line.cls && line.cls.includes('code')) span.innerHTML = highlightCode(line.text);
    };

    const scrollTerm = () => {
      termBody.scrollTop = termBody.scrollHeight;
    };

    if (reduceMotion) {
      lines().forEach((line) => {
        const span = renderLine(line);
        span.textContent = line.text;
        finishLine(line, span);
      });
      scrollTerm();
    } else {
      const caret = document.createElement('span');
      caret.className = 't-caret';
      const typeLines = () => {
        termBody.innerHTML = '';
        let li = 0;
        const nextLine = () => {
          if (!heroActive) {
            heroResume.push(nextLine);
            return;
          }
          if (li >= lines().length) {
            termBody.appendChild(caret);
            scrollTerm();
            setTimeout(typeLines, 6500);
            return;
          }
          const line = lines()[li];
          const span = renderLine(line);
          span.parentElement.appendChild(caret);
          scrollTerm();
          let ci = 0;
          const isCode = line.cls && line.cls.includes('code');
          const typeChar = () => {
            if (!heroActive) {
              heroResume.push(typeChar);
              return;
            }
            ci++;
            span.textContent = line.text.slice(0, ci);
            if (ci < line.text.length) {
              setTimeout(typeChar, (line.cmd ? 55 : isCode ? 26 : 20) * pace);
            } else {
              finishLine(line, span);
              li++;
              setTimeout(nextLine, line.cmd ? 320 : isCode ? 140 : 520);
            }
          };
          typeChar();
        };
        nextLine();
      };
      typeLines();
    }
  }

  /* ---------- scroll-triggered reveal ---------- */
  const revealGroups = new Map();
  document.querySelectorAll('.reveal').forEach((el) => {
    const parent = el.closest('.about-grid, .journey-grid, .projects-grid, .contact-grid, .quote, .section-heading') || el.parentElement;
    if (!revealGroups.has(parent)) revealGroups.set(parent, []);
    revealGroups.get(parent).push(el);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  } else {
    revealGroups.forEach((els) => {
      els.forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.12}s`;
      });
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  /* ---------- header shadow + scroll progress ---------- */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const ghostSections = finePointer && !reduceMotion ? Array.from(document.querySelectorAll('.section[data-ghost]')) : [];
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    ghostSections.forEach((s) => {
      s.style.setProperty('--gy', `${s.getBoundingClientRect().top * 0.12}px`);
    });
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
    }
  };
  onScroll();
  let scrollQueued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        onScroll();
      });
    },
    { passive: true }
  );

  /* ---------- cursor spotlight in hero ---------- */
  const hero = document.querySelector('.hero');
  if (hero && finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      hero.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }

  /* ---------- 3D tilt on the Codeforces card ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.journey-feature, .portal-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-6px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- details reveal: hover the item itself (tap on touch) ---------- */
  const canHover = window.matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.project-card, .section-label-row, .focus-item').forEach((host) => {
    if (!host.querySelector('.project-details, .section-details, .focus-details')) return;
    if (canHover) {
      host.addEventListener('pointerenter', () => host.classList.add('show-details'));
      host.addEventListener('pointerleave', () => host.classList.remove('show-details'));
    } else {
      host.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // let real links navigate
        host.classList.toggle('show-details');
      });
    }
  });

  /* ---------- copy email from the connect card ---------- */
  const copyRow = document.getElementById('copyEmail');
  const copyLabel = document.getElementById('copyLabel');
  if (copyRow && copyLabel) {
    const doCopy = () => {
      const email = 'aroraarvin8@gmail.com';
      const done = () => {
        copyLabel.textContent = 'copied ✓';
        setTimeout(() => {
          copyLabel.textContent = 'copy';
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(() => {
          window.location.href = `mailto:${email}`;
        });
      } else {
        window.location.href = `mailto:${email}`;
      }
    };
    copyRow.addEventListener('click', doCopy);
    copyRow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        doCopy();
      }
    });
  }

  /* ---------- click ripple on buttons ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('.button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - r.left - size / 2}px`;
        ripple.style.top = `${e.clientY - r.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ---------- generative ambient music ---------- */
  const musicBtn = document.getElementById('musicToggle');
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (musicBtn && AudioCtx) {
    let actx = null, master, delay, feedback;
    let padTimer = null, arpTimer = null, chordIdx = 0;
    const CHORDS = [
      [110.0, 130.81, 164.81, 196.0],  // Am7
      [87.31, 110.0, 130.81, 174.61],  // Fmaj7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [98.0, 123.47, 146.83, 196.0],   // G
    ];
    const SCALE = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // A minor pentatonic-ish

    const playPad = () => {
      const t = actx.currentTime;
      CHORDS[chordIdx].forEach((f) => {
        const osc = actx.createOscillator();
        const g = actx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 4.5);   // slow, gentle swell
        g.gain.setValueAtTime(0.07, t + 8.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 12.5); // long overlapping fade
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + 13);
      });
      chordIdx = (chordIdx + 1) % CHORDS.length;
    };

    const playArpNote = () => {
      if (Math.random() > 0.55) return; // sparser, calmer
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const g = actx.createGain();
      osc.type = 'sine';
      osc.frequency.value = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.1 ? 2 : 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.15);   // soft swell instead of pluck
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3);    // long tail
      osc.connect(g);
      g.connect(master);
      g.connect(delay);
      osc.start(t);
      osc.stop(t + 3.1);
    };

    const startMusic = () => {
      if (!actx) {
        actx = new AudioCtx();
        const warmth = actx.createBiquadFilter(); // rounds off any sharpness
        warmth.type = 'lowpass';
        warmth.frequency.value = 1400;
        warmth.Q.value = 0.4;
        master = actx.createGain();
        master.gain.value = 0.32;
        master.connect(warmth).connect(actx.destination);
        delay = actx.createDelay(1);
        delay.delayTime.value = 0.52;
        feedback = actx.createGain();
        feedback.gain.value = 0.3;
        delay.connect(feedback).connect(delay);
        delay.connect(master);
      }
      actx.resume();
      playPad();
      padTimer = setInterval(playPad, 12000);
      arpTimer = setInterval(playArpNote, 900);
    };

    const stopMusic = () => {
      clearInterval(padTimer);
      clearInterval(arpTimer);
      if (actx) actx.suspend();
    };

    const setPlaying = (playing) => {
      musicBtn.classList.toggle('is-playing', playing);
      musicBtn.setAttribute('aria-pressed', String(playing));
      musicBtn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
      if (playing) startMusic();
      else stopMusic();
    };

    let userToggled = false; // an explicit user choice beats any auto-start logic
    musicBtn.addEventListener('click', () => {
      userToggled = true;
      setPlaying(!musicBtn.classList.contains('is-playing'));
    });

    // Autostart: try immediately; if the browser blocks audio before a user
    // gesture, start on the first interaction anywhere on the page instead —
    // but never against an explicit on/off choice the user already made.
    const armGestureStart = () => {
      const onFirstGesture = (e) => {
        ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.removeEventListener(ev, onFirstGesture));
        if (musicBtn.contains(e.target)) return; // let the button's own handler decide
        if (!userToggled && !musicBtn.classList.contains('is-playing')) setPlaying(true);
      };
      ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, onFirstGesture));
    };

    setPlaying(true);
    setTimeout(() => {
      if (!userToggled && actx && actx.state !== 'running') {
        setPlaying(false); // silently blocked — reset so scheduled notes don't pile up
        armGestureStart();
      }
    }, 400);
  }

  /* ---------- live Codeforces stats ---------- */
  const cfStat = document.getElementById('cfStat');
  const heroCfCount = document.getElementById('heroCfCount');
  if (heroCfCount) heroCfCount.textContent = cfDisplay(0);
  if (cfStat) cfStat.textContent = `${cfDisplay(0)} problems solved on Codeforces ↗`;
  fetch('https://codeforces.com/api/user.status?handle=Arvin2417&from=1&count=10000')
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== 'OK') throw new Error(data.comment || 'Codeforces API error');
      const solved = new Set();
      const solveDays = new Set();
      data.result.forEach((sub) => {
        if (sub.verdict === 'OK') {
          solved.add(`${sub.problem.contestId}${sub.problem.index}`);
          solveDays.add(Math.floor(sub.creationTimeSeconds / 86400));
        }
      });

      cfSolvedCount = cfDisplay(solved.size);
      if (cfStat) cfStat.textContent = `${cfDisplay(solved.size)} problems solved on Codeforces ↗`;
      // count-up animation for the number displays
      const target = Math.max(solved.size + CF_PRIVATE_OFFSET, CF_SOLVED_FLOOR);
      const animateCount = (el) => {
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
      };
      if (heroCfCount) animateCount(heroCfCount);
      document.querySelectorAll('.cf-count').forEach(animateCount);

      // Longest run of consecutive days with at least one accepted submission.
      const days = [...solveDays].sort((a, b) => a - b);
      let maxStreak = 0;
      let run = 0;
      let prev = null;
      days.forEach((d) => {
        run = prev !== null && d === prev + 1 ? run + 1 : 1;
        if (run > maxStreak) maxStreak = run;
        prev = d;
      });
      const streakEl = document.getElementById('cfStreak');
      if (streakEl) streakEl.textContent = Math.max(maxStreak, CF_STREAK_FLOOR);
    })
    .catch(() => {
      // The known floor is already displayed; nothing to roll back.
    });

  /* ---------- sound effects (synthesized, no audio files) ---------- */
  const sfx = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return { play: () => {} };
    let ctx = null;
    const ensure = () => {
      try {
        if (!ctx) ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) {}
    };
    // audio can only start after a user gesture — arm it on the first one
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, ensure, { passive: true }));
    const tone = (freq, dur, o = {}) => {
      const t = ctx.currentTime + (o.delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.gain || 0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    };
    const whoosh = (dur, o = {}) => {
      const t = ctx.currentTime + (o.delay || 0);
      const len = Math.ceil(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 0.8;
      f.frequency.setValueAtTime(o.from || 300, t);
      f.frequency.exponentialRampToValueAtTime(o.to || 1600, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.gain || 0.15, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + dur + 0.05);
    };
    const play = (name) => {
      ensure();
      if (!ctx || ctx.state !== 'running') return; // pre-gesture: stay silent
      try {
        switch (name) {
          case 'click':
            tone(660, 0.07, { type: 'triangle', gain: 0.06 });
            tone(990, 0.05, { gain: 0.035, delay: 0.03 });
            break;
          case 'hover':
            tone(540, 0.045, { gain: 0.02 });
            break;
          case 'portal':
            whoosh(0.75, { gain: 0.16, from: 260, to: 2600 });
            tone(220, 0.75, { gain: 0.08, slideTo: 880 });
            break;
          case 'rocket':
            whoosh(2.2, { gain: 0.26, from: 70, to: 1400 });
            tone(55, 2, { type: 'sawtooth', gain: 0.1, slideTo: 220 });
            whoosh(1.2, { gain: 0.12, from: 900, to: 3200, delay: 1.1 });
            break;
          case 'unlock':
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.28, { gain: 0.07, delay: i * 0.09 }));
            break;
          case 'complete':
            [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => tone(f, 0.4, { gain: 0.08, delay: i * 0.11 }));
            whoosh(1, { gain: 0.1, from: 500, to: 3000 });
            break;
        }
      } catch (e) {}
    };
    return { play };
  })();
  // click blips on anything interactive; soft hover ticks on desktop
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, [role="button"]')) sfx.play('click');
  });
  if (finePointer) {
    document.querySelectorAll('a, button, .project-card, .portal-card, .focus-item, .stat-chip, .cc-row').forEach((el) => {
      el.addEventListener('pointerenter', () => sfx.play('hover'));
    });
  }

  /* ---------- entry screen: rocket launch into the universe ---------- */
  const entry = document.getElementById('entryScreen');
  if (entry) {
    let seen = false;
    try { seen = sessionStorage.getItem('entrySeen') === '1'; } catch (e) {}
    if (seen || reduceMotion) {
      entry.remove();
    } else {
      document.body.classList.add('entry-hold');
      const starBox = document.getElementById('entryStars');
      if (starBox) {
        for (let i = 0; i < 60; i++) {
          const s = document.createElement('i');
          s.style.left = `${Math.random() * 100}%`;
          s.style.top = `${Math.random() * 100}%`;
          s.style.setProperty('--spd', `${0.6 + Math.random()}s`);
          s.style.setProperty('--dl', `${Math.random()}`);
          starBox.appendChild(s);
        }
      }
      const done = () => {
        try { sessionStorage.setItem('entrySeen', '1'); } catch (e) {}
        entry.classList.add('is-done');
        document.body.classList.remove('entry-hold');
        setTimeout(() => entry.remove(), 700);
      };
      const skipBtn = document.getElementById('entrySkip');
      if (skipBtn) skipBtn.addEventListener('click', done);
      const launchBtn = document.getElementById('entryBtn');
      if (launchBtn) launchBtn.addEventListener('click', () => {
        sfx.play('rocket');
        entry.classList.add('launching');
        setTimeout(done, 2100);
      });
    }
  }

  /* ---------- portal page transitions ---------- */
  const portalEl = document.getElementById('portalOverlay');
  if (portalEl && !reduceMotion) {
    // arrival: step out of a shrinking portal
    portalEl.classList.add('is-enter');
    setTimeout(() => portalEl.classList.remove('is-enter'), 850);
    // never leave the portal stuck over the page (back/forward cache restores)
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) portalEl.classList.remove('is-open', 'is-enter');
    });
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      // only internal page hops — anchors, mailto:, https:// etc. keep default behavior
      if (!href || href.startsWith('#') || link.target === '_blank' || /^[a-z]+:/i.test(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (e.clientX || e.clientY) {
        portalEl.style.setProperty('--px', `${e.clientX}px`);
        portalEl.style.setProperty('--py', `${e.clientY}px`);
      } else {
        portalEl.style.removeProperty('--px'); // keyboard activation: open from center
        portalEl.style.removeProperty('--py');
      }
      sfx.play('portal');
      portalEl.classList.remove('is-enter');
      portalEl.classList.add('is-open');
      setTimeout(() => { window.location.href = href; }, 780);
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.button, .music-toggle').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.22}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- star bursts ---------- */
  const sparkBurst = (x, y, count) => {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = i % 2 ? 'spark alt' : 'spark';
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const d = 26 + Math.random() * 34;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--sx', `${Math.cos(a) * d}px`);
      s.style.setProperty('--sy', `${Math.sin(a) * d}px`);
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
  };
  if (finePointer && !reduceMotion) {
    window.addEventListener('pointerdown', (e) => sparkBurst(e.clientX, e.clientY, 7));
  }

  /* ---------- explorer quests: gamified exploration ---------- */
  const QUESTS = [
    { id: 'liftoff', icon: '🚀', name: 'Liftoff', hint: 'enter the universe' },
    { id: 'about', icon: '🪐', name: 'Identity Found', hint: 'visit the About portal' },
    { id: 'journey', icon: '🛰️', name: 'Path Walker', hint: 'visit the Journey portal' },
    { id: 'projects', icon: '🛠️', name: 'Builder’s Vault', hint: 'visit the Projects portal' },
    { id: 'contact', icon: '📡', name: 'Signal Sent', hint: 'visit the Contact portal' },
    { id: 'music', icon: '🎵', name: 'Sound of Space', hint: 'toggle the ambient music' },
    { id: 'secret', icon: '🔍', name: 'Secret Panel', hint: 'uncover a hidden details panel' },
    { id: 'deep', icon: '🌌', name: 'Deep Diver', hint: 'scroll to the very bottom' },
  ];
  const loadQuests = () => { try { return JSON.parse(localStorage.getItem('aa_quests') || '{}'); } catch (e) { return {}; } };
  const questState = loadQuests();

  const hud = document.createElement('div');
  hud.className = 'quest-hud';
  hud.innerHTML =
    '<button class="quest-pill" type="button" aria-label="Explorer progress — open quest log">' +
    '<span class="q-orb"></span><b class="q-count">0/8</b><span class="q-bar"><i></i></span></button>' +
    '<div class="quest-panel"><h4>EXPLORER LOG</h4><p class="q-sub">Discover everything this universe hides…</p><ul></ul></div>';
  document.body.appendChild(hud);
  hud.querySelector('.quest-pill').addEventListener('click', () => hud.classList.toggle('open'));

  const renderQuests = () => {
    const done = QUESTS.filter((q) => questState[q.id]).length;
    hud.querySelector('.q-count').textContent = `${done}/${QUESTS.length}`;
    hud.querySelector('.q-bar i').style.width = `${(done / QUESTS.length) * 100}%`;
    const ul = hud.querySelector('.quest-panel ul');
    ul.innerHTML = '';
    QUESTS.forEach((q) => {
      const li = document.createElement('li');
      if (questState[q.id]) {
        li.innerHTML = `<span>${q.icon}</span><b>${q.name}</b>`;
      } else {
        li.className = 'locked';
        li.innerHTML = `<span>❓</span><b>???</b><em>· ${q.hint}</em>`;
      }
      ul.appendChild(li);
    });
  };
  renderQuests();

  // toasts queue up instead of clobbering each other (quest + level-clear can land close together)
  let toastEl = null, toastBusy = false;
  const toastQueue = [];
  const showNextToast = () => {
    if (!toastQueue.length) { toastBusy = false; return; }
    toastBusy = true;
    toastEl.textContent = toastQueue.shift();
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(showNextToast, 450); // let the hide transition finish
    }, 2600);
  };
  const toast = (msg) => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'quest-toast';
      document.body.appendChild(toastEl);
    }
    toastQueue.push(msg);
    if (!toastBusy) showNextToast();
  };

  const unlock = (id) => {
    if (questState[id]) return;
    const q = QUESTS.find((x) => x.id === id);
    if (!q) return;
    questState[id] = 1;
    try { localStorage.setItem('aa_quests', JSON.stringify(questState)); } catch (e) {}
    renderQuests();
    const done = QUESTS.filter((x) => questState[x.id]).length;
    toast(`🏆 ${q.icon} ${q.name} discovered · ${done}/${QUESTS.length}`);
    sfx.play('unlock');
    if (!reduceMotion) sparkBurst(window.innerWidth / 2, 130, 14);
    if (done === QUESTS.length) {
      setTimeout(() => {
        toast('🌟 100% EXPLORED — you’ve seen the whole universe. Respect!');
        sfx.play('complete');
        if (!reduceMotion) {
          sparkBurst(window.innerWidth * 0.3, window.innerHeight * 0.4, 16);
          sparkBurst(window.innerWidth * 0.7, window.innerHeight * 0.55, 16);
        }
      }, 3600);
    }
  };

  // page-visit discoveries (small delay so it lands after the portal reveal)
  setTimeout(() => {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (path.startsWith('about')) unlock('about');
    else if (path.startsWith('journey')) unlock('journey');
    else if (path.startsWith('projects')) unlock('projects');
    else if (path.startsWith('contact')) unlock('contact');
  }, 1100);

  // liftoff — launching (or skipping) the entry rocket
  ['entryBtn', 'entrySkip'].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => unlock('liftoff'));
  });
  // reduced-motion visitors never see the entry screen — grant liftoff on the home page so 8/8 stays reachable
  if (reduceMotion && document.querySelector('.hero')) unlock('liftoff');

  // music toggle
  const musicQ = document.getElementById('musicToggle');
  if (musicQ) musicQ.addEventListener('click', () => unlock('music'));

  // secret details panels
  document.querySelectorAll('.project-card, .section-label-row, .focus-item').forEach((host) => {
    if (!host.querySelector('.project-details, .section-details, .focus-details')) return;
    ['pointerenter', 'click'].forEach((ev) => host.addEventListener(ev, () => unlock('secret')));
  });

  // deep diver — reach the bottom
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) unlock('deep');
  }, { passive: true });

  /* ---------- level-clear: exit portals unlock when you finish the level ---------- */
  const pageNext = document.querySelector('.page-next');
  const LEVELS = { 'about.html': '01', 'journey.html': '02', 'projects.html': '03', 'contact.html': '04' };
  const pageFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const lvl = LEVELS[pageFile];
  if (pageNext && lvl) {
    let cleared = false;
    try { cleared = sessionStorage.getItem('lvl' + lvl) === '1'; } catch (e) {}
    const pnLink = pageNext.querySelector('a');
    if (cleared) {
      pageNext.classList.add('pn-unlocked');
    } else {
      pageNext.classList.add('pn-locked');
      // keep the locked portal out of the tab order too — pointer-events only blocks the mouse
      if (pnLink) {
        pnLink.setAttribute('tabindex', '-1');
        pnLink.setAttribute('aria-disabled', 'true');
      }
      const clearLevel = () => {
        if (pageNext.classList.contains('pn-unlocked')) return;
        pageNext.classList.remove('pn-locked');
        pageNext.classList.add('pn-unlocked');
        if (pnLink) {
          pnLink.removeAttribute('tabindex');
          pnLink.removeAttribute('aria-disabled');
        }
        try { sessionStorage.setItem('lvl' + lvl, '1'); } catch (e) {}
        toast(`✅ LEVEL ${lvl} CLEARED — a portal has been revealed`);
        sfx.play('unlock');
        if (!reduceMotion) {
          const r = pageNext.getBoundingClientRect();
          sparkBurst(r.left + r.width / 2, Math.max(60, Math.min(r.top + 40, window.innerHeight - 60)), 12);
        }
      };
      const checkEnd = () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) clearLevel();
      };
      window.addEventListener('scroll', checkEnd, { passive: true });
      setTimeout(checkEnd, 1500); // short levels fit one screen — count as explored
    }
  }

  /* ---------- nav highlight for section in view ---------- */
  const navLinks = document.querySelectorAll('nav a[data-nav]');
  const sections = Array.from(navLinks)
    .map((link) => document.getElementById(link.dataset.nav))
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = document.querySelector(`nav a[data-nav="${entry.target.id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    sections.forEach((s) => navObserver.observe(s));
  }
})();
