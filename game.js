(() => {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const HIDDEN_ROWS = 2;
  const TOTAL_ROWS = ROWS + HIDDEN_ROWS;
  const NEXT_COUNT = 5;

  const COLORS = {
    I: "#00e5e5",
    O: "#f0d000",
    T: "#c040e0",
    S: "#40d040",
    Z: "#e04040",
    J: "#4060e0",
    L: "#e08020",
    G: "#5a6470",
    grid: "rgba(255,255,255,0.04)",
  };

  const SHAPES = {
    I: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]],
    ],
    O: [
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
    ],
    T: [
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]],
    ],
    S: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[1, 1], [2, 1], [0, 2], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
    ],
    Z: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [0, 1], [1, 1], [0, 2]],
    ],
    J: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]],
    ],
    L: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]],
    ],
  };

  const KICKS_JLSTZ = {
    "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };

  const KICKS_I = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };

  const SCORE_TABLE = [0, 100, 300, 500, 800];
  const ATTACK_TABLE = [0, 0, 1, 2, 4];
  const LOCK_DELAY = 500;
  const MAX_LOCK_RESETS = 15;
  const DAS_DELAY = 140;
  const ARR_RATE = 40;
  const SOFT_DROP_MS = 40;
  const LINE_CLEAR_MS = 280;

  function gravityMs(level) {
    const table = [
      800, 716, 633, 550, 466, 383, 300, 216, 133, 100,
      83, 83, 83, 66, 66, 66, 50, 50, 50, 33, 33, 33, 33, 33, 33,
      16, 16, 16, 16, 16, 8,
    ];
    return table[Math.min(level - 1, table.length - 1)];
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBlock(ctx, x, y, color, size, alpha = 1) {
    const pad = 1.5;
    const r = 3;
    ctx.save();
    ctx.globalAlpha = alpha;
    const px = x * size + pad;
    const py = y * size + pad;
    const s = size - pad * 2;
    ctx.fillStyle = color;
    roundRect(ctx, px, py, s, s, r);
    ctx.fill();
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "rgba(255,255,255,0.35)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = grad;
    roundRect(ctx, px, py, s, s, r);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    roundRect(ctx, px + 2, py + 2, s * 0.4, s * 0.22, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMiniPiece(ctx, type, cx, cy, size) {
    if (!type) return;
    const shape = SHAPES[type][0];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of shape) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const ox = cx - (w * size) / 2 - minX * size;
    const oy = cy - (h * size) / 2 - minY * size;
    for (const [x, y] of shape) {
      const px = ox + x * size;
      const py = oy + y * size;
      const pad = 1;
      const r = 2;
      ctx.save();
      ctx.fillStyle = COLORS[type];
      roundRect(ctx, px + pad, py + pad, size - pad * 2, size - pad * 2, r);
      ctx.fill();
      const grad = ctx.createLinearGradient(px, py, px, py + size);
      grad.addColorStop(0, "rgba(255,255,255,0.3)");
      grad.addColorStop(1, "rgba(0,0,0,0.2)");
      ctx.fillStyle = grad;
      roundRect(ctx, px + pad, py + pad, size - pad * 2, size - pad * 2, r);
      ctx.fill();
      ctx.restore();
    }
  }

  class TetrisPlayer {
    constructor(options) {
      this.id = options.id;
      this.name = options.name;
      this.keys = options.keys;
      this.dom = options.dom;
      this.competitive = options.competitive || false;
      this.spectator = options.spectator || false;
      this.onAttack = options.onAttack || (() => {});
      this.onGameOver = options.onGameOver || (() => {});
      this.onReady = options.onReady || (() => {});
      this.onStateSync = options.onStateSync || (() => {});

      this.boardCtx = this.dom.board.getContext("2d");
      this.holdCtx = this.dom.hold ? this.dom.hold.getContext("2d") : null;
      this.nextCtx = this.dom.next ? this.dom.next.getContext("2d") : null;

      this.resetState();
      this.active = false;
      this.inputEnabled = !this.spectator;
      this.pressed = Object.create(null);
      this.dasDir = 0;
      this.dasTimer = 0;
      this.arrTimer = 0;
      this.dasCharged = false;
      this.dropAccum = 0;
      this.softDropping = false;
      this.lockTimer = null;
    }

    get blockSize() {
      return this.dom.board.width / COLS;
    }

    resetState() {
      this.grid = Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
      this.bag = [];
      this.queue = [];
      this.current = null;
      this.hold = null;
      this.canHold = true;
      this.canSkip = true;
      this.score = 0;
      this.level = 1;
      this.lines = 0;
      this.running = false;
      this.paused = false;
      this.gameOver = false;
      this.clearing = false;
      this.clearAnim = null;
      this.lockResets = 0;
      this.lastLockY = -1;
      this.pendingGarbage = 0;
    }

    emptyGrid() {
      return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
    }

    refillBag() {
      const types = ["I", "O", "T", "S", "Z", "J", "L"];
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      this.bag.push(...types);
    }

    nextFromBag() {
      if (this.bag.length < 7) this.refillBag();
      return this.bag.shift();
    }

    fillQueue() {
      while (this.queue.length < NEXT_COUNT) this.queue.push(this.nextFromBag());
    }

    createPiece(type) {
      return { type, rot: 0, x: 3, y: 0 };
    }

    cellsOf(piece, rot = piece.rot, ox = piece.x, oy = piece.y) {
      return SHAPES[piece.type][rot].map(([cx, cy]) => [ox + cx, oy + cy]);
    }

    valid(piece, rot = piece.rot, ox = piece.x, oy = piece.y) {
      for (const [x, y] of this.cellsOf(piece, rot, ox, oy)) {
        if (x < 0 || x >= COLS || y >= TOTAL_ROWS) return false;
        if (y < 0) continue;
        if (this.grid[y][x]) return false;
      }
      return true;
    }

    ghostY(piece) {
      let y = piece.y;
      while (this.valid(piece, piece.rot, piece.x, y + 1)) y++;
      return y;
    }

    cancelLock() {
      if (this.lockTimer !== null) {
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
      }
    }

    startLock() {
      this.cancelLock();
      this.lockTimer = setTimeout(() => {
        this.lockTimer = null;
        if (this.running && !this.paused && !this.clearing && this.current &&
            !this.valid(this.current, this.current.rot, this.current.x, this.current.y + 1)) {
          this.lockPiece();
        }
      }, LOCK_DELAY);
    }

    isGrounded() {
      return this.current && !this.valid(this.current, this.current.rot, this.current.x, this.current.y + 1);
    }

    ensureLock() {
      if (!this.isGrounded()) {
        this.cancelLock();
        return;
      }
      if (this.lockTimer === null) this.startLock();
    }

    tryResetLock() {
      if (!this.isGrounded()) {
        this.cancelLock();
        return;
      }
      if (this.current.y !== this.lastLockY) {
        this.lastLockY = this.current.y;
        this.lockResets = 0;
      }
      if (this.lockResets < MAX_LOCK_RESETS) {
        this.lockResets++;
        this.startLock();
      } else if (this.lockTimer === null) {
        this.startLock();
      }
    }

    spawn() {
      this.fillQueue();
      const type = this.queue.shift();
      this.fillQueue();
      this.current = this.createPiece(type);
      this.canHold = true;
      this.canSkip = true;
      this.lockResets = 0;
      this.lastLockY = -1;
      this.cancelLock();

      if (this.pendingGarbage > 0) {
        this.injectGarbage(this.pendingGarbage);
        this.pendingGarbage = 0;
      }

      if (!this.valid(this.current)) {
        this.endGame(false);
        return false;
      }
      this.notifyStateSync();
      return true;
    }

    injectGarbage(lineCount) {
      for (let i = 0; i < lineCount; i++) {
        const hole = Math.floor(Math.random() * COLS);
        const row = Array(COLS).fill("G");
        row[hole] = null;
        this.grid.shift();
        this.grid.push(row);
      }
    }

    receiveGarbage(lines) {
      if (!this.running || this.gameOver) return;
      if (this.current && !this.clearing) {
        this.pendingGarbage += lines;
      } else {
        this.injectGarbage(lines);
        this.notifyStateSync();
      }
    }

    lockPiece() {
      if (!this.current) return;
      this.cancelLock();
      for (const [x, y] of this.cellsOf(this.current)) {
        if (y < 0) {
          this.endGame(false);
          return;
        }
        this.grid[y][x] = this.current.type;
      }
      this.current = null;
      const full = this.findFullRows();
      if (full.length) {
        this.startLineClear(full);
      } else {
        this.spawn();
      }
      this.notifyStateSync();
    }

    findFullRows() {
      const rows = [];
      for (let y = 0; y < TOTAL_ROWS; y++) {
        if (this.grid[y].every((c) => c !== null)) rows.push(y);
      }
      return rows;
    }

    startLineClear(rows) {
      this.clearing = true;
      this.clearAnim = { rows: new Set(rows), start: performance.now() };
      const count = rows.length;
      this.score += SCORE_TABLE[count] * this.level;
      this.lines += count;
      this.level = Math.max(this.level, Math.floor(this.lines / 10) + 1);
      this.updateHUD();

      if (this.competitive && count > 0) {
        const attack = ATTACK_TABLE[count] || 0;
        if (attack > 0) this.onAttack(attack);
      }

      setTimeout(() => {
        const sorted = [...rows].sort((a, b) => a - b);
        for (const y of sorted) {
          this.grid.splice(y, 1);
          this.grid.unshift(Array(COLS).fill(null));
        }
        this.clearAnim = null;
        this.clearing = false;
        this.spawn();
        this.notifyStateSync();
      }, LINE_CLEAR_MS);
    }

    move(dx) {
      if (!this.current || this.clearing) return false;
      if (this.valid(this.current, this.current.rot, this.current.x + dx, this.current.y)) {
        this.current.x += dx;
        this.tryResetLock();
        this.notifyStateSync();
        return true;
      }
      return false;
    }

    softDropStep() {
      if (!this.current || this.clearing) return false;
      if (this.valid(this.current, this.current.rot, this.current.x, this.current.y + 1)) {
        this.current.y++;
        this.score += 1;
        this.updateHUD();
        this.ensureLock();
        this.notifyStateSync();
        return true;
      }
      this.ensureLock();
      return false;
    }

    hardDrop() {
      if (!this.current || this.clearing) return;
      const gy = this.ghostY(this.current);
      const dropped = gy - this.current.y;
      this.current.y = gy;
      this.score += dropped * 2;
      this.updateHUD();
      this.notifyStateSync();
      this.lockPiece();
    }

    rotate(dir) {
      if (!this.current || this.clearing || this.current.type === "O") return;
      const from = this.current.rot;
      const to = (from + dir + 4) % 4;
      const key = `${from}>${to}`;
      const kicks = this.current.type === "I" ? KICKS_I[key] : KICKS_JLSTZ[key];
      for (const [kx, ky] of kicks) {
        const nx = this.current.x + kx;
        const ny = this.current.y - ky;
        if (this.valid(this.current, to, nx, ny)) {
          this.current.rot = to;
          this.current.x = nx;
          this.current.y = ny;
          this.tryResetLock();
          this.notifyStateSync();
          return;
        }
      }
    }

    holdPiece() {
      if (!this.current || !this.canHold || this.clearing) return;
      this.cancelLock();
      const type = this.current.type;
      if (this.hold === null) {
        this.hold = type;
        this.current = null;
        this.spawn();
      } else {
        const swap = this.hold;
        this.hold = type;
        this.current = this.createPiece(swap);
        this.lockResets = 0;
        this.lastLockY = -1;
        if (!this.valid(this.current)) {
          this.endGame(false);
          return;
        }
      }
      this.canHold = false;
      this.drawHold();
      this.notifyStateSync();
    }

    skipPiece() {
      if (!this.current || !this.canSkip || this.clearing) return;
      this.cancelLock();
      this.current = null;
      this.spawn();
      this.canSkip = false;
      this.notifyStateSync();
    }

    reset() {
      this.cancelLock();
      this.resetState();
      this.updateHUD();
      this.drawHold();
      this.drawNext();
      this.drawBoard();
    }

    start() {
      this.reset();
      this.running = true;
      this.active = true;
      this.hideOverlay();
      this.spawn();
      this.onReady();
    }

    endGame(won) {
      if (this.gameOver) return;
      this.running = false;
      this.gameOver = true;
      this.active = false;
      this.cancelLock();
      this.current = null;
      this.onGameOver(won);
    }

    showOverlay(title, msg, isGameOver = false) {
      if (!this.dom.overlay || !this.dom.overlayTitle || !this.dom.overlayMsg) return;
      this.dom.overlayTitle.textContent = title;
      this.dom.overlayMsg.textContent = msg;
      this.dom.overlayMsg.style.whiteSpace = "pre-line";
      this.dom.overlayTitle.classList.toggle("game-over", isGameOver);
      this.dom.overlay.classList.remove("hidden");
    }

    hideOverlay() {
      if (!this.dom.overlay) return;
      this.dom.overlay.classList.add("hidden");
    }

    togglePause() {
      if (!this.running || this.gameOver) return;
      this.paused = !this.paused;
      if (this.paused) {
        this.cancelLock();
        this.showOverlay("PAUSED", "Press P to resume");
      } else {
        this.hideOverlay();
        if (this.isGrounded()) this.startLock();
      }
    }

    updateHUD() {
      this.dom.score.textContent = String(this.score);
      if (this.dom.level) this.dom.level.textContent = String(this.level);
      this.dom.lines.textContent = String(this.lines);
    }

    drawBoard() {
      const ctx = this.boardCtx;
      const canvas = this.dom.board;
      const block = this.blockSize;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * block + 0.5, 0);
        ctx.lineTo(x * block + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * block + 0.5);
        ctx.lineTo(canvas.width, y * block + 0.5);
        ctx.stroke();
      }

      const flash = this.clearAnim
        ? Math.sin(((performance.now() - this.clearAnim.start) / LINE_CLEAR_MS) * Math.PI * 4) * 0.5 + 0.5
        : 0;

      for (let y = HIDDEN_ROWS; y < TOTAL_ROWS; y++) {
        const vy = y - HIDDEN_ROWS;
        const clearingRow = this.clearAnim && this.clearAnim.rows.has(y);
        for (let x = 0; x < COLS; x++) {
          const cell = this.grid[y][x];
          if (!cell) continue;
          if (clearingRow) {
            drawBlock(ctx, x, vy, "#ffffff", block, 0.4 + flash * 0.6);
          } else {
            drawBlock(ctx, x, vy, COLORS[cell] || COLORS.G, block);
          }
        }
      }

      if (this.current && !this.clearing) {
        const gy = this.ghostY(this.current);
        if (gy !== this.current.y) {
          for (const [x, y] of this.cellsOf(this.current, this.current.rot, this.current.x, gy)) {
            if (y >= HIDDEN_ROWS) {
              drawBlock(ctx, x, y - HIDDEN_ROWS, COLORS[this.current.type], block, 0.22);
            }
          }
        }
        for (const [x, y] of this.cellsOf(this.current)) {
          if (y >= HIDDEN_ROWS) {
            drawBlock(ctx, x, y - HIDDEN_ROWS, COLORS[this.current.type], block);
          }
        }
      }
    }

    drawHold() {
      if (!this.holdCtx || !this.dom.hold) return;
      const ctx = this.holdCtx;
      const canvas = this.dom.hold;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (this.hold) {
        ctx.globalAlpha = this.canHold ? 1 : 0.35;
        drawMiniPiece(ctx, this.hold, canvas.width / 2, canvas.height / 2, 22);
        ctx.globalAlpha = 1;
      }
    }

    drawNext() {
      if (!this.nextCtx || !this.dom.next) return;
      const ctx = this.nextCtx;
      const canvas = this.dom.next;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const slotH = canvas.height / NEXT_COUNT;
      this.queue.slice(0, NEXT_COUNT).forEach((type, i) => {
        const size = i === 0 ? 22 : 18;
        drawMiniPiece(ctx, type, canvas.width / 2, slotH * i + slotH / 2, size);
      });
    }

    tick(dt) {
      if (this.spectator) return;
      if (!this.running || this.paused || this.gameOver || this.clearing) return;
      this.handleDAS(dt);
      if (this.current) {
        const interval = this.softDropping ? SOFT_DROP_MS : gravityMs(this.level);
        this.dropAccum += dt;
        while (this.dropAccum >= interval) {
          this.dropAccum -= interval;
          if (this.softDropping) {
            if (!this.softDropStep()) break;
          } else if (this.valid(this.current, this.current.rot, this.current.x, this.current.y + 1)) {
            this.current.y++;
            this.ensureLock();
          } else {
            this.ensureLock();
            break;
          }
        }
      }
    }

    render() {
      this.drawBoard();
      this.drawNext();
      this.drawHold();
    }

    handleDAS(dt) {
      if (this.dasDir === 0) return;
      if (!this.dasCharged) {
        this.dasTimer += dt;
        if (this.dasTimer >= DAS_DELAY) {
          this.dasCharged = true;
          this.arrTimer = 0;
          this.move(this.dasDir);
        }
      } else {
        this.arrTimer += dt;
        while (this.arrTimer >= ARR_RATE) {
          this.arrTimer -= ARR_RATE;
          if (!this.move(this.dasDir)) break;
        }
      }
    }

    setDas(dir) {
      if (this.dasDir === dir) return;
      this.dasDir = dir;
      this.dasTimer = 0;
      this.arrTimer = 0;
      this.dasCharged = false;
      if (dir !== 0) this.move(dir);
    }

    clearInput() {
      this.pressed = Object.create(null);
      this.setDas(0);
      this.softDropping = false;
    }

    handleKeyDown(code) {
      if (!this.inputEnabled || !this.running || this.paused || this.gameOver || this.clearing) return;
      if (this.pressed[code]) return;
      this.pressed[code] = true;
      const k = this.keys;
      if (!k.left) return;

      if (code === k.left) this.setDas(-1);
      else if (code === k.right) this.setDas(1);
      else if (code === k.down) {
        this.softDropping = true;
        this.dropAccum = 0;
        this.softDropStep();
      } else if (code === k.rotateCW) this.rotate(1);
      else if (code === k.rotateCCW) this.rotate(-1);
      else if (code === k.hardDrop) this.hardDrop();
      else if (code === k.hold) this.holdPiece();
      else if (code === k.skip) this.skipPiece();
    }

    handleKeyUp(code) {
      this.pressed[code] = false;
      const k = this.keys;
      if (!k.left) return;
      if (code === k.left && this.dasDir === -1) {
        this.setDas(this.pressed[k.right] ? 1 : 0);
      } else if (code === k.right && this.dasDir === 1) {
        this.setDas(this.pressed[k.left] ? -1 : 0);
      } else if (code === k.down) {
        this.softDropping = false;
        this.dropAccum = 0;
      }
    }

    notifyStateSync() {
      if (!this.spectator) this.onStateSync();
    }

    exportState() {
      let gridStr = "";
      for (let y = 0; y < TOTAL_ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          gridStr += this.grid[y][x] || ".";
        }
      }
      return {
        grid: gridStr,
        current: this.current ? { ...this.current } : null,
        queue: this.queue.slice(0, NEXT_COUNT),
        hold: this.hold,
        score: this.score,
        lines: this.lines,
      };
    }

    importState(state) {
      if (!state) return;
      if (typeof state.grid === "string") {
        this.grid = [];
        for (let y = 0; y < TOTAL_ROWS; y++) {
          const row = [];
          for (let x = 0; x < COLS; x++) {
            const ch = state.grid[y * COLS + x] || ".";
            row.push(ch === "." ? null : ch);
          }
          this.grid.push(row);
        }
      } else if (Array.isArray(state.grid)) {
        this.grid = state.grid.map((row) => row.map((cell) => cell || null));
      }
      this.current = state.current ? { ...state.current } : null;
      this.queue = state.queue ? state.queue.slice() : [];
      this.hold = state.hold || null;
      this.score = state.score || 0;
      this.lines = state.lines || 0;
      this.clearing = false;
      this.clearAnim = null;
      this.updateHUD();
    }

    startSpectating() {
      this.reset();
      this.running = true;
      this.active = true;
      this.drawBoard();
      this.drawHold();
      this.drawNext();
    }
  }

  // ——— DOM refs ———
  const menuScreen = document.getElementById("menu-screen");
  const soloScreen = document.getElementById("solo-screen");
  const localScreen = document.getElementById("local-screen");
  const onlineScreen = document.getElementById("online-screen");
  const lobbyPanel = document.getElementById("lobby-panel");
  const onlineGamePanel = document.getElementById("online-game-panel");
  const lobbyStatus = document.getElementById("lobby-status");
  const roomCodeDisplay = document.getElementById("room-code-display");
  const roomCodeInput = document.getElementById("room-code-input");
  const lobbyError = document.getElementById("lobby-error");
  const btnStartMatch = document.getElementById("btn-start-match");

  const KEY_P1 = {
    left: "ArrowLeft", right: "ArrowRight", down: "ArrowDown",
    rotateCW: "ArrowUp", rotateCCW: "KeyZ", hardDrop: "Space",
    hold: "KeyC", skip: "KeyV", pause: "KeyP",
  };

  const KEY_P2 = {
    left: "KeyA", right: "KeyD", down: "KeyS",
    rotateCW: "KeyW", rotateCCW: "KeyQ", hardDrop: "KeyE",
    hold: "KeyF", skip: "KeyR", pause: "KeyO",
  };

  function playerDom(prefix) {
    return {
      board: document.getElementById(`${prefix}-board`),
      hold: document.getElementById(`${prefix}-hold`),
      next: document.getElementById(`${prefix}-next`),
      score: document.getElementById(`${prefix}-score`),
      level: document.getElementById(`${prefix}-level`),
      lines: document.getElementById(`${prefix}-lines`),
      overlay: document.getElementById(`${prefix}-overlay`),
      overlayTitle: document.getElementById(`${prefix}-overlay-title`),
      overlayMsg: document.getElementById(`${prefix}-overlay-msg`),
    };
  }

  let mode = "menu";
  let players = [];
  let matchOver = false;
  let lastTime = 0;
  let animId = 0;
  let peer = null;
  let dataConn = null;
  let roomCode = "";
  let isHost = false;
  let onlinePlayer = null;
  let opponentView = null;
  let onlineOpponentName = "Opponent";
  let onlineSyncAccum = 0;
  let pendingOpponentState = null;
  const ONLINE_SYNC_MS = 50;

  function showScreen(screen) {
    [menuScreen, soloScreen, localScreen, onlineScreen].forEach((el) => {
      el.classList.toggle("hidden", el !== screen);
    });
  }

  function stopAll() {
    players.forEach((p) => {
      p.cancelLock();
      p.running = false;
      p.active = false;
      p.clearInput();
    });
    players = [];
    matchOver = false;
    onlineSyncAccum = 0;
    pendingOpponentState = null;
    opponentView = null;
    onlinePlayer = null;
    if (dataConn) {
      dataConn.close();
      dataConn = null;
    }
    if (peer) {
      peer.destroy();
      peer = null;
    }
  }

  function goMenu() {
    stopAll();
    mode = "menu";
    showScreen(menuScreen);
    lobbyPanel.classList.remove("hidden");
    onlineGamePanel.classList.add("hidden");
    lobbyError.textContent = "";
    roomCodeDisplay.textContent = "----";
    roomCodeInput.value = "";
    btnStartMatch.classList.add("hidden");
  }

  function createPlayer(id, name, keyMap, domPrefix, competitive, callbacks, extra = {}) {
    return new TetrisPlayer({
      id,
      name,
      keys: keyMap,
      dom: playerDom(domPrefix),
      competitive,
      spectator: extra.spectator || false,
      onAttack: callbacks.onAttack,
      onGameOver: callbacks.onGameOver,
      onReady: callbacks.onReady || (() => {}),
      onStateSync: callbacks.onStateSync || (() => {}),
    });
  }

  function startSolo() {
    stopAll();
    mode = "solo";
    showScreen(soloScreen);
    const player = createPlayer("solo", "Player", KEY_P1, "solo", false, {
      onGameOver: () => {
        player.showOverlay("GAME OVER", `Score: ${player.score}\nPress Enter to restart`, true);
      },
    });
    players = [player];
    player.showOverlay("TETRIS", "Press Enter to start");
    lastTime = performance.now();
    if (!animId) animId = requestAnimationFrame(loop);
  }

  function startLocal() {
    stopAll();
    mode = "local";
    showScreen(localScreen);
    matchOver = false;

    const p1 = createPlayer("p1", "Player 1", KEY_P1, "p1", true, {
      onAttack: (lines) => { if (!matchOver && p2.running) p2.receiveGarbage(lines); },
      onGameOver: (won) => handleLocalOver(p1, p2, won),
    });

    const p2 = createPlayer("p2", "Player 2", KEY_P2, "p2", true, {
      onAttack: (lines) => { if (!matchOver && p1.running) p1.receiveGarbage(lines); },
      onGameOver: (won) => handleLocalOver(p2, p1, won),
    });

    players = [p1, p2];
    p1.showOverlay("PLAYER 1", "Press Enter to start");
    p2.showOverlay("PLAYER 2", "Press Enter to start");
    lastTime = performance.now();
    if (!animId) animId = requestAnimationFrame(loop);
  }

  function handleLocalOver(loser, winner, won) {
    if (matchOver) return;
    matchOver = true;
    loser.showOverlay("DEFEAT", `${winner.name} wins!\nPress Enter for rematch`, true);
    winner.endGame(true);
    winner.showOverlay("VICTORY", `You win!\nPress Enter for rematch`, true);
    players.forEach((p) => {
      p.running = false;
      p.inputEnabled = false;
    });
  }

  function rematchLocal() {
    matchOver = false;
    players.forEach((p) => {
      p.inputEnabled = true;
      p.start();
      p.showOverlay(p.id === "p1" ? "PLAYER 1" : "PLAYER 2", "Get ready!");
      setTimeout(() => p.hideOverlay(), 800);
    });
  }

  function makeRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function peerIdFromCode(code) {
    return `tetris-${code.toUpperCase()}`;
  }

  function parsePeerData(raw) {
    if (typeof raw === "string") return JSON.parse(raw);
    if (raw instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(raw));
    if (typeof raw === "object" && raw !== null) return raw;
    return JSON.parse(String(raw));
  }

  function broadcastOnlineState() {
    if (mode !== "online" || matchOver || !onlinePlayer || onlinePlayer.spectator) return;
    sendOnline({ type: "state", state: onlinePlayer.exportState() });
  }

  function applyOpponentState(state) {
    if (!state) return;
    if (!opponentView) {
      pendingOpponentState = state;
      return;
    }
    opponentView.importState(state);
    opponentView.render();
  }

  function sendOnline(msg) {
    if (!dataConn) return;
    const payload = JSON.stringify(msg);
    if (dataConn.open) {
      dataConn.send(payload);
    } else {
      dataConn.once("open", () => dataConn.send(payload));
    }
  }

  function setupDataConn(conn) {
    dataConn = conn;
    const connectTimeout = setTimeout(() => {
      if (!conn.open) {
        lobbyError.textContent = "Could not connect. Check the room code and try again.";
        conn.close();
      }
    }, 12000);

    conn.on("open", () => {
      clearTimeout(connectTimeout);
      if (!isHost) {
        roomCodeDisplay.textContent = roomCode;
        lobbyStatus.textContent = "Joined! Waiting for host to start…";
        btnStartMatch.classList.add("hidden");
      }
    });
    conn.on("data", (raw) => {
      try {
        onOnlineMessage(parsePeerData(raw));
      } catch {
        /* ignore malformed packets */
      }
    });
    conn.on("close", onPeerClose);
    conn.on("error", () => {
      lobbyError.textContent = "Connection lost. Check the room code and try again.";
    });
  }

  function onPeerClose() {
    if (mode.startsWith("online") && !matchOver) {
      lobbyError.textContent = "Opponent disconnected";
      if (onlinePlayer) {
        onlinePlayer.showOverlay("OPPONENT LEFT", "Press Enter for menu", true);
        onlinePlayer.running = false;
      }
    }
  }

  function onOnlineMessage(msg) {
    switch (msg.type) {
      case "opponent_joined":
        lobbyStatus.textContent = "Opponent connected! Host: press Start Match.";
        if (isHost) btnStartMatch.classList.remove("hidden");
        break;
      case "match_start":
        startOnlineMatch(msg.you || "You", msg.opponent || "Opponent");
        break;
      case "state":
        applyOpponentState(msg.state);
        break;
      case "attack":
        if (onlinePlayer && !matchOver) onlinePlayer.receiveGarbage(msg.lines);
        break;
      case "game_over":
      case "opponent_lost":
        if (onlinePlayer && !matchOver) {
          matchOver = true;
          onlinePlayer.endGame(true);
          onlinePlayer.showOverlay("VICTORY", "You win!\nPress Enter for menu", true);
        }
        break;
      case "error":
        lobbyError.textContent = msg.message;
        break;
    }
  }

  function hostRoom(retry = 0) {
    roomCode = makeRoomCode();
    roomCodeDisplay.textContent = roomCode;
    lobbyStatus.textContent = "Creating room…";

    peer = new Peer(peerIdFromCode(roomCode), { debug: 0 });

    peer.on("open", () => {
      lobbyStatus.textContent = "Waiting for opponent… Share the room code.";
      btnStartMatch.classList.add("hidden");
    });

    peer.on("connection", (conn) => {
      if (dataConn) dataConn.close();
      setupDataConn(conn);
      lobbyStatus.textContent = "Opponent connected! Host: press Start Match.";
      btnStartMatch.classList.remove("hidden");
    });

    peer.on("error", (err) => {
      if (err.type === "unavailable-id" && retry < 5) {
        peer.destroy();
        peer = null;
        hostRoom(retry + 1);
        return;
      }
      lobbyError.textContent = "Could not create room. Please try again.";
    });
  }

  function joinRoom(code) {
    roomCode = code;
    roomCodeDisplay.textContent = code;
    lobbyStatus.textContent = "Connecting to room…";
    btnStartMatch.classList.add("hidden");

    peer = new Peer({ debug: 0 });

    peer.on("open", () => {
      const conn = peer.connect(peerIdFromCode(code), { reliable: true });
      setupDataConn(conn);
    });

    peer.on("error", () => {
      lobbyError.textContent = "Could not connect. Check the room code and try again.";
    });
  }

  function startOnlineLobby(asHost) {
    stopAll();
    mode = "online-lobby";
    showScreen(onlineScreen);
    lobbyPanel.classList.remove("hidden");
    onlineGamePanel.classList.add("hidden");
    lobbyError.textContent = "";
    isHost = asHost;

    if (typeof Peer === "undefined") {
      lobbyError.textContent = "Multiplayer failed to load. Refresh the page.";
      return;
    }

    if (asHost) {
      hostRoom();
    } else {
      const code = roomCodeInput.value.trim().toUpperCase();
      if (code.length !== 4) {
        lobbyError.textContent = "Enter a 4-letter room code";
        return;
      }
      joinRoom(code);
    }
  }

  function startOnlineMatch(you, opponent) {
    if (mode === "online" && onlinePlayer?.running) return;
    mode = "online";
    matchOver = false;
    onlineSyncAccum = 0;
    lobbyPanel.classList.add("hidden");
    onlineGamePanel.classList.remove("hidden");
    onlineOpponentName = opponent;

    onlinePlayer = createPlayer("online", you, KEY_P1, "online", true, {
      onAttack: (lines) => sendOnline({ type: "attack", lines }),
      onStateSync: () => broadcastOnlineState(),
      onGameOver: () => {
        if (!matchOver) {
          matchOver = true;
          sendOnline({ type: "game_over" });
          onlinePlayer.showOverlay("DEFEAT", `${opponent} wins!\nPress Enter for menu`, true);
        }
      },
    });

    opponentView = createPlayer("opp", opponent, {}, "opp", false, {}, { spectator: true });
    opponentView.startSpectating();

    if (pendingOpponentState) {
      applyOpponentState(pendingOpponentState);
      pendingOpponentState = null;
    }

    players = [onlinePlayer, opponentView];
    onlinePlayer.start();
    broadcastOnlineState();
    document.getElementById("online-opponent-name").textContent = opponent;
    lastTime = performance.now();
    if (!animId) animId = requestAnimationFrame(loop);
  }

  function loop(now) {
    animId = requestAnimationFrame(loop);
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;

    if (mode === "online" && onlinePlayer?.running && !onlinePlayer.gameOver && !onlinePlayer.paused) {
      onlineSyncAccum += dt;
      if (onlineSyncAccum >= ONLINE_SYNC_MS) {
        onlineSyncAccum = 0;
        broadcastOnlineState();
      }
    }

    players.forEach((p) => {
      p.tick(dt);
      p.render();
    });
  }

  const PREVENT_DEFAULT = new Set([
    "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space",
    "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE",
  ]);

  window.addEventListener("keydown", (e) => {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();

    if (e.key === "Escape" && mode !== "menu") {
      goMenu();
      return;
    }

    if (e.key === "Enter") {
      if (mode === "solo") {
        const p = players[0];
        if (!p.running || p.gameOver) p.start();
      } else if (mode === "local") {
        if (matchOver) rematchLocal();
        else if (!players[0]?.running) {
          players.forEach((p) => {
            p.start();
            setTimeout(() => p.hideOverlay(), 600);
          });
        }
      } else if (mode === "online" && matchOver) {
        goMenu();
      }
      return;
    }

    if (mode === "solo" && (e.key === "p" || e.key === "P")) {
      players[0]?.togglePause();
      return;
    }

    if (mode === "local") {
      players.forEach((p) => {
        if (e.code === p.keys.pause) p.togglePause();
        else p.handleKeyDown(e.code);
      });
      return;
    }

    if (mode === "online" && onlinePlayer) {
      if (e.code === KEY_P1.pause) onlinePlayer.togglePause();
      else onlinePlayer.handleKeyDown(e.code);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (mode === "local") players.forEach((p) => p.handleKeyUp(e.code));
    else if (mode === "online" && onlinePlayer) onlinePlayer.handleKeyUp(e.code);
    else if (mode === "solo" && players[0]) players[0].handleKeyUp(e.code);
  });

  window.addEventListener("blur", () => players.forEach((p) => p.clearInput()));

  document.getElementById("btn-solo").addEventListener("click", startSolo);
  document.getElementById("btn-local").addEventListener("click", startLocal);
  document.getElementById("btn-create-room").addEventListener("click", () => startOnlineLobby(true));
  document.getElementById("btn-join-room").addEventListener("click", () => startOnlineLobby(false));
  document.getElementById("btn-start-match").addEventListener("click", () => {
    if (!isHost || !dataConn) return;
    const begin = () => {
      sendOnline({ type: "match_start", you: "You", opponent: "Opponent" });
      startOnlineMatch("You", "Opponent");
    };
    if (dataConn.open) begin();
    else dataConn.once("open", begin);
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", goMenu);
  });

  goMenu();
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);
})();
