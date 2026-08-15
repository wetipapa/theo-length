import type { ProblemKind } from "../types";

/**
 * 게임 규칙과 난이도.
 *
 * 숫자를 화면 코드에 흩어 두지 않는다. 아이가 하는 걸 보고 고치는 일이 계속 생기는데,
 * 그때 한 곳만 보면 되도록 여기에 모은다.
 */

export type LevelId = "easy" | "normal" | "hard" | "challenge";

export interface LevelSet {
  label: string;
  /** 한 판에 푸는 문제 수 */
  rounds: number;
  /** 목표 길이의 범위(칸) */
  target: { min: number; max: number };
  /**
   * 이 난이도에서 나오는 문제 종류.
   * 순서가 개념의 순서이고, 앞에서부터 돌아가며 낸다 —
   * 무작위로 섞으면 처음 만나는 개념이 첫 문제로 나올 수 있다.
   */
  kinds: ProblemKind[];
  /** 첫 화면 난이도 버튼 아래 붙는 한 줄. 부모가 고르는 근거가 된다 */
  hint: string;
}

/**
 * 난이도 = **어떤 개념까지 만나는가**이지, 얼마나 큰 수를 다루는가가 아니다.
 *
 * 목표 범위도 같이 넓히긴 하지만 그건 곁가지다. 일곱 살에게 어려운 것은 14칸이 아니라
 * "전체를 알고 개수를 알 때 한 조각을 되짚는" 방향이다. 그래서 단계마다
 * **새 개념을 한둘씩만 얹고**, 앞 단계의 개념은 계속 섞어 낸다.
 *
 * `kinds`는 순서대로 돌려 낸다. 무작위로 뽑으면 처음 만나는 개념이 첫 문제로 나온다.
 */
export const LEVELS: Record<LevelId, LevelSet> = {
  easy: {
    label: "쉬움",
    hint: "재기와 이어 붙이기",
    rounds: 8,
    target: { min: 4, max: 8 },
    // 숫자로 알려주는 것부터. 단위 반복은 쉬운 두 방향(전체 구하기·개수 구하기)만 나온다
    kinds: ["count", "repeat", "measure", "countUnit", "count", "measure"],
  },
  normal: {
    label: "보통",
    hint: "한 조각 되짚기, 다른 단위로 재기",
    rounds: 10,
    target: { min: 5, max: 12 },
    // 여기서 반복의 세 번째 방향(전체와 개수로 한 조각 구하기)과
    // 같은 길이를 다른 단위로 재는 문제가 처음 나온다
    kinds: ["count", "repeat", "measure", "sameParts", "blank", "unitOnly", "countUnit", "measure"],
  },
  hard: {
    label: "어려움",
    hint: "전체와 부분, 꺾인 길, 수직선",
    rounds: 12,
    target: { min: 6, max: 14 },
    // 0이 아닌 데서 시작하는 자 읽기, 선분의 부분 구하기, 꺾인 길, 수직선이 합류한다
    kinds: [
      "measure", "sameParts", "segments", "offset", "bentPath",
      "unitOnly", "countUnit", "cancelPair", "tickGap", "midpoint",
    ],
  },
  challenge: {
    label: "도전",
    hint: "겹치는 구간, 여러 번 꺾인 길",
    rounds: 12,
    target: { min: 8, max: 18 },
    // 앞 단계에서 만난 것들의 어려운 판만 모았다. 새 조작은 하나도 없다 —
    // 도전 단계에서 처음 보는 조작까지 나오면 개념이 아니라 조작에서 막힌다
    // 마지막이 첫 종류와 달라야 한다. 문제 수가 이 목록보다 많아 한 바퀴 돌면
    // 끝과 처음이 이어 붙는데, 같은 종류면 같은 문제를 두 판 연속 만나게 된다
    kinds: [
      "segments", "cancelPair", "bentPath", "sameParts", "segments",
      "midpoint", "bentPath", "cancelPair", "unitOnly", "tickGap",
    ],
  },
};

export const RULES = {
  /** 문제 하나를 맞히면 받는 기본 점수 */
  baseScore: 100,
  /**
   * 한 번도 빼지 않고 맞히면 붙는 보너스.
   * 되돌리기를 벌하지는 않는다 — 빼고 다시 놓는 것도 길이를 재는 과정이다.
   * 다만 한 번에 맞힌 아이에게는 표시가 나야 다시 해볼 마음이 든다.
   */
  perfectBonus: 50,
  /**
   * 조각 하나의 최대 길이(칸).
   * 이보다 길면 한 조각으로 답이 끝나 버려서, 잇는 재미도 단위 반복의 감각도 안 생긴다.
   */
  maxPieceUnits: 5,
  /** 트레이에 놓이는 조각 수 */
  trayCount: 5,
  /**
   * 선분 문제에서 선분 위에 찍는 점의 수.
   * 도전 단계는 다섯 점까지 간다 — 그보다 많으면 모바일 폭에서 글자가 겹친다.
   */
  posts: { normal: 4, challenge: 5 },
} as const;

/**
 * 조각 색.
 *
 * 길이를 색으로 외우지 않도록 **길이와 색을 묶지 않는다.** 매 문제 색을 다시 섞는다.
 * (같은 색이 늘 3칸이면 아이는 세지 않고 색만 본다)
 */
export const PIECE_COLORS = [
  { fill: "#E8536F", line: "#B02B45" },
  { fill: "#F0A02E", line: "#B06E11" },
  { fill: "#6FB566", line: "#3F7C38" },
  { fill: "#4B9BD5", line: "#28648F" },
  { fill: "#A97BD8", line: "#6D46A0" },
  { fill: "#E0776B", line: "#A5473D" },
] as const;

export interface Settings {
  level: LevelId;
  sound: boolean;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  level: "easy",
  sound: true,
  haptics: true,
};
