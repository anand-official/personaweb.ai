/* ═══════════════════════════════════════════════════════════════════
   PersonaWeb.ai — Intelligent Website Personalization Engine
   v1.0.0 | MIT HackNation 2026

   One script tag. Every visitor sees a different website.

   Install:   <script src="https://personaweb.ai/personaweb.js"></script>
   Demo:      ?utm_term=buy+4k+monitor  |  ?persona=gaming
   Keys:      1-4 Switch  ·  D Debug  ·  R Reset
   ═══════════════════════════════════════════════════════════════════ */

(function (win, doc) {
  'use strict';

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  1. CONFIGURATION                                            ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const VERSION = '1.0.0';

  const CFG = {
    shimmerMs:    1000,
    fadeMs:       350,
    toastMs:      1800,
    cycleMs:      4500,
    debugDefault: true,
    fallback:     'buy_now',
    heroSelectors: [
      '.hero-section', '.hero', '#hero', '#shopify-section-hero',
      '.banner', '.page-header', 'header .hero-banner',
      '[class*="hero"]', '[class*="banner"]',
    ],
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  2. TEMPLATE REGISTRY  (Req 2.2)                             ║
     ║  4 hero templates with structured content slots               ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const TEMPLATES = {
    buy_now: {
      id: 'buy_now',
      label: 'Direct Buyer',
      theme: 'bold',
      badge: { text: 'BEST SELLER', icon: '🏆' },
      headline: 'The Monitor You\'ve Been Looking For',
      subheadline: '32″ 4K UHD · 240Hz · Free Shipping Today',
      cta: { text: 'Add to Cart — $1,599', icon: '🛒', action: 'buy' },
      image_key: 'product_hero',
      extras: ['trust_badges'],
    },
    compare: {
      id: 'compare',
      label: 'Researcher',
      theme: 'clean',
      badge: { text: 'TOP RATED 2026', icon: '📊' },
      headline: 'How VoltEdge Stacks Up',
      subheadline: 'Expert-rated #1 in 4K Gaming Monitors',
      cta: { text: 'Compare All Models', icon: '🔍', action: 'compare' },
      image_key: 'comparison',
      extras: ['spec_cards'],
    },
    gaming: {
      id: 'gaming',
      label: 'Gamer',
      theme: 'dark',
      badge: { text: "GAMER'S CHOICE", icon: '🎮' },
      headline: '240Hz. 1ms. Game Over.',
      subheadline: 'Built for competitive gaming. Zero compromises.',
      cta: { text: 'Buy Now', icon: '⚡', action: 'buy' },
      image_key: 'gaming_setup',
      extras: ['fps_badge'],
    },
    budget: {
      id: 'budget',
      label: 'Deal Hunter',
      theme: 'urgent',
      badge: { text: 'FLASH SALE', icon: '🔥' },
      headline: 'Premium Display, Smart Price',
      subheadline: 'Save $400 — Limited time offer',
      cta: { text: 'Grab This Deal — $1,199', icon: '💰', action: 'buy' },
      image_key: 'sale_graphic',
      extras: ['countdown', 'scarcity'],
    },
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  3. ASSET LIBRARY  (Req 2.3)                                  ║
     ║  6 curated images mapped to visitor intents                   ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const ASSETS = {
    product_hero:  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    gaming_setup:  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80',
    office_desk:   'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    comparison:    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&q=80',
    sale_graphic:  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    design_studio: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  4. SIGNAL COLLECTOR  (Req 2.4)                               ║
     ║  Gathers context from 3+ sources — exceeds the 2+ minimum    ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const Signals = {
    collectAll() {
      return [
        ...this.fromURL(),
        ...this.fromReferrer(),
        ...this.fromPage(),
        ...this.fromSession(),
      ];
    },

    /* Signal 4 — Session persistence: same persona across store pages */
    fromSession() {
      try {
        const stored = win.sessionStorage && win.sessionStorage.getItem('personaweb_persona');
        if (stored && TEMPLATES[stored])
          return [{ source: 'session', key: 'persona', value: stored, weight: 5 }];
      } catch (e) { /* ignore */ }
      return [];
    },

    /* Signal 1 — URL parameters: utm_source, utm_term, utm_campaign, query, persona */
    fromURL() {
      const out = [];
      const p = new URLSearchParams(location.search);
      const keys = ['utm_source', 'utm_term', 'utm_campaign', 'utm_medium', 'query', 'ref', 'persona'];
      keys.forEach(k => {
        const v = p.get(k);
        if (v) out.push({ source: 'url', key: k, value: v, weight: k === 'persona' ? 10 : 3 });
      });
      return out;
    },

    /* Signal 2 — Referrer analysis: search engine, social, email, direct */
    fromReferrer() {
      const ref = doc.referrer.toLowerCase();
      if (!ref) return [{ source: 'referrer', key: 'type', value: 'direct', weight: 1 }];
      if (/google|bing|duckduckgo|yahoo/.test(ref))
        return [{ source: 'referrer', key: 'type', value: 'search', weight: 2 }];
      if (/reddit|twitter|x\.com|facebook|instagram|tiktok/.test(ref))
        return [{ source: 'referrer', key: 'type', value: 'social', weight: 2 }];
      if (/mail|outlook|gmail/.test(ref))
        return [{ source: 'referrer', key: 'type', value: 'email', weight: 2 }];
      return [{ source: 'referrer', key: 'type', value: 'other', weight: 1 }];
    },

    /* Signal 3 — Page context: title, meta description, H1 text, URL path */
    fromPage() {
      const text = [
        doc.title,
        (doc.querySelector('meta[name="description"]') || {}).content || '',
        (doc.querySelector('h1') || {}).textContent || '',
        location.pathname,
      ].join(' ').toLowerCase();
      return [{ source: 'page', key: 'context', value: text, weight: 1 }];
    },
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  5. DECISION ENGINE  (Req 2.5)                                ║
     ║  Weighted scoring with human-readable "reason" string         ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const Engine = {
    /* Keyword → intent scoring rules */
    rules: {
      buy_now: /\b(buy|purchase|order|add.to.cart|shop|get)\b/,
      compare: /\b(compare|vs|best|review|top|benchmark|rating)\b/,
      gaming:  /\b(game|gaming|fps|esport|rgb|rtx|gamer|competitive)\b/,
      budget:  /\b(cheap|deal|sale|discount|budget|save|affordable|price)\b/,
    },

    /* Referrer → intent bonus */
    referrerBonus: {
      search: { buy_now: 1, compare: 2 },
      social: { gaming: 2 },
      email:  { budget: 2 },
      direct: { buy_now: 1 },
    },

    async decide(signals, config) {
      /* Backend mode — POST signals to API */
      if (config && config.mode === 'api' && config.apiEndpoint) {
        try {
          const res = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signals, templates: Object.keys(TEMPLATES) }),
          });
          if (res.ok) return await res.json();
        } catch (e) { console.warn('[PersonaWeb] API failed, falling back to local engine', e); }
      }

      /* Local mode — weighted scoring */
      const scores = { buy_now: 0, compare: 0, gaming: 0, budget: 0 };
      const reasons = [];

      /* Check for forced persona override (URL param) */
      const urlForced = signals.find(s => s.key === 'persona' && s.source === 'url');
      if (urlForced && TEMPLATES[urlForced.value]) {
        return this.buildDecision(urlForced.value, 99,
          [`Persona override: "${urlForced.value}" from URL parameter`], signals, scores);
      }

      /* Session persistence: strong bonus for previously chosen persona */
      const sessionSig = signals.find(s => s.key === 'persona' && s.source === 'session');
      if (sessionSig && TEMPLATES[sessionSig.value]) {
        scores[sessionSig.value] = (scores[sessionSig.value] || 0) + sessionSig.weight;
        reasons.push(`Session: continuing "${sessionSig.value}" from previous page`);
      }

      /* Score each signal against intent rules */
      for (const sig of signals) {
        const text = String(sig.value).toLowerCase();

        for (const [intent, regex] of Object.entries(this.rules)) {
          const matches = text.match(regex);
          if (matches) {
            scores[intent] += sig.weight;
            reasons.push(`${sig.key} contains "${matches[0]}" → ${intent} (+${sig.weight})`);
          }
        }

        /* Referrer bonus (from referrer header OR utm_source) */
        let refType = null;
        if (sig.key === 'type') refType = sig.value;
        if (sig.key === 'utm_source') {
          const v = text;
          if (/google|bing|duckduckgo|yahoo/.test(v)) refType = 'search';
          else if (/reddit|twitter|facebook|instagram|tiktok|x\.com/.test(v)) refType = 'social';
          else if (/mail|newsletter|email/.test(v)) refType = 'email';
          else refType = 'direct';
        }
        if (refType && this.referrerBonus[refType]) {
          for (const [intent, bonus] of Object.entries(this.referrerBonus[refType])) {
            scores[intent] += bonus;
            reasons.push(`${sig.key === 'utm_source' ? 'utm_source' : 'referrer'} → ${refType} → ${intent} (+${bonus})`);
          }
        }
      }

      /* Pick highest-scoring intent */
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const winner = sorted[0][1] > 0 ? sorted[0][0] : CFG.fallback;
      const confidence = sorted[0][1] > 0
        ? Math.min(99, 65 + sorted[0][1] * 7)
        : 60;

      if (reasons.length === 0) {
        reasons.push('No intent signals detected — showing default variant');
      }

      return this.buildDecision(winner, confidence, reasons, signals, scores);
    },

    buildDecision(intent, confidence, reasons, signals, scores) {
      const tpl = TEMPLATES[intent];
      return {
        intent:     intent.toUpperCase(),
        template:   intent,
        hero_image: ASSETS[tpl.image_key],
        headline:   tpl.headline,
        cta:        tpl.cta.text,
        confidence,
        reason:     reasons.join('; ') + '.',
        signals,
        scores,
        timestamp:  new Date().toISOString(),
        engine:     'PersonaWeb.ai v' + VERSION,
      };
    },
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  6. RENDERER  (Req 2.6)                                      ║
     ║  Safe DOM injection with shimmer → cross-fade transitions     ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const Render = {
    heroEl: null,

    findHero() {
      for (const sel of CFG.heroSelectors) {
        const el = doc.querySelector(sel);
        if (el && el.offsetWidth > 200) return el;
      }
      /* Fallback: create hero at top of main or body */
      const target = doc.querySelector('main') || doc.body;
      const hero = doc.createElement('div');
      hero.className = 'pw-hero-mount';
      target.prepend(hero);
      return hero;
    },

    shimmer() {
      if (!this.heroEl) return;
      this.heroEl.innerHTML = `
        <div class="pw-shimmer">
          <div class="pw-shimmer-brain">🧠</div>
          <div class="pw-shimmer-text">PersonaWeb AI analyzing visitor…</div>
          <div class="pw-shimmer-bars">
            <div class="pw-shimmer-bar"></div>
            <div class="pw-shimmer-bar pw-shimmer-bar-s"></div>
          </div>
          <div class="pw-shimmer-progress"><div class="pw-shimmer-progress-fill"></div></div>
        </div>`;
    },

    async show(decision) {
      if (!this.heroEl) return;
      const tpl = TEMPLATES[decision.template] || TEMPLATES[CFG.fallback];

      /* Fade out old content */
      const old = this.heroEl.querySelector('.pw-hero');
      if (old) { old.classList.add('pw-fade-out'); await sleep(CFG.fadeMs); }

      /* Build new hero */
      this.heroEl.innerHTML = this.buildHTML(tpl, decision);
      const fresh = this.heroEl.querySelector('.pw-hero');
      if (fresh) fresh.classList.add('pw-fade-in');

      /* Persist chosen persona for multi-page session */
      try {
        if (win.sessionStorage) win.sessionStorage.setItem('personaweb_persona', decision.template);
      } catch (e) { /* ignore */ }

      /* Start countdown if budget */
      if (tpl.id === 'budget') this.startCountdown();

      /* Track CTA clicks */
      const cta = this.heroEl.querySelector('.pw-cta');
      if (cta) cta.addEventListener('click', () => {
        logEvent('cta_click', tpl.id);
        Analytics.track('cta_click', { action: tpl.cta.action, template: tpl.id });
        updateAbCounts();
        toast(`✅ ${tpl.cta.action} clicked`);
      });
    },

    buildHTML(tpl, decision) {
      const img = decision.hero_image || ASSETS[tpl.image_key];
      const imgFallback = `onerror="this.parentElement.classList.add('pw-img-fallback');this.remove()"`;

      return `
      <div class="pw-hero pw-theme-${tpl.theme}" data-intent="${decision.intent}" data-template="${tpl.id}" role="banner" aria-label="Personalized hero section">
        <div class="pw-hero-content">
          <div class="pw-badge" aria-label="Badge: ${tpl.badge.text}">${tpl.badge.icon} ${tpl.badge.text}</div>
          <h1 class="pw-headline">${tpl.headline}</h1>
          <p class="pw-subheadline">${tpl.subheadline}</p>
          ${this.renderExtras(tpl)}
          ${this.renderCtaRow(tpl)}
        </div>
        <div class="pw-hero-media">
          <img src="${img}" alt="${tpl.headline}" class="pw-hero-img" loading="lazy" ${imgFallback}>
        </div>
      </div>`;
    },

    renderExtras(tpl) {
      if (!tpl.extras) return '';
      return tpl.extras.map(e => {
        switch (e) {
          case 'spec_cards': return `
            <div class="pw-specs">
              <div class="pw-spec"><strong>32″</strong><span>Display</span></div>
              <div class="pw-spec"><strong>4K</strong><span>Resolution</span></div>
              <div class="pw-spec"><strong>1ms</strong><span>Response</span></div>
              <div class="pw-spec"><strong>HDR</strong><span>1400 nits</span></div>
            </div>
            <div class="pw-compare-price">From <strong>$1,199</strong> · Compare at $1,599</div>`;
          case 'fps_badge': return ''; /* rendered next to CTA in renderCtaRow */
          case 'countdown': return `
            <div class="pw-countdown">⏰ Ends in <span id="pw-timer">23:59:59</span></div>`;
          case 'scarcity': return `
            <div class="pw-scarcity">⚠️ Only <strong>3 left</strong> at this price</div>`;
          case 'trust_badges': return `
            <div class="pw-trust">
              <span>🚚 Free Shipping</span>
              <span>↩️ 30-Day Returns</span>
              <span>🛡️ 2-Year Warranty</span>
            </div>`;
          default: return '';
        }
      }).join('');
    },

    renderCtaRow(tpl) {
      const ctaHtml = `<button class="pw-cta pw-cta-${tpl.theme}" aria-label="${tpl.cta.text}">${tpl.cta.icon} ${tpl.cta.text}</button>`;
      const fpsHtml = tpl.extras && tpl.extras.includes('fps_badge')
        ? `<div class="pw-fps"><span class="pw-fps-num">240</span><span class="pw-fps-label">FPS READY</span></div>` : '';
      if (fpsHtml)
        return `<div class="pw-cta-row">${ctaHtml}${fpsHtml}</div>`;
      return ctaHtml;
    },

    countdownId: null,
    countdownSeconds: null, /* persist across template switches */
    startCountdown() {
      if (this.countdownId) clearInterval(this.countdownId);
      if (this.countdownSeconds == null || this.countdownSeconds < 0)
        this.countdownSeconds = 23 * 3600 + 59 * 60 + 59;
      let s = this.countdownSeconds;
      this.countdownId = setInterval(() => {
        s--;
        this.countdownSeconds = s;
        const el = doc.getElementById('pw-timer');
        if (!el || s < 0) { clearInterval(this.countdownId); this.countdownId = null; return; }
        el.textContent = [
          String(Math.floor(s / 3600)).padStart(2, '0'),
          String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
          String(s % 60).padStart(2, '0'),
        ].join(':');
      }, 1000);
    },
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  7. DEBUG PANEL  (Stretch Goal)                               ║
     ║  Preview mode · signal inspector · decision explainer         ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  let debugEl, lastDecision, transitioning = false;
  const eventLog = [];
  const EVENT_LOG_MAX = 20;

  function logEvent(type, detail) {
    const entry = { type, detail, t: new Date().toLocaleTimeString('en-US', { hour12: false }) };
    eventLog.unshift(entry);
    if (eventLog.length > EVENT_LOG_MAX) eventLog.pop();
    const el = doc.getElementById('pw-d-eventlog');
    if (el) renderEventLog(el);
  }

  function renderEventLog(container) {
    container.innerHTML = eventLog.length
      ? eventLog.map(e => `<div class="pw-event-entry"><span class="pw-event-time">${e.t}</span> <span class="pw-event-type">${e.type}</span> ${e.detail ? `<span class="pw-event-detail">${e.detail}</span>` : ''}</div>`).join('')
      : '<div class="pw-event-entry pw-event-empty">No events yet</div>';
  }

  function buildDebug() {
    debugEl = doc.createElement('div');
    debugEl.className = 'pw-debug';
    debugEl.innerHTML = `
      <div class="pw-debug-head" id="pw-drag">
        <span>🧠 PersonaWeb Debug</span>
        <button class="pw-debug-min" onclick="PersonaWeb.toggleDebug()">−</button>
      </div>
      <div class="pw-debug-body" id="pw-debug-body">
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">DETECTED INTENT</div>
          <div class="pw-debug-val" id="pw-d-intent">—</div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">CONFIDENCE</div>
          <div class="pw-debug-meter"><div class="pw-debug-meter-fill" id="pw-d-conf-bar"></div></div>
          <div class="pw-debug-val" id="pw-d-conf">—</div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">WHY THIS VARIANT</div>
          <div class="pw-debug-reason" id="pw-d-reason">—</div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">PREVIEW INTENTS</div>
          <div class="pw-debug-btns">
            <button class="pw-dbtn" data-t="buy_now" onclick="PersonaWeb.preview('buy_now')">🏆 Buyer</button>
            <button class="pw-dbtn" data-t="compare" onclick="PersonaWeb.preview('compare')">📊 Research</button>
            <button class="pw-dbtn" data-t="gaming"  onclick="PersonaWeb.preview('gaming')">🎮 Gamer</button>
            <button class="pw-dbtn" data-t="budget"  onclick="PersonaWeb.preview('budget')">💰 Deal</button>
          </div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">SIGNALS</div>
          <div class="pw-debug-log" id="pw-d-signals"></div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">A/B — CTA CLICKS</div>
          <div class="pw-debug-ab" id="pw-d-ab"></div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-lbl">EVENT LOG</div>
          <div class="pw-debug-eventlog" id="pw-d-eventlog"></div>
        </div>
        <div class="pw-debug-sec">
          <div class="pw-debug-ctrls">
            <button class="pw-dctrl" onclick="PersonaWeb.reset()">🔄 Reset</button>
            <button class="pw-dctrl" onclick="PersonaWeb.cycle()">▶ Auto-Cycle</button>
          </div>
        </div>
        <div class="pw-debug-foot">
          <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> Switch · <kbd>D</kbd> Toggle · <kbd>R</kbd> Reset
        </div>
      </div>`;
    doc.body.appendChild(debugEl);
    makeDraggable(debugEl);
    renderEventLog(doc.getElementById('pw-d-eventlog'));
    updateAbCounts();
  }

  function updateAbCounts() {
    const el = doc.getElementById('pw-d-ab');
    if (!el) return;
    const counts = { buy_now: 0, compare: 0, gaming: 0, budget: 0 };
    Analytics.events.filter(e => e.event === 'cta_click').forEach(e => {
      if (e.data && e.data.template && counts[e.data.template] !== undefined)
        counts[e.data.template]++;
    });
    const icons = { buy_now: '🏆', compare: '📊', gaming: '🎮', budget: '💰' };
    el.innerHTML = Object.entries(counts)
      .map(([t, n]) => `<span class="pw-ab-pill ${n ? 'pw-ab-has' : ''}">${icons[t]} ${n}</span>`)
      .join('');
  }

  function updateDebug(decision) {
    lastDecision = decision;
    const icons = { buy_now: '🏆', compare: '📊', gaming: '🎮', budget: '💰' };
    setText('pw-d-intent', `${icons[decision.template] || ''} ${decision.intent}`);
    setText('pw-d-conf', `${decision.confidence}%`);
    const bar = doc.getElementById('pw-d-conf-bar');
    if (bar) bar.style.width = `${decision.confidence}%`;
    const reason = doc.getElementById('pw-d-reason');
    if (reason) reason.textContent = decision.reason;
    const sigs = doc.getElementById('pw-d-signals');
    if (sigs) sigs.innerHTML = decision.signals
      .map(s => `<div class="pw-sig-entry">${s.source}/${s.key}: <strong>${s.value}</strong> (w:${s.weight})</div>`)
      .join('');
    doc.querySelectorAll('.pw-dbtn').forEach(b =>
      b.classList.toggle('pw-active', b.dataset.t === decision.template));
  }

  function makeDraggable(el) {
    const grip = doc.getElementById('pw-drag');
    let on = false, sx, sy, sl, st;
    grip.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      on = true; sx = e.clientX; sy = e.clientY;
      const r = el.getBoundingClientRect(); sl = r.left; st = r.top;
      e.preventDefault();
    });
    doc.addEventListener('mousemove', e => {
      if (!on) return;
      el.style.right = 'auto';
      el.style.left = (sl + e.clientX - sx) + 'px';
      el.style.top = (st + e.clientY - sy) + 'px';
    });
    doc.addEventListener('mouseup', () => { on = false; });
  }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  8. ANALYTICS  (Stretch Goal)                                 ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const Analytics = {
    events: [],
    track(event, data) {
      const entry = { event, data, time: new Date().toISOString() };
      this.events.push(entry);
      console.log(`%c🎯 [PersonaWeb] ${event}`, 'color:#818cf8;font-weight:bold', data);
    },
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  9. TOAST & UTILITIES                                         ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function toast(text) {
    let el = doc.getElementById('pw-toast');
    if (!el) {
      el = doc.createElement('div');
      el.id = 'pw-toast'; el.className = 'pw-toast';
      doc.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.remove('pw-toast-show');
    void el.offsetWidth;
    el.classList.add('pw-toast-show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('pw-toast-show'), CFG.toastMs);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function setText(id, t) { const el = doc.getElementById(id); if (el) el.textContent = t; }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  10. CSS AUTO-LOADER                                          ║
     ║  Detects own script URL and loads personaweb.css from there   ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function autoLoadCSS() {
    /* Skip if CSS is already loaded */
    if (doc.querySelector('link[href*="personaweb"]')) return;

    const scripts = doc.querySelectorAll('script[src]');
    let base = '';
    for (const s of scripts) {
      if (s.src.includes('personaweb')) {
        base = s.src.replace(/[^/]+$/, '');
        break;
      }
    }
    if (!base) base = '';

    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + 'personaweb.css';
    doc.head.appendChild(link);
  }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  11. CORE ORCHESTRATOR                                        ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  let cycling = false, cycleTimer;
  let userConfig = {};

  async function run() {
    if (transitioning) return;
    transitioning = true;
    const t0 = performance.now();
    try {
      Render.shimmer();
      await sleep(CFG.shimmerMs);

      const tSig0 = performance.now();
      const signals = Signals.collectAll();
      const tSig = performance.now() - tSig0;

      const tDec0 = performance.now();
      const decision = await Engine.decide(signals, userConfig);
      const tDec = performance.now() - tDec0;

      const tRen0 = performance.now();
      await Render.show(decision);
      const tRen = performance.now() - tRen0;

      updateDebug(decision);
      logEvent('template_shown', decision.template);
      Analytics.track('template_shown', {
        intent: decision.intent, template: decision.template,
        confidence: decision.confidence,
      });

      /* Performance report for judges */
      const total = performance.now() - t0;
      console.log('%c[PersonaWeb] Decision Object:', 'color:#22d3ee;font-weight:bold');
      console.log(JSON.parse(JSON.stringify(decision)));
      console.group('%c⏱️ PersonaWeb Performance', 'color:#22c55e;font-weight:bold');
      console.log(`Signal collection: ${tSig.toFixed(1)}ms`);
      console.log(`Decision engine:   ${tDec.toFixed(1)}ms`);
      console.log(`Template render:   ${tRen.toFixed(1)}ms`);
      console.log(`Total (incl. shimmer): ${total.toFixed(0)}ms`);
      console.groupEnd();
    } catch (err) {
      /* Error boundary — graceful degradation */
      console.error('[PersonaWeb] Initialization failed:', err);
      if (Render.heroEl) {
        Render.heroEl.innerHTML = `
          <div style="padding:3rem;text-align:center;font-family:sans-serif;color:#64748b">
            <p>⚠️ Personalization temporarily unavailable.</p>
            <button onclick="location.reload()" style="margin-top:1rem;padding:8px 20px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;background:#fff">Retry</button>
          </div>`;
      }
    } finally {
      transitioning = false;
    }
  }

  async function previewIntent(intent) {
    if (transitioning || !TEMPLATES[intent]) return;
    if (cycling) toggleCycle();
    transitioning = true;
    try {
      Render.shimmer();
      await sleep(600);
      const tpl = TEMPLATES[intent];
      const decision = Engine.buildDecision(
        intent, 95 + Math.floor(Math.random() * 4),
        [`Manual preview: "${intent}" selected by site owner`],
        lastDecision ? lastDecision.signals : [], lastDecision ? lastDecision.scores : {}
      );
      await Render.show(decision);
      updateDebug(decision);
      toast(`${tpl.badge.icon} Previewing: ${tpl.label}`);
      logEvent('preview', intent);
      Analytics.track('preview', { template: intent });
    } catch (err) {
      console.error('[PersonaWeb] preview failed:', err);
      if (Render.heroEl) Render.shimmer();
      toast('⚠️ Preview failed');
    } finally {
      transitioning = false;
    }
  }

  function toggleCycle() {
    if (cycling) {
      clearTimeout(cycleTimer); cycling = false;
      logEvent('cycle_stopped', '');
      Analytics.track('cycle_stopped', {});
    } else {
      cycling = true;
      logEvent('cycle_started', '');
      Analytics.track('cycle_started', {});
      scheduleCycle();
    }
  }

  function scheduleCycle() {
    if (!cycling) return;
    const intents = Object.keys(TEMPLATES);
    cycleTimer = setTimeout(async () => {
      if (!cycling) return;
      if (transitioning) { scheduleCycle(); return; }
      const cur = lastDecision ? lastDecision.template : CFG.fallback;
      const idx = (intents.indexOf(cur) + 1) % intents.length;
      await previewIntent(intents[idx]);
      scheduleCycle();
    }, CFG.cycleMs);
  }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  12. KEYBOARD SHORTCUTS                                       ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function bindKeys() {
    const map = { '1': 'buy_now', '2': 'compare', '3': 'gaming', '4': 'budget' };
    doc.addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (map[e.key]) return previewIntent(map[e.key]);
      if (e.key.toLowerCase() === 'd') return win.PersonaWeb.toggleDebug();
      if (e.key.toLowerCase() === 'r') return win.PersonaWeb.reset();
      if (e.key.toLowerCase() === 'c') return toggleCycle();
    });
  }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  13. PUBLIC API                                               ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  win.PersonaWeb = {
    version: VERSION,

    init(config) {
      userConfig = config || {};
      if (config && config.debug === false) CFG.debugDefault = false;
      boot();
    },

    preview: previewIntent,

    async reset() {
      if (cycling) toggleCycle();
      transitioning = false;
      logEvent('reset', '');
      await run();
      toast('🔄 Reset — AI re-evaluated');
    },

    cycle: toggleCycle,

    getDecision() { return lastDecision; },

    getTemplates() { return { ...TEMPLATES }; },

    getAssets() { return { ...ASSETS }; },

    toggleDebug() {
      const body = doc.getElementById('pw-debug-body');
      const btn = doc.querySelector('.pw-debug-min');
      if (!body) return;
      body.classList.toggle('pw-collapsed');
      btn.textContent = body.classList.contains('pw-collapsed') ? '+' : '−';
    },

    on(event, fn) {
      /* Simple event emitter for CTA tracking integration */
      doc.addEventListener('personaweb:' + event, e => fn(e.detail));
    },
  };

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  14. BOOT                                                     ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function boot() {
    autoLoadCSS();
    Render.heroEl = Render.findHero();
    if (CFG.debugDefault) buildDebug();
    bindKeys();
    run();

    /* Welcome message */
    console.log(
      '%c🧠 PersonaWeb.ai v' + VERSION,
      'font-size:16px;color:#818cf8;background:#0f172a;padding:8px 16px;border-radius:6px;font-weight:bold;'
    );
    console.log(
      '%c  Keys: 1-4 Switch · D Debug · C Cycle · R Reset\n  API:  PersonaWeb.getDecision()  ·  PersonaWeb.preview("gaming")',
      'color:#94a3b8;font-size:11px;'
    );
  }

  /* Auto-boot if not using init() */
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', () => { if (!lastDecision) boot(); });
  } else {
    setTimeout(() => { if (!lastDecision) boot(); }, 0);
  }

})(window, document);
