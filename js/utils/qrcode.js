/**
 * Self-contained QR Code generator (byte mode, versions 1–10).
 * Implements GF(256) Reed–Solomon ECC, data placement, all 8 masks with
 * penalty-based selection, and BCH format/version info — no dependencies.
 * Returns a boolean matrix you can render to canvas/SVG.
 */

// GF(256) log/antilog tables (primitive polynomial 0x11d).
const EXP = new Array(256), LOG = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  EXP[255] = EXP[0];
})();
const gexp = (n) => EXP[((n % 255) + 255) % 255];
const glog = (n) => LOG[n];

function rsPoly(num, shift) {
  const out = new Array(num.length + shift).fill(0);
  for (let i = 0; i < num.length; i++) out[i] = num[i];
  return out;
}
function rsMultiply(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++)
      if (a[i] && b[j]) out[i + j] ^= gexp(glog(a[i]) + glog(b[j]));
  return out;
}
function rsGenerator(degree) {
  let g = [1];
  for (let i = 0; i < degree; i++) g = rsMultiply(g, [1, gexp(i)]);
  return g;
}
function rsEncode(data, ecCount) {
  const gen = rsGenerator(ecCount);
  const res = rsPoly(data, ecCount);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      const lc = glog(coef);
      for (let j = 0; j < gen.length; j++) res[i + j] ^= gexp(glog(gen[j]) + lc);
    }
  }
  return res.slice(data.length);
}

// [blocks, totalCount, dataCount] groups, order L,M,Q,H per version 1..10.
const RS_BLOCK = [
  [1,26,19],[1,26,16],[1,26,13],[1,26,9],
  [1,44,34],[1,44,28],[1,44,22],[1,44,16],
  [1,70,55],[1,70,44],[2,35,17],[2,35,13],
  [1,100,80],[2,50,32],[2,50,24],[4,25,9],
  [1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],
  [2,86,68],[4,43,27],[4,43,19],[4,43,15],
  [2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],
  [2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],
  [2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],
  [2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],
];
const LEVELS = { L: 0, M: 1, Q: 2, H: 3 };
const ALIGN = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];

function rsBlocks(type, level) {
  const row = RS_BLOCK[(type - 1) * 4 + LEVELS[level]];
  const blocks = [];
  for (let i = 0; i < row.length; i += 3) {
    for (let j = 0; j < row[i]; j++) blocks.push({ total: row[i + 1], data: row[i + 2] });
  }
  return blocks;
}
function dataCapacity(type, level) {
  return rsBlocks(type, level).reduce((s, b) => s + b.data, 0);
}

class BitBuffer {
  constructor() { this.buf = []; this.len = 0; }
  put(num, length) { for (let i = length - 1; i >= 0; i--) this.putBit(((num >>> i) & 1) === 1); }
  putBit(bit) {
    const i = Math.floor(this.len / 8);
    if (this.buf.length <= i) this.buf.push(0);
    if (bit) this.buf[i] |= 0x80 >>> (this.len % 8);
    this.len++;
  }
}

function createData(type, level, bytes) {
  const buf = new BitBuffer();
  buf.put(4, 4); // byte mode
  buf.put(bytes.length, type < 10 ? 8 : 16);
  for (const b of bytes) buf.put(b, 8);
  const capacityBits = dataCapacity(type, level) * 8;
  if (buf.len > capacityBits) return null;
  if (buf.len + 4 <= capacityBits) buf.put(0, 4);
  while (buf.len % 8 !== 0) buf.putBit(false);
  const pad = [0xec, 0x11];
  let pi = 0;
  while (buf.buf.length < dataCapacity(type, level)) buf.buf.push(pad[pi++ % 2]);

  // Split into blocks, compute EC, interleave.
  const blocks = rsBlocks(type, level);
  let offset = 0;
  const dataBlocks = [], ecBlocks = [];
  let maxData = 0, maxEc = 0;
  for (const blk of blocks) {
    const ecCount = blk.total - blk.data;
    const d = buf.buf.slice(offset, offset + blk.data);
    offset += blk.data;
    dataBlocks.push(d);
    ecBlocks.push(rsEncode(d, ecCount));
    maxData = Math.max(maxData, d.length);
    maxEc = Math.max(maxEc, ecCount);
  }
  const result = [];
  for (let i = 0; i < maxData; i++)
    for (const d of dataBlocks) if (i < d.length) result.push(d[i]);
  for (let i = 0; i < maxEc; i++)
    for (const e of ecBlocks) if (i < e.length) result.push(e[i]);
  return result;
}

// BCH helpers for format & version info.
function bchDigit(data) { let d = 0; while (data !== 0) { d++; data >>>= 1; } return d; }
const G15 = 0b10100110111, G18 = 0b1111100100101, G15_MASK = 0b101010000010010;
function bchFormat(data) {
  let d = data << 10;
  while (bchDigit(d) - bchDigit(G15) >= 0) d ^= G15 << (bchDigit(d) - bchDigit(G15));
  return ((data << 10) | d) ^ G15_MASK;
}
function bchVersion(data) {
  let d = data << 12;
  while (bchDigit(d) - bchDigit(G18) >= 0) d ^= G18 << (bchDigit(d) - bchDigit(G18));
  return (data << 12) | d;
}

