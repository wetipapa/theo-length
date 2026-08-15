import { describe, expect, it } from "vitest";
import { LEVELS, RULES, type LevelId } from "../config/gameConfig";
import { makeProblem, makeRun, sumUnits, withParticle, type Rng } from "./problems";
import type { ProblemKind } from "../types";

function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const LEVEL_IDS = Object.keys(LEVELS) as LevelId[];

/** 조각을 놓아 채우는 문제들 */
const FILL: ProblemKind[] = [
  "count",
  "repeat",
  "measure",
  "blank",
  "offset",
  "sameParts",
  "countUnit",
  "unitOnly",
  "segments",
  "bentPath",
  "cancelPair",
];
/** 눈금을 짚는 문제들. `target`이 길이가 아니라 수라서 규칙이 다르다 */
const PICK: ProblemKind[] = ["midpoint", "tickGap"];
const ALL = [...FILL, ...PICK];

/** 난이도별로 문제를 잔뜩 만들어 넘긴다 */
function each(seed: number, kinds: ProblemKind[], n: number, fn: (p: ReturnType<typeof makeProblem>, id: LevelId) => void) {
  const rng = seeded(seed);
  for (const id of LEVEL_IDS) {
    for (const kind of kinds) {
      for (let i = 0; i < n; i++) fn(makeProblem(LEVELS[id], kind, rng, id), id);
    }
  }
}

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

describe("어느 문제든 풀린다", () => {
  it("트레이로 목표를 만들 수 있다", () => {
    // 못 만드는 판이 나오면 아이는 자기가 못 푸는 줄 안다
    each(7, FILL, 120, (p) => {
      const units = p.tray.map((t) => t.units);
      expect(solvable(p.target, units), `${p.kind} ${p.target}칸 / 트레이 ${units}`).toBe(true);
    });
  });

  it("막다른 길이 없다 — 여러 길이를 쓰는 문제에는 1칸이 늘 있다", () => {
    // 7칸에 6칸을 채웠는데 1칸이 없으면 놓은 걸 도로 빼는 수밖에 없다.
    // 한 가지 조각만 쓰는 문제는 그 규칙이 곧 문제라 예외다.
    const single: ProblemKind[] = ["repeat", "countUnit", "unitOnly", "sameParts"];
    each(11, FILL.filter((k) => !single.includes(k)), 120, (p) => {
      expect(p.tray.some((t) => t.units === 1), `${p.kind}`).toBe(true);
    });
  });

  it("조각이 상한을 넘지 않는다", () => {
    each(3, FILL, 60, (p) => {
      for (const piece of p.tray) {
        expect(piece.units).toBeGreaterThanOrEqual(1);
        expect(piece.units).toBeLessThanOrEqual(RULES.maxPieceUnits);
      }
    });
  });

  it("한 번에 놓이는 개수가 목표를 넘지 않는다", () => {
    // autoRepeat 배수를 잘못 잡으면 정답 조각인데도 안 들어간다
    each(43, ["sameParts"], 200, (p) => {
      const fits = p.tray.filter((t) => t.units * p.autoRepeat! === p.target);
      expect(fits, `${p.target}칸 / ${p.autoRepeat}개`).toHaveLength(1);
    });
  });
});

