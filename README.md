# Arvin Arora — Portfolio Universe

My personal developer portfolio, built as a small game-like universe: hand-written HTML, CSS, and JavaScript — **no frameworks, no libraries, no build step**.

**Live site:** https://arvin-arora.github.io

## The experience

- 🚀 **Rocket entry sequence** — a fake "access terminal" login launches you through a star-warp into the site (once per session)
- 🌀 **Portal page transitions** — every internal navigation opens a swirling portal that swallows the screen from your click point; the next page steps out of a shrinking portal
- 🏆 **Explorer quest log** — 9 hidden discoveries tracked across pages (localStorage), with unlock toasts, a draggable progress HUD, and locked `???` entries to hunt down
- 🧪 **Interactive app case study** — the Hostel Attendance App has its own experience page with a simulated check-in demo (device → GPS → Wi-Fi → anti-spoof → face liveness) and the full API flow
- 🎵 **Generative ambient music** — synthesized live with the Web Audio API (chord pads + sparse pentatonic notes through a delay line)
- ✨ **Interactive effects** — particle constellation canvas, custom cursor, magnetic buttons, click star-bursts, 3D card tilt, glitch text, typewriter headline, animated coding terminal, parallax ghost numerals, drifting aurora backdrop

## Engineering notes

- **Multi-page static site** (Home / About / Journey / Projects / Contact) sharing one stylesheet and one script; every feature is guarded so any page can omit any element
- **Live Codeforces stats** fetched from the public API on every visit — solved count and max streak update themselves
- **Performance-aware**: hero loops pause offscreen via IntersectionObserver, canvas and heavy effects are desktop-only, scroll work is rAF-throttled, phones get a lite mode
- **Accessible & respectful**: full `prefers-reduced-motion` support (portals, rocket, and sparkles all disable), keyboard-visible focus, semantic landmarks
- **SEO**: per-page titles/descriptions/canonicals, Open Graph/Twitter cards, JSON-LD person schema, sitemap

## Honesty policy

Everything on the site is real: real solved-problem counts (live from the API), real projects only, and "Coming Soon" where things don't exist yet.
