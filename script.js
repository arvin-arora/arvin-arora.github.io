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
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
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
    document.querySelectorAll('.journey-feature').forEach((card) => {
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

  /* ---------- details reveal (hover/tap the ⓘ buttons) ---------- */
  const canHover = window.matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.details-btn').forEach((btn) => {
    const host = btn.closest('.project-card, .section-label-row');
    if (!host) return;
    let openedAt = 0;
    // On touch devices hover events fire on tap and fight the click toggle,
    // so hover-open/leave-close only bind where real hover exists.
    if (canHover) {
      btn.addEventListener('pointerenter', () => {
        host.classList.add('show-details');
        openedAt = performance.now();
      });
      host.addEventListener('pointerleave', () => host.classList.remove('show-details'));
    }
    // Tap/keyboard toggle (touchscreens have no hover); don't follow any parent link.
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // A tap fires pointerenter+click together — don't let the click undo the open.
      if (performance.now() - openedAt < 500 && host.classList.contains('show-details')) return;
      host.classList.toggle('show-details');
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        host.classList.toggle('show-details');
      }
    });
    // Let the panel itself dismiss on tap too.
    const panel = host.querySelector('.project-details, .section-details');
    if (panel) {
      panel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        host.classList.remove('show-details');
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

    musicBtn.addEventListener('click', () => {
      setPlaying(!musicBtn.classList.contains('is-playing'));
    });

    // Autostart: try immediately; if the browser blocks audio before a user
    // gesture, start on the first interaction anywhere on the page instead.
    const armGestureStart = () => {
      const onFirstGesture = (e) => {
        if (musicBtn.contains(e.target)) return; // let the button's own handler decide
        ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.removeEventListener(ev, onFirstGesture));
        if (!musicBtn.classList.contains('is-playing')) setPlaying(true);
      };
      ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, onFirstGesture));
    };

    setPlaying(true);
    setTimeout(() => {
      if (actx && actx.state !== 'running') {
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
      if (heroCfCount) heroCfCount.textContent = cfDisplay(solved.size);
      document.querySelectorAll('.cf-count').forEach((el) => {
        el.textContent = cfDisplay(solved.size);
      });

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
