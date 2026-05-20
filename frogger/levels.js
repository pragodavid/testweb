// levels.js – definice úrovní, auta, klády, rychlosti

const GRID_COLS = 14;
const GRID_ROWS = 14;

// Typy řádků
const ROW_TYPE = {
  SAFE:  'safe',
  ROAD:  'road',
  WATER: 'water',
  HOME:  'home',
};

// Každý level = pole řádků odspodu (index 0 = spodní řádek)
// speed: buňky/sekundu, dir: 1=doprava, -1=doleva
// width: šířka objektu v buňkách

function getLevel(n) {
  const speedMul = 1 + (n - 1) * 0.25;

  return [
    // row 0 – start (safe)
    { type: ROW_TYPE.SAFE,  objects: [] },

    // rows 1–5 – silnice
    { type: ROW_TYPE.ROAD, objects: makeVehicles([ 
        { speed: 2.2 * speedMul, dir: -1, width: 2, count: 3, symbol: '🚗', color: '#ff4444' }
      ], GRID_COLS) },
    { type: ROW_TYPE.ROAD, objects: makeVehicles([
        { speed: 1.6 * speedMul, dir:  1, width: 3, count: 2, symbol: '🚛', color: '#ff8800' }
      ], GRID_COLS) },
    { type: ROW_TYPE.ROAD, objects: makeVehicles([
        { speed: 2.8 * speedMul, dir: -1, width: 1, count: 4, symbol: '🏎', color: '#ff2222' }
      ], GRID_COLS) },
    { type: ROW_TYPE.ROAD, objects: makeVehicles([
        { speed: 1.4 * speedMul, dir:  1, width: 2, count: 3, symbol: '🚙', color: '#ffaa00' }
      ], GRID_COLS) },
    { type: ROW_TYPE.ROAD, objects: makeVehicles([
        { speed: 2.0 * speedMul, dir: -1, width: 2, count: 2, symbol: '🚕', color: '#ffff00' }
      ], GRID_COLS) },

    // row 6 – střední ostrůvek (safe)
    { type: ROW_TYPE.SAFE, objects: [] },

    // rows 7–11 – řeka
    { type: ROW_TYPE.WATER, objects: makeLogs([
        { speed: 1.4 * speedMul, dir:  1, width: 3, count: 2 }
      ], GRID_COLS) },
    { type: ROW_TYPE.WATER, objects: makeLogs([
        { speed: 2.0 * speedMul, dir: -1, width: 2, count: 3 }
      ], GRID_COLS) },
    { type: ROW_TYPE.WATER, objects: makeLogs([
        { speed: 1.2 * speedMul, dir:  1, width: 4, count: 2 }
      ], GRID_COLS) },
    { type: ROW_TYPE.WATER, objects: makeLogs([
        { speed: 2.4 * speedMul, dir: -1, width: 2, count: 3 }
      ], GRID_COLS) },
    { type: ROW_TYPE.WATER, objects: makeLogs([
        { speed: 1.6 * speedMul, dir:  1, width: 3, count: 2 }
      ], GRID_COLS) },

    // row 12 – bezpečný pruh před cílem
    { type: ROW_TYPE.SAFE, objects: [] },

    // row 13 – cíl (HOME)
    { type: ROW_TYPE.HOME, objects: [] },
  ];
}

function makeVehicles(specs, cols) {
  const objs = [];
  specs.forEach(spec => {
    const gap = Math.floor(cols / spec.count);
    for (let i = 0; i < spec.count; i++) {
      objs.push({
        x: i * gap,
        width: spec.width,
        speed: spec.speed,
        dir: spec.dir,
        type: 'vehicle',
        symbol: spec.symbol,
        color: spec.color,
      });
    }
  });
  return objs;
}

function makeLogs(specs, cols) {
  const objs = [];
  specs.forEach(spec => {
    const gap = Math.floor(cols / spec.count);
    for (let i = 0; i < spec.count; i++) {
      objs.push({
        x: i * gap,
        width: spec.width,
        speed: spec.speed,
        dir: spec.dir,
        type: 'log',
      });
    }
  });
  return objs;
}
