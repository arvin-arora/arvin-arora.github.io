# Arvin Arora — Portfolio

My personal site: a single-page, editorial portfolio hand-written in HTML, CSS and JavaScript — **no frameworks, no libraries, no build step**.

**Live:** https://arvin-arora.github.io

## Design

Dark editorial layout inspired by top athlete-brand sites: near-black base, a single fluorescent accent, giant uppercase typography, full-bleed black-and-white photography, and an all-text-link interaction model (no buttons).

- Cinematic entry — the hero photo slow-zooms while the name slides up out of masked lines and a hand-drawn signature stroke draws itself
- Logo morph — the header reads "Arvin Arora." at the top of the page and folds into "AA." as you scroll
- Career-style roadmap — giant year numerals, hairline dividers, honest milestones (done / live / next)
- Scroll-fill name wall, live-updating Codeforces stats with count-up, ticker marquee, staggered scroll reveals

## The app case study

The Hostel Attendance App has its own page with a **working in-browser recreation** of the real check-in flow: liveness challenge, live selfie camera (never recorded or uploaded), the 5-step verification modal, a time-scenario simulator from the app's real dev build, and a pipeline diagram that lights up stage by stage as the demo runs.

## Engineering notes

- Live Codeforces stats fetched from the public API on every visit
- Performance-aware: rAF-throttled scroll work, IntersectionObserver reveals, GPU-only animations
- Full `prefers-reduced-motion` support, semantic landmarks, keyboard-visible focus
- Honest content policy: real numbers (live from the API), real projects only, "Next" where things don't exist yet
