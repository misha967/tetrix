/**
 * SYMETRY TETRIX — Math Engine
 * Target RTP: 97%
 *
 * RTP Table:
 * | Result        | Probability | Payout |
 * | 0 lines       |     40%     |   0×   |
 * | 1–2 lines     |     28%     |  0.8×  |
 * | 3–5 lines     |     17%     |   2×   |
 * | 6–9 lines     |     10%     |   4×   |
 * | 10–14 lines   |      4%     |   7×   |
 * | 15+ (TETRIX)  |      1%     |  17×   |
 *
 * RTP = 0.40×0 + 0.28×0.8 + 0.17×2 + 0.10×4 + 0.04×7 + 0.01×17
 *     = 0 + 0.224 + 0.34 + 0.40 + 0.28 + 0.17 = 0.97 ✓
 */

// ─── RTP TABLE ───────────────────────────────────────────────
const RTP_TABLE = [
  { label: 'Bust',   minLines: 0,  maxLines: 0,  prob: 0.40, payout: 0    },
  { label: 'Small',  minLines: 1,  maxLines: 2,  prob: 0.28, payout: 0.8  },
  { label: 'Medium', minLines: 3,  maxLines: 5,  prob: 0.17, payout: 2    },
  { label: 'Good',   minLines: 6,  maxLines: 9,  prob: 0.10, payout: 4    },
  { label: 'Great',  minLines: 10, maxLines: 14, prob: 0.04, payout: 7    },
  { label: 'TETRIX', minLines: 15, maxLines: 999,prob: 0.01, payout: 17   },
];

function getPayout(linesCleared) {
  for (const tier of RTP_TABLE) {
    if (linesCleared >= tier.minLines && linesCleared <= tier.maxLines) {
      return { ...tier, multiplier: tier.payout };
    }
  }
  return RTP_TABLE[0];
}

function verifyRTP() {
  return RTP_TABLE.reduce((sum, t) => sum + t.prob * t.payout, 0).toFixed(4);
}

// ─── TETROMINOES ─────────────────────────────────────────────
const PIECES = {
  I: { shape: [[1,1,1,1]], color: '#00f0f0' },
  O: { shape: [[1,1],[1,1]], color: '#f0f000' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#00f000' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#f00000' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#f0a000' },
};
const PIECE_KEYS = Object.keys(PIECES);

// ─── MODIFIERS ───────────────────────────────────────────────
const MODIFIERS = [
  { id: 'normal',  label: '',        icon: '',   weight: 55,
    desc: 'Pièce normale' },
  { id: 'bomb',    label: 'BOMB',    icon: '💣', weight: 12,
    desc: 'Explose les blocs voisins' },
  { id: 'heavy',   label: 'HEAVY',   icon: '⚡', weight: 13,
    desc: 'Tombe 3× plus vite' },
  { id: 'wild',    label: 'WILD',    icon: '⭐', weight: 10,
    desc: 'Compte double pour les lignes' },
  { id: 'cursed',  label: 'CURSED',  icon: '💀', weight: 10,
    desc: 'Rotation bloquée' },
];

function weightedRandom(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randomPieceKey() {
  return PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
}

function randomModifier() {
  return weightedRandom(MODIFIERS);
}

// ─── LINE CLEAR REWARDS ──────────────────────────────────────
// Random effects triggered on line clears — purely visual/gameplay
// They don't affect RTP (RTP is determined by final line count)
const LINE_REWARDS = [
  { id: 'bonus_time', label: '+5s',      icon: '⏱️', weight: 25,
    desc: '+5 secondes' },
  { id: 'clear_row',  label: 'CLEAR',    icon: '🧹', weight: 15,
    desc: 'Efface une ligne aléatoire' },
  { id: 'slow',       label: 'SLOW',     icon: '🐢', weight: 20,
    desc: 'Ralentit la chute pendant 5s' },
  { id: 'preview',    label: 'PREVIEW',  icon: '👁️', weight: 20,
    desc: 'Révèle les 3 prochaines pièces' },
  { id: 'score_x2',   label: '×2',       icon: '✨', weight: 12,
    desc: 'Double les points 10s' },
  { id: 'bomb_clear', label: 'BOOM',     icon: '💥', weight: 8,
    desc: 'Explose le bas du board' },
];

function randomLineReward() {
  return weightedRandom(LINE_REWARDS);
}

// ─── BOARD HELPERS ───────────────────────────────────────────
const BOARD_W = 10;
const BOARD_H = 20;

function emptyBoard() {
  return Array.from({ length: BOARD_H }, () => Array(BOARD_W).fill(null));
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
  );
}

function isValid(board, shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = x + c, ny = y + r;
      if (nx < 0 || nx >= BOARD_W || ny >= BOARD_H) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function placePiece(board, shape, x, y, color, modifier) {
  const newBoard = board.map(row => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] && y + r >= 0) {
        newBoard[y + r][x + c] = { color, modifier };
      }
    }
  }
  return newBoard;
}

function clearLines(board) {
  const cleared = [];
  const newBoard = board.filter((row, i) => {
    if (row.every(cell => cell !== null)) {
      cleared.push(i);
      return false;
    }
    return true;
  });
  while (newBoard.length < BOARD_H) newBoard.unshift(Array(BOARD_W).fill(null));
  return { newBoard, linesCleared: cleared.length };
}

function bombEffect(board, x, y) {
  const newBoard = board.map(row => [...row]);
  for (let r = y - 1; r <= y + 1; r++) {
    for (let c = x - 1; c <= x + 1; c++) {
      if (r >= 0 && r < BOARD_H && c >= 0 && c < BOARD_W) {
        newBoard[r][c] = null;
      }
    }
  }
  return newBoard;
}

// ─── EXPORTS ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RTP_TABLE, getPayout, verifyRTP,
    PIECES, PIECE_KEYS, MODIFIERS, LINE_REWARDS,
    randomPieceKey, randomModifier, randomLineReward,
    emptyBoard, rotateCW, isValid, placePiece, clearLines, bombEffect,
    BOARD_W, BOARD_H,
  };
} else {
  window.TetrixMath = {
    RTP_TABLE, getPayout, verifyRTP,
    PIECES, PIECE_KEYS, MODIFIERS, LINE_REWARDS,
    randomPieceKey, randomModifier, randomLineReward,
    emptyBoard, rotateCW, isValid, placePiece, clearLines, bombEffect,
    BOARD_W, BOARD_H,
  };
}
