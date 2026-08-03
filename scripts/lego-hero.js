/* Builds the ORON wordmark out of LEGO bricks and snaps them into place.

   The letters are 5x7 bitmaps; every "#" becomes one brick positioned on a
   grid. Bricks start scattered and animate home on a per-column stagger, so
   the word assembles left to right instead of all at once. */
(function () {
  'use strict';

  var GLYPHS = {
    O: [
      '.###.',
      '#...#',
      '#...#',
      '#...#',
      '#...#',
      '#...#',
      '.###.'
    ],
    R: [
      '####.',
      '#...#',
      '#...#',
      '####.',
      '#.#..',
      '#..#.',
      '#...#'
    ],
    N: [
      '#...#',
      '##..#',
      '##..#',
      '#.#.#',
      '#..##',
      '#..##',
      '#...#'
    ]
  };

  var WORD = 'ORON';
  var GAP_COLS = 1;          // blank columns between letters
  var ROWS = 7;

  /* Mostly brand blues so the wordmark stays on-brand, with a scatter of real
     LEGO colours so it reads as a toy and not a chart. */
  var BLUES = ['#2f5cf0', '#1f47c7', '#4c7bff', '#22337f', '#3a68f5'];
  var ACCENTS = ['#f5b301', '#e4572e', '#22b573'];

  function pick(list, rnd) {
    return list[Math.floor(rnd() * list.length)];
  }

  /* Deterministic PRNG: the scatter should look random but be identical on
     every load, so the hero does not shuffle between page views. */
  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function build(word) {
    var rnd = seeded(20260803);
    var cells = [];
    var col = 0;

    for (var w = 0; w < WORD.length; w++) {
      var glyph = GLYPHS[WORD[w]];
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < glyph[y].length; x++) {
          if (glyph[y][x] === '#') cells.push({ x: col + x, y: y });
        }
      }
      col += glyph[0].length + GAP_COLS;
    }

    var totalCols = col - GAP_COLS;

    /* Left-to-right stagger reads as assembly; top-to-bottom would read as
       a curtain drop. */
    cells.sort(function (a, b) { return a.x - b.x || a.y - b.y; });

    var frag = document.createDocumentFragment();
    cells.forEach(function (c, i) {
      var b = document.createElement('span');
      b.className = 'lego-brick';
      var accent = rnd() < 0.16;
      b.style.setProperty('--c', accent ? pick(ACCENTS, rnd) : pick(BLUES, rnd));
      b.style.setProperty('--i', i);
      b.style.left = 'calc(var(--u) * ' + c.x + ')';
      b.style.top = 'calc(var(--u) * ' + c.y + ')';
      /* Scatter: bricks come from outside the word, biased away from centre
         so they look tipped out of a box rather than exploded. */
      var dir = c.x < totalCols / 2 ? -1 : 1;
      b.style.setProperty('--dx', (dir * (40 + rnd() * 190)).toFixed(0) + 'px');
      b.style.setProperty('--dy', (-120 - rnd() * 190).toFixed(0) + 'px');
      b.style.setProperty('--rz', ((rnd() - 0.5) * 150).toFixed(0) + 'deg');
      if (rnd() < 0.09) b.classList.add('lego-brick--live');
      frag.appendChild(b);
    });

    return { frag: frag, cols: totalCols, rows: ROWS };
  }

  function init() {
    var wordEl = document.getElementById('legoWord');
    if (!wordEl) return;

    var stage = wordEl.closest('.lego-stage');
    var out = build(WORD);

    wordEl.appendChild(out.frag);
    wordEl.style.width = 'calc(var(--u) * ' + out.cols + ')';
    wordEl.style.height = 'calc(var(--u) * ' + out.rows + ')';

    /* Two frames: one for layout to settle with the bricks in their scattered
       start state, one to flip the class so the transition actually runs. */
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
