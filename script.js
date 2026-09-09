(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  // the visitor's chosen pilot name (asked on the entry screen) personalizes the whole run
  let pilotStored = '';
  try { pilotStored = (localStorage.getItem('aa_pilot') || '').trim(); } catch (e) {}
  const pilot = pilotStored ? pilotStored.slice(0, 24) : 'Explorer';
  const pageFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
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
        ctx.fillStyle = 'rgba(158,203,255,.5)';
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
            ctx.strokeStyle = `rgba(158,203,255,${0.14 * (1 - d / LINK_DIST)})`;
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
      { cls: 'out', text: 'Arvin Arora — aspiring software developer' },
      { cmd: true, text: 'cat education.txt' },
      { cls: 'out', text: 'Scaler School of Technology · Year 1 · CS' },
      { cmd: true, text: 'arvin --stats' },
      { cls: 'out hi', text: `codeforces: Arvin2417 · ${cfSolvedCount} solved` },
      { cls: 'out', text: 'focus: fundamentals · DSA · web dev' },
      { cmd: true, text: 'ls ~/projects' },
      { cls: 'out', text: 'hostel-attendance-app/  portfolio-universe/' },
      { cls: 'out hi', text: 'hostel app: face + GPS + wi-fi verified attendance' },
      { cmd: true, text: 'cat contact.txt' },
      { cls: 'out', text: 'aroraarvin8@gmail.com · github.com/arvin-arora' },
      { cmd: true, text: 'echo $STATUS' },
      { cls: 'out hi', text: 'building the foundation 🚀 open to connect' },
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
    // every level has its own soundtrack — different chords, scale, wave, tempo and tone
    const MOODS = {
      'index.html': { // spawn point — the calm original theme
        wave: 'sine', cutoff: 1400, padEvery: 12000, arpEvery: 900, arpChance: 0.55, arpDur: 3, bpm: 72,
        chords: [[110.0, 130.81, 164.81, 196.0], [87.31, 110.0, 130.81, 174.61], [130.81, 164.81, 196.0, 246.94], [98.0, 123.47, 146.83, 196.0]],
        scale: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
      },
      'about.html': { // warm major — meeting the architect
        wave: 'triangle', cutoff: 1200, padEvery: 13000, arpEvery: 1200, arpChance: 0.5, arpDur: 3.4, bpm: 66,
        chords: [[130.81, 164.81, 196.0, 246.94], [110.0, 130.81, 164.81, 196.0], [87.31, 130.81, 174.61, 220.0], [98.0, 146.83, 196.0, 220.0]],
        scale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
      },
      'journey.html': { // determined minor — the grind
        wave: 'sine', cutoff: 1600, padEvery: 11000, arpEvery: 800, arpChance: 0.6, arpDur: 2.6, bpm: 84,
        chords: [[73.42, 110.0, 146.83, 174.61], [116.54, 146.83, 174.61, 220.0], [87.31, 130.81, 174.61, 220.0], [130.81, 164.81, 196.0, 261.63]],
        scale: [293.66, 349.23, 392.0, 440.0, 523.25, 587.33],
      },
      'projects.html': { // uplifting — the vault of builds
        wave: 'triangle', cutoff: 1800, padEvery: 10000, arpEvery: 700, arpChance: 0.65, arpDur: 2.2, bpm: 92,
        chords: [[82.41, 123.47, 164.81, 196.0], [130.81, 164.81, 196.0, 246.94], [98.0, 146.83, 196.0, 246.94], [73.42, 110.0, 146.83, 185.0]],
        scale: [329.63, 392.0, 440.0, 493.88, 587.33, 659.25],
      },
      'hostel-app.html': { // minimal tech pulses — the simulation zone
        wave: 'triangle', cutoff: 1000, padEvery: 14000, arpEvery: 550, arpChance: 0.45, arpDur: 1.4, bpm: 100,
        chords: [[110.0, 164.81, 220.0, 261.63], [82.41, 123.47, 164.81, 246.94], [87.31, 130.81, 174.61, 261.63], [98.0, 146.83, 196.0, 293.66]],
        scale: [440.0, 523.25, 587.33, 659.25, 783.99, 880.0],
      },
      'contact.html': { // dreamy resolve — the final level
        wave: 'sine', cutoff: 1100, padEvery: 14000, arpEvery: 1400, arpChance: 0.5, arpDur: 4, bpm: 58,
        chords: [[87.31, 110.0, 130.81, 164.81], [98.0, 123.47, 146.83, 196.0], [82.41, 123.47, 146.83, 164.81], [110.0, 164.81, 196.0, 246.94]],
        scale: [261.63, 329.63, 392.0, 440.0, 523.25, 659.25],
      },
    };
    const MOOD = MOODS[pageFile] || MOODS['index.html'];

    const playPad = () => {
      const t = actx.currentTime;
      MOOD.chords[chordIdx].forEach((f) => {
        const osc = actx.createOscillator();
        const g = actx.createGain();
        osc.type = MOOD.wave;
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 4.5);   // slow, gentle swell
        g.gain.setValueAtTime(0.07, t + 8.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 12.5); // long overlapping fade
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + 13);
      });
      chordIdx = (chordIdx + 1) % MOOD.chords.length;
    };

    const playArpNote = () => {
      if (Math.random() > MOOD.arpChance) return; // sparser, calmer
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const g = actx.createGain();
      osc.type = MOOD.wave;
      osc.frequency.value = MOOD.scale[Math.floor(Math.random() * MOOD.scale.length)] * (Math.random() < 0.1 ? 2 : 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.15);   // soft swell instead of pluck
      g.gain.exponentialRampToValueAtTime(0.0001, t + MOOD.arpDur); // tail length is part of the mood
      osc.connect(g);
      g.connect(master);
      g.connect(delay);
      osc.start(t);
      osc.stop(t + MOOD.arpDur + 0.1);
    };

    /* lo-fi rhythm section — kick, snare, hats and a bassline at each level's tempo */
    let stepTimer = null, stepIdx = 0;
    const drumNoise = (dur, filterType, freq, gain) => {
      const len = Math.ceil(actx.sampleRate * dur);
      const buf = actx.createBuffer(1, len, actx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource();
      src.buffer = buf;
      const f = actx.createBiquadFilter();
      f.type = filterType;
      f.frequency.value = freq;
      const g = actx.createGain();
      const t = actx.currentTime;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(actx.destination);
      src.start(t);
      src.stop(t + dur + 0.02);
    };
    const playKick = () => {
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const g = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g).connect(actx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    };
    const playBassNote = () => {
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const g = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = MOOD.chords[chordIdx][0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.4);
    };
    const playStep = () => {
      const s = stepIdx % 8;
      if (s === 0 || s === 6) playKick();
      if (s === 4) drumNoise(0.12, 'bandpass', 1800, 0.13); // snare
      if (s % 2 === 1) drumNoise(0.04, 'highpass', 6000, 0.05); // hats
      if (s === 0 || s === 3 || s === 6) playBassNote();
      stepIdx++;
    };

    /* solar-wind ambience — the deep drone real space sonifications actually sound like */
    let windSrc = null;
    const startWind = () => {
      if (windSrc) return;
      const len = actx.sampleRate * 3;
      const buf = actx.createBuffer(1, len, actx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3;
      }
      windSrc = actx.createBufferSource();
      windSrc.buffer = buf;
      windSrc.loop = true;
      const f = actx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 220;
      const lfo = actx.createOscillator(); // slow sweep, like plasma-wave recordings
      lfo.frequency.value = 0.06;
      const lfoGain = actx.createGain();
      lfoGain.gain.value = 140;
      lfo.connect(lfoGain).connect(f.frequency);
      lfo.start();
      const g = actx.createGain();
      g.gain.value = 0.06;
      windSrc.connect(f).connect(g).connect(actx.destination);
      windSrc.start();
    };

    const startMusic = () => {
      if (!actx) {
        actx = new AudioCtx();
        const warmth = actx.createBiquadFilter(); // rounds off any sharpness
        warmth.type = 'lowpass';
        warmth.frequency.value = MOOD.cutoff;
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
      startWind();
      playPad();
      padTimer = setInterval(playPad, MOOD.padEvery);
      arpTimer = setInterval(playArpNote, MOOD.arpEvery);
      stepTimer = setInterval(playStep, Math.round(30000 / (MOOD.bpm || 76))); // 8th notes at the level's tempo
    };

    const stopMusic = () => {
      clearInterval(padTimer);
      clearInterval(arpTimer);
      clearInterval(stepTimer);
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
    let hadGesture = false;
    const onGesture = () => { hadGesture = true; ensure(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, onGesture, { passive: true }));
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
      g.gain.exponentialRampToValueAtTime(o.gain || 0.15, t + Math.min(0.06, dur * 0.4));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + dur + 0.05);
    };
    const rumble = (dur, o = {}) => {
      // brown-ish noise through a lowpass — the deep engine bed of a real launch
      const t = ctx.currentTime + (o.delay || 0);
      const len = Math.ceil(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = 0.5;
      f.frequency.setValueAtTime(o.from || 60, t);
      f.frequency.exponentialRampToValueAtTime(o.to || 140, t + dur * 0.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.gain || 0.4, t + 0.25);
      g.gain.setValueAtTime(o.gain || 0.4, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + dur + 0.05);
    };
    const play = (name) => {
      ensure();
      if (!ctx) return;
      // after a real gesture, schedule even while the context is still resuming —
      // the notes fire the instant it goes live (first-click reliability everywhere)
      if (ctx.state !== 'running' && !hadGesture) return;
      try {
        switch (name) {
          case 'click':
            tone(660, 0.07, { type: 'triangle', gain: 0.06 });
            tone(990, 0.05, { gain: 0.035, delay: 0.03 });
            break;
          case 'hover':
            tone(540, 0.045, { gain: 0.02 });
            break;
          case 'pop':
            tone(392, 0.12, { gain: 0.05 });
            tone(587.33, 0.1, { gain: 0.04, delay: 0.06 });
            break;
          case 'hyper':
            whoosh(0.6, { gain: 0.3, from: 700, to: 6500 }); // rising warp sweep
            tone(320, 0.55, { gain: 0.12, slideTo: 1280 });
            tone(1046.5, 0.4, { gain: 0.08, delay: 0.15, slideTo: 2093 });
            break;
          case 'portal':
            whoosh(0.75, { gain: 0.24, from: 260, to: 2600 });
            tone(220, 0.75, { gain: 0.1, slideTo: 880 });
            break;
          case 'rocket':
            whoosh(0.4, { gain: 0.35, from: 300, to: 3500 }); // ignition burst
            rumble(3, { gain: 0.55, from: 90, to: 380 }); // engine bed — raised into speaker-audible range
            whoosh(2.7, { gain: 0.3, from: 220, to: 2400, delay: 0.2 }); // rising exhaust roar
            tone(42, 2.6, { gain: 0.25, slideTo: 95 }); // sub-bass swell for real speakers
            whoosh(0.55, { gain: 0.22, from: 2500, to: 6500, delay: 1.5 }); // bright sizzle synced to the warp flash
            for (let i = 0; i < 22; i++) { // combustion crackle — the signature of a real launch
              whoosh(0.05 + Math.random() * 0.05, {
                gain: 0.1 + Math.random() * 0.12,
                from: 400 + Math.random() * 900,
                to: 900 + Math.random() * 1600,
                delay: 0.15 + Math.random() * 2.3,
              });
            }
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
      const nameInput = document.getElementById('pilotName');
      if (nameInput && pilotStored) nameInput.value = pilotStored;
      const savePilot = () => {
        const v = nameInput ? nameInput.value.trim().slice(0, 24) : '';
        if (v) { try { localStorage.setItem('aa_pilot', v); } catch (e) {} }
        return v || pilot;
      };
      const skipBtn = document.getElementById('entrySkip');
      if (skipBtn) skipBtn.addEventListener('click', () => {
        const who = savePilot();
        done();
        setTimeout(() => toast(`🚀 Welcome aboard, ${who}.`), 700);
      });
      const launchBtn = document.getElementById('entryBtn');
      if (nameInput && launchBtn) nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') launchBtn.click();
      });
      if (launchBtn) launchBtn.addEventListener('click', () => {
        const who = savePilot();
        setTimeout(() => toast(`🚀 Welcome aboard, ${who}. 9 discoveries await.`), 2600);
        sfx.play('rocket');
        entry.classList.add('launching');
        // launchpad smoke billowing out during ignition
        for (let i = 0; i < 14; i++) {
          setTimeout(() => {
            if (!entry.isConnected) return;
            const puff = document.createElement('div');
            puff.className = 'r-smoke';
            puff.style.setProperty('--sx', `${(Math.random() * 2 - 1) * 110}px`);
            entry.appendChild(puff);
            setTimeout(() => puff.remove(), 2500);
          }, i * 90);
        }
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
    { id: 'demo', icon: '🧪', name: 'App Autopsy', hint: 'run the Hostel App check-in demo' },
  ];
  // per-visit progress: the log starts at 0/9 for every fresh visit (survives page hops, resets next visit)
  const loadQuests = () => { try { return JSON.parse(sessionStorage.getItem('aa_quests') || '{}'); } catch (e) { return {}; } };
  const questState = loadQuests();

  const hud = document.createElement('div');
  hud.className = 'quest-hud';
  hud.innerHTML =
    '<button class="quest-pill" type="button" aria-label="Explorer progress — open quest log">' +
    '<span class="q-orb"></span><b class="q-count">0/8</b><span class="q-bar"><i></i></span></button>' +
    '<div class="quest-panel"><h4>EXPLORER LOG</h4><p class="q-sub">Discover everything this universe hides…</p><ul></ul></div>';
  document.body.appendChild(hud);
  const pill = hud.querySelector('.quest-pill');
  let dragMoved = false;
  pill.addEventListener('click', () => {
    if (dragMoved) { dragMoved = false; return; } // that was a drag, not a click
    const r = hud.getBoundingClientRect();
    hud.classList.toggle('panel-down', r.top < window.innerHeight / 2);
    hud.classList.toggle('panel-right', r.left > window.innerWidth - 300);
    hud.classList.toggle('open');
  });
  // the HUD is draggable — park it anywhere; the spot is remembered
  const applyHudPos = (x, y) => {
    const r = hud.getBoundingClientRect();
    hud.style.left = `${Math.min(Math.max(8, x), window.innerWidth - r.width - 8)}px`;
    hud.style.top = `${Math.min(Math.max(8, y), window.innerHeight - r.height - 8)}px`;
    hud.style.bottom = 'auto';
    hud.style.right = 'auto';
  };
  try {
    const savedPos = JSON.parse(localStorage.getItem('aa_hud_pos') || 'null');
    if (savedPos && typeof savedPos.x === 'number') applyHudPos(savedPos.x, savedPos.y);
  } catch (e) {}
  let hudDrag = null;
  pill.addEventListener('pointerdown', (e) => {
    const r = hud.getBoundingClientRect();
    hudDrag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
    dragMoved = false;
    pill.setPointerCapture(e.pointerId);
  });
  pill.addEventListener('pointermove', (e) => {
    if (!hudDrag) return;
    const dx = e.clientX - hudDrag.sx;
    const dy = e.clientY - hudDrag.sy;
    if (!dragMoved && Math.hypot(dx, dy) < 6) return;
    dragMoved = true;
    applyHudPos(hudDrag.ox + dx, hudDrag.oy + dy);
  });
  pill.addEventListener('pointerup', () => {
    if (!hudDrag) return;
    hudDrag = null;
    if (dragMoved) {
      const r = hud.getBoundingClientRect();
      try { localStorage.setItem('aa_hud_pos', JSON.stringify({ x: r.left, y: r.top })); } catch (e) {}
    }
  });
  window.addEventListener('resize', () => {
    if (hud.style.top) applyHudPos(parseFloat(hud.style.left), parseFloat(hud.style.top));
  });

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
    try { sessionStorage.setItem('aa_quests', JSON.stringify(questState)); } catch (e) {}
    renderQuests();
    const done = QUESTS.filter((x) => questState[x.id]).length;
    toast(`🏆 ${q.icon} ${q.name} discovered · ${done}/${QUESTS.length}`);
    sfx.play('unlock');
    if (!reduceMotion) sparkBurst(window.innerWidth / 2, 130, 14);
    if (done === QUESTS.length) {
      setTimeout(() => {
        toast(`🌟 100% EXPLORED — ${pilot}, you’ve seen the whole universe. Respect!`);
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
  const LEVELS = { 'about.html': '01', 'journey.html': '02', 'projects.html': '03', 'hostel-app.html': '03★', 'contact.html': '04' };
  // remember every page this browser has visited — encounters never pitch a page you've already seen
  const visitedPages = (() => { try { return JSON.parse(localStorage.getItem('aa_visited') || '[]'); } catch (e) { return []; } })();
  if (visitedPages.indexOf(pageFile) === -1) {
    visitedPages.push(pageFile);
    try { localStorage.setItem('aa_visited', JSON.stringify(visitedPages)); } catch (e) {}
  }
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
        toast(`✅ LEVEL ${lvl} CLEARED — nice run, ${pilot}. A portal has been revealed`);
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

  /* ---------- level intro card on arrival ---------- */
  const INTROS = {
    'index.html': ['LEVEL 00', 'Spawn Point', 'Nine discoveries hide in this universe. Explore everything.'],
    'about.html': ['LEVEL 01', 'About the Architect', 'Who’s building all this — and why fundamentals come first.'],
    'journey.html': ['LEVEL 02', 'The Coding Journey', 'Live Codeforces stats and the roadmap of the whole run.'],
    'projects.html': ['LEVEL 03', 'The Vault of Builds', 'Real projects only — one of them has its own play area.'],
    'hostel-app.html': ['LEVEL 03★', 'Simulation Zone', 'You’re inside the app now. Run a check-in.'],
    'contact.html': ['LEVEL 04', 'Final Level', 'Say hello — the architect actually replies.'],
  };
  const intro = INTROS[pageFile];
  if (intro && !reduceMotion) {
    const showIntro = () => {
      const el = document.createElement('div');
      el.className = 'level-intro';
      el.innerHTML = `<small>${intro[0]}</small><b>${intro[1]}</b><p>${intro[2]}</p>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      sfx.play('pop');
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 500);
      }, 2400);
    };
    if (document.getElementById('entryScreen') && document.body.classList.contains('entry-hold')) {
      const waitEntry = setInterval(() => {
        if (!document.body.classList.contains('entry-hold')) {
          clearInterval(waitEntry);
          setTimeout(showIntro, 400);
        }
      }, 300);
    } else {
      setTimeout(showIntro, 900); // right after the portal step-out
    }
  }

  /* ---------- hyperjump: flash + warp sound + jump to the next level ---------- */
  const NEXT_PAGE = { 'index.html': 'about.html', 'about.html': 'journey.html', 'journey.html': 'projects.html', 'projects.html': 'hostel-app.html', 'hostel-app.html': 'contact.html', 'contact.html': 'index.html' };
  const hyperDest = NEXT_PAGE[pageFile];
  if (hyperDest) {
    const hbtn = document.createElement('button');
    hbtn.type = 'button';
    hbtn.className = 'hyper-btn';
    hbtn.textContent = '⚡ HYPERJUMP';
    hbtn.setAttribute('aria-label', 'Hyperjump to the next level');
    const host = document.querySelector('.page-next');
    if (host) host.appendChild(hbtn);
    else {
      hbtn.classList.add('hyper-fixed'); // home has no exit arrow — dock it bottom-right
      document.body.appendChild(hbtn);
    }
    let jumping = false;
    hbtn.addEventListener('click', () => {
      if (jumping) return;
      jumping = true;
      sfx.play('hyper');
      if (!reduceMotion) {
        const fl = document.createElement('div');
        fl.className = 'hyper-flash';
        document.body.appendChild(fl);
      }
      setTimeout(() => { window.location.href = hyperDest; }, reduceMotion ? 120 : 500);
    });
  }

  /* ---------- cinematic sky: shooting stars + a passing rocket ---------- */
  if (finePointer && !reduceMotion) {
    const spawnShootingStar = () => {
      const s = document.createElement('i');
      s.className = 'shooting-star';
      s.style.top = `${5 + Math.random() * 40}%`;
      s.style.left = `${30 + Math.random() * 60}%`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1400);
      setTimeout(spawnShootingStar, 7000 + Math.random() * 12000);
    };
    setTimeout(spawnShootingStar, 4000);
    const spawnCruiser = () => {
      const r = document.createElement('i');
      r.className = 'sky-rocket';
      r.innerHTML = '<span class="sr-fin"></span><span class="sr-body"></span><span class="sr-flame"></span>';
      r.style.top = `${15 + Math.random() * 55}%`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 9500);
      setTimeout(spawnCruiser, 30000 + Math.random() * 25000);
    };
    setTimeout(spawnCruiser, 12000);
  }

  /* ---------- floating home warp — visible on every level ---------- */
  if (pageFile !== 'index.html') {
    const homeBtn = document.createElement('a');
    homeBtn.className = 'home-warp';
    homeBtn.href = 'index.html';
    homeBtn.setAttribute('aria-label', 'Warp back to the home screen');
    homeBtn.innerHTML = '<b>⌂</b>HOME';
    document.body.appendChild(homeBtn);
  }

  /* ---------- random encounters: RPG-style popups while scrolling ---------- */
  // every encounter is about the page the visitor is currently on — no cross-page pitches
  const ENCOUNTERS = [
    { id: 'home-terminal', page: 'index.html', q: '{p}, that terminal in the hero is typing Arvin’s real details — did you catch it before it loops?', a: 'Show me →', target: '.terminal' },
    { id: 'home-portals', page: 'index.html', q: 'Four portals are waiting on this page — each hides something the others don’t. Skip one, and you’ll never know what you missed…', a: 'Take me to them →', target: '.explore-grid' },
    { id: 'about-facts', page: 'about.html', q: 'A quick-facts panel is hiding right under the [ LEVEL 01 ] label. Want a peek?', a: 'Reveal it →', target: '.section-label-row', reveal: true },
    { id: 'journey-roadmap', page: 'journey.html', q: 'Further down this page sits the full roadmap of the run — cleared levels and locked ones. Seen it?', a: 'Jump to the roadmap →', target: '.roadmap' },
    { id: 'journey-snapshot', page: 'journey.html', q: '{p}, a CP snapshot hides under the [ LEVEL 02 ] label — live solve count included.', a: 'Reveal it →', target: '.section-label-row', reveal: true },
    { id: 'projects-hood', page: 'projects.html', q: 'Most visitors never find these: every project card hides an “under the hood” panel. Want one opened — or will you hunt them yourself?', a: 'Open one →', target: '.project-card', reveal: true },
    { id: 'app-sim', page: 'hostel-app.html', q: '{p}, that 🛠️ bar at the bottom of the phone is a real dev tool from the app — you can flip time itself.', a: 'Show me →', target: '.rn-devbar' },
    { id: 'contact-copy', page: 'contact.html', q: '{p}, tap the email row on the connect card and it copies instantly — one tap, no typing.', a: 'Show me →', target: '.connect-card' },
    { id: 'log', page: '*', q: 'Your explorer log is watching you. Some entries are still ??? — how many have YOU unlocked?', a: 'Check my log', action: 'log' },
    { id: 'music', page: '*', q: 'This universe has a soundtrack — synthesized live in your browser, zero audio files. Want it on?', a: 'Play the soundtrack', action: 'music' },
  ];
  const encShown = (() => { try { return JSON.parse(sessionStorage.getItem('aa_enc') || '[]'); } catch (e) { return []; } })();
  const encEligible = ENCOUNTERS.filter((x) => {
    if (encShown.indexOf(x.id) !== -1) return false;
    if (x.page !== '*' && x.page !== pageFile) return false; // only hints about THIS page
    if (x.target && !document.querySelector(x.target)) return false;
    if (x.id === 'music' && questState.music) return false;
    if (x.id === 'log' && QUESTS.every((q) => questState[q.id])) return false;
    return true;
  });
  // prefer a hint specific to this page; the generic ones are a fallback
  const encPageSpecific = encEligible.filter((x) => x.page !== '*');
  const encPool = encPageSpecific.length ? encPageSpecific : encEligible;
  const showEncounter = (enc) => {
      try { sessionStorage.setItem('aa_enc', JSON.stringify(encShown.concat(enc.id))); } catch (e) {}
      const ov = document.createElement('div');
      ov.className = 'encounter';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.setAttribute('aria-label', 'Random encounter');
      const card = document.createElement('div');
      card.className = 'enc-card';
      // always greet by the freshest saved name (it may have been logged after page load)
      let liveName = pilot;
      try { liveName = ((localStorage.getItem('aa_pilot') || '').trim() || 'Explorer').slice(0, 24); } catch (e) {}
      const eyebrow = document.createElement('p');
      eyebrow.className = 'enc-eyebrow';
      eyebrow.textContent = `⚡ ${liveName.toUpperCase()} · RANDOM ENCOUNTER`;
      card.appendChild(eyebrow);
      const h = document.createElement('h3');
      h.textContent = enc.q.replace('{p}', liveName);
      card.appendChild(h);
      let nameField = null;
      if (enc.input) {
        nameField = document.createElement('input');
        nameField.type = 'text';
        nameField.maxLength = 24;
        nameField.placeholder = 'your name, pilot';
        nameField.className = 'enc-input';
        nameField.setAttribute('aria-label', 'Your name');
        card.appendChild(nameField);
      }
      const actions = document.createElement('div');
      actions.className = 'enc-actions';
      card.appendChild(actions);
      ov.appendChild(card);
      const dismiss = () => {
        ov.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => ov.remove(), 380);
      };
      const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
      const primary = document.createElement('button');
      primary.type = 'button';
      primary.addEventListener('click', () => {
        if (enc.input && nameField) {
          const v = nameField.value.trim().slice(0, 24);
          if (v) {
            try { localStorage.setItem('aa_pilot', v); } catch (e) {}
            toast(`🫡 Logged, ${v}. This universe knows you now.`);
            sfx.play('unlock');
          }
        }
        if (enc.action === 'log') hud.classList.add('open');
        if (enc.action === 'music') {
          const m = document.getElementById('musicToggle');
          if (m && !m.classList.contains('is-playing')) m.click();
        }
        if (enc.target) {
          const t = document.querySelector(enc.target);
          if (t) {
            t.scrollIntoView({ behavior: 'smooth', block: 'center' });
            t.classList.add('enc-glow');
            if (enc.reveal) t.classList.add('show-details');
            setTimeout(() => {
              t.classList.remove('enc-glow');
              if (enc.reveal) t.classList.remove('show-details');
            }, 3800);
          }
        }
        dismiss();
      });
      primary.className = 'button button-primary';
      primary.textContent = enc.a;
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'enc-skip';
      skip.textContent = 'skip — i can handle missing out 😏';
      skip.addEventListener('click', dismiss);
      actions.appendChild(primary);
      actions.appendChild(skip);
      ov.addEventListener('click', (e) => { if (e.target === ov) dismiss(); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('show'));
      sfx.play('pop');
      if (nameField) {
        nameField.addEventListener('keydown', (e) => { if (e.key === 'Enter') primary.click(); });
        nameField.focus();
      } else {
        primary.focus();
      }
    };
  if (encPool.length) {
    // trigger: after real scrolling plus a little time on the level — feels random, never instant
    const encThreshold = 700 + Math.random() * 900;
    const encStart = Date.now();
    let encScrolled = 0;
    let encLastY = window.scrollY;
    const onScrollEnc = () => {
      encScrolled += Math.abs(window.scrollY - encLastY);
      encLastY = window.scrollY;
      if (encScrolled < encThreshold || Date.now() - encStart < 9000) return;
      if (document.body.classList.contains('entry-hold')) return;
      window.removeEventListener('scroll', onScrollEnc);
      let storedName = '';
      try { storedName = (localStorage.getItem('aa_pilot') || '').trim(); } catch (e) {}
      if (!storedName) {
        // no pilot on record — the first encounter recruits them by name
        showEncounter({ id: 'name', q: 'Hold up — who’s exploring this universe? The log needs a name.', a: 'Log me in ✓', input: true });
      } else {
        showEncounter(encPool[Math.floor(Math.random() * encPool.length)]);
      }
    };
    window.addEventListener('scroll', onScrollEnc, { passive: true });
  }

  /* ---------- final level: has the pilot really cleared 9/9? ---------- */
  if (pageFile === 'contact.html') {
    let finalAsked = false;
    try { finalAsked = sessionStorage.getItem('aa_final') === '1'; } catch (e) {}
    if (!finalAsked) {
      setTimeout(() => {
        try { sessionStorage.setItem('aa_final', '1'); } catch (e) {}
        const doneCount = QUESTS.filter((q) => questState[q.id]).length;
        const total = QUESTS.length;
        if (doneCount >= total) {
          showEncounter({ id: 'final', q: `${pilot}, ${total}/${total} — a fully cleared universe. Legends only. One thing left: actually say hello.`, a: 'Take a bow 🏆', action: 'log' });
        } else {
          showEncounter({ id: 'final', q: `Hold on, ${pilot} — this is the FINAL LEVEL and your log says ${doneCount}/${total}. ${total - doneCount} discoveries are still hiding out there. Leaving already?`, a: 'Open my log', action: 'log' });
        }
      }, 7000);
    }
  }

  /* ---------- hostel app: faithful simulator of the real app's screens ---------- */
  const rnAction = document.getElementById('rnAction');
  if (rnAction) {
    const $id = (x) => document.getElementById(x);
    const rnBadge = $id('rnBadge'), rnCard = $id('rnCard'), rnSims = $id('rnSims'), rnSimLabel = $id('rnSimLabel');
    const rnCamera = $id('rnCamera'), rnCamStatus = $id('rnCamStatus'), rnVerify = $id('rnVerify');
    const rnVTitle = $id('rnVTitle'), rnVSub = $id('rnVSub'), rnVSteps = $id('rnVSteps'), rnVFoot = $id('rnVFoot'), rnVDone = $id('rnVDone');
    $id('rnDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    // the visitor plays the student in the demo — log them in by their pilot name
    if (pilotStored) {
      const nameEl = document.querySelector('.rn-profile b');
      const avEl = document.querySelector('.rn-avatar');
      if (nameEl) nameEl.textContent = pilot;
      if (avEl) avEl.textContent = pilot.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    }

    const SCHED = 'Open: 10:30 PM • Deadline: 11:00 PM • Grace: 11:10 PM';
    // every string below is verbatim from the real app's source
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

    const rnCount = () => {
      const c = RN[rnState];
      const line = rnMarkedAt
        ? 'Attendance recorded successfully for tonight'
        : c.card[3].replace('{t}', `${Math.floor(rnRemain / 60)}m ${String(rnRemain % 60).padStart(2, '0')}s`);
      const el = rnCard.querySelector('.rn-count');
      if (el) el.textContent = line;
    };

    let rnStartFlow = null; // assigned below
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
        rnTick = setInterval(() => {
          if (rnRemain > 0) { rnRemain--; rnCount(); }
        }, 1000);
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
          sfx.play('unlock');
          return;
        }
        rows[i].classList.add('checking');
        rows[i].querySelector('em').textContent = 'CHECKING';
        setTimeout(() => {
          rows[i].classList.remove('checking');
          rows[i].classList.add('passed');
          rows[i].querySelector('.rn-snum').textContent = '✓';
          rows[i].querySelector('em').textContent = 'PASSED';
          if (i >= 1) lightFlow(i + 1); // face/geofence/wifi/server gates on the page diagram
          sfx.play('click');
          setTimeout(() => step(i + 1), 170);
        }, 700);
      };
      step(0);
    };

    // real selfie feed for the face step — stays in the browser, never recorded or uploaded
    const rnFeed = $id('rnCamFeed');
    const rnFacemoji = $id('rnFacemoji');
    let rnStream = null;
    const rnStopCam = () => {
      if (rnStream) {
        rnStream.getTracks().forEach((t) => t.stop());
        rnStream = null;
      }
      if (rnFeed) {
        rnFeed.srcObject = null;
        rnFeed.hidden = true;
      }
      if (rnFacemoji) rnFacemoji.hidden = false;
    };
    // the flow diagram on the page lights up in sync with the demo
    const flowRoad = document.querySelectorAll('#appFlow > li');
    const lightFlow = (i) => {
      const li = flowRoad[i];
      if (li && !li.classList.contains('done')) {
        li.classList.add('done');
        sfx.play('click');
      }
    };
    const resetFlow = () => flowRoad.forEach((li) => li.classList.remove('done'));
    rnStartFlow = () => {
      if (rnFlow) return;
      rnFlow = true;
      rnCamera.hidden = false;
      rnCamStatus.textContent = 'Position your face in the frame';
      sfx.play('pop');
      lightFlow(0); // liveness challenge issued
      if (rnFeed && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
          .then((stream) => {
            if (rnCamera.hidden) { stream.getTracks().forEach((t) => t.stop()); return; } // flow already over
            rnStream = stream;
            rnFeed.srcObject = stream;
            rnFeed.hidden = false;
            if (rnFacemoji) rnFacemoji.hidden = true;
          })
          .catch(() => {}); // denied or no camera — the stand-in avatar stays
      }
      // tight 3-second capture: position → challenge → smile → got it
      const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      setTimeout(() => { rnCamStatus.textContent = challenge; sfx.play('click'); }, 800);
      setTimeout(() => { rnCamStatus.textContent = `Smile, ${pilot} 😄`; sfx.play('pop'); }, 1700);
      setTimeout(() => { rnCamStatus.textContent = '✓ Got it'; sfx.play('click'); lightFlow(1); }, 2500);
      setTimeout(() => { rnStopCam(); rnCamera.hidden = true; rnRunVerify(); }, 3000);
    };

    rnVDone.addEventListener('click', () => {
      rnVerify.hidden = true;
      rnMarkedAt = RN[rnState].marked || '10:37 PM';
      rnFlow = false;
      rnRender();
      lightFlow(6); // nightly automation — the last stage on the page diagram
      unlock('demo');
      if (!reduceMotion) {
        const r = rnAction.getBoundingClientRect();
        sparkBurst(r.left + r.width / 2, Math.max(60, r.top + 30), 12);
      }
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
