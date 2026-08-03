/* Builds the ORON wordmark out of LEGO bricks.

   The letters are 5x7 bitmaps. Runs of adjacent cells in a row are merged
   into single multi-stud bricks — a 1x1 grid of squares does not read as
   LEGO; 2x1, 3x1 and 4x1 pieces with real studs do. */
(function () {
  'use strict';

  var GLYPHS = {
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#']
  };

  var WORD = 'ORON';
  var GAP_COLS = 1;
  var ROWS = 7;

  /* The four classic LEGO colours. Anything subtler stops reading as a toy. */
  var COLORS = ['#e3000b', '#0057a8', '#ffd400', '#00852b'];

  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* Split a run of N cells into believable piece sizes: mostly 2s and 4s,
     the way a real build would be assembled. */
  function pieces(n, rnd) {
    var out = [];
    while (n > 0) {
      var size;
      if (n >= 4) size = rnd() < 0.55 ? 4 : 2;
      else if (n === 3) size = rnd() < 0.5 ? 3 : 2;
      else size = n;
      size = Math.min(size, n);
      out.push(size);
      n -= size;
    }
    return out;
  }

  function build() {
    var rnd = seeded(20260803);
    var bricks = [];
    var col = 0;

    for (var w = 0; w < WORD.length; w++) {
      var glyph = GLYPHS[WORD[w]];
      for (var y = 0; y < ROWS; y++) {
        var row = glyph[y];
        var x = 0;
        while (x < row.length) {
          if (row[x] !== '#') { x++; continue; }
          var run = 0;
          while (x + run < row.length && row[x + run] === '#') run++;
          pieces(run, rnd).forEach(function (size) {
            bricks.push({ x: col + x, y: y, cells: size });
            x += size;
          });
        }
      }
      col += glyph[0].length + GAP_COLS;
    }

    var totalCols = col - GAP_COLS;

    /* Left to right reads as assembly; top to bottom would read as a curtain. */
    bricks.sort(function (a, b) { return a.x - b.x || a.y - b.y; });

    var frag = document.createDocumentFragment();
    bricks.forEach(function (p, i) {
      var el = document.createElement('span');
      el.className = 'lego-brick';
      el.style.setProperty('--cells', p.cells);
      el.style.setProperty('--c', COLORS[Math.floor(rnd() * COLORS.length)]);
      el.style.setProperty('--i', i);
      el.style.left = 'calc(var(--u) * ' + p.x + ')';
      el.style.top = 'calc(var(--u) * ' + p.y + ')';

      /* Tipped out of a box: pieces arrive from beyond the word, biased away
         from the centre rather than exploding out of it. */
      var dir = p.x < totalCols / 2 ? -1 : 1;
      el.style.setProperty('--dx', (dir * (60 + rnd() * 220)).toFixed(0) + 'px');
      el.style.setProperty('--dy', (-140 - rnd() * 220).toFixed(0) + 'px');
      el.style.setProperty('--rz', ((rnd() - 0.5) * 160).toFixed(0) + 'deg');

      for (var s = 0; s < p.cells; s++) {
        el.appendChild(document.createElement('i'));
      }
      frag.appendChild(el);
    });

    return { frag: frag, cols: totalCols, rows: ROWS, count: bricks.length };
  }

  function init() {
    var wordEl = document.getElementById('legoWord');
    if (!wordEl) return;

    var stage = wordEl.closest('.lego-stage');
    var out = build();

    wordEl.appendChild(out.frag);
    wordEl.style.width = 'calc(var(--u) * ' + out.cols + ')';
    wordEl.style.height = 'calc(var(--u) * ' + out.rows + ')';

    /* Two frames: one to lay the bricks out scattered, one to flip the class
       so the transition actually runs. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wordEl.classList.add('is-built');
        if (stage) stage.classList.add('is-built');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
