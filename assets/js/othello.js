/* =========================================================
   othello.js: real Othello, weak opponent, and an ending
   where every single piece on the board turns pink.
   ========================================================= */
(function () {
  'use strict';

  var N = 8;
  var boardEl = document.getElementById('othBoard');
  var statusEl = document.getElementById('othStatus');
  var msgEl = document.getElementById('othMsg');
  var herEl = document.getElementById('othHer');
  var himEl = document.getElementById('othHim');
  var resetBtn = document.getElementById('othReset');
  var skipBtn = document.getElementById('othSkip');
  if (!boardEl) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  var CORNERS = ['0,0', '0,7', '7,0', '7,7'];

  var board, cells = [], stones = [], busy = false, over = false;

  function inside(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }
  function other(w) { return w === 'her' ? 'him' : 'her'; }

  /* ---------- rules ---------- */
  function flipsFor(r, c, who) {
    if (board[r][c]) return [];
    var all = [];
    for (var d = 0; d < DIRS.length; d++) {
      var dr = DIRS[d][0], dc = DIRS[d][1];
      var line = [], rr = r + dr, cc = c + dc;
      while (inside(rr, cc) && board[rr][cc] === other(who)) {
        line.push([rr, cc]); rr += dr; cc += dc;
      }
      if (line.length && inside(rr, cc) && board[rr][cc] === who) all = all.concat(line);
    }
    return all;
  }

  function legalMoves(who) {
    var out = {};
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var f = flipsFor(r, c, who);
        if (f.length) out[r + ',' + c] = f;
      }
    }
    return out;
  }

  function counts() {
    var h = 0, m = 0;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (board[r][c] === 'her') h++; else if (board[r][c] === 'him') m++;
    }
    return { her: h, him: m };
  }

  /* ---------- rendering ---------- */
  function build() {
    boardEl.innerHTML = '';
    cells = []; stones = [];
    for (var r = 0; r < N; r++) stones.push(new Array(N).fill(null));
    for (var rr = 0; rr < N; rr++) {
      for (var cc = 0; cc < N; cc++) {
        var b = document.createElement('button');
        b.className = 'oth-cell';
        b.type = 'button';
        b.dataset.r = rr; b.dataset.c = cc;
        b.setAttribute('aria-label', 'Row ' + (rr + 1) + ' column ' + (cc + 1));
        b.addEventListener('click', onCell);
        boardEl.appendChild(b);
        cells.push(b);
      }
    }
  }

  function cellAt(r, c) { return cells[r * N + c]; }

  function setStone(r, c, who, flip) {
    var s = stones[r][c];
    if (!s) {
      s = document.createElement('span');
      s.className = 'stone ' + who;
      cellAt(r, c).appendChild(s);
      stones[r][c] = s;
    } else {
      if (flip && !reduce) {
        s.classList.add('flipping');
        setTimeout(function () { s.classList.remove('flipping'); }, 520);
        setTimeout(function () {
          s.classList.remove('her', 'him');
          s.classList.add(who);
        }, 190);
        return;
      }
      s.classList.remove('her', 'him');
      s.classList.add(who);
    }
  }

  function drawAll() {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (board[r][c]) setStone(r, c, board[r][c], false);
    }
    score();
  }

  function score() {
    var k = counts();
    herEl.textContent = k.her;
    himEl.textContent = k.him;
  }

  function markLegal(moves) {
    cells.forEach(function (el) { el.classList.remove('legal'); });
    if (over || !moves) return;
    Object.keys(moves).forEach(function (key) {
      var p = key.split(',');
      cellAt(+p[0], +p[1]).classList.add('legal');
    });
  }

  /* ---------- play ---------- */
  function apply(r, c, who, moves) {
    var flips = moves[r + ',' + c];
    board[r][c] = who;
    setStone(r, c, who, false);
    flips.forEach(function (p, i) {
      board[p[0]][p[1]] = who;
      var delay = reduce ? 0 : 70 + i * 55;
      setTimeout(function () { setStone(p[0], p[1], who, true); score(); }, delay);
    });
    score();
    return flips.length;
  }

  function onCell(e) {
    if (busy || over) return;
    var r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c;
    var moves = legalMoves('her');
    if (!moves[r + ',' + c]) {
      statusEl.textContent = 'Not that one. The glowing squares are yours.';
      return;
    }
    busy = true;
    markLegal(null);
    var n = apply(r, c, 'her', moves);
    statusEl.textContent = n === 1 ? 'One of mine, taken.' : n + ' of mine, taken. Ruthless.';
    setTimeout(nextTurn.bind(null, 'him'), reduce ? 120 : 500 + n * 55);
  }

  function aiPlay() {
    var moves = legalMoves('him');
    var keys = Object.keys(moves);
    if (!keys.length) return false;

    /* a spectacularly bad opponent: never takes a corner, avoids the
       edges, and flips as few of her pieces as it can get away with */
    var pool = keys.filter(function (k) { return CORNERS.indexOf(k) < 0; });
    if (!pool.length) pool = keys;
    var inner = pool.filter(function (k) {
      var p = k.split(',');
      return +p[0] > 0 && +p[0] < N - 1 && +p[1] > 0 && +p[1] < N - 1;
    });
    if (inner.length) pool = inner;
    pool.sort(function (a, b) { return moves[a].length - moves[b].length; });
    var best = moves[pool[0]].length;
    var tied = pool.filter(function (k) { return moves[k].length === best; });
    var key = tied[(Math.random() * tied.length) | 0].split(',');

    apply(+key[0], +key[1], 'him', moves);
    return true;
  }

  function nextTurn(who) {
    if (over) return;
    if (who === 'him') {
      var played = aiPlay();
      if (!played) {
        if (Object.keys(legalMoves('her')).length) {
          statusEl.textContent = 'I have got nothing. All yours.';
          busy = false;
          markLegal(legalMoves('her'));
          return;
        }
        return finale('The board is done.');
      }
      setTimeout(function () {
        var mine = legalMoves('her');
        if (Object.keys(mine).length) {
          statusEl.textContent = 'Your turn. The glowing squares are the legal ones.';
          busy = false;
          markLegal(mine);
        } else if (Object.keys(legalMoves('him')).length) {
          statusEl.textContent = 'No moves for you, so I will go again.';
          setTimeout(nextTurn.bind(null, 'him'), reduce ? 120 : 800);
        } else {
          finale('The board is done.');
        }
      }, reduce ? 120 : 800);
    }
  }

  /* ---------- the ending ---------- */
  var HEART = [
    '00000000',
    '01100110',
    '11111111',
    '11111111',
    '11111111',
    '01111110',
    '00111100',
    '00011000'
  ];

  function finale(lead) {
    if (over) return;
    over = true; busy = true;
    markLegal(null);
    var k = counts();
    statusEl.textContent = (lead || '') + ' ' +
      (k.her > k.him ? 'You won, ' + k.her + ' to ' + k.him + '. Naturally.'
        : k.her === k.him ? 'A draw. Suspicious.'
        : 'I won on points, which means nothing, watch this.');

    /* order every square by distance from the middle, so the colour
       spreads outward like something spilling */
    var order = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      order.push({ r: r, c: c, d: Math.hypot(r - 3.5, c - 3.5) });
    }
    order.sort(function (a, b) { return a.d - b.d; });

    var step = reduce ? 0 : 42;

    order.forEach(function (o, i) {
      setTimeout(function () {
        board[o.r][o.c] = 'her';
        setStone(o.r, o.c, 'her', !!stones[o.r][o.c]);
        score();
      }, i * step);
    });

    var afterFlip = reduce ? 150 : order.length * step + 500;

    setTimeout(function () {
      /* and now they arrange themselves into the shape of the thing */
      order.forEach(function (o, i) {
        setTimeout(function () {
          var s = stones[o.r][o.c];
          if (!s) return;
          if (HEART[o.r].charAt(o.c) === '1') s.classList.add('glow');
          else s.classList.add('dim');
        }, i * (reduce ? 0 : 14));
      });
      if (window.burstFrom) window.burstFrom(boardEl, 26);
    }, afterFlip);

    setTimeout(function () {
      msgEl.classList.add('big');
      msgEl.innerHTML =
        '<span class="fin-en">I love you</span>' +
        '<span class="fin-ta" lang="ta">நான் உன்னை காதலிக்கிறேன்</span>' +
        '<span class="fin-tr">na unna kadhalikheren</span>';
      statusEl.textContent = 'Every piece on the board. That is roughly the ratio.';
      if (window.burstFrom) window.burstFrom(msgEl, 22);
    }, afterFlip + (reduce ? 150 : 1500));
  }

  /* ---------- reset ---------- */
  function reset() {
    board = [];
    for (var r = 0; r < N; r++) { board.push([]); for (var c = 0; c < N; c++) board[r].push(null); }
    board[3][3] = 'him'; board[4][4] = 'him';
    board[3][4] = 'her'; board[4][3] = 'her';
    over = false; busy = false;
    msgEl.className = 'game-msg';
    msgEl.textContent = '';
    build();
    drawAll();
    statusEl.textContent = 'You are pink, I am cream. Every legal move is marked. Fill the board and watch what happens.';
    markLegal(legalMoves('her'));
  }

  resetBtn.addEventListener('click', reset);
  skipBtn.addEventListener('click', function () {
    if (over) { reset(); setTimeout(function () { finale('Again, then.'); }, 400); }
    else finale('Fine, I could not wait either.');
  });

  reset();
})();