describe("단위 반복의 세 방향", () => {
  it("repeat — 같은 조각만 주고 개수까지 알려준다", () => {
    each(13, ["repeat"], 120, (p) => {
      const sizes = new Set(p.tray.map((t) => t.units));
      expect(sizes.size).toBe(1);
      const unit = [...sizes][0];
      expect(p.target % unit).toBe(0);
      expect(unit).toBeGreaterThan(1); // 1칸씩 세는 건 반복 개념이 안 된다
      expect(p.prompt).toContain(`${p.target / unit}개`);
    });
  });

  it("sameParts — 전체와 개수를 주고 한 조각을 되짚게 한다", () => {
    each(47, ["sameParts"], 150, (p) => {
      expect(p.autoRepeat).toBeGreaterThanOrEqual(2);
      expect(p.target % p.autoRepeat!).toBe(0);
      // 개수는 알려주되 한 조각 길이는 알려주지 않는다. 그게 문제다
      expect(p.prompt).toContain(`${p.autoRepeat}개`);
      expect(p.prompt).not.toContain(`${p.target / p.autoRepeat!}칸 조각`);
    });
  });

  it("countUnit — 전체와 한 조각을 주고 개수를 세게 한다", () => {
    each(53, ["countUnit"], 150, (p) => {
      const sizes = new Set(p.tray.map((t) => t.units));
      expect(sizes.size).toBe(1);
      const unit = [...sizes][0];
      expect(p.target % unit).toBe(0);
      // 개수를 적어 주면 셀 이유가 없어진다
      expect(p.prompt).not.toContain(`${p.target / unit}개`);
    });
  });

  it("세 방향이 한 난이도 안에 다 나온다", () => {
    // 한 방향만 연습하면 아이는 곱셈 문제로 외우고, 방향이 바뀌면 손을 못 댄다
    for (const id of ["normal", "hard"] as LevelId[]) {
      const kinds = new Set(LEVELS[id].kinds);
      expect(kinds.has("repeat") || kinds.has("countUnit")).toBe(true);
      expect(kinds.has("sameParts")).toBe(true);
    }
  });
});

describe("같은 길이를 다른 단위로", () => {
  it("두 판이 붙어 나오고, 같은 길이를 다른 조각으로 잰다", () => {
    const rng = seeded(59);
    for (const id of LEVEL_IDS) {
      if (!LEVELS[id].kinds.includes("unitOnly")) continue;
      for (let i = 0; i < 60; i++) {
        const run = makeRun(LEVELS[id], rng, id);
        const at = run.findIndex((p) => p.kind === "unitOnly");
        expect(at, `${id}에 unitOnly가 없다`).toBeGreaterThanOrEqual(0);

        const [first, second] = [run[at], run[at + 1]];
        expect(second?.kind, "짝 없이 혼자 나오면 비교할 게 없다").toBe("unitOnly");
        // 화면에서 틈의 너비가 같아야 개수 차이가 눈에 들어온다
        expect(second.target).toBe(first.target);
        expect(second.tray[0].units).not.toBe(first.tray[0].units);
        expect(second.tray[0].units).toBeLessThan(first.tray[0].units);
      }
    }
  });

  it("조각에 눈금이 없다", () => {
    // 칸을 셀 수 있으면 "6칸이니까 2개"로 계산해 버리고, 정작 배울 관계는 지나간다
    each(61, ["unitOnly"], 80, (p) => {
      expect(p.tray).toHaveLength(1);
      expect(p.tray[0].ticks).toBe(false);
      expect(p.target % p.tray[0].units).toBe(0);
    });
  });

  it("두 번째 판이 개수를 견줘 말해 준다", () => {
    const rng = seeded(67);
    for (let i = 0; i < 60; i++) {
      const run = makeRun(LEVELS.normal, rng, "normal");
      const at = run.findIndex((p) => p.kind === "unitOnly");
      const [first, second] = [run[at], run[at + 1]];
      const cntA = first.target / first.tray[0].units;
      const cntB = second.target / second.tray[0].units;
      expect(cntB).toBeGreaterThan(cntA);
      expect(second.note).toContain(`${cntA}개`);
      expect(second.note).toContain(`${cntB}개`);
    }
  });
});

