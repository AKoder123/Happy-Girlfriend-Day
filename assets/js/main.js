/* =========================================================
   main.js: gate, petals, gallery, reasons, small joys
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     shared: burst of little hearts at a screen point
     --------------------------------------------------------- */
  var GLYPHS = ['🩷', '💖', '💕', '🌸', '💗'];
  function popHearts(x, y, count) {
    if (reduce) return;
    for (var i = 0; i < (count || 6); i++) {
      var h = document.createElement('span');
      h.className = 'pop-heart';
      h.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      h.style.left = (x + (Math.random() * 70 - 35)) + 'px';
      h.style.top = (y + (Math.random() * 30 - 15)) + 'px';
      h.style.fontSize = (0.9 + Math.random() * 1.3).toFixed(2) + 'rem';
      h.style.animationDelay = (Math.random() * 0.22).toFixed(2) + 's';
      document.body.appendChild(h);
      setTimeout(function (el) { return function () { el.remove(); }; }(h), 1900);
    }
  }
  window.popHearts = popHearts;

  function burstFrom(el, count) {
    var r = el.getBoundingClientRect();
    popHearts(r.left + r.width / 2, r.top + r.height / 2, count || 10);
  }
  window.burstFrom = burstFrom;

  /* ---------------------------------------------------------
     the envelope gate
     --------------------------------------------------------- */
  var gate = document.getElementById('gate');
  var envBtn = document.getElementById('openEnvelope');
  var opened = false;

  function openGate() {
    if (opened) return;
    opened = true;
    envBtn.classList.add('open');
    burstFrom(envBtn, 22);
    setTimeout(function () { burstFrom(envBtn, 14); }, 260);
    setTimeout(function () {
      gate.classList.add('gone');
      document.body.classList.remove('locked');
      setTimeout(function () { gate.remove(); }, 950);
    }, reduce ? 200 : 1150);
  }

  if (gate && envBtn) {
    document.body.classList.add('locked');
    envBtn.addEventListener('click', openGate);
    gate.addEventListener('click', function (e) { if (e.target === gate) openGate(); });
    document.addEventListener('keydown', function (e) {
      if (!opened && (e.key === 'Enter' || e.key === ' ')) openGate();
    });
  }

  /* ---------------------------------------------------------
     falling petals / hearts canvas
     --------------------------------------------------------- */
  var canvas = document.getElementById('petals');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bits = [];
    var W = 0, H = 0;

    function size() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      var n = W < 620 ? 16 : 30;
      bits = [];
      for (var i = 0; i < n; i++) {
        bits.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 4 + Math.random() * 8,
          sp: 0.25 + Math.random() * 0.7,
          drift: (Math.random() - 0.5) * 0.5,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.02,
          a: 0.18 + Math.random() * 0.35,
          heart: Math.random() < 0.45
        });
      }
    }

    function heartPath(s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(0, s * 0.05, -s * 0.5, -s * 0.1, -s * 0.5, s * -0.35);
      ctx.bezierCurveTo(-s * 0.5, -s * 0.72, -s * 0.1, -s * 0.72, 0, -s * 0.4);
      ctx.bezierCurveTo(s * 0.1, -s * 0.72, s * 0.5, -s * 0.72, s * 0.5, -s * 0.35);
      ctx.bezierCurveTo(s * 0.5, -s * 0.1, 0, s * 0.05, 0, s * 0.35);
      ctx.closePath();
    }

    function petalPath(s) {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.62, s * 0.34, 0, 0, Math.PI * 2);
      ctx.closePath();
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.y += b.sp;
        b.x += b.drift + Math.sin(b.y / 70) * 0.35;
        b.rot += b.vr;
        if (b.y - b.r > H) { b.y = -b.r - 10; b.x = Math.random() * W; }
        if (b.x < -30) b.x = W + 20; else if (b.x > W + 30) b.x = -20;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = b.a;
        ctx.fillStyle = b.heart ? '#f767a7' : '#ffb0d2';
        if (b.heart) heartPath(b.r * 1.5); else petalPath(b.r * 1.7);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }

    size(); seed(); frame();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); seed(); }, 180);
    });
  }

  /* ---------------------------------------------------------
     reveal on scroll
     --------------------------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i, 6) * 70) + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------
     nav highlighting
     --------------------------------------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = sections.indexOf(en.target);
        links.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
      });
    }, { threshold: 0.01, rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { if (s) navIO.observe(s); });
  }

  /* ---------------------------------------------------------
     gallery + lightbox
     --------------------------------------------------------- */
  /* ✏️ EDIT ME: captions. Change the words, keep the file names. */
  var PHOTOS = [
    { src: 'photos/mint-and-yellow.jpg',   cap: 'the mint suit and the yellow dress' },
    { src: 'photos/sunlight.jpg',          cap: 'morning light, best kiss' },
    { src: 'photos/olive-couch.jpg',       cap: 'you, casually outshining the room' },
    { src: 'photos/golden-lift.jpg',       cap: 'lift mirror, gold light, my girl' },
    { src: 'photos/round-mirror.jpg',      cap: 'the round mirror one' },
    { src: 'photos/our-hands.jpg',         cap: 'your rings, my favourite hand' },
    { src: 'photos/monash-night.jpg',      cap: 'dressed up and completely unbothered' },
    { src: 'photos/round-mirror-two.jpg',  cap: 'one more, because I couldn\'t choose' }
  ];

  var grid = document.getElementById('galleryGrid');
  if (grid) {
    PHOTOS.forEach(function (p, i) {
      var fig = document.createElement('button');
      fig.className = 'gitem reveal';
      fig.type = 'button';
      fig.setAttribute('aria-label', 'Open photo: ' + p.cap);
      fig.innerHTML =
        '<img src="' + p.src + '" alt="' + p.cap + '" loading="lazy" decoding="async">' +
        '<figcaption>' + p.cap + '</figcaption>';
      fig.addEventListener('click', function () { openLB(i); });
      grid.appendChild(fig);
      if ('IntersectionObserver' in window) {
        var o = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { fig.classList.add('in'); o.disconnect(); }
        }, { threshold: 0.1 });
        o.observe(fig);
      } else { fig.classList.add('in'); }
    });
  }

  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbIdx = 0;

  function openLB(i) {
    lbIdx = i;
    lbImg.src = PHOTOS[i].src;
    lbImg.alt = PHOTOS[i].cap;
    lbCap.textContent = PHOTOS[i].cap;
    lb.hidden = false;
    document.body.classList.add('locked');
    document.getElementById('lbClose').focus();
  }
  function closeLB() { lb.hidden = true; document.body.classList.remove('locked'); }
  function stepLB(d) {
    lbIdx = (lbIdx + d + PHOTOS.length) % PHOTOS.length;
    openLB(lbIdx);
  }

  if (lb) {
    document.getElementById('lbClose').addEventListener('click', closeLB);
    document.getElementById('lbPrev').addEventListener('click', function () { stepLB(-1); });
    document.getElementById('lbNext').addEventListener('click', function () { stepLB(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-fig')) closeLB();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      else if (e.key === 'ArrowLeft') stepLB(-1);
      else if (e.key === 'ArrowRight') stepLB(1);
    });
    /* swipe */
    var sx = 0, sy = 0;
    lb.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) stepLB(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     reasons cards
     --------------------------------------------------------- */
  /* ✏️ EDIT ME: swap these for your own. Twelve keeps the grid neat. */
  var REASONS = [
    'Because your laugh makes me feel like I just won my first basketball tournament all over again.',
    'You make an ordinary Wednesday feel like an occasion.',
    'Your hand fits in mine like somebody measured it.',
    'You pay attention to all the small things, and you always check up on me.',
    'The way you get excited about tiny things. Food. Dogs. A good sale.',
    'You are the quiet in the middle of my very loud head.',
    'The way you look at me when you say you love me.',
    'You are kind to people who can do absolutely nothing for you.',
    'You make me want to be better without ever once asking me to.',
    'Your hugs solve roughly eighty percent of my problems.',
    'You in that yellow dress. And the green one. And your pyjamas.',
    'Because it is you. It was always going to be you.'
  ];

  var rGrid = document.getElementById('reasonGrid');
  var rCount = document.getElementById('reasonCount');
  var allOpen = document.getElementById('allOpen');
  var opened_n = 0;

  if (rGrid) {
    REASONS.forEach(function (text, i) {
      var card = document.createElement('button');
      card.className = 'rcard';
      card.type = 'button';
      card.setAttribute('aria-label', 'Reason ' + (i + 1) + ', tap to open');
      card.innerHTML =
        '<span class="rface rfront">🩷</span>' +
        '<span class="rface rback">' + text + '</span>';
      card.addEventListener('click', function () {
        var wasFlipped = card.classList.contains('flipped');
        card.classList.toggle('flipped');
        if (!wasFlipped) {
          if (!card.dataset.seen) {
            card.dataset.seen = '1';
            opened_n++;
            rCount.textContent = opened_n + ' / ' + REASONS.length + ' opened';
            if (opened_n === REASONS.length) {
              allOpen.classList.add('show');
              burstFrom(rGrid, 30);
            }
          }
          burstFrom(card, 5);
        }
      });
      rGrid.appendChild(card);
    });
    rCount.textContent = '0 / ' + REASONS.length + ' opened';
  }

  /* ---------------------------------------------------------
     tamil flip card
     --------------------------------------------------------- */
  var tc = document.getElementById('tamilCard');
  if (tc) {
    tc.addEventListener('click', function () {
      tc.classList.toggle('flipped');
      if (tc.classList.contains('flipped')) burstFrom(tc, 16);
    });
  }

  /* ---------------------------------------------------------
     love meter
     --------------------------------------------------------- */
  var range = document.getElementById('loveRange');
  var read = document.getElementById('meterRead');
  if (range && read) {
    var LINES = [
      [0,   'zero? be serious'],
      [10,  'rookie numbers'],
      [25,  'warmer'],
      [40,  'getting there'],
      [55,  'closer, keep going'],
      [70,  'now we are talking'],
      [85,  'almost, do not stop'],
      [99,  'one more pixel…']
    ];
    function paint() {
      var v = +range.value;
      range.style.setProperty('--fill', v + '%');
      if (v >= 100) {
        read.textContent = '∞. The slider broke. It was never going to be enough.';
        read.classList.add('maxed');
        if (!range.dataset.done) { range.dataset.done = '1'; burstFrom(range, 26); }
      } else {
        read.classList.remove('maxed');
        var label = LINES[0][1];
        for (var i = 0; i < LINES.length; i++) if (v >= LINES[i][0]) label = LINES[i][1];
        read.textContent = v + '%, ' + label;
      }
    }
    range.addEventListener('input', paint);
    paint();
  }

  /* ---------------------------------------------------------
     big heart tap counter
     --------------------------------------------------------- */
  var bh = document.getElementById('bigHeart');
  var hc = document.getElementById('heartCount');
  if (bh && hc) {
    var taps = 0;
    var NOTES = {
      1:  'that is one',
      3:  'keep going',
      7:  'seven. still true',
      12: 'you have got stamina',
      21: 'twenty one and counting',
      40: 'okay now you are just showing off',
      75: 'seventy five. I love you seventy five times',
      100:'one hundred. na unna kadhalikheren'
    };
    bh.addEventListener('click', function (e) {
      taps++;
      var n = NOTES[taps];
      hc.textContent = n ? n : (taps + ' × 🩷');
      popHearts(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 7);
    });
  }
})();
