// commands.js – seznam příkazů pro agendu

const COMMANDS_REFERENCE = [
  {
    category: '[ POHYB ]',
    commands: [
      { cmd: 'MOVE', desc: 'Pohyb o jedno pole dopředu' },
      { cmd: 'TURNLEFT', desc: 'Otočení doleva o 90°' },
      { cmd: 'TURNRIGHT', desc: 'Otočení doprava o 90°' },
    ]
  },
  {
    category: '[ BEEPERY ]',
    commands: [
      { cmd: 'PICKBEEPER', desc: 'Sebere beeper z aktuálního políčka' },
      { cmd: 'PUTBEEPER', desc: 'Položí beeper na aktuální políčko' },
    ]
  },
  {
    category: '[ NASTAVENÍ SVĚTA ]',
    commands: [
      { cmd: 'SET-KAREL x y dir', desc: 'Umístí Karela na [x,y] směrem dir (N/E/S/W)' },
      { cmd: 'SET-BEEPER x y', desc: 'Umístí beeper na souřadnice [x,y]' },
      { cmd: 'SET-WALL x y dir', desc: 'Postaví zeď na straně dir políčka [x,y]' },
      { cmd: 'RESET', desc: 'Vymaže celý svět a vrátí Karela na start' },
    ]
  },
  {
    category: '[ ŘÍDÍCÍ STRUKTURY ]',
    commands: [
      { cmd: 'REPEAT n TIMES', desc: 'Opakuje blok příkazů n-krát' },
      { cmd: 'END', desc: 'Ukončí blok REPEAT, IF nebo WHILE' },
      { cmd: 'IF podmínka', desc: 'Provede blok pokud je podmínka splněna' },
      { cmd: 'ELSE', desc: 'Alternativní větev pro IF' },
      { cmd: 'WHILE podmínka', desc: 'Opakuje blok dokud je podmínka splněna' },
    ]
  },
  {
    category: '[ PODMÍNKY ]',
    commands: [
      { cmd: 'FRONT-IS-CLEAR', desc: 'Pravda pokud je před Karelem volno' },
      { cmd: 'BEEPER-IS-PRESENT', desc: 'Pravda pokud je na políčku beeper' },
      { cmd: 'FACING-NORTH', desc: 'Pravda pokud Karel míří na sever (^)' },
      { cmd: 'FACING-EAST', desc: 'Pravda pokud Karel míří na východ (>)' },
      { cmd: 'FACING-SOUTH', desc: 'Pravda pokud Karel míří na jih (v)' },
      { cmd: 'FACING-WEST', desc: 'Pravda pokud Karel míří na západ (<)' },
    ]
  },
  {
    category: '[ VLASTNÍ PŘÍKAZY ]',
    commands: [
      { cmd: 'DEFINE name', desc: 'Začne definici vlastního příkazu "name"' },
      { cmd: 'END', desc: 'Ukončí definici vlastního příkazu' },
    ]
  },
  {
    category: '[ PROGRAM ]',
    commands: [
      { cmd: 'RUN', desc: 'Spustí nahraný program (multiline režim)' },
      { cmd: 'CLEAR-PROGRAM', desc: 'Vymaže nahraný program' },
      { cmd: 'SHOW-PROGRAM', desc: 'Zobrazí aktuálně nahraný program' },
      { cmd: 'SPEED n', desc: 'Nastaví rychlost animace (1=pomalá, 10=rychlá)' },
    ]
  },
];

function buildAgendaHTML() {
  return COMMANDS_REFERENCE.map(section => `
    <div class="agenda-section">
      <div class="agenda-category">${section.category}</div>
      <div class="agenda-commands">
        ${section.commands.map(c => `
          <div class="agenda-row">
            <span class="agenda-cmd">${c.cmd}</span>
            <span class="agenda-desc">${c.desc}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
