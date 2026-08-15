import type { ProblemKind } from "../types";

/**
 * 게임 규칙과 난이도.
 *
 * 숫자를 화면 코드에 흩어 두지 않는다. 아이가 하는 걸 보고 고치는 일이 계속 생기는데,
 * 그때 한 곳만 보면 되도록 여기에 모은다.
 */

export type LevelId = "easy" | "normal" | "hard";

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
}

export const LEVELS: Record<LevelId, LevelSet> = {
  easy: {
    label: "쉬움",
    rounds: 8,
    target: { min: 4, max: 8 },
    // 숫자로 알려주는 것부터. 재는 문제는 익숙해진 다음에 나온다
    kinds: ["count", "repeat", "count", "measure"],
  },
  normal: {
    label: "보통",
    rounds: 10,
    target: { min: 5, max: 12 },
    kinds: ["count", "repeat", "measure", "blank", "measure"],
  },
  hard: {
    label: "어려움",
    rounds: 12,
    target: { min: 6, max: 14 },
    // 0이 아닌 데서 시작하는 문제는 여기서만 나온다. 눈금 읽기의 마지막 관문이다
    kinds: ["repeat", "measure", "blank", "offset", "count", "offset"],
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
