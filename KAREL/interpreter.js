// interpreter.js – parser a interpret příkazů Karela

const Interpreter = (() => {
  let userDefs = {}; // vlastní příkazy
  let program = []; // multiline program buffer
  let programMode = false; // jsme uvnitř DEFINE nebo nahráváme program?
  let defName = null;
  let defBuffer = [];

  function reset() {
    userDefs = {};
    program = [];
    programMode = false;
    defName = null;
    defBuffer = [];
  }

  function clearProgram() {
    program = [];
    Terminal.print('>> Program vymazán.');
  }

  function showProgram() {
    if (program.length === 0) {
      Terminal.print('>> Program je prázdný.');
      return;
    }
    Terminal.print('>> Aktuální program:');
    program.forEach((line, i) => Terminal.print(`   ${String(i + 1).padStart(2, '0')}  ${line}`));
  }

  // Evaluate condition string
  function evalCondition(cond) {
    switch (cond.toUpperCase()) {
      case 'FRONT-IS-CLEAR': return World.frontIsClear();
      case 'BEEPER-IS-PRESENT': return World.beeperIsPresent();
      case 'FACING-NORTH': return World.facingNorth();
      case 'FACING-EAST': return World.facingEast();
      case 'FACING-SOUTH': return World.facingSouth();
      case 'FACING-WEST': return World.facingWest();
      default: throw new Error(`CHYBA: Neznámá podmínka '${cond}'`);
    }
  }

  // Parse lines into a flat step-function array
  function compileLines(lines) {
    const steps = [];
    let i = 0;

    function parseBlock(endTokens) {
      const block = [];
      while (i < lines.length) {
        const line = lines[i].trim().toUpperCase();
        if (endTokens.some(t => line === t || line.startsWith(t))) break;
        block.push(...parseLine());
      }
      return block;
    }

    function parseLine() {
      const raw = lines[i].trim();
      const upper = raw.toUpperCase();
      i++;
      const parts = raw.split(/\s+/);
      const uparts = upper.split(/\s+/);

      // REPEAT n TIMES
      if (uparts[0] === 'REPEAT') {
        const n = parseInt(uparts[1]);
        if (isNaN(n) || n < 1) throw new Error(`CHYBA: REPEAT potřebuje kladné číslo, dostalo '${uparts[1]}'`);
        const body = parseBlock(['END']);
        i++; // skip END
        const result = [];
        for (let r = 0; r < n; r++) result.push(...body);
        return result;
      }

      // WHILE podmínka
      if (uparts[0] === 'WHILE') {
        const cond = uparts.slice(1).join('-');
        const body = parseBlock(['END']);
        i++; // skip END
        // Dynamic: generate steps at runtime via closure
        const whileSteps = [];
        whileSteps.push(() => {
          // Re-evaluate each iteration
          const runWhile = () => {
            if (!evalCondition(cond)) return [];
            return [...body, runWhile];
          };
          // We'll use a trick: push remaining steps dynamically
          // Instead, compile to a recursive step injector
        });
        // Better approach: return a special while-runner
        return [createWhileRunner(cond, body)];
      }

      // IF podmínka
      if (uparts[0] === 'IF') {
        const cond = uparts.slice(1).join('-');
        const thenBlock = parseBlock(['ELSE', 'END']);
        let elseBlock = [];
        const nextLine = lines[i] ? lines[i].trim().toUpperCase() : '';
        if (nextLine === 'ELSE') {
          i++; // skip ELSE
          elseBlock = parseBlock(['END']);
        }
        i++; // skip END
        return [createIfRunner(cond, thenBlock, elseBlock)];
      }

      // END (standalone – block terminator already consumed)
      if (upper === 'END') return [];

      // Simple commands
      return [createSimpleStep(raw)];
    }

    while (i < lines.length) {
      steps.push(...parseLine());
    }
    return steps;
  }

  function createSimpleStep(raw) {
    return () => executeSimple(raw);
  }

  function createWhileRunner(cond, bodySteps) {
    // Returns a step that, when run, injects more steps if condition holds
    return function whileRunner() {
      if (!evalCondition(cond)) return;
      // Execute body steps synchronously then re-check via animator queue injection
      // We'll handle this via a queue-injection pattern in Animator
      Animator.injectSteps([...bodySteps, createWhileRunner(cond, bodySteps)]);
    };
  }

  function createIfRunner(cond, thenBlock, elseBlock) {
    return () => {
      const result = evalCondition(cond);
      if (result) {
        Animator.injectSteps([...thenBlock]);
      } else if (elseBlock.length > 0) {
        Animator.injectSteps([...elseBlock]);
      }
    };
  }

  function executeSimple(raw) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    switch (cmd) {
      case 'MOVE': World.move(); break;
      case 'TURNLEFT': World.turnLeft(); break;
      case 'TURNRIGHT': World.turnRight(); break;
      case 'PICKBEEPER': World.pickBeeper(); break;
      case 'PUTBEEPER': World.putBeeper(); break;

      case 'SET-KAREL': {
        const x = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        const dir = (parts[3] || 'N').toUpperCase();
        World.setKarel(x, y, dir);
        Terminal.print(`>> Karel přesunut na [${x},${y}] směr ${dir}`);
        break;
      }
      case 'SET-BEEPER': {
        const x = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        const count = parseInt(parts[3]) || 1;
        World.setBeeper(x, y, count);
        Terminal.print(`>> Beeper umístěn na [${x},${y}]`);
        break;
      }
      case 'SET-WALL': {
        const x = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        const side = (parts[3] || '').toUpperCase();
        World.setWall(x, y, side);
        Terminal.print(`>> Zeď postavena na [${x},${y}] strana ${side}`);
        break;
      }
      case 'RESET': {
        World.reset();
        Terminal.print('>> Svět resetován.');
        break;
      }
      case 'SPEED': {
        const n = parseInt(parts[1]);
        Animator.setSpeed(n);
        Terminal.print(`>> Rychlost nastavena na ${n}`);
        break;
      }
      case 'CLEAR-PROGRAM': clearProgram(); break;
      case 'SHOW-PROGRAM': showProgram(); break;

      default:
        // User-defined command?
        if (userDefs[cmd]) {
          Animator.injectSteps([...userDefs[cmd]]);
        } else {
          throw new Error(`CHYBA: Neznámý příkaz '${raw}'`);
        }
    }
  }

  // Entry point for terminal input
  function handleInput(input) {
    const trimmed = input.trim();
    if (!trimmed) return;

    const upper = trimmed.toUpperCase();
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    // DEFINE mode
    if (defName !== null) {
      if (upper === 'END') {
        try {
          userDefs[defName] = compileLines(defBuffer);
          Terminal.print(`>> Příkaz '${defName}' definován (${defBuffer.length} řádků).`);
        } catch (e) {
          Terminal.print('❌ ' + e.message);
        }
        defName = null;
        defBuffer = [];
      } else {
        defBuffer.push(trimmed);
        Terminal.print(`   ${trimmed}`);
      }
      return;
    }

    if (cmd === 'DEFINE') {
      const name = parts[1] ? parts[1].toUpperCase() : null;
      if (!name) { Terminal.print('❌ CHYBA: DEFINE potřebuje jméno příkazu.'); return; }
      defName = name;
      defBuffer = [];
      Terminal.print(`>> Definuji příkaz '${name}'. Zadávej řádky, ukonči příkazem END.`);
      return;
    }

    // Program buffer accumulation (multiline via colon prefix)
    if (trimmed.startsWith(':')) {
      program.push(trimmed.slice(1).trim());
      Terminal.print(`   ${trimmed.slice(1).trim()}`);
      return;
    }

    if (cmd === 'RUN') {
      if (program.length === 0) { Terminal.print('>> Program je prázdný. Přidej řádky prefixem ":"'); return; }
      Terminal.print('>> Spouštím program...');
      runLines(program);
      return;
    }

    // Single-line immediate execution
    try {
      const steps = compileLines([trimmed]);
      if (steps.length > 0) {
        Animator.enqueue(steps, () => Terminal.print('>> OK'));
      }
    } catch (e) {
      Terminal.print('❌ ' + e.message);
    }
  }

  function runLines(lines) {
    try {
      const steps = compileLines([...lines]);
      Animator.enqueue(steps, () => Terminal.print('>> Program dokončen.'));
    } catch (e) {
      Terminal.print('❌ ' + e.message);
    }
  }

  return { handleInput, reset, clearProgram, showProgram };
})();
