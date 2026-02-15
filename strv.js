class Keyboard {
  constructor() {
    this.UP = 0;
    this.DOWN = 1;
    this._1 = 49;
    this._2 = 50;
    this._3 = 51;
    this._4 = 52;
    this._5 = 53;
    this.CTRL = 17;
    this.ARROW_LEFT = 37;
    this.ARROW_RIGHT = 39;
    this.ARROW_TOP = 38;
    this.ARROW_BOTTOM = 40;
    this.SPACE = 32;
    this.R = 82;
    this.G = 71;
    this.V = 86;
    this.B = 66;

    // --- WASD keys ---
    this.W = 87;
    this.A = 65;
    this.S = 83;
    this.D = 68;
    this.keys = new Array(255).fill(this.UP);
    document.addEventListener("keydown", evt => this.down(evt));
    document.addEventListener("keyup", evt => this.up(evt));
  }
  up(evt) {
    const k = Math.min(evt.charCode || evt.keyCode, 255);
    this.keys[k] = this.UP;
  }
  down(evt) {
    const k = Math.min(evt.charCode || evt.keyCode, 255);
    if (k === this.LEFT || k === this.ARROW_LEFT || k === this.A) {
      this.press_left();
    } else if (k === this.TOP || k === this.ARROW_TOP || k === this.W) {
      this.press_top();
    } else if (k === this.DOWN || k === this.ARROW_DOWN || k === this.S) {
      this.press_bottom();
    } else if (k === this.RIGHT || k === this.ARROW_RIGHT || k === this.D) {
      this.press_right();
    }
    this.keys[k] = this.DOWN;
    return k;
  }
  press_left() {
    this.keys[this.RIGHT] = this.UP;
    this.keys[this.ARROW_RIGHT] = this.UP;
    this.keys[this.D] = this.UP;
  }
  press_right() {
    this.keys[this.LEFT] = this.UP;
    this.keys[this.ARROW_LEFT] = this.UP;
    this.keys[this.A] = this.UP;
  }
  press_bottom() {
    this.keys[this.TOP] = this.UP;
    this.keys[this.ARROW_TOP] = this.UP;
    this.keys[this.W] = this.UP;
  }
  press_top() {
    this.keys[this.BOTTOM] = this.UP;
    this.keys[this.ARROW_BOTTOM] = this.UP;
    this.keys[this.S] = this.UP;
  }
  clear_directional() {
    this.keys[this.RIGHT] = this.UP;
    this.keys[this.ARROW_RIGHT] = this.UP;
    this.keys[this.D] = this.UP;
    this.keys[this.LEFT] = this.UP;
    this.keys[this.ARROW_LEFT] = this.UP;
    this.keys[this.A] = this.UP;
    this.keys[this.TOP] = this.UP;
    this.keys[this.ARROW_TOP] = this.UP;
    this.keys[this.W] = this.UP;
    this.keys[this.BOTTOM] = this.UP;
    this.keys[this.ARROW_BOTTOM] = this.UP;
    this.keys[this.S] = this.UP;
  }
  is_left() {
    return this.keys[this.LEFT] || this.keys[this.ARROW_LEFT] || this.keys[this.A];
  }
  is_right() {
    return this.keys[this.RIGHT] || this.keys[this.ARROW_RIGHT] || this.keys[this.D];
  }
  is_top() {
    return this.keys[this.TOP] || this.keys[this.ARROW_TOP] || this.keys[this.W];
  }
  is_bottom() {
    return this.keys[this.BOTTOM] || this.keys[this.ARROW_BOTTOM] || this.keys[this.S];
  }
}
window.Keyboard = Keyboard
class FastGrid {
  constructor(wrlW, wrlH, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(wrlW / cellSize);
    this.rows = Math.ceil(wrlH / cellSize);
    this.size = this.cols * this.rows;
    this.occ = new Uint8Array(this.size);
  }
  ix(x, y) {
    const cx = Math.max(0, Math.min(this.cols - 1, x / this.cellSize | 0));
    const cy = Math.max(0, Math.min(this.rows - 1, y / this.cellSize | 0));
    return cy * this.cols + cx;
  }
  setObstacle(x, y, radius) {
    const r = Math.ceil(radius / this.cellSize);
    const cx = x / this.cellSize | 0;
    const cy = y / this.cellSize | 0;
    for (let yy = cy - r; yy <= cy + r; yy++) {
      if (yy < 0 || yy >= this.rows) {
        continue;
      }
      const base = yy * this.cols;
      for (let xx = cx - r; xx <= cx + r; xx++) {
        if (xx < 0 || xx >= this.cols) {
          continue;
        }
        this.occ[base + xx] = 1;
      }
    }
  }
  isBlockedCell(ix) {
    return this.occ[ix] !== 0;
  }
}
class FastHeap {
  constructor(capacity) {
    this.heap = new Int32Array(capacity);
    this.size = 0;
  }
  push(v) {
    let i = this.size++;
    this.heap[i] = v;
    while (i > 0) {
      const p = i - 1 >> 1;
      if (FastAStar.fcost[this.heap[p]] <= FastAStar.fcost[this.heap[i]]) {
        break;
      }
      const t = this.heap[p];
      this.heap[p] = this.heap[i];
      this.heap[i] = t;
      i = p;
    }
  }
  pop() {
    if (this.size === 0) {
      return -1;
    }
    const ret = this.heap[0];
    this.size--;
    if (this.size > 0) {
      this.heap[0] = this.heap[this.size];
      let i = 0;
      while (1) {
        const l = i * 2 + 1;
        const r = l + 1;
        if (l >= this.size) {
          break;
        }
        let m = l;
        if (r < this.size && FastAStar.fcost[this.heap[r]] < FastAStar.fcost[this.heap[l]]) {
          m = r;
        }
        if (FastAStar.fcost[this.heap[i]] <= FastAStar.fcost[this.heap[m]]) {
          break;
        }
        const t = this.heap[i];
        this.heap[i] = this.heap[m];
        this.heap[m] = t;
        i = m;
      }
    }
    return ret;
  }
  clear() {
    this.size = 0;
  }
}
class FastAStar {
  static init(maxNodes) {
    FastAStar.g = new Float32Array(maxNodes);
    FastAStar.fcost = new Float32Array(maxNodes);
    FastAStar.parent = new Int32Array(maxNodes);
    FastAStar.closed = new Uint8Array(maxNodes);
    FastAStar.openTag = new Uint8Array(maxNodes);
  }
  constructor(grid) {
    this.grid = grid;
    this.max = grid.size;
    this.heap = new FastHeap(this.max);
  }
  neighbors(idx, out) {
    const c = idx % this.grid.cols;
    const r = idx / this.grid.cols | 0;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const rr = r + dy;
      if (rr < 0 || rr >= this.grid.rows) {
        continue;
      }
      for (let dx = -1; dx <= 1; dx++) {
        const cc = c + dx;
        if (cc < 0 || cc >= this.grid.cols) {
          continue;
        }
        if (dx === 0 && dy === 0) {
          continue;
        }
        const ni = rr * this.grid.cols + cc;
        if (this.grid.isBlockedCell(ni)) {
          continue;
        }
        out[n++] = ni;
      }
    }
    return n;
  }
  heuristic(a, b) {
    const ac = a % this.grid.cols;
    const ar = a / this.grid.cols | 0;
    const bc = b % this.grid.cols;
    const br = b / this.grid.cols | 0;
    const dx = Math.abs(ac - bc);
    const dy = Math.abs(ar - br);
    const mn = Math.min(dx, dy);
    const mx = Math.max(dx, dy);
    return mn * 1.4142 + (mx - mn);
  }
  findPath(sx, sy, tx, ty, out) {
    const s = this.grid.ix(sx, sy);
    const t = this.grid.ix(tx, ty);
    if (this.grid.isBlockedCell(s) || this.grid.isBlockedCell(t)) {
      return 0;
    }
    const N = this.max;
    const g = FastAStar.g;
    const fcost = FastAStar.fcost;
    const parent = FastAStar.parent;
    const closed = FastAStar.closed;
    const openTag = FastAStar.openTag;
    for (let i = 0; i < N; i++) {
      openTag[i] = 0;
      closed[i] = 0;
    }
    const heap = this.heap;
    heap.clear();
    g[s] = 0;
    fcost[s] = this.heuristic(s, t);
    openTag[s] = 1;
    parent[s] = -1;
    heap.push(s);
    const neigh = new Int32Array(8);
    while (heap.size > 0) {
      const cur = heap.pop();
      if (cur === t) {
        break;
      }
      openTag[cur] = 0;
      closed[cur] = 1;
      const nn = this.neighbors(cur, neigh);
      const gc = g[cur];
      for (let i = 0; i < nn; i++) {
        const ni = neigh[i];
        if (closed[ni]) {
          continue;
        }
        const ax = cur % this.grid.cols;
        const ay = cur / this.grid.cols | 0;
        const bx = ni % this.grid.cols;
        const by = ni / this.grid.cols | 0;
        const dx = ax - bx;
        const dy = ay - by;
        const cost = dx === 0 || dy === 0 ? 1 : 1.4142;
        const ng = gc + cost;
        if (!openTag[ni] || ng < g[ni]) {
          g[ni] = ng;
          parent[ni] = cur;
          fcost[ni] = ng + this.heuristic(ni, t);
          if (!openTag[ni]) {
            openTag[ni] = 1;
            heap.push(ni);
          }
        }
      }
    }
    let cur = t;
    let len = 0;
    while (cur !== -1 && len < 512) {
      const cx = cur % this.grid.cols * this.grid.cellSize + this.grid.cellSize * 0.5;
      const cy = (cur / this.grid.cols | 0) * this.grid.cellSize + this.grid.cellSize * 0.5;
      out[len++] = {
        x: cx,
        y: cy
      };
      cur = parent[cur];
    }
    return len;
  }
}
window.FastGrid = FastGrid
