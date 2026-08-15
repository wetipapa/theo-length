/**
 * 문제의 종류. 순서가 곧 개념의 순서다.
 *
 * **거의 전부가 "틈을 정확히 채운다"는 같은 조작으로 끝난다.**
 * 목표를 어떻게 알려주는지만 다르다 — 아이는 개념을 하나 만날 때마다 조작을 다시 배우지 않는다.
 * 수직선 두 종류(`midpoint`·`tickGap`)만 예외인데, 거기엔 채울 틈이 없기 때문이다.
 *
 * ── 기본 측정
 * - `count`   목표를 숫자로 알려준다. "8칸짜리 다리"
 * - `measure` 자 위의 물체를 재서 스스로 알아낸다. 숫자를 알려주지 않는다
 * - `blank`   조각에 눈금이 없다. 숫자 라벨만 보고 길이를 다룬다
 * - `offset`  자 위 물체가 0이 아닌 눈금에서 시작한다. 끝 숫자가 곧 길이가 아니다
 *
 * ── 단위 반복의 세 방향
 *   셋 중 하나를 모를 때 나머지 둘로 찾는다. 한 방향만 연습하면 아이는
 *   "곱하기 문제"로 외우고, 방향이 바뀌면 손을 못 댄다.
 * - `repeat`     한 조각 × 개수 → 전체.  "2칸 조각 4개로"
 * - `sameParts`  전체 ÷ 개수 → 한 조각.  "12칸을 똑같은 조각 3개로"
 * - `countUnit`  전체 ÷ 한 조각 → 개수.  "12칸을 3칸 조각으로"
 *
 * ── 같은 길이를 다른 단위로
 * - `unitOnly` 눈금 없는 조각 한 종류로만 채운다. **같은 틈을 두 번 연달아 낸다.**
 *   한 번은 긴 조각, 다음은 짧은 조각으로. 개수가 달라지는 걸 손으로 겪고 나서
 *   "많이 들어간 쪽이 더 짧다"를 말해 준다
 *
 * ── 전체와 부분
 * - `segments` A-B-C-D 선분. 아는 구간으로 모르는 구간을 채운다.
 *   어려움에서는 구간이 겹친다 (A~C와 B~D를 알고 B~C를 구하기)
 * - `bentPath` 꺾인 길의 길이를 세어 곧은 다리로 놓는다. 맞히면 길이 쭉 펴진다
 *
 * ── 같은 전체를 두 가지로 만들기
 * - `cancelPair` 위아래 두 줄이 같은 길이다. **양쪽에 똑같이 들어 있는 것부터 지우고**
 *   남은 것끼리 견준다. 식을 먼저 보여 주지 않는다 — 같은 것을 눌러 지워 보는 것이 곧 계산이다
 *
 * ── 수직선
 * - `midpoint` 두 수에서 같은 거리에 있는 눈금을 짚는다. 짚을 때마다 양쪽 거리가 보인다
 * - `tickGap`  일정한 간격의 눈금에서 빠진 수를 찾는다
 */
export type ProblemKind =
  | "count"
  | "measure"
  | "blank"
  | "offset"
  | "repeat"
  | "sameParts"
  | "countUnit"
  | "unitOnly"
  | "segments"
  | "bentPath"
  | "midpoint"
  | "tickGap"
  | "cancelPair";

/** 다리에 놓을 조각 하나 */
export interface Piece {
  id: number;
  /** 길이(칸). 화면 픽셀이 아니라 게임 안의 단위다 */
  units: number;
  color: string;
  /** 눈금을 그릴지. `blank`·`unitOnly`에서는 숨긴다 */
  ticks: boolean;
  /**
   * 길이를 숫자로 적을지.
   *
   * `blank`은 눈금을 지우고 숫자만 남긴다 — 세는 대신 주어진 길이를 받아들이는 연습이다.
   * `unitOnly`는 **둘 다 지운다.** 숫자가 보이면 "6칸이니까 2개"로 계산해 버리고,
   * 정작 배워야 할 관계(많이 들어간 조각이 더 짧다)는 지나간다.
   */
  label: boolean;
}

/** 선분 위의 점 하나 */
export interface Post {
  /** A, B, C … */
  label: string;
  /** 선분 왼쪽 끝에서 몇 칸 지점인지 */
  at: number;
}

/** 선분 위에 숫자로 알려주는 구간. 다리 위쪽에 호와 숫자로 그린다 */
export interface Arc {
  from: number;
  to: number;
  units: number;
  /** 몇 번째 층에 그릴지. 겹치는 구간을 같은 높이에 그리면 읽을 수 없다 */
  tier: number;
}

