// terminal.js – příkazová řádka, vstup, historie, výstup

const Terminal = (() => {
  let history = [];
  let historyIndex = -1;
  let outputEl = null;
  let inputEl = null;

  function init() {
    outputEl = document.getElementById('terminal-output');
    inputEl = document.getElementById('terminal-input');

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputEl.value.trim();
        if (!val) return;
        history.unshift(val);
        historyIndex = -1;
        inputEl.value = '';
        print(`<span class="term-prompt">KAREL&gt;</span> <span class="term-input-echo">${escapeHtml(val)}</span>`);
        Interpreter.handleInput(val);
        scrollToBottom();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          inputEl.value = history[historyIndex];
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          inputEl.value = history[historyIndex];
        } else {
          historyIndex = -1;
          inputEl.value = '';
        }
      }
    });

    // Keep focus on input
    document.addEventListener('click', () => inputEl.focus());
    inputEl.focus();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function print(msg) {
    if (!outputEl) return;
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = msg;
    outputEl.appendChild(line);
    scrollToBottom();
  }

  function scrollToBottom() {
    if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
  }

  function printWelcome() {
    const lines = [
      '<span class="term-header">╔══════════════════════════════════════════════╗</span>',
      '<span class="term-header">║         K A R E L   v1.0   [ CRT-SIM ]      ║</span>',
      '<span class="term-header">║         Inspirováno Karlem Čapkem, 1981      ║</span>',
      '<span class="term-header">╚══════════════════════════════════════════════╝</span>',
      '',
      '>> Systém připraven. Karel stojí na výchozí pozici.',
      '>> Zadej příkaz nebo použij agendu nahoře.',
      '>> Multiline program: každý řádek prefixuj ":", pak RUN.',
      '',
    ];
    lines.forEach(l => print(l));
  }

  return { init, print, printWelcome };
})();
