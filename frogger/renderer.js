// renderer.js – canvas kreslení, CRT styl

const Renderer = (() => {
  let canvas, ctx;
  let cellW, cellH;

  const COLORS = {
    safe:    '#041a04',
    road:    '#0a0a0a',
    water:   '#001a33',
    home:    '#041a04',
    grid:    '#0d2a0d',
    frog:    '#39ff6e',
    log:     '#4a2800',
    logEdge: '#6b3d00',
    water1:  '#001528',
    water2:  '#002040',
    homeSlot:'#052805',
    homeFill:'#003300',
    text:    '#39ff6e',
    amber:   '#ffc400',
    red:     '#ff4444',
    timeBar: '#39ff6e',
    timeLow: '#ff4444',
  };

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    const parent = canvas.parentElement;
    const availW = parent.clientWidth - 8;
    const availH = parent.clientHeight - 8;
    cellW = Math.max(20, Math.floor(availW / GRID_COLS));
    cellH = Math.max(20, Math.floor(availH / GRID_ROWS));
    // keep cells square-ish
    const cell = Math.min(cellW, cellH);
    cellW = cell;
    cellH = cell;
    canvas.width  = cellW * GRID_COLS;
    canvas.height = cellH * GRID_ROWS;
    canvas.style.width  = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  }

  function render(state, rows, homesFilled) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRows(rows, homesFilled);
    drawFrog(state.frog, state.phase);
    drawOverlay(state);
  }

  function drawRows(rows, homesFilled) {
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const y = (GRID_ROWS - 1 - ri) * cellH; // row 0 = bottom

      // Row background
      let bg = COLORS.safe;
      if (row.type === ROW_TYPE.ROAD)  bg = COLORS.road;
      if (row.type === ROW_TYPE.WATER) bg = (ri % 2 === 0) ? COLORS.water1 : COLORS.water2;
      if (row.type === ROW_TYPE.HOME)  bg = COLORS.homeSlot;

      ctx.fillStyle = bg;
      ctx.fillRect(0, y, canvas.width, cellH);

      // Grid lines
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 0.5;
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.strokeRect(c * cellW, y, cellW, cellH);
      }

      // Road markings
      if (row.type === ROW_TYPE.ROAD) {
        ctx.fillStyle = '#1a1a00';
        ctx.fillRect(0, y + cellH / 2 - 1, canvas.width, 2);
      }

      // Water ripples
      if (row.type === ROW_TYPE.WATER) {
        ctx.strokeStyle = 'rgba(0,100,200,0.15)';
        ctx.lineWidth = 1;
        for (let w = 0; w < canvas.width; w += 20) {
          ctx.beginPath();
          ctx.moveTo(w, y + cellH * 0.4);
          ctx.bezierCurveTo(w + 5, y + cellH * 0.3, w + 10, y + cellH * 0.5, w + 20, y + cellH * 0.4);
          ctx.stroke();
        }
      }

      // Home slots
      if (row.type === ROW_TYPE.HOME) {
        const slotW = GRID_COLS / 5;
        for (let s = 0; s < 5; s++) {
          const sx = s * slotW * cellW;
          ctx.fillStyle = homesFilled[s] ? COLORS.homeFill : '#000000';
          ctx.fillRect(sx + 2, y + 2, slotW * cellW - 4, cellH - 4);
          ctx.strokeStyle = homesFilled[s] ? COLORS.frog : '#1a5c1a';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx + 2, y + 2, slotW * cellW - 4, cellH - 4);
          if (homesFilled[s]) {
            ctx.fillStyle = COLORS.frog;
            ctx.font = `${Math.floor(cellH * 0.55)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐸', sx + slotW * cellW / 2, y + cellH / 2);
          }
        }
      }

      // Objects (vehicles & logs)
      row.objects.forEach(obj => drawObject(obj, y));
    }
  }

  function drawObject(obj, y) {
    const x = obj.x * cellW;
    const w = obj.width * cellW;

    if (obj.type === 'log') {
      // Log body
      const grad = ctx.createLinearGradient(x, y + 2, x, y + cellH - 2);
      grad.addColorStop(0, '#6b3d00');
      grad.addColorStop(0.5, '#4a2800');
      grad.addColorStop(1, '#3a1e00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, w - 4, cellH - 8, 6);
      ctx.fill();
      // Log grain lines
      ctx.strokeStyle = 'rgba(100,60,0,0.4)';
      ctx.lineWidth = 1;
      for (let i = 1; i < obj.width; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * cellW, y + 6);
        ctx.lineTo(x + i * cellW, y + cellH - 6);
        ctx.stroke();
      }
      ctx.strokeStyle = '#6b3d00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, w - 4, cellH - 8, 6);
      ctx.stroke();
    }

    if (obj.type === 'vehicle') {
      ctx.fillStyle = obj.color || '#ff4444';
      ctx.shadowColor = obj.color || '#ff4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 3, w - 4, cellH - 6, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Headlights
      const lightColor = obj.dir === 1 ? '#ffffaa' : '#ff8888';
      ctx.fillStyle = lightColor;
      const lx = obj.dir === 1 ? x + w - 5 : x + 2;
      ctx.fillRect(lx, y + 5, 3, 4);
      ctx.fillRect(lx, y + cellH - 9, 3, 4);
    }
  }

  function drawFrog(frog, phase) {
    if (!frog) return;
    const x = frog.col * cellW;
    const y = (GRID_ROWS - 1 - frog.row) * cellH;

    if (phase === 'dead') {
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 12;
      ctx.font = `bold ${Math.floor(cellH * 0.75)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', x + cellW / 2, y + cellH / 2);
      ctx.shadowBlur = 0;
      return;
    }

    // Frog glow
    ctx.shadowColor = COLORS.frog;
    ctx.shadowBlur = 14;
    ctx.font = `${Math.floor(cellH * 0.78)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐸', x + cellW / 2, y + cellH / 2);
    ctx.shadowBlur = 0;
  }

  function drawOverlay(state) {
    if (state.phase === 'dead' && state.deathMsg) {
      drawCenteredMsg(state.deathMsg, COLORS.red);
    }
    if (state.phase === 'gameover') {
      drawCenteredMsg('GAME OVER', COLORS.red, `SKÓRE: ${state.score}`);
    }
  }

  function drawCenteredMsg(line1, color, line2) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(cx - 120, cy - 36, 240, line2 ? 72 : 48);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 120, cy - 36, 240, line2 ? 72 : 48);

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.font = `bold 28px 'VT323', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, cx, cy - (line2 ? 12 : 0));
    if (line2) {
      ctx.font = `20px 'VT323', monospace`;
      ctx.fillText(line2, cx, cy + 18);
    }
    ctx.shadowBlur = 0;
  }

  function getCellSize() { return { cellW, cellH }; }

  return { init, render, resize, getCellSize };
})();