describe("전체와 부분 — 선분", () => {
  it("빈 구간과 놓인 구간이 선분을 빈틈없이 덮는다", () => {
    each(71, ["segments"], 150, (p) => {
      const line = p.line!;
      const all = [...line.filled, line.gap].sort((x, y) => x.from - y.from);
      expect(all[0].from).toBe(0);
      expect(all[all.length - 1].to).toBe(line.span);
      for (let i = 1; i < all.length; i++) expect(all[i].from).toBe(all[i - 1].to);
      expect(line.gap.to - line.gap.from).toBe(p.target);
    });
  });

  it("점이 구간 경계에 있고 왼쪽부터 차례로 붙는다", () => {
    each(73, ["segments"], 120, (p) => {
      const { posts, span } = p.line!;
      expect(posts[0].at).toBe(0);
      expect(posts[posts.length - 1].at).toBe(span);
      for (let i = 1; i < posts.length; i++) expect(posts[i].at).toBeGreaterThan(posts[i - 1].at);
      expect(posts.length).toBeLessThanOrEqual(RULES.posts.challenge + 1);
    });
  });

  it("호에 적힌 수가 실제 구간 길이와 같다", () => {
    // 여기가 어긋나면 아이가 바르게 따져도 답이 안 나온다
    each(79, ["segments"], 150, (p) => {
      for (const arc of p.line!.arcs) {
        expect(arc.units).toBe(arc.to - arc.from);
        expect(arc.from).toBeGreaterThanOrEqual(0);
        expect(arc.to).toBeLessThanOrEqual(p.line!.span);
      }
    });
  });

  it("알려준 것만으로 답이 나온다", () => {
    // 호를 더하고 빼서 빈 구간이 결정되지 않으면 찍는 문제가 된다
    each(83, ["segments"], 150, (p) => {
      const { arcs, gap } = p.line!;
      const direct = arcs.some((a) => a.from === gap.from && a.to === gap.to);
      expect(direct, "빈 구간을 그대로 알려주면 생각할 게 없다").toBe(false);

      // 가장 긴 호가 나머지를 모두 품는다. 그 안에서 빼거나(겹치지 않을 때),
      // 나머지를 더해 넘치는 만큼을 보면(겹칠 때) 빈 구간이 나온다
      const cover = arcs.reduce((m, a) => (a.units > m.units ? a : m));
      const others = arcs.filter((a) => a !== cover);
      expect(others.every((a) => a.from >= cover.from && a.to <= cover.to)).toBe(true);

      const sum = others.reduce((n, a) => n + a.units, 0);
      expect(cover.units - sum === p.target || sum - cover.units === p.target).toBe(true);
    });
  });

  it("겹치는 구간 문제는 도전에서만 나온다", () => {
    const rng = seeded(89);
    for (const id of LEVEL_IDS) {
      if (id === "challenge") continue;
      for (let i = 0; i < 80; i++) {
        const arcs = makeProblem(LEVELS[id], "segments", rng, id).line!.arcs;
        const cover = arcs.reduce((m, a) => (a.units > m.units ? a : m));
        const partial = arcs.filter((a) => a !== cover);
        const overlaps = partial.some((a, x) => partial.some((b, y) => y > x && a.to > b.from && b.to > a.from));
        expect(overlaps, `${id}에 겹치는 호가 나왔다`).toBe(false);
      }
    }
  });

  it("겹치는 구간의 답이 늘 같은 자리에 있지 않다", () => {
    // 자리가 고정이면 아이는 따지지 않고 "가운데 칸"을 외운다
    const rng = seeded(91);
    const spots = new Set<string>();
    for (let i = 0; i < 120; i++) {
      const p = makeProblem(LEVELS.challenge, "segments", rng, "challenge");
      const at = p.line!.posts.findIndex((q) => q.at === p.line!.gap.from);
      spots.add(p.line!.posts[at].label);
    }
    expect(spots.size).toBeGreaterThan(1);
  });
});

