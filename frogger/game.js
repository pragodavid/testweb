// game.js – herní logika, stav, kolize, skóre

const Game = (() => {
  const LIVES_START = 3;
  const HOME_SLOTS = 5;
  const TIME_LIMIT = 30; // sekund na jeden přejezd

  let state = {};
  let rows = [];
  let onRender = null;
  let onGameOver = null;
  let onWin = null;
  let lastTime = null;
  let animFrame = null;
  let homesFilled = [];

  function init(renderCb, gameOverCb, winCb) {
    onRender = renderCb;
    onGameOver = gameOverCb;
    onWin = winCb;
    startGame();
  }

  function startGame() {
    state = {
      level: 1,
      lives: LIVES_START,
      score: 0,
      timeLeft: TIME_LIMIT,
      phase: 'playing', // playing | dead | win | gameover
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
      col: Math.floor(GRID_COLS / 2),
      row: 0,
      onLog: null,
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
    const dt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;

    if (state.phase === 'playing') {
      updateObjects(dt);
      updateFrogOnLog();
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) die('ČAS VYPRŠEL!');
    }

    onRender(state, rows, homesFilled);
    animFrame = requestAnimationFrame(loop);
  }

  function updateObjects(dt) {
    rows.forEach(row => {
      row.objects.forEach(obj => {
        obj.x += obj.speed * obj.dir * dt;
        // wrap around
        if (obj.dir === 1 && obj.x > GRID_COLS) obj.x -= GRID_COLS + obj.width;
        if (obj.dir === -1 && obj.x < -obj.width) obj.x += GRID_COLS + obj.width;
      });
    });
  }

  function updateFrogOnLog() {
    const frog = state.frog;
    const row = rows[frog.row];
    if (!row || row.type !== ROW_TYPE.WATER) {
      frog.onLog = null;
      return;
    }

    const log = getLogAt(frog.row, frog.col);
    if (!log) {
      die('ŽÁBA SE UTOPILA!');
      return;
    }
    // Frog rides log
    frog.onLog = log;
    frog.col += log.speed * log.dir * (1 / 60);
    frog.col = Math.max(0, Math.min(GRID_COLS - 1, frog.col));
  }

  function getLogAt(rowIdx, col) {
    const row = rows[rowIdx];
    if (!row) return null;
    return row.objects.find(obj =>
      obj.type === 'log' &&
      col >= obj.x &&
      col < obj.x + obj.width
    ) || null;
  }

  function getVehicleAt(rowIdx, col) {
    const row = rows[rowIdx];
    if (!row) return null;
    return row.objects.find(obj =>
      obj.type === 'vehicle' &&
      col >= obj.x &&
      col < obj.x + obj.width
    ) || null;
  }

  function checkCollision() {
    const frog = state.frog;
    const row = rows[frog.row];
    if (!row) return;

    if (row.type === ROW_TYPE.ROAD) {
      if (getVehicleAt(frog.row, Math.floor(frog.col))) {
        die('ŽÁBA PŘEJETA!');
      }
    }
    if (row.type === ROW_TYPE.WATER) {
      if (!getLogAt(frog.row, Math.floor(frog.col))) {
        die('ŽÁBA SE UTOPILA!');
      }
    }
  }

  function move(dir) {
    if (state.phase !== 'playing') return;
    const frog = state.frog;
    const prevRow = frog.row;
    const prevCol = Math.floor(frog.col);

    if (dir === 'up')    frog.row = Math.min(GRID_ROWS - 1, frog.row + 1);
    if (dir === 'down')  frog.row = Math.max(0, frog.row - 1);
    if (dir === 'left')  frog.col = Math.max(0, Math.floor(frog.col) - 1);
    if (dir === 'right') frog.col = Math.min(GRID_COLS - 1, Math.floor(frog.col) + 1);

    // Score for moving up
    if (dir === 'up') state.score += 10;

    // Check home row
    if (frog.row === GRID_ROWS - 1) {
      reachHome();
      return;
    }

    checkCollision();
  }

  function reachHome() {
    const slot = Math.floor(state.frog.col / (GRID_COLS / HOME_SLOTS));
    const clampedSlot = Math.max(0, Math.min(HOME_SLOTS - 1, slot));

    if (homesFilled[clampedSlot]) {
      die('OBSAZENO!');
      return;
    }

    homesFilled[clampedSlot] = true;
    state.score += 50 + Math.floor(state.timeLeft) * 3;

    if (homesFilled.every(h => h)) {
      // Level complete
      state.level++;
      state.score += 200;
      homesFilled = Array(HOME_SLOTS).fill(false);
      loadLevel(state.level);
      Terminal && Terminal.print && Terminal.print(`>> LEVEL ${state.level} – POKRAČUJ!`);
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

  function restart() {
    startGame();
  }

  function getState() { return state; }

  return { init, move, restart, getState };
})();
