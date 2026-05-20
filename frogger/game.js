// game.js – herní logika, stav, kolize, skóre

const Game = (() => {
  const LIVES_START = 3;
  const HOME_SLOTS = 5;
  const TIME_LIMIT = 30;

  let state = {};
  let rows = [];
  let onRender = null;
  let onGameOver = null;
  let lastTime = null;
  let animFrame = null;
  let homesFilled = [];

  function init(renderCb, gameOverCb, winCb) {
    onRender = renderCb;
    onGameOver = gameOverCb;
    startGame();
  }

  function startGame() {
    state = {
      level: 1,
      lives: LIVES_START,
      score: 0,
      timeLeft: TIME_LIMIT,
      phase: 'playing',
      frog: null,
      deathMsg: '',
    };
    homesFilled = Array(HOME_SLOTS).fill(false);
    loadLevel(state.level);
    startLoop();
  }

  function loadLevel(n) {
    rows = getLevel(n);
    spawnFrog();
    state.timeLeft = TIME_LIMIT;
  }

  function spawnFrog() {
    state.frog = {
      col: Math.floor(GRID_COLS / 2),  // vždy celé číslo
      row: 0,
    };
  }

  // ── Main loop ──
  function startLoop() {
    lastTime = null;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (state.phase === 'playing') {
      updateObjects(dt);
      updateFrogOnLog(dt);
      checkRoadCollision();
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) die('ČAS VYPRŠEL!');
    }

    if (onRender) onRender(state, rows, homesFilled);
    animFrame = requestAnimationFrame(loop);
  }

  function updateObjects(dt) {
    rows.forEach(row => {
      row.objects.forEach(obj => {
        obj.x += obj.speed * obj.dir * dt;
        // wrap around s přesahem
        const total = GRID_COLS + obj.width;
        if (obj.dir === 1  && obj.x > GRID_COLS)   obj.x -= total;
        if (obj.dir === -1 && obj.x < -obj.width)   obj.x += total;
      });
    });
  }

  // Žába se pohybuje s kládou – používá reálný dt
  function updateFrogOnLog(dt) {
    const frog = state.frog;
    const row = rows[frog.row];
    if (!row || row.type !== ROW_TYPE.WATER) return;

    const log = getLogAt(frog.row, frog.col);
    if (!log) {
      die('ŽÁBA SE UTOPILA!');
      return;
    }
    // Pohyb žáby synchronizovaný s kládou (stejný dt jako updateObjects)
    frog.col += log.speed * log.dir * dt;
    // Utopení pokud vypluje z obrazovky
    if (frog.col < 0 || frog.col >= GRID_COLS) {
      die('ŽÁBA VYPLULA Z OBRAZOVKY!');
    }
  }

  // Kontinuální kontrola kolize s auty (každý frame)
  function checkRoadCollision() {
    const frog = state.frog;
    const row = rows[frog.row];
    if (!row || row.type !== ROW_TYPE.ROAD) return;
    if (getVehicleAt(frog.row, frog.col)) {
      die('ŽÁBA PŘEJETA!');
    }
  }

  // Žába je na kládě pokud střed žáby (col + 0.5) leží uvnitř klády
  // Klády jsou plovoucí, žába je plovoucí – porovnání v reálných souřadnicích
  function getLogAt(rowIdx, frogCol) {
    const row = rows[rowIdx];
    if (!row) return null;
    const fc = frogCol + 0.5; // střed žáby
    return row.objects.find(obj =>
      obj.type === 'log' &&
      fc > obj.x &&
      fc < obj.x + obj.width
    ) || null;
  }

  // Kolize s autem – žába je přejeta pokud střed žáby leží uvnitř auta
  function getVehicleAt(rowIdx, frogCol) {
    const row = rows[rowIdx];
    if (!row) return null;
    const fc = frogCol + 0.5; // střed žáby
    return row.objects.find(obj =>
      obj.type === 'vehicle' &&
      fc > obj.x + 0.1 &&       // malý margin aby okraj nevadil
      fc < obj.x + obj.width - 0.1
    ) || null;
  }

  function move(dir) {
    if (state.phase !== 'playing') return;
    const frog = state.frog;

    // Uložíme původní pozici pro případ kolize
    const prevCol = frog.col;
    const prevRow = frog.row;

    if (dir === 'up')    frog.row = Math.min(GRID_ROWS - 1, frog.row + 1);
    if (dir === 'down')  frog.row = Math.max(0, frog.row - 1);
    if (dir === 'left')  frog.col = Math.max(0, Math.floor(frog.col) - 1);
    if (dir === 'right') frog.col = Math.min(GRID_COLS - 1, Math.floor(frog.col) + 1);

    if (dir === 'up') state.score += 10;

    // Cílový řádek
    if (frog.row === GRID_ROWS - 1) {
      reachHome();
      return;
    }

    // Okamžitá kontrola po skoku na silnici
    const row = rows[frog.row];
    if (row && row.type === ROW_TYPE.ROAD) {
      if (getVehicleAt(frog.row, frog.col)) {
        die('ŽÁBA PŘEJETA!');
        return;
      }
    }
    // Okamžitá kontrola po skoku do vody
    if (row && row.type === ROW_TYPE.WATER) {
      if (!getLogAt(frog.row, frog.col)) {
        die('ŽÁBA SE UTOPILA!');
        return;
      }
    }
  }

  function reachHome() {
    const frog = state.frog;
    const slot = Math.min(HOME_SLOTS - 1, Math.max(0,
      Math.floor(frog.col / (GRID_COLS / HOME_SLOTS))
    ));

    if (homesFilled[slot]) {
      die('OBSAZENO!');
      return;
    }

    homesFilled[slot] = true;
    state.score += 50 + Math.floor(state.timeLeft) * 3;

    if (homesFilled.every(h => h)) {
      state.level++;
      state.score += 200;
      homesFilled = Array(HOME_SLOTS).fill(false);
      loadLevel(state.level);
    } else {
      spawnFrog();
      state.timeLeft = TIME_LIMIT;
    }
  }

  function die(msg) {
    if (state.phase !== 'playing') return;
    state.lives--;
    state.phase = 'dead';
    state.deathMsg = msg;

    setTimeout(() => {
      if (state.lives <= 0) {
        state.phase = 'gameover';
        if (onGameOver) onGameOver(state.score);
      } else {
        state.phase = 'playing';
        spawnFrog();
        state.timeLeft = TIME_LIMIT;
      }
    }, 1500);
  }

  function restart() { startGame(); }
  function getState() { return state; }

  return { init, move, restart, getState };
})();
