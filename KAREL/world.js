// world.js – stav světa, mřížka, Karel, zdi, beepery

const DIRECTIONS = ['N', 'E', 'S', 'W'];
const DIR_SYMBOLS = { N: '^', E: '>', S: 'v', W: '<' };
const DIR_DELTA = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

const World = (() => {
  const GRID_W = 12;
  const GRID_H = 12;

  let karel = { x: 1, y: GRID_H - 2, dir: 'N' };
  let beepers = {}; // "x,y" -> count
  let walls = new Set(); // "x,y,side" side = N/E/S/W

  function key(x, y) { return `${x},${y}`; }
  function wallKey(x, y, side) { return `${x},${y},${side}`; }

  function reset() {
    karel = { x: 1, y: GRID_H - 2, dir: 'N' };
    beepers = {};
    walls = new Set();
  }

  function inBounds(x, y) {
    return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
  }

  function isBorderWall(x, y) {
    return x < 0 || x >= GRID_W || y < 0 || y >= GRID_H;
  }

  function hasWall(x, y, side) {
    // Border walls
    if (side === 'N' && y === 0) return true;
    if (side === 'S' && y === GRID_H - 1) return true;
    if (side === 'W' && x === 0) return true;
    if (side === 'E' && x === GRID_W - 1) return true;
    return walls.has(wallKey(x, y, side));
  }

  function frontIsClear() {
    const delta = DIR_DELTA[karel.dir];
    const nx = karel.x + delta.dx;
    const ny = karel.y + delta.dy;
    if (isBorderWall(nx, ny)) return false;
    if (hasWall(karel.x, karel.y, karel.dir)) return false;
    return true;
  }

  function beeperIsPresent() {
    return (beepers[key(karel.x, karel.y)] || 0) > 0;
  }

  function facingNorth() { return karel.dir === 'N'; }
  function facingEast()  { return karel.dir === 'E'; }
  function facingSouth() { return karel.dir === 'S'; }
  function facingWest()  { return karel.dir === 'W'; }

  function move() {
    if (!frontIsClear()) throw new Error('CHYBA: Karel narazil do zdi!');
    const delta = DIR_DELTA[karel.dir];
    karel.x += delta.dx;
    karel.y += delta.dy;
  }

  function turnLeft() {
    const i = DIRECTIONS.indexOf(karel.dir);
    karel.dir = DIRECTIONS[(i + 3) % 4];
  }

  function turnRight() {
    const i = DIRECTIONS.indexOf(karel.dir);
    karel.dir = DIRECTIONS[(i + 1) % 4];
  }

  function pickBeeper() {
    const k = key(karel.x, karel.y);
    if (!beepers[k] || beepers[k] <= 0) throw new Error('CHYBA: Žádný beeper k sebrání!');
    beepers[k]--;
    if (beepers[k] === 0) delete beepers[k];
  }

  function putBeeper() {
    const k = key(karel.x, karel.y);
    beepers[k] = (beepers[k] || 0) + 1;
  }

  function setBeeper(x, y, count = 1) {
    if (!inBounds(x, y)) throw new Error(`CHYBA: Souřadnice [${x},${y}] jsou mimo mřížku!`);
    beepers[key(x, y)] = count;
  }

  function setWall(x, y, side) {
    side = side.toUpperCase();
    if (!DIRECTIONS.includes(side)) throw new Error(`CHYBA: Neplatná strana zdi '${side}'. Použij N/E/S/W.`);
    if (!inBounds(x, y)) throw new Error(`CHYBA: Souřadnice [${x},${y}] jsou mimo mřížku!`);
    walls.add(wallKey(x, y, side));
    // Mirror wall on adjacent cell
    const delta = DIR_DELTA[side];
    const nx = x + delta.dx;
    const ny = y + delta.dy;
    const opposite = { N: 'S', S: 'N', E: 'W', W: 'E' }[side];
    if (inBounds(nx, ny)) walls.add(wallKey(nx, ny, opposite));
  }

  function setKarel(x, y, dir) {
    dir = dir.toUpperCase();
    if (!inBounds(x, y)) throw new Error(`CHYBA: Souřadnice [${x},${y}] jsou mimo mřížku!`);
    if (!DIRECTIONS.includes(dir)) throw new Error(`CHYBA: Neplatný směr '${dir}'. Použij N/E/S/W.`);
    karel.x = x;
    karel.y = y;
    karel.dir = dir;
  }

  function getState() {
    return {
      karel: { ...karel },
      beepers: { ...beepers },
      walls: new Set(walls),
      gridW: GRID_W,
      gridH: GRID_H,
    };
  }

  return {
    reset, move, turnLeft, turnRight, pickBeeper, putBeeper,
    setBeeper, setWall, setKarel, getState,
    frontIsClear, beeperIsPresent,
    facingNorth, facingEast, facingSouth, facingWest,
    DIR_SYMBOLS,
  };
})();
