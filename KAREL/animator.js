// animator.js – fronta kroků, zpožděná animace, překreslení mřížky

const Animator = (() => {
  let animSpeed = 350; // ms per step
  let queue = [];
  let running = false;
  let onDone = null;

  function setSpeed(n) {
    // n: 1 (pomalá) → 10 (rychlá)
    n = Math.max(1, Math.min(10, n));
    animSpeed = Math.round(1200 - n * 110);
  }

  function enqueue(steps, doneCallback) {
    queue = [...steps];
    onDone = doneCallback || null;
    if (!running) runNext();
  }

  function runNext() {
    if (queue.length === 0) {
      running = false;
      if (onDone) onDone();
      return;
    }
    running = true;
    const step = queue.shift();
    try {
      step();
    } catch (e) {
      Terminal.print('❌ ' + e.message);
      queue = [];
      running = false;
      if (onDone) onDone();
      renderGrid();
      return;
    }
    renderGrid();
    setTimeout(runNext, animSpeed);
  }

  function renderGrid() {
    const state = World.getState();
    const { karel, beepers, walls, gridW, gridH } = state;
    const canvas = document.getElementById('karel-grid');
    if (!canvas) return;

    // Použij dostupný prostor rodiče, ne canvas samotný (který může být 0)
    const parent = canvas.parentElement;
    const labelEl = document.getElementById('grid-label');
    const labelH = labelEl ? labelEl.offsetHeight + 6 : 0;
    const availW = parent.clientWidth - 16;   // padding 8px každá strana
    const availH = parent.clientHeight - labelH - 16;

    const cellSize = Math.max(4, Math.min(
      Math.floor(availW / gridW),
      Math.floor(availH / gridH)
    ));

    const drawW = cellSize * gridW;
    const drawH = cellSize * gridH;

    canvas.width = drawW;
    canvas.height = drawH;
    canvas.style.width = drawW + 'px';
    canvas.style.height = drawH + 'px';

    const ctx = canvas.getContext('2d');
    const offsetX = 0;
    const offsetY = 0;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid cells
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;

        // Cell background
        ctx.fillStyle = '#0d1a0d';
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

        // Grid lines
        ctx.strokeStyle = '#1a3a1a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);

        // Beeper
        const bk = `${x},${y}`;
        if (beepers[bk]) {
          const count = beepers[bk];
          ctx.fillStyle = '#00ff41';
          ctx.font = `bold ${Math.floor(cellSize * 0.45)}px 'VT323', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 8;
          ctx.fillText(count > 1 ? count : '●', px + cellSize / 2, py + cellSize / 2);
          ctx.shadowBlur = 0;
        }

        // Karel
        if (karel.x === x && karel.y === y) {
          const symbol = World.DIR_SYMBOLS[karel.dir];
          ctx.fillStyle = '#ffff00';
          ctx.font = `bold ${Math.floor(cellSize * 0.6)}px 'VT323', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 14;
          ctx.fillText(symbol, px + cellSize / 2, py + cellSize / 2 + 1);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Walls
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 6;

    walls.forEach(wk => {
      const parts = wk.split(',');
      const wx = parseInt(parts[0]);
      const wy = parseInt(parts[1]);
      const side = parts[2];
      const px = offsetX + wx * cellSize;
      const py = offsetY + wy * cellSize;

      ctx.beginPath();
      if (side === 'N') { ctx.moveTo(px, py); ctx.lineTo(px + cellSize, py); }
      else if (side === 'S') { ctx.moveTo(px, py + cellSize); ctx.lineTo(px + cellSize, py + cellSize); }
      else if (side === 'W') { ctx.moveTo(px, py); ctx.lineTo(px, py + cellSize); }
      else if (side === 'E') { ctx.moveTo(px + cellSize, py); ctx.lineTo(px + cellSize, py + cellSize); }
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = '#00cc33';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, gridW * cellSize, gridH * cellSize);

    // Coordinates (small labels)
    if (cellSize >= 28) {
      ctx.fillStyle = '#1a5c1a';
      ctx.font = `${Math.max(8, Math.floor(cellSize * 0.22))}px 'VT323', monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          if (!beepers[`${x},${y}`] && !(karel.x === x && karel.y === y)) {
            const px = offsetX + x * cellSize + 2;
            const py = offsetY + y * cellSize + 1;
            ctx.fillText(`${x},${y}`, px, py);
          }
        }
      }
    }
  }

  function isRunning() { return running; }

  return { enqueue, renderGrid, setSpeed, isRunning };
})();