describe("꺾인 길", () => {
  it("가로·세로로만 꺾이고 격자를 벗어나지 않는다", () => {
    each(97, ["bentPath"], 150, (p) => {
      const { cols, rows, vertices } = p.path!;
      expect(vertices.length).toBeGreaterThanOrEqual(3); // 적어도 한 번은 꺾인다
      for (const v of vertices) {
        expect(v.x).toBeGreaterThanOrEqual(0);
        expect(v.x).toBeLessThanOrEqual(cols);
        expect(v.y).toBeGreaterThanOrEqual(0);
        expect(v.y).toBeLessThanOrEqual(rows);
      }
      for (let i = 1; i < vertices.length; i++) {
        const a = vertices[i - 1];
        const b = vertices[i];
        const moved = (a.x !== b.x ? 1 : 0) + (a.y !== b.y ? 1 : 0);
        expect(moved, "비스듬히 가면 칸을 셀 수 없다").toBe(1);
      }
    });
  });

  it("길의 칸 수가 놓아야 할 다리 길이와 같다", () => {
    // 여기가 어긋나면 바르게 세고도 다리가 안 맞는다
    each(101, ["bentPath"], 150, (p) => {
      const { vertices } = p.path!;
      const steps = vertices.reduce(
        (acc, v, i) => (i === 0 ? 0 : acc + Math.abs(v.x - vertices[i - 1].x) + Math.abs(v.y - vertices[i - 1].y)),
        0,
      );
      expect(steps).toBe(p.target);
    });
  });

  it("도전에서 더 많이 꺾인다", () => {
    const rng = seeded(103);
    const bends = (id: LevelId) => {
      let total = 0;
      for (let i = 0; i < 80; i++) total += makeProblem(LEVELS[id], "bentPath", rng, id).path!.vertices.length;
      return total / 80;
    };
    expect(bends("challenge")).toBeGreaterThan(bends("hard"));
  });
});

describe("같은 전체를 두 가지로", () => {
  it("위아래 줄의 길이가 같다", () => {
    // 이 문제의 전제다. 여기가 어긋나면 아이가 바르게 지워도 답이 안 맞는다
    each(139, ["cancelPair"], 150, (p) => {
      expect(sumUnits(p.pair!.top)).toBe(sumUnits(p.pair!.bottom));
    });
  });

  it("겹치는 물건을 다 지우면 아는 것 하나와 모르는 것들만 남는다", () => {
    each(149, ["cancelPair"], 150, (p) => {
      const { top, bottom, unknown, unknownCount } = p.pair!;
      const common = new Set(top.map((t) => t.name).filter((n) => bottom.some((b) => b.name === n)));

      const leftTop = top.filter((t) => !common.has(t.name));
      const leftBottom = bottom.filter((b) => !common.has(b.name));

      expect(leftTop, "위에는 아는 것 하나만 남아야 한다").toHaveLength(1);
      expect(leftTop[0].known).toBe(true);
      expect(leftBottom).toHaveLength(unknownCount);
      expect(leftBottom.every((b) => b.name === unknown && !b.known)).toBe(true);

      // 남은 것끼리 견주면 답이 그대로 나온다
      expect(leftTop[0].units).toBe(p.target * unknownCount);
    });
  });

  it("양쪽에 똑같은 개수로 들어 있다", () => {
    // 한쪽에 하나 더 있으면 지우다가 짝이 없어 막힌다
    each(151, ["cancelPair"], 150, (p) => {
      const { top, bottom } = p.pair!;
      const count = (list: typeof top, name: string) => list.filter((b) => b.name === name).length;
      for (const name of new Set(top.map((t) => t.name))) {
        if (!bottom.some((b) => b.name === name)) continue;
        expect(count(top, name)).toBe(count(bottom, name));
      }
    });
  });

  it("모르는 물건은 길이를 알려주지 않는다", () => {
    each(157, ["cancelPair"], 120, (p) => {
      const unknowns = p.pair!.bottom.filter((b) => !b.known);
      expect(unknowns.length).toBeGreaterThanOrEqual(2);
      expect(unknowns.every((b) => b.units === p.target)).toBe(true);
      expect(p.prompt).not.toContain(`${p.target}칸`);
      // 무엇의 길이를 묻는지 이름으로 말해 줘야 한다
      expect(p.prompt).toContain(p.pair!.unknown);
      expect(p.note).toContain(p.pair!.unknown);
    });
  });

  it("물건 이름이 겹치지 않는다", () => {
    // 아는 것과 모르는 것이 같은 이름이면 무엇을 지웠는지 알 수 없다
    each(163, ["cancelPair"], 120, (p) => {
      const names = new Set([...p.pair!.top, ...p.pair!.bottom].map((b) => b.name));
      expect(names.size).toBe(3);
    });
  });
});

