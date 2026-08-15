import { PIECE_COLORS, RULES, type LevelId, type LevelSet } from "../config/gameConfig";
import { OBJECT_NAMES } from "../components/LengthObject";
import type { Arc, ItemBlock, ObjectKind, Piece, Problem, ProblemKind } from "../types";

/** 길이를 재는 물건들. 자 위에도 올라가고 두 줄 견주기에도 쓰인다 */
const ITEMS: ObjectKind[] = ["log", "match", "pencil", "straw", "brush", "eraser"];

export type Rng = () => number;

/**
 * 수 뒤에 붙는 "와/과"를 고른다.
 *
 * 읽는 소리로 정해진다 — 12는 "십이"로 끝나 받침이 없으니 `12와`이고,
 * 13은 "십삼"이라 받침이 있으니 `13과`다. 숫자만 보고는 알 수 없어서
 * 마지막 자리의 읽는 소리를 본다. 0으로 끝나면 "십"이라 받침이 있다.
 */
export function withParticle(n: number): string {
  const openEnded = [2, 4, 5, 9]; // 이·사·오·구 — 받침이 없다
  return `${n}${openEnded.includes(n % 10) ? "와" : "과"}`;
}

const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];

function shuffle<T>(rng: Rng, list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 나누어떨어지는 약수들.
 *
 * 1과 자기 자신은 뺀다 — 한 칸씩 세거나 한 개로 끝나면 반복 개념이 안 된다.
 * 개수가 여섯을 넘는 것도 뺀다. 그때부터는 세는 게 아니라 같은 동작의 반복 노동이 된다.
 */
function divisorsWithin(target: number, maxUnit: number): number[] {
  const out: number[] = [];
  for (let u = 2; u <= Math.min(maxUnit, target - 1); u++) {
    if (target % u === 0 && target / u <= 6) out.push(u);
  }
  return out;
}

/**
 * 목표를 만들 수 있는 조각 묶음을 하나 뽑는다.
 *
 * **정답이 반드시 존재해야 한다.** 아무 조각이나 주면 목표를 만들 수 없는 판이 생기고,
 * 아이는 자기가 못 푸는 줄 안다. 그래서 답이 되는 조합을 먼저 만들고,
 * 그 조각들을 트레이에 반드시 포함시킨다.
 */
function solutionFor(target: number, rng: Rng, fixedUnit?: number): number[] {
  if (fixedUnit) return Array.from({ length: target / fixedUnit }, () => fixedUnit);
  const parts: number[] = [];
  let left = target;
  while (left > 0) {
    const size = Math.min(left, randInt(rng, 1, RULES.maxPieceUnits));
    parts.push(size);
    left -= size;
  }
  return parts;
}

/**
 * 트레이를 만든다.
 *
 * **길이가 겹치지 않게 담는다.** 조각은 몇 번이든 다시 쓸 수 있으니 같은 길이를
 * 여러 개 둘 이유가 없고, 종류가 적어야 아이가 훑어보기도 쉽다.
 *
 * **1칸은 반드시 넣는다.** 그것만으로 어떤 목표든 만들 수 있어 막다른 길이 사라진다 —
 * 7칸에 6칸을 채웠는데 1칸이 없으면 놓은 걸 도로 빼는 수밖에 없는데,
 * 일곱 살에게 "여기까지 잘 해놓고 처음부터 다시"는 게임을 놓게 만드는 순간이다.
 */
function makeTray(rng: Rng, sizes: number[], allTicks: boolean): Piece[] {
  const colors = shuffle(rng, [...PIECE_COLORS]);
  return shuffle(rng, sizes).map((u, i) => ({
    id: i,
    units: u,
    color: colors[i % colors.length].fill,
    ticks: allTicks,
    label: true,
  }));
}

/** 답이 되는 길이들을 먼저 담고, 남는 자리는 고민할 거리로 채운다 */
function buildSizes(rng: Rng, solution: number[]): number[] {
  const sizes = new Set<number>([1]);
  for (const u of solution) {
    if (sizes.size >= RULES.trayCount) break;
    sizes.add(u);
  }
  let guard = 0;
  while (sizes.size < RULES.trayCount && guard++ < 50) {
    sizes.add(randInt(rng, 2, RULES.maxPieceUnits));
  }
  return [...sizes];
}

/** 목표를 채우는 평범한 트레이 (여러 길이를 섞어 쓰는 문제용) */
const freeTray = (rng: Rng, target: number, ticks = true) =>
  makeTray(rng, buildSizes(rng, solutionFor(target, rng)), ticks);

// ──────────────────────────────────────────────────────────────
// 단위 반복의 세 방향
// ──────────────────────────────────────────────────────────────

/**
 * 전체 ÷ 개수 → 한 조각.
 *
 * "12칸을 똑같은 조각 3개로 채워요." **틈이 세 칸으로 나뉘어 보이고**,
 * 그 한 칸에 딱 맞는 조각만 들어간다. 맞는 걸 찾아 세 번 놓으면 끝난다.
 *
 * 예전에는 조각 하나를 누르면 세 개가 한꺼번에 붙게 했는데,
 * 한 번 눌러서 답이 되니 생각할 것이 없었다. 나뉜 칸을 보고 거기 맞는 길이를
 * 고르는 것이 곧 "전체를 개수로 나누기"다.
 */
function sameParts(level: LevelSet, rng: Rng): Problem {
  // 개수와 한 조각을 정하면 전체가 따라 나온다. 난이도 범위에 들 때까지 다시 뽑는다
  let count = 2;
  let unit = 2;
  for (let guard = 0; guard < 40; guard++) {
    count = randInt(rng, 2, 4);
    unit = randInt(rng, 2, RULES.maxPieceUnits);
    const t = unit * count;
    if (t >= level.target.min && t <= level.target.max) break;
  }
  const target = unit * count;

  // 후보는 서로 다른 길이들. 개수가 고정이라 정답 길이는 하나뿐이다
  const sizes = new Set<number>([unit]);
  let guard = 0;
  while (sizes.size < 4 && guard++ < 50) sizes.add(randInt(rng, 2, RULES.maxPieceUnits));

  return {
    kind: "sameParts",
    target,
    prompt: `${target}칸을 똑같은 조각 ${count}개로 채워요`,
    tellsTarget: true,
    tray: makeTray(rng, [...sizes], true),
    rulerSpan: level.target.max + 2,
    slots: count,
    note: `${target}칸을 ${count}개로 나누면 한 개는 ${unit}칸이에요`,
  };
}

/**
 * 전체 ÷ 한 조각 → 개수.
 *
 * `repeat`과 판은 같고 **개수를 안 알려준다는 것만 다르다.** 아이는 놓으면서 센다.
 */
function countUnit(level: LevelSet, rng: Rng): Problem {
  let target = randInt(rng, level.target.min, level.target.max);
  let options = divisorsWithin(target, RULES.maxPieceUnits);
  for (let guard = 0; guard < 30 && options.length === 0; guard++) {
    target = randInt(rng, level.target.min, level.target.max);
    options = divisorsWithin(target, RULES.maxPieceUnits);
  }
  const unit = options.length > 0 ? pick(rng, options) : 1;
  const count = target / unit;

  return {
    kind: "countUnit",
    target,
    prompt: `${unit}칸 조각만으로 ${target}칸을 채워요`,
    tellsTarget: true,
    tray: makeTray(rng, [unit], true),
    rulerSpan: level.target.max + 2,
    note: `${unit}칸 조각 ${count}개면 ${target}칸이에요`,
  };
}

// ──────────────────────────────────────────────────────────────
// 같은 길이를 다른 단위로
// ──────────────────────────────────────────────────────────────

/**
 * 같은 틈을 두 번 낸다. 한 번은 긴 조각으로, 다음은 짧은 조각으로.
 *
 * **조각에 눈금을 그리지 않는다.** 숫자를 셀 수 있으면 아이는 "6칸이니까 2개"라고
 * 계산해 버리고, 정작 배워야 할 관계 — 같은 길이를 더 많은 개수로 채운 쪽이
 * 한 조각이 더 짧다 — 는 지나간다. 개수만 남게 해야 그 관계가 보인다.
 *
 * 두 판의 틈이 화면에서 **똑같은 너비**여야 해서 목표를 공유한다.
 */
function unitOnlyPair(level: LevelSet, rng: Rng): Problem[] {
  // 서로 다른 약수를 둘 이상 가진 목표를 찾는다
  let target = 0;
  let options: number[] = [];
  for (let guard = 0; guard < 40; guard++) {
    target = randInt(rng, level.target.min, level.target.max);
    options = divisorsWithin(target, RULES.maxPieceUnits).filter((u) => target / u <= 6);
    if (options.length >= 2) break;
  }
  if (options.length < 2) {
    target = 12;
    options = [4, 3, 2];
  }

  const shuffled = shuffle(rng, options);
  const big = Math.max(shuffled[0], shuffled[1]);
  const small = Math.min(shuffled[0], shuffled[1]);
  const rulerSpan = level.target.max + 2;
  const colors = shuffle(rng, [...PIECE_COLORS]);

  const round = (unit: number, color: string, note: string): Problem => ({
    kind: "unitOnly",
    target,
    prompt: "이 조각 하나로만 틈을 채워 보세요",
    tellsTarget: false,
    tray: [{ id: 0, units: unit, color, ticks: false, label: false }],
    rulerSpan,
    note,
  });

  return [
    round(big, colors[0].fill, `${target / big}개로 채웠어요. 이번엔 다른 조각으로 해볼까요?`),
    round(
      small,
      colors[1].fill,
      `같은 틈인데 아까는 ${target / big}개, 이번엔 ${target / small}개. 많이 들어간 조각이 더 짧아요`,
    ),
  ];
}

// ──────────────────────────────────────────────────────────────
// 전체와 부분 — 선분
// ──────────────────────────────────────────────────────────────

/**
 * A-B-C-D 선분에서 모르는 구간 하나를 채운다.
 *
 * 선분 자체에는 눈금을 그리지 않는다. **알려주는 것은 위쪽 호에 적힌 숫자뿐이다.**
 * 눈금을 그리면 아이는 관계를 따지지 않고 칸을 세어 버린다.
 *
 * 두 가지로 낸다.
 * - `whole`   전체와 나머지 구간들을 알려준다 → 빼서 구한다
 * - `overlap` A~C와 B~D처럼 **겹치는** 구간을 알려준다 → 겹친 만큼이 답이다 (도전)
 */
function segments(level: LevelSet, rng: Rng, overlap: boolean): Problem {
  const labels = ["A", "B", "C", "D", "E"];
  const count = overlap ? randInt(rng, 3, 4) : randInt(rng, 3, 4);

  // 구간 길이. 모르는 칸은 조금 넉넉하게 잡아 조각을 여러 개 놓을 거리가 되게 한다
  const parts = Array.from({ length: count }, () => randInt(rng, 2, 5));

  // 겹치는 문제는 이어진 세 구간을 한 묶음으로 본다. 그 묶음의 **가운데**가 답이다.
  // 묶음의 시작을 옮겨서 늘 같은 자리(B~C)만 나오지 않게 한다
  const windowStart = overlap ? randInt(rng, 0, count - 3) : 0;
  const gapIndex = overlap ? windowStart + 1 : randInt(rng, 0, count - 1);
  parts[gapIndex] = randInt(rng, 3, Math.min(8, level.target.max));

  const bounds = [0];
  for (const p of parts) bounds.push(bounds[bounds.length - 1] + p);
  const span = bounds[bounds.length - 1];
  const posts = bounds.map((at, i) => ({ label: labels[i], at }));
  const gap = { from: bounds[gapIndex], to: bounds[gapIndex + 1] };
  const target = gap.to - gap.from;

  const filled = parts
    .map((_, i) => ({ from: bounds[i], to: bounds[i + 1] }))
    .filter((_, i) => i !== gapIndex);

  const arc = (from: number, to: number, tier: number): Arc => ({ from, to, units: to - from, tier });

  // 이어진 세 구간 [w, w+3)에서, 앞 둘을 덮는 호와 뒤 둘을 덮는 호는 가운데에서 겹친다.
  // 두 호를 더하면 묶음 전체보다 딱 그 겹친 만큼 크다
  const w = windowStart;
  const arcs: Arc[] = overlap
    ? [
        arc(bounds[w], bounds[w + 2], 0),
        arc(bounds[w + 1], bounds[w + 3], 1),
        arc(bounds[w], bounds[w + 3], 2),
      ]
    : [
        ...filled.map((f, i) => arc(f.from, f.to, i % 2)),
        arc(0, span, 2),
      ];

  const from = posts[gapIndex].label;
  const to = posts[gapIndex + 1].label;

  return {
    kind: "segments",
    target,
    prompt: overlap
      ? `겹치는 구간을 보고 ${from}~${to}를 채워요`
      : `${from}~${to}가 몇 칸인지 알아내 채워요`,
    tellsTarget: false,
    tray: freeTray(rng, target),
    rulerSpan: level.target.max + 2,
    line: { span, posts, gap, filled, arcs },
    note: overlap
      ? `${arcs[0].units} + ${arcs[1].units}는 ${arcs[2].units}보다 ${target}칸 더 커요. 겹친 만큼이에요`
      : `전체 ${span}칸에서 나머지를 빼면 ${target}칸이에요`,
  };
}

// ──────────────────────────────────────────────────────────────
// 꺾인 길
// ──────────────────────────────────────────────────────────────

/**
 * 격자 위에서 꺾인 길의 길이를 세어 곧은 다리로 놓는다.
 *
 * 맞히면 꺾인 길이 **그 자리에서 쭉 펴진다.** 이 게임에서 가르치려는 건
 * "꺾여 있어도 길이는 그대로"인데, 말로 적어 두는 것보다 펴지는 걸 한 번 보는 게 낫다.
 *
 * 꺾이는 지점을 빠뜨리거나 두 번 세는 실수를 잡으려고 길을 **한 칸짜리 토막으로**
 * 그린다. 긴 직선 하나로 그리면 모서리에서 몇 칸인지 헷갈린다.
 */
function bentPath(level: LevelSet, rng: Rng, bends: number): Problem {
  // 격자 한 칸을 다리의 한 칸과 같은 크기로 그린다. 그래야 길이 펴졌을 때
  // 아이가 놓은 다리와 너비가 정확히 맞아떨어져 "길이는 그대로"가 눈으로 확인된다.
  // 그러려면 격자가 다리보다 넓으면 안 되므로 열 수를 가장 짧은 길이에 맞춘다.
  const cols = 8;
  const rows = 4;
  let vertices: { x: number; y: number }[] = [];
  let total = 0;

  for (let guard = 0; guard < 60; guard++) {
    const pts = [{ x: 0, y: randInt(rng, 1, rows - 1) }];
    let horizontal = true;
    for (let i = 0; i < bends + 1; i++) {
      const last = pts[pts.length - 1];
      if (horizontal) {
        const x = randInt(rng, Math.min(last.x + 2, cols), cols);
        if (x === last.x) break;
        pts.push({ x, y: last.y });
      } else {
        // 위아래 중 더 멀리 갈 수 있는 쪽으로. 붙어 있는 벽 쪽으로 가면 길이 짧아진다
        const up = last.y;
        const down = rows - last.y;
        const y = up > down ? randInt(rng, 0, Math.max(0, last.y - 2)) : randInt(rng, Math.min(last.y + 2, rows), rows);
        if (y === last.y) break;
        pts.push({ x: last.x, y });
      }
      horizontal = !horizontal;
    }
    const len = pts.reduce(
      (acc, p, i) => (i === 0 ? 0 : acc + Math.abs(p.x - pts[i - 1].x) + Math.abs(p.y - pts[i - 1].y)),
      0,
    );
    if (len >= Math.max(level.target.min, cols) && len <= Math.min(level.target.max, 12) && pts.length >= bends + 1) {
      vertices = pts;
      total = len;
      break;
    }
  }

  if (vertices.length === 0) {
    // 무작위가 계속 어긋나면 확실한 판 하나로 떨어진다. 문제 없는 라운드가 나오면 안 된다
    vertices = [
      { x: 0, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 1 },
      { x: 6, y: 1 },
    ];
    total = 8;
  }

  return {
    kind: "bentPath",
    target: total,
    prompt: "꺾인 길이 몇 칸인지 세어 보고 곧은 다리로 놓아요",
    tellsTarget: false,
    tray: freeTray(rng, total),
    rulerSpan: level.target.max + 2,
    path: { cols, rows, vertices },
    note: "꺾여 있어도 길이는 그대로예요",
  };
}

// ──────────────────────────────────────────────────────────────
// 같은 전체를 두 가지로 만들기
// ──────────────────────────────────────────────────────────────


/**
 * 위아래 두 줄이 같은 길이다. 모르는 물건 하나가 몇 칸인지 알아낸다.
 *
 * **식을 먼저 보여 주지 않는다.** 양쪽에 똑같이 들어 있는 물건을 눌러 지우다 보면
 * 마지막에 "아는 것 하나 = 모르는 것 몇 개"만 남고, 그게 곧 계산한 결과다.
 * 지우는 손이 곧 양변에서 같은 값을 빼는 일이라, 아이는 그 규칙을 배우기 전에 먼저 써 본다.
 *
 * 조각에 눈금을 그리지 않는다. 셀 수 있으면 지울 이유가 없다.
 */
function cancelPair(level: LevelSet, rng: Rng): Problem {
  const [known, common, unknown] = shuffle(rng, ITEMS).slice(0, 3);

  const unknownUnits = randInt(rng, 2, Math.min(4, Math.floor(level.target.max / 2)));
  const unknownCount = randInt(rng, 2, 3);
  const knownUnits = unknownUnits * unknownCount; // 아는 것 하나 = 모르는 것 여러 개
  // 두 줄이 길수록 한 칸이 좁게 그려지고, 아래 다리는 답(2~4칸)만큼이라 손톱만 해진다.
  // 공통 물건은 짧게, 개수는 둘까지만 둔다
  const commonUnits = randInt(rng, 1, 2);
  const commonCount = 2;

  let id = 0;
  const block = (kind: ObjectKind, units: number, isKnown: boolean): ItemBlock => ({
    id: id++,
    kind,
    units,
    known: isKnown,
  });

  const commons = () => Array.from({ length: commonCount }, () => block(common, commonUnits, true));

  return {
    kind: "cancelPair",
    target: unknownUnits,
    prompt: `위아래 길이가 같아요. ${OBJECT_NAMES[unknown]} 하나는 몇 칸일까요?`,
    tellsTarget: false,
    tray: freeTray(rng, unknownUnits),
    rulerSpan: level.target.max + 2,
    pair: {
      // 같은 물건이 한쪽에 몰려 있으면 눈으로 짝이 바로 보인다. 섞어 둔다
      top: shuffle(rng, [...commons(), block(known, knownUnits, true)]),
      bottom: shuffle(rng, [
        ...commons(),
        ...Array.from({ length: unknownCount }, () => block(unknown, unknownUnits, false)),
      ]),
      unknown,
      unknownCount,
    },
    note: `${OBJECT_NAMES[known]} ${knownUnits}칸이 ${OBJECT_NAMES[unknown]} ${unknownCount}개와 같아요. 그래서 ${unknownUnits}칸이에요`,
  };
}

// ──────────────────────────────────────────────────────────────
// 수직선
// ──────────────────────────────────────────────────────────────

/**
 * 두 수의 한가운데.
 *
 * `(두 수의 합) ÷ 2`를 외우게 하지 않는다. 눈금을 짚을 때마다 **양쪽 거리가 화살표로**
 * 나오고, 두 화살표가 같아지는 자리가 답이다. 아이는 짚어 보면서 균형을 맞춘다.
 */
function midpoint(level: LevelSet, rng: Rng): Problem {
  const span = level.target.max + 4;
  const step = span > 16 ? 5 : 2;
  let a = 0;
  let b = 0;
  for (let guard = 0; guard < 40; guard++) {
    a = randInt(rng, 0, span - 4);
    b = randInt(rng, a + 4, span);
    if ((b - a) % 2 === 0) break;
  }
  if ((b - a) % 2 !== 0) {
    a = 2;
    b = span - (span % 2 === 0 ? 2 : 3);
  }
  const answer = (a + b) / 2;

  return {
    kind: "midpoint",
    target: answer,
    prompt: `${withParticle(a)} ${b}의 한가운데를 짚어 보세요`,
    tellsTarget: false,
    tray: [],
    rulerSpan: span,
    numberLine: { span, step, a, b },
    note: `양쪽으로 똑같이 ${answer - a}칸씩이에요`,
  };
}

/**
 * 일정한 간격의 눈금에서 빠진 수.
 *
 * 자와 수직선이 같은 구조라는 걸 짚는 문제다. 눈금 사이가 늘 같은 만큼이라는 게
 * 보이면 빠진 자리는 세어서 나온다.
 */
function tickGap(level: LevelSet, rng: Rng): Problem {
  const step = pick(rng, level.target.max > 12 ? [3, 4, 5] : [2, 3]);
  const span = step * randInt(rng, 4, 6);
  const marks = Array.from({ length: span / step + 1 }, (_, i) => i * step);
  // 양 끝은 가리지 않는다. 끝을 가리면 간격을 잴 기준이 한쪽밖에 안 남는다
  const hidden = marks[randInt(rng, 1, marks.length - 2)];

  const wrong = new Set<number>();
  let guard = 0;
  while (wrong.size < 3 && guard++ < 40) {
    const near = hidden + pick(rng, [-step, -1, 1, step, step - 1, 1 - step]);
    if (near !== hidden && near > 0) wrong.add(near);
  }

  return {
    kind: "tickGap",
    target: hidden,
    prompt: "?에 들어갈 수는 무엇일까요?",
    tellsTarget: false,
    tray: [],
    rulerSpan: span,
    numberLine: { span, step, hidden },
    choices: shuffle(rng, [hidden, ...wrong]),
    note: `눈금 사이가 ${step}칸씩이에요`,
  };
}

// ──────────────────────────────────────────────────────────────

/**
 * 문제 하나를 만든다.
 *
 * 종류마다 **목표를 알려주는 방식**만 다르고, 수직선 문제를 빼면 아이가 하는 일은
 * 늘 같다 — 틈을 정확히 채우기. 새 종류를 넣을 때 손댈 곳은 이 함수 하나다.
 */
export function makeProblem(level: LevelSet, kind: ProblemKind, rng: Rng, levelId?: LevelId): Problem {
  const rulerSpan = level.target.max + 2;
  const isChallenge = levelId === "challenge";

  if (kind === "sameParts") return sameParts(level, rng);
  if (kind === "countUnit") return countUnit(level, rng);
  if (kind === "unitOnly") return unitOnlyPair(level, rng)[0];
  if (kind === "segments") return segments(level, rng, isChallenge);
  if (kind === "bentPath") return bentPath(level, rng, isChallenge ? randInt(rng, 4, 5) : randInt(rng, 2, 3));
  if (kind === "midpoint") return midpoint(level, rng);
  if (kind === "tickGap") return tickGap(level, rng);
  if (kind === "cancelPair") return cancelPair(level, rng);

  if (kind === "repeat") {
    // 한 조각 길이와 개수를 둘 다 알려준다. 반복의 가장 쉬운 방향이다
    let target = randInt(rng, level.target.min, level.target.max);
    let options = divisorsWithin(target, RULES.maxPieceUnits);
    for (let guard = 0; guard < 30 && options.length === 0; guard++) {
      target = randInt(rng, level.target.min, level.target.max);
      options = divisorsWithin(target, RULES.maxPieceUnits);
    }
    const unit = options.length > 0 ? pick(rng, options) : 1;
    return {
      kind,
      target,
      prompt: `${unit}칸 조각 ${target / unit}개로 다리를 놓아요`,
      tellsTarget: false,
      tray: makeTray(rng, [unit], true),
      rulerSpan,
      note: `${unit}칸이 ${target / unit}개면 ${target}칸이에요`,
    };
  }

  if (kind === "measure" || kind === "offset") {
    // 자 위에 물체를 놓고 그 길이만큼 다리를 놓게 한다. 숫자를 알려주지 않는다
    const target = randInt(rng, level.target.min, level.target.max);
    const from = kind === "offset" ? randInt(rng, 1, Math.max(1, rulerSpan - target - 1)) : 0;
    return {
      kind,
      target,
      prompt:
        kind === "offset"
          ? "자 위 막대와 똑같은 길이로 놓아요"
          : "자로 재어 보고 똑같은 길이로 놓아요",
      tellsTarget: false,
      tray: freeTray(rng, target),
      onRuler: { from, to: from + target, label: kind === "offset" ? "여기서부터" : "" },
      rulerObject: pick(rng, ITEMS),
      rulerSpan,
    };
  }

  const target = randInt(rng, level.target.min, level.target.max);
  return {
    kind,
    target,
    prompt: `${target}칸짜리 다리를 놓아요`,
    tellsTarget: true,
    tray: freeTray(rng, target, kind !== "blank"),
    rulerSpan,
  };
}

/**
 * 한 판에 낼 문제들을 미리 만든다.
 *
 * 종류를 무작위로 뽑지 않고 정해진 순서로 돌린다. 무작위면 처음 만나는 개념
 * (0이 아닌 데서 시작하는 자 읽기 같은)이 첫 문제로 나올 수 있다.
 *
 * `unitOnly`만 예외로 **두 판을 붙여 낸다.** 같은 틈을 다른 조각으로 두 번 채워 봐야
 * 개수와 조각 길이의 관계가 보인다. 한 판만 나오면 그냥 채우기 문제가 된다.
 */
export function makeRun(level: LevelSet, rng: Rng, levelId?: LevelId): Problem[] {
  const out: Problem[] = [];
  for (let i = 0; out.length < level.rounds; i++) {
    const kind = level.kinds[i % level.kinds.length];
    if (kind === "unitOnly") {
      // 자리가 하나뿐이면 짝이 안 되니 다른 종류로 채운다
      if (out.length + 2 > level.rounds) {
        out.push(makeProblem(level, "measure", rng, levelId));
        continue;
      }
      out.push(...unitOnlyPair(level, rng));
      continue;
    }
    out.push(makeProblem(level, kind, rng, levelId));
  }
  return out;
}

/** 놓인 조각들의 길이 합 */
export function sumUnits(list: { units: number }[]): number {
  return list.reduce((acc, p) => acc + p.units, 0);
}
