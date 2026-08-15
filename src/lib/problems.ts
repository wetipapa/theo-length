import { PIECE_COLORS, RULES, type LevelSet } from "../config/gameConfig";
import type { Piece, Problem, ProblemKind } from "../types";

export type Rng = () => number;

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
 * 목표를 만들 수 있는 조각 묶음을 하나 뽑는다.
 *
 * **정답이 반드시 존재해야 한다.** 아무 조각이나 주면 목표를 만들 수 없는 판이 생기고,
 * 아이는 자기가 못 푸는 줄 안다. 그래서 답이 되는 조합을 먼저 만들고,
 * 그 조각들을 트레이에 반드시 포함시킨다.
 */
function solutionFor(target: number, rng: Rng, fixedUnit?: number): number[] {
  if (fixedUnit) {
    // `repeat` 문제 — 같은 조각만 반복해서 목표를 만든다
    return Array.from({ length: target / fixedUnit }, () => fixedUnit);
  }
  const parts: number[] = [];
  let left = target;
  while (left > 0) {
    // 남은 만큼만, 그리고 조각 상한 안에서 자른다
    const size = Math.min(left, randInt(rng, 1, RULES.maxPieceUnits));
    parts.push(size);
    left -= size;
  }
  return parts;
}

/** 목표를 나누어떨어지게 하는 단위 중 하나를 고른다. `repeat` 문제에 쓴다 */
function unitDividing(target: number, rng: Rng): number {
  const options: number[] = [];
  for (let u = 2; u <= Math.min(RULES.maxPieceUnits, target - 1); u++) {
    if (target % u === 0) options.push(u);
  }
  return options.length > 0 ? pick(rng, options) : 1;
}

/**
 * 트레이를 만든다.
 *
 * **길이가 겹치지 않게 담는다.** 예전에는 정답 조합을 그대로 늘어놓아서
 * 같은 길이가 네 개씩 나오기도 했다. 조각은 몇 번이든 다시 쓸 수 있으니
 * 같은 길이를 여러 개 둘 이유가 없고, 종류가 적어야 아이가 훑어보기도 쉽다.
 *
 * **1칸은 반드시 넣는다.** 그것만으로 어떤 목표든 만들 수 있어 막다른 길이 사라진다 —
 * 7칸에 6칸을 채웠는데 1칸이 없으면 놓은 걸 도로 빼는 수밖에 없는데,
 * 일곱 살에게 "여기까지 잘 해놓고 처음부터 다시"는 게임을 놓게 만드는 순간이다.
 */
function makeTray(rng: Rng, solution: number[], allTicks: boolean, sameOnly?: number): Piece[] {
  const colors = shuffle(rng, [...PIECE_COLORS]);

  // 같은 조각만 쓰는 문제는 그 규칙이 곧 문제다. 다른 길이를 섞으면 안 된다
  const sizes = sameOnly ? [sameOnly] : buildSizes(rng, solution);

  return shuffle(rng, sizes).map((u, i) => ({
    id: i,
    units: u,
    color: colors[i % colors.length].fill,
    ticks: allTicks,
  }));
}

function buildSizes(rng: Rng, solution: number[]): number[] {
  const sizes = new Set<number>([1]);
  // 정답에 쓰인 길이를 먼저 담는다. 있으면 훨씬 적은 손으로 풀린다
  for (const u of solution) {
    if (sizes.size >= RULES.trayCount) break;
    sizes.add(u);
  }
  // 남는 자리는 고민할 거리로 채운다
  let guard = 0;
  while (sizes.size < RULES.trayCount && guard++ < 50) {
    sizes.add(randInt(rng, 2, RULES.maxPieceUnits));
  }
  return [...sizes];
}

/**
 * 문제 하나를 만든다.
 *
 * 종류마다 **목표를 알려주는 방식**만 다르고, 아이가 하는 일은 늘 같다 — 틈을 정확히 채우기.
 * 새 종류를 넣을 때 손댈 곳은 이 함수 하나다.
 */
export function makeProblem(level: LevelSet, kind: ProblemKind, rng: Rng): Problem {
  const rulerSpan = level.target.max + 2;

  if (kind === "repeat") {
    // 나누어떨어지는 목표를 먼저 고른다
    let target = randInt(rng, level.target.min, level.target.max);
    let unit = unitDividing(target, rng);
    for (let guard = 0; guard < 20 && unit === 1; guard++) {
      target = randInt(rng, level.target.min, level.target.max);
      unit = unitDividing(target, rng);
    }
    const count = target / unit;
    return {
      kind,
      target,
      prompt: `${unit}칸 조각 ${count}개로 다리를 놓아요`,
      tray: makeTray(rng, solutionFor(target, rng, unit), true, unit),
      rulerSpan,
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
      tray: makeTray(rng, solutionFor(target, rng), true),
      onRuler: { from, to: from + target, label: kind === "offset" ? "여기서부터" : "" },
      rulerSpan,
    };
  }

  if (kind === "blank") {
    // 조각에 눈금이 없다. 숫자만 보고 다뤄야 한다
    const target = randInt(rng, level.target.min, level.target.max);
    return {
      kind,
      target,
      prompt: `${target}칸짜리 다리를 놓아요`,
      tray: makeTray(rng, solutionFor(target, rng), false),
      rulerSpan,
    };
  }

  const target = randInt(rng, level.target.min, level.target.max);
  return {
    kind,
    target,
    prompt: `${target}칸짜리 다리를 놓아요`,
    tray: makeTray(rng, solutionFor(target, rng), true),
    rulerSpan,
  };
}

/**
 * 한 판에 낼 문제들을 미리 만든다.
 *
 * 종류를 무작위로 뽑지 않고 정해진 순서로 돌린다. 무작위면 처음 만나는 개념
 * (0이 아닌 데서 시작하는 자 읽기 같은)이 첫 문제로 나올 수 있다.
 */
export function makeRun(level: LevelSet, rng: Rng): Problem[] {
  return Array.from({ length: level.rounds }, (_, i) =>
    makeProblem(level, level.kinds[i % level.kinds.length], rng),
  );
}

/** 놓인 조각들의 길이 합 */
export function sumUnits(list: { units: number }[]): number {
  return list.reduce((acc, p) => acc + p.units, 0);
}