describe("수직선", () => {
  it("midpoint — 답이 딱 떨어지고 양쪽 거리가 같다", () => {
    each(107, ["midpoint"], 150, (p) => {
      const { a, b, span } = p.numberLine!;
      expect(Number.isInteger(p.target)).toBe(true);
      expect(p.target - a!).toBe(b! - p.target);
      expect(p.target).toBeGreaterThan(a!);
      expect(p.target).toBeLessThan(b!);
      expect(b!).toBeLessThanOrEqual(span);
      // 두 수가 너무 붙어 있으면 짚을 자리가 없다
      expect(b! - a!).toBeGreaterThanOrEqual(4);
    });
  });

  it("midpoint — 답을 문구로 알려주지 않는다", () => {
    each(109, ["midpoint"], 120, (p) => {
      expect(p.prompt).not.toContain(String(p.target));
      expect(p.tray).toHaveLength(0);
    });
  });

  it("tickGap — 가리는 자리가 눈금 위이고 양 끝이 아니다", () => {
    // 끝을 가리면 간격을 잴 기준이 한쪽밖에 안 남는다
    each(113, ["tickGap"], 150, (p) => {
      const { hidden, step, span } = p.numberLine!;
      expect(hidden! % step).toBe(0);
      expect(hidden).toBeGreaterThan(0);
      expect(hidden).toBeLessThan(span);
      expect(p.target).toBe(hidden);
    });
  });

  it("tickGap — 고를 수에 답이 하나만 들어 있다", () => {
    each(127, ["tickGap"], 150, (p) => {
      expect(p.choices).toHaveLength(4);
      expect(p.choices!.filter((c) => c === p.target)).toHaveLength(1);
      expect(new Set(p.choices).size).toBe(4);
    });
  });
});

describe("한 판", () => {
  it("난이도가 정한 만큼 문제가 나온다", () => {
    const rng = seeded(37);
    for (const id of LEVEL_IDS) {
      for (let i = 0; i < 40; i++) {
        expect(makeRun(LEVELS[id], rng, id)).toHaveLength(LEVELS[id].rounds);
      }
    }
  });

  it("첫 문제는 늘 그 난이도의 첫 종류다", () => {
    // 무작위로 섞으면 처음 만나는 개념이 첫 문제로 나올 수 있다
    const rng = seeded(41);
    for (const id of LEVEL_IDS) {
      expect(makeRun(LEVELS[id], rng, id)[0].kind).toBe(LEVELS[id].kinds[0]);
    }
  });

  it("쉬움에는 어려운 개념이 섞이지 않는다", () => {
    const heavy: ProblemKind[] = ["segments", "bentPath", "midpoint", "tickGap", "offset", "sameParts"];
    for (const kind of LEVELS.easy.kinds) expect(heavy).not.toContain(kind);
  });

  it("도전은 앞 단계에서 만난 종류만 쓴다", () => {
    // 도전에서 처음 보는 조작까지 나오면 개념이 아니라 조작에서 막힌다
    const seen = new Set([...LEVELS.easy.kinds, ...LEVELS.normal.kinds, ...LEVELS.hard.kinds]);
    for (const kind of LEVELS.challenge.kinds) expect(seen.has(kind), kind).toBe(true);
  });

  it("같은 종류가 연달아 나오지 않는다", () => {
    // 목록이 문제 수보다 짧아 한 바퀴 돌면 끝과 처음이 이어 붙는다.
    // 거기서 같은 종류가 겹치면 같은 문제를 두 판 연속 만난다.
    // 짝으로 내는 unitOnly만 예외다 — 붙어 나오는 것이 그 문제의 요점이다
    const rng = seeded(137);
    for (const id of LEVEL_IDS) {
      for (let i = 0; i < 40; i++) {
        const run = makeRun(LEVELS[id], rng, id);
        for (let r = 1; r < run.length; r++) {
          if (run[r].kind === "unitOnly") continue;
          expect(run[r].kind, `${id} ${r + 1}번째`).not.toBe(run[r - 1].kind);
        }
      }
    }
  });

  it("모든 종류가 어딘가에서 나온다", () => {
    // 만들어 놓고 어느 난이도에도 안 넣으면 아무도 못 만난다
    const used = new Set(LEVEL_IDS.flatMap((id) => LEVELS[id].kinds));
    for (const kind of ALL) expect(used.has(kind), `${kind}가 어디에도 없다`).toBe(true);
  });
});

