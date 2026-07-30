/* =========================================================
   connect4.js: "Four in a Row", rigged with affection.
   The board starts one move away from a win for her, and the
   opponent politely refuses to ever block her.
   ========================================================= */
(function () {
  'use strict';

  var ROWS = 6, COLS = 7;
  var boardEl = document.getElementById('c4Board');
  var arrowsEl = document.getElementById('c4Arrows');
  var statusEl = document.getElementById('c4Status');
  var msgEl = document.getElementById('c4Msg');
  var resetBtn = document.getElementById('c4Reset');
  if (!boardEl) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the board she walks in on, already one move from a win for her */
  function startPosition() {
    var b = [];
    for (var r = 0; r < ROWS; r++) { b.push([]); for (var c = 0; c < COLS; c++) b[r].push(null); }
    b[5][1] = 'her'; b[5][2] = 'her'; b[5][3] = 'her';
    b[5][5] = 'him'; b[4][1] = 'him'; b[4][2] = 'him';
    return b;
  }

  var board, cells = [], discs = [], busy = false, over = false;

  /* ---------- helpers ---------- */
  function openRow(c) {
    for (var r = ROWS - 1; r >= 0; r--) if (!board[r][c]) return r;
    return -1;
  }
  function inside(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

  /* with board[r][c] already set to `who`: does it complete four?
     returns the four winning cells, or null */
  function winLine(r, c, who) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1], line = [[r, c]];
      var k, rr, cc;
      for (k = 1; k < 4; k++) {
        rr = r + dr * k; cc = c + dc * k;
        if (inside(rr, cc) && board[rr][cc] === who) line.push([rr, cc]); else break;
      }
      for (k = 1; k < 4; k++) {
        rr = r - dr * k; cc = c - dc * k;
        if (inside(rr, cc) && board[rr][cc] === who) line.unshift([rr, cc]); else break;
      }
      if (line.length >= 4) {
        var idx = 0;
        for (var i = 0; i < line.length; i++) {
          if (line[i][0] === r && line[i][1] === c) { idx = i; break; }
        }
        return line.slice(Math.min(idx, line.length - 4), Math.min(idx, line.length - 4) + 4);
      }
    }
    return null;
  }

  function winningColsFor(who) {
    var out = [];
    for (var c = 0; c < COLS; c++) {
      var r = openRow(c);
      if (r < 0) continue;
      board[r][c] = who;
      var w = winLine(r, c, who);
      board[r][c] = null;
      if (w) out.push(c);
    }
    return out;
  }

  function full() { for (var c = 0; c < COLS; c++) if (openRow(c) >= 0) return false; return true; }

  /* ---------- rendering ---------- */
  function build() {
    boardEl.innerHTML = '';
    arrowsEl.innerHTML = '';
    cells = []; discs = [];
    for (var r = 0; r < ROWS; r++) discs.push(new Array(COLS).fill(null));

    for (var i = 0; i < COLS; i++) {
      var a = document.createElement('span');
      a.textContent = '↓';
      arrowsEl.appendChild(a);
    }
    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        var btn = document.createElement('button');
        btn.className = 'c4-cell';
        btn.type = 'button';
        btn.dataset.col = cc;
        btn.setAttribute('aria-label', 'Column ' + (cc + 1));
        btn.addEventListener('click', onCellClick);
        boardEl.appendChild(btn);
        cells.push(btn);
      }
    }
    for (var r2 = 0; r2 < ROWS; r2++) {
      for (var c2 = 0; c2 < COLS; c2++) {
        if (board[r2][c2]) paint(r2, c2, board[r2][c2], true);
      }
    }
  }

  function paint(r, c, who, instant) {
    var cell = cells[r * COLS + c];
    var d = document.createElement('span');
    d.className = 'disc ' + who;
    cell.appendChild(d);
    discs[r][c] = d;
    if (instant || reduce) {
      d.classList.add('drop');
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { d.classList.add('drop'); });
      });
    }
    return d;
  }

  function hint() {
    var cols = winningColsFor('her');
    var arrows = arrowsEl.children;
    for (var i = 0; i < COLS; i++) arrows[i].classList.remove('on');
    cells.forEach(function (el) { el.classList.remove('hl'); });
    if (over || !cols.length) return;
    var c = cols[0];
    arrows[c].classList.add('on');
    var r = openRow(c);
    if (r >= 0) cells[r * COLS + c].classList.add('hl');
    statusEl.textContent = 'One move left, Chellun Kutty. Column ' + (c + 1) + '. Go on. 🩷';
  }

  /* ---------- turns ---------- */
  function onCellClick(e) {
    if (busy || over) return;
    var c = +e.currentTarget.dataset.col;
    var r = openRow(c);
    if (r < 0) { statusEl.textContent = 'That column is full. Pick another one.'; return; }
    busy = true;
    board[r][c] = 'her';
    paint(r, c, 'her');
    var w = winLine(r, c, 'her');
    if (w) { setTimeout(function () { finale(w); }, reduce ? 60 : 520); return; }
    if (full()) { setTimeout(tidyDraw, 500); return; }
    statusEl.textContent = 'My turn. I will try my best to be useless.';
    setTimeout(aiTurn, reduce ? 120 : 620);
  }

  function aiTurn() {
    var legal = [];
    for (var c = 0; c < COLS; c++) if (openRow(c) >= 0) legal.push(c);
    if (!legal.length) { tidyDraw(); return; }

    var herWins = winningColsFor('her');

    /* never win, never block her */
    var safe = legal.filter(function (col) {
      if (herWins.indexOf(col) >= 0) return false;
      var r = openRow(col);
      board[r][col] = 'him';
      var selfWin = winLine(r, col, 'him');
      board[r][col] = null;
      return !selfWin;
    });

    /* better still: leave her a winning move */
    var gifts = safe.filter(function (col) {
      var r = openRow(col);
      board[r][col] = 'him';
      var n = winningColsFor('her').length;
      board[r][col] = null;
      return n > 0;
    });

    var pool = gifts.length ? gifts : (safe.length ? safe : legal);
    var pick = pool[(Math.random() * pool.length) | 0];
    var row = openRow(pick);
    board[row][pick] = 'him';
    paint(row, pick, 'him');

    busy = false;
    if (full()) { setTimeout(tidyDraw, 500); return; }
    statusEl.textContent = 'Your turn.';
    setTimeout(hint, reduce ? 60 : 480);
  }

  function tidyDraw() {
    statusEl.textContent = 'We filled it up without you winning. Unacceptable. Resetting.';
    setTimeout(reset, 1400);
  }

  /* ---------- the whole point ---------- */
  /* the finished board spells it out, one letter per disc */
  var FIN = [
    ['C', 'H', 'E', 'L', 'L', 'U', 'N'],
    ['', 'K', 'U', 'T', 'T', 'Y', ''],
    ['', 'I', 'L', 'O', 'V', 'E', ''],
    ['', '', 'Y', 'O', 'U', '', ''],
    ['🩷', '🩷', '🩷', '🩷', '🩷', '🩷', '🩷'],
    ['', '🩷', '🩷', '🩷', '🩷', '🩷', '']
  ];

  function finale(winCells4) {
    over = true; busy = true;
    hint();
    statusEl.textContent = 'Four in a row. Obviously.';
    if (window.burstFrom) window.burstFrom(boardEl, 24);

    winCells4.forEach(function (p) {
      var d = discs[p[0]][p[1]];
      if (d) d.classList.add('win');
    });

    var step = reduce ? 0 : 45;

    setTimeout(function () {
      /* fill every empty seat, in a wave from the bottom left */
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (!board[r][c]) {
            board[r][c] = 'her';
            (function (rr, cc) {
              setTimeout(function () { paint(rr, cc, 'her'); }, step * ((ROWS - rr) + cc));
            })(r, c);
          }
        }
      }
    }, reduce ? 0 : 900);

    setTimeout(function () {
      /* every disc turns pink, then takes its letter */
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          (function (rr, cc) {
            setTimeout(function () {
              var d = discs[rr][cc];
              if (!d) return;
              d.classList.remove('him', 'win');
              d.classList.add('her', 'letter');
              var ch = FIN[rr][cc];
              d.textContent = ch;
              if (!ch) d.classList.add('fade');
            }, step * (rr * COLS + cc) * 0.6);
          })(r, c);
        }
      }
      if (window.burstFrom) window.burstFrom(boardEl, 30);
    }, reduce ? 100 : 2100);

    setTimeout(function () {
      msgEl.classList.add('big');
      msgEl.innerHTML =
        '<span class="fin-en">I love you</span>' +
        '<span class="fin-ta" lang="ta">நான் உன்னை காதலிக்கிறேன்</span>' +
        '<span class="fin-tr">na unna kadhalikheren</span>';
      statusEl.textContent = 'You were always going to win this one.';
      if (window.burstFrom) window.burstFrom(msgEl, 20);
    }, reduce ? 300 : 4200);
  }

  /* ---------- reset ---------- */
  function reset() {
    board = startPosition();
    over = false; busy = false;
    msgEl.className = 'game-msg';
    msgEl.textContent = '';
    build();
    statusEl.textContent = 'You are pink. I am lilac. I may have set the board up in your favour. I always do.';
    setTimeout(hint, reduce ? 60 : 700);
  }

  resetBtn.addEventListener('click', reset);
  reset();
})();
