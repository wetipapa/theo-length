import { describe, expect, it } from "vitest";
import { LEVELS, RULES } from "../config/gameConfig";
import { makeProblem, makeRun, sumUnits, type Rng } from "./problems";
import type { ProblemKind } from "../types";

function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const KINDS: ProblemKind[] = ["count", "repeat", "measure", "blank", "offset"];

/** 트레이 조각으로 목표를 만들 수 있는가. 조각은 몇 번이든 다시 쓸 수 있다 */
function solvable(target: number, units: number[]): boolean {
  const reach = Array.from({ length: target + 1 }, () => false);
  reach[0] = true;
  for (let n = 1; n <= target; n++) {
    for (const u of units) {
      if (u <= n && reach[n - u]) {
        reach[n] = true;
        break;
      }
    }
  }
  return reach[target];
}

describe("문제 만들기", () => {
  it("어떤 문제든 트레이로 목표를 만들 수 있다", () => {
    // 못 만드는 판이 나오면 아이는 자기가 못 푸는 줄 안다
    const rng = seeded(7);
    for (const level of Object.values(LEVELS)) {
      for (const kind of KINDS) {
        for (let i = 0; i < 120; i++) {
          const p = makeProblem(level, kind, rng);
          const units = p.tray.map((t) => t.units);
          expect(solvable(p.target, units), `${kind} ${p.target}칸 / 트레이 ${units}`).toBe(true);
        }
      }
    }
  });

  it("막다른 길이 없다 — 1칸 조각이 늘 있다", () => {
    // 7칸에 6칸을 채웠는데 1칸이 없으면 놓은 걸 도로 빼는 수밖에 없다.
    // 같은 조각만 쓰는 repeat 문제는 그 규칙이 곧 문제라 예외다.
    const rng = seeded(11);
    for (const level of Object.values(LEVELS)) {
      for (const kind of KINDS.filter((k) => k !== "repeat")) {
        for (let i = 0; i < 120; i++) {
          const p = makeProblem(level, kind, rng);
          expect(p.tray.some((t) => t.units === 1)).toBe(true);
        }
      }
    }
  });

  it("조각이 상한을 넘지 않는다", () => {
    const rng = seeded(3);
    for (const level of Object.values(LEVELS)) {
      for (const kind of KINDS) {
        for (let i = 0; i < 80; i++) {
          for (const piece of makeProblem(level, kind, rng).tray) {
            expect(piece.units).toBeGreaterThanOrEqual(1);
            expect(piece.units).toBeLessThanOrEqual(RULES.maxPieceUnits);
          }
        }
      }
    }
  });

  it("목표가 난이도 범위 안에 있다", () => {
    const rng = seeded(5);
    for (const level of Object.values(LEVELS)) {
      for (const kind of KINDS) {
        for (let i = 0; i < 80; i++) {
          const p = makeProblem(level, kind, rng);
          expect(p.target).toBeGreaterThanOrEqual(level.target.min);
          expect(p.target).toBeLessThanOrEqual(level.target.max);
        }
      }
    }
  });
});

describe("문제 종류별 규칙", () => {
  it("repeat은 같은 조각만 주고, 그것으로 나누어떨어진다", () => {
    const rng = seeded(13);
    for (const level of Object.values(LEVELS)) {
      for (let i = 0; i < 150; i++) {
        const p = makeProblem(level, "repeat", rng);
        const sizes = new Set(p.tray.map((t) => t.units));
        expect(sizes.size).toBe(1);
        const unit = [...sizes][0];
        expect(p.target % unit).toBe(0);
        expect(unit).toBeGreaterThan(1); // 1칸씩 세는 건 반복 개념이 안 된다
      }
    }
  });

  it("offset은 0이 아닌 곳에서 시작하고 자 안에 들어간다", () => {
    const rng = seeded(17);
    for (const level of Object.values(LEVELS)) {
      for (let i = 0; i < 150; i++) {
        const p = makeProblem(level, "offset", rng);
        expect(p.onRuler).toBeDefined();
        expect(p.onRuler!.from).toBeGreaterThan(0);
        expect(p.onRuler!.to).toBeLessThanOrEqual(p.rulerSpan);
        // 자 위 물체의 길이가 곧 목표다 — 끝 숫자가 아니라
        expect(p.onRuler!.to - p.onRuler!.from).toBe(p.target);
      }
    }
  });

  it("measure는 0에서 시작한다", () => {
    const rng = seeded(19);
    for (let i = 0; i < 150; i++) {
      const p = makeProblem(LEVELS.normal, "measure", rng);
      expect(p.onRuler!.from).toBe(0);
      expect(p.onRuler!.to).toBe(p.target);
    }
  });

  it("blank는 조각에 눈금이 없다", () => {
    const rng = seeded(23);
    for (let i = 0; i < 100; i++) {
      const p = makeProblem(LEVELS.normal, "blank", rng);
      expect(p.tray.every((t) => !t.ticks)).toBe(true);
    }
  });

  it("숫자로 알려주는 문제는 목표가 문구에 들어 있다", () => {
    const rng = seeded(29);
    for (let i = 0; i < 100; i++) {
      const p = makeProblem(LEVELS.easy, "count", rng);
      expect(p.prompt).toContain(String(p.target));
    }
  });

  it("재는 문제는 답을 문구로 알려주지 않는다", () => {
    // 숫자를 적어 주면 자를 볼 이유가 없어진다
    const rng = seeded(31);
    for (let i = 0; i < 100; i++) {
      for (const kind of ["measure", "offset"] as ProblemKind[]) {
        const p = makeProblem(LEVELS.hard, kind, rng);
        expect(p.prompt).not.toContain(String(p.target));
      }
    }
  });
});

describe("한 판", () => {
  it("난이도가 정한 만큼 문제가 나온다", () => {
    const rng = seeded(37);
    for (const level of Object.values(LEVELS)) {
      expect(makeRun(level, rng)).toHaveLength(level.rounds);
    }
  });

  it("첫 문제는 늘 그 난이도의 첫 종류다", () => {
    // 무작위로 섞으면 처음 만나는 개념이 첫 문제로 나올 수 있다
    const rng = seeded(41);
    for (const level of Object.values(LEVELS)) {
      expect(makeRun(level, rng)[0].kind).toBe(level.kinds[0]);
    }
  });
});

describe("sumUnits", () => {
  it("놓인 조각의 길이를 더한다", () => {
    expect(sumUnits([])).toBe(0);
    expect(sumUnits([{ units: 3 }, { units: 2 }, { units: 1 }])).toBe(6);
  });
});