function maskFn(mask, i, j) {
  switch (mask) {
    case 0: return (i + j) % 2 === 0;
    case 1: return i % 2 === 0;
    case 2: return j % 3 === 0;
    case 3: return (i + j) % 3 === 0;
    case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
    case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
    case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
    case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
  }
}

function buildMatrix(type, level, data, mask) {
  const size = type * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(null));

  const finder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const on = (0 <= dr && dr <= 6 && (dc === 0 || dc === 6)) ||
        (0 <= dc && dc <= 6 && (dr === 0 || dr === 6)) ||
        (2 <= dr && dr <= 4 && 2 <= dc && dc <= 4);
      m[rr][cc] = on;
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  // Alignment patterns — placed BEFORE timing so timing fills only the gaps.
  // Skip only the three that coincide with the finder-pattern corners.
  const pos = ALIGN[type - 1];
  const last = pos.length - 1;
  for (let i = 0; i < pos.length; i++) for (let j = 0; j < pos.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
    const r = pos[i], c = pos[j];
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
      m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
  }
  // Timing patterns (skip modules already occupied by alignment patterns)
  for (let i = 8; i < size - 8; i++) {
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
  }
  // Dark module
  m[size - 8][8] = true;

  // Reserve format areas (fill later)
  const reserveFormat = () => {
    for (let i = 0; i < 9; i++) { if (i !== 6) reserve(i, 8), reserve(8, i); }
    for (let i = 0; i < 8; i++) { reserve(8, size - 1 - i); reserve(size - 1 - i, 8); }
  };
  function reserve(r, c) { if (m[r][c] === null) m[r][c] = false; }
  reserveFormat();

  // Version info (>= type 7)
  if (type >= 7) {
    const bits = bchVersion(type);
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >> i) & 1) === 1;
      m[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
      m[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  // Place data with mask
  let idx = 0, dir = -1, row = size - 1;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (m[row][cc] === null) {
          let dark = false;
          if (idx < data.length * 8) dark = ((data[idx >>> 3] >>> (7 - (idx & 7))) & 1) === 1;
          idx++;
          if (maskFn(mask, row, cc)) dark = !dark;
          m[row][cc] = dark;
        }
      }
      row += dir;
      if (row < 0 || row >= size) { row -= dir; dir = -dir; break; }
    }
  }

  // Format info: 2-bit EC indicator (L=01,M=00,Q=11,H=10) then 3-bit mask.
  const fmtData = (({ L: 1, M: 0, Q: 3, H: 2 }[level]) << 3) | mask;
  const fmtBits = bchFormat(fmtData);
  for (let i = 0; i < 15; i++) {
    const bit = ((fmtBits >> i) & 1) === 1;
    // vertical (top-left down + bottom)
    if (i < 6) m[i][8] = bit;
    else if (i < 8) m[i + 1][8] = bit;
    else m[size - 15 + i][8] = bit;
    // horizontal
    if (i < 8) m[8][size - 1 - i] = bit;
    else if (i < 9) m[8][15 - i - 1 + 1] = bit;
    else m[8][15 - i - 1] = bit;
  }
  return m;
}

function penalty(m) {
  const size = m.length; let score = 0;
  // Rule 1: runs of 5+
  for (let r = 0; r < size; r++) {
    for (const line of [m[r], m.map((row) => row[r])]) {
      let run = 1;
      for (let i = 1; i < size; i++) {
        if (line[i] === line[i - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
  }
  // Rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++)
    if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) score += 3;
  // Rule 3: finder-like patterns
  const pat = [true, false, true, true, true, false, true];
  const check = (get) => {
    for (let i = 0; i <= size - 7; i++) {
      let ok = true; for (let k = 0; k < 7; k++) if (get(i + k) !== pat[k]) { ok = false; break; }
      if (ok) score += 40;
    }
  };
  for (let r = 0; r < size; r++) check((i) => m[r][i]);
  for (let c = 0; c < size; c++) check((i) => m[i][c]);
  // Rule 4: dark ratio
  let dark = 0; for (const row of m) for (const v of row) if (v) dark++;
  const ratio = (dark / (size * size)) * 100;
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  return score;
}

/**
 * Generate a QR matrix (array of boolean rows) for `text`.
 * @param {string} text
 * @param {{level?: 'L'|'M'|'Q'|'H'}} opts
 */
export function generateQR(text, { level = "M" } = {}) {
  const bytes = new TextEncoder().encode(text);
  let type = 0, data = null;
  for (let t = 1; t <= 10; t++) {
    data = createData(t, level, bytes);
    if (data) { type = t; break; }
  }
  if (!type) throw new Error("Content too long for QR (max ~150 chars). Shorten it.");
  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = buildMatrix(type, level, data, mask);
    const s = penalty(m);
    if (s < bestScore) { bestScore = s; best = m; }
  }
  return best;
}

/** Render a QR matrix onto a canvas element. */
export function drawQR(matrix, canvas, { scale = 8, margin = 4, dark = "#0a0c14", light = "#ffffff" } = {}) {
  const size = matrix.length;
  const px = (size + margin * 2) * scale;
  canvas.width = px; canvas.height = px;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = light; ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = dark;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++)
    if (matrix[r][c]) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
}
