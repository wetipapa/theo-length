/**
 * 문제의 종류. 순서가 곧 개념의 순서다.
 *
 * 다섯 가지가 전부 **"틈을 정확히 채운다"** 는 같은 조작으로 끝난다.
 * 목표를 어떻게 알려주는지만 다르다 — 아이는 새 조작을 배우지 않고 개념만 하나씩 만난다.
 *
 * - `count`   목표를 숫자로 알려준다. "8칸짜리 다리"
 * - `repeat`  같은 조각만 주고 몇 개인지 세게 한다. "2칸 조각 4개"
 * - `measure` 자 위의 물체를 재서 스스로 알아낸다. 숫자를 알려주지 않는다
 * - `blank`   조각에 눈금이 없다. 숫자 라벨만 보고 길이를 다룬다
 * - `offset`  자 위 물체가 0이 아닌 눈금에서 시작한다. 끝 숫자가 곧 길이가 아니다
 */
export type ProblemKind = "count" | "repeat" | "measure" | "blank" | "offset";

/** 다리에 놓을 조각 하나 */
export interface Piece {
  /** 트레이 안에서의 고유 번호 */
  id: number;
  /** 길이(칸). 화면 픽셀이 아니라 게임 안의 단위다 */
  units: number;
  /** 조각 색 (트레이에서 서로 구분되도록) */
  color: string;
  /** 눈금을 그릴지. `blank` 문제에서는 숨긴다 */
  ticks: boolean;
}

/** 문제 하나 */
export interface Problem {
  kind: ProblemKind;
  /** 채워야 할 전체 길이(칸) */
  target: number;
  /** 아이가 읽는 한 줄 */
  prompt: string;
  /** 트레이에 놓이는 조각들 */
  tray: Piece[];
  /**
   * `measure`·`offset`에서 자 위에 놓이는 물체.
   * `from`부터 `to`까지 차지한다. 길이는 `to - from`이고, 그걸 알아내는 것이 문제다.
   */
  onRuler?: { from: number; to: number; label: string };
  /** 자에 눈금을 몇 칸까지 그릴지 */
  rulerSpan: number;
}

/** 다리에 놓인 조각 (트레이 조각의 복제본) */
export interface Placed {
  /** 놓인 순서로 매기는 고유 번호 */
  key: number;
  units: number;
  color: string;
  ticks: boolean;
}

export type Phase = "playing" | "crossing" | "done";

export interface RunResult {
  score: number;
  solved: number;
  /** 한 번에 맞힌 문제 수 */
  perfect: number;
  isBest: boolean;
}