describe("답을 흘리지 않는다", () => {
  it("알아내야 하는 문제는 목표를 문구에 적지 않는다", () => {
    // tellsTarget이 거짓이면 화면 어디에도 남은 칸 수가 안 나온다.
    // 반대로 참인데 문구에 목표가 없으면 아이가 알 길이 사라진다
    each(167, ALL, 150, (p) => {
      if (p.tellsTarget) {
        expect(p.prompt, `${p.kind}`).toContain(String(p.target));
      } else {
        expect(p.prompt, `${p.kind}`).not.toContain(`${p.target}칸`);
      }
    });
  });

  it("재고 세어야 하는 문제는 전부 알려주지 않는 쪽이다", () => {
    // 여기 하나라도 참이 섞이면 그 종류는 답이 화면에 적힌 채로 나온다
    const hidden: ProblemKind[] = [
      "measure", "offset", "repeat", "unitOnly",
      "segments", "bentPath", "cancelPair", "midpoint", "tickGap",
    ];
    each(173, hidden, 60, (p) => {
      expect(p.tellsTarget, `${p.kind}`).toBe(false);
    });
  });

  it("숫자로 알려주는 문제는 알려준다고 표시돼 있다", () => {
    each(179, ["count", "blank", "sameParts", "countUnit"], 60, (p) => {
      expect(p.tellsTarget, `${p.kind}`).toBe(true);
    });
  });
});

describe("문구", () => {
  it("수 뒤의 와/과를 읽는 소리에 맞춘다", () => {
    // "12과 22"는 아이가 소리 내어 읽을 때 걸린다. 받침 없는 이·사·오·구만 "와"다
    expect(withParticle(12)).toBe("12와");
    expect(withParticle(13)).toBe("13과");
    expect(withParticle(4)).toBe("4와");
    expect(withParticle(5)).toBe("5와");
    expect(withParticle(9)).toBe("9와");
    expect(withParticle(10)).toBe("10과");
    expect(withParticle(20)).toBe("20과");
    expect(withParticle(6)).toBe("6과");
    expect(withParticle(7)).toBe("7과");
  });

  it("한가운데 문제가 바른 조사를 쓴다", () => {
    each(131, ["midpoint"], 120, (p) => {
      const a = p.numberLine!.a!;
      expect(p.prompt.startsWith(withParticle(a))).toBe(true);
    });
  });
});

describe("sumUnits", () => {
  it("놓인 조각의 길이를 더한다", () => {
    expect(sumUnits([])).toBe(0);
    expect(sumUnits([{ units: 3 }, { units: 2 }, { units: 1 }])).toBe(6);
  });
});