/** 선분 문제의 판 전체 */
export interface LineBoard {
  /** 선분 전체 길이(칸) */
  span: number;
  posts: Post[];
  /** 비어 있는 구간. 여기를 채우는 것이 문제다 */
  gap: { from: number; to: number };
  /** 이미 놓여 있는 구간들 */
  filled: { from: number; to: number }[];
  /** 숫자로 알려주는 구간들 */
  arcs: Arc[];
}

/** 격자 위 꺾인 길 */
export interface PathBoard {
  /** 격자 칸 수 */
  cols: number;
  rows: number;
  /** 꺾이는 지점들. 이웃한 두 점 사이는 늘 가로 또는 세로다 */
  vertices: { x: number; y: number }[];
}

/** 두 줄 견주기에 나오는 물건. 이름이 아니라 **그림**으로 구별한다 */
export type ObjectKind = "log" | "match" | "pencil" | "straw" | "brush" | "eraser";

/** 두 줄 견주기의 물건 하나 */
export interface ItemBlock {
  id: number;
  kind: ObjectKind;
  units: number;
  /** 길이를 알려주는 물건인지. 모르는 물건은 범례에 `?`로 나온다 */
  known: boolean;
}

/**
 * 두 줄 견주기 판.
 *
 * 위아래 줄의 **전체 길이가 같다.** 양쪽에 똑같이 들어 있는 물건을 지워 나가면
 * 마지막에 "아는 것 하나 = 모르는 것 몇 개"만 남는다.
 */
export interface PairBoard {
  top: ItemBlock[];
  bottom: ItemBlock[];
  /** 모르는 물건. 이게 몇 칸인지가 답이다 */
  unknown: ObjectKind;
  /** 모르는 물건이 아래 줄에 몇 개 있는지 */
  unknownCount: number;
}

/** 수직선 판 */
export interface NumberLineBoard {
  /** 0부터 몇까지 */
  span: number;
  /** 숫자를 붙이는 간격 */
  step: number;
  /** 눈금을 짚을 수 있는 범위. `midpoint`에서 쓴다 */
  a?: number;
  b?: number;
  /** 숫자 대신 물음표로 가릴 위치. `tickGap`에서 쓴다 */
  hidden?: number;
}

/** 문제 하나 */
export interface Problem {
  kind: ProblemKind;
  /**
   * 채워야 할 길이(칸).
   * 수직선 문제(`midpoint`·`tickGap`)에서는 짚어야 할 **수**를 담는다.
   */
  target: number;
  /** 아이가 읽는 한 줄 */
  prompt: string;
  /**
   * 문구가 목표 길이를 이미 말해 주는가.
   *
   * **여기가 거짓이면 화면 어디에도 남은 칸 수를 적으면 안 된다.**
   * 알아내는 것이 문제인데 "5칸 더 필요해요"라고 써 두면 답을 그냥 알려주는 셈이다.
   * 조각을 흐리게 처리하는 것도 같은 이유로 하지 않는다 —
   * 5는 흐린데 4는 아니면 남은 칸이 4라고 말해 주는 것과 같다.
   */
  tellsTarget: boolean;
  /** 트레이에 놓이는 조각들. 수직선 문제에서는 비어 있다 */
  tray: Piece[];
  /**
   * 자 위에 놓이는 물체. `from`부터 `to`까지 차지한다.
   * 길이는 `to - from`이고, 그걸 알아내는 것이 문제다.
   */
  onRuler?: { from: number; to: number; label: string };
  /** 자에 눈금을 몇 칸까지 그릴지 */
  rulerSpan: number;
  /**
   * 조각을 누르면 이만큼 한꺼번에 놓인다.
   * "12칸을 똑같은 조각 3개로" 같은 문제에 쓴다 — 셋이 한 번에 착 붙어야
   * "이 길이 셋이면 12칸"이 한눈에 들어온다.
   * 이 문제에서는 빼기도 통째로 되고, 빼도 보너스를 잃지 않는다.
   * 여러 크기를 대 보는 것이 곧 푸는 방법이기 때문이다.
   */
  autoRepeat?: number;
  /** 맞힌 뒤 한 줄 짚어 주는 말. 방금 한 조작이 무슨 관계였는지 알려주는 자리다 */
  note?: string;
  /** 선분 문제 */
  line?: LineBoard;
  /** 꺾인 길 문제 */
  path?: PathBoard;
  /** 수직선 문제 */
  numberLine?: NumberLineBoard;
  /** `tickGap`에서 고르는 수들 */
  choices?: number[];
  /** 두 줄 견주기 문제 */
  pair?: PairBoard;
}

/** 다리에 놓인 조각 */
export interface Placed {
  key: number;
  units: number;
  color: string;
  ticks: boolean;
  label: boolean;
}

export type Phase = "playing" | "crossing" | "done";

export interface RunResult {
  score: number;
  solved: number;
  /** 한 번에 맞힌 문제 수 */
  perfect: number;
  isBest: boolean;
}
