import type { ReactNode } from "react";

/** 상판 높이(px) */
export const DECK_H = 58;
/** 상판 아래 강의 **기본** 깊이(px). 화면에 자리가 남으면 더 깊게 그린다 */
export const RIVER_H = 96;
/**
 * 양쪽 언덕의 **최소** 폭(px).
 *
 * 실제로는 남는 자리를 끝까지 채운다. 상판만큼만 땅을 그리면
 * 화면 가운데에 직사각형 세 개가 떠 있는 그림이 되어 강으로 안 읽힌다.
 */
export const BANK_W = 40;

/**
 * 다리가 놓이는 자리 — 강과 양쪽 언덕.
 *
 * 예전에는 상판 아래에 둥근 하늘색 덩어리 하나를 깔아 뒀는데, 욕조처럼 보였다.
 * 교대는 공중에 떠 있고 물은 바닥이 둥글어서, 일곱 살이 보면 "이게 뭐지" 싶은 그림이었다.
 *
 * 세 가지를 고쳤다.
 * - **언덕을 바닥까지 내린다.** 땅은 잘려 있지 않다. 위에 풀을 얹어 땅인 걸 못박는다
 * - **강은 상판 아래에서 시작한다.** 예전에는 채워야 할 틈까지 물빛이라
 *   "비어 있다"가 아니라 "물이 차 있다"로 읽혔다
 * - **아래로 갈수록 깊어지고 잔물결이 흐른다.** 한 색으로 칠하면 종이처럼 보인다
 */
/**
 * 강을 헤엄치는 악어.
 *
 * CSS 덩어리로 눈과 등만 그려 봤는데 초록 막대에 흰 점이라 악어로 안 읽혔다.
 * 옆모습을 통째로 그리는 편이 훨씬 잘 읽힌다 — 주둥이·눈·등의 톱니·꼬리가 다 보여야 한다.
 */
function Crocodile({ top }: { top: number }) {
  return (
    <svg
      viewBox="0 0 120 34"
      className="absolute animate-[float-across_16s_linear_infinite]"
      style={{ top, left: "-22%", width: 96 }}
      aria-hidden="true"
    >
      {/* 꼬리 — 뒤로 갈수록 가늘어진다 */}
      <path d="M8 20 Q22 16 34 19 L34 24 Q22 25 8 20Z" fill="#3f7a4a" />
      {/* 몸통과 주둥이 */}
      <path
        d="M30 15 Q48 11 66 13 L104 15 Q114 16 114 19 Q114 22 104 23 L66 25 Q48 27 30 23Z"
        fill="#4a8f57"
      />
      {/* 배 — 밝은 색이 있어야 덩어리로 안 보인다 */}
      <path d="M36 22 Q62 26 100 22 Q62 24 36 22Z" fill="#8fc98a" opacity="0.7" />
      {/* 등의 톱니 */}
      {[38, 48, 58].map((x) => (
        <path key={x} d={`M${x} 13 l4 -5 l4 5Z`} fill="#3f7a4a" />
      ))}
      {/* 눈두덩과 눈 */}
      <circle cx="96" cy="14" r="5" fill="#4a8f57" />
      <circle cx="97" cy="13.5" r="2.4" fill="#fff" />
      <circle cx="97.6" cy="13.5" r="1.3" fill="#1d3524" />
      {/* 콧구멍 */}
      <circle cx="111" cy="17.5" r="1.2" fill="#2f5c38" />
      {/* 이빨 */}
      <path d="M92 21 l2.5 3 l2.5 -3Z M99 21.5 l2.5 3 l2.5 -3Z" fill="#fff" />
    </svg>
  );
}

export function BridgeScene({
  deckWidth,
  riverH = RIVER_H,
  children,
}: {
  deckWidth: number;
  /** 강의 깊이. 화면에 자리가 남으면 깊게 그려 빈 공간을 줄인다 */
  riverH?: number;
  children: ReactNode;
}) {
  const bank = (side: "left" | "right") => (
    <div
      className="relative flex-1"
      style={{
        minWidth: BANK_W,
        height: DECK_H + riverH,
        background: "linear-gradient(180deg,#a9825a 0%,#8a6a4a 38%,#6b5138 100%)",
        borderRadius: side === "left" ? "6px 0 0 6px" : "0 6px 6px 0",
      }}
    >
      {/* 흙 위의 풀. 땅이라는 걸 한눈에 알린다 */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: 13, background: "linear-gradient(180deg,#8ed07a,#5aa84f)" }}
      />
      {/* 흙결 */}
      <div className="absolute inset-x-1 top-7 h-[3px] rounded bg-[#00000014]" />
      <div className="absolute inset-x-2 top-16 h-[3px] rounded bg-[#00000010]" />
    </div>
  );

  return (
    <div className="relative flex w-full items-start">
      {bank("left")}

      <div className="relative shrink-0" style={{ width: deckWidth, height: DECK_H + riverH }}>
        {/* 강 — 상판 아래에서 시작한다 */}
        <div
          className="absolute inset-x-0 overflow-hidden"
          style={{
            top: DECK_H,
            height: riverH,
            background: "linear-gradient(180deg,#9fd8e8 0%,#5fb6d4 45%,#2e86b0 100%)",
          }}
          aria-hidden="true"
        >
          {/* 강을 헤엄쳐 지나가는 악어.
              아이가 다리를 놓는 이유를 한 컷으로 말해 준다 — 저기로 걸어 건널 수는 없다.
              아주 느리게 움직인다. 빠르면 눈이 그쪽으로 끌려가 정작 다리를 못 본다 */}
          <Crocodile top={riverH * 0.45} />

          {[0.18, 0.42, 0.66].map((t, i) => (
            <div
              key={t}
              className="absolute h-[3px] rounded-full bg-white/35"
              style={{ top: riverH * t, left: `${8 + i * 14}%`, width: `${34 - i * 6}%` }}
            />
          ))}
        </div>

        {/* 상판이 놓이는 자리 */}
        <div className="absolute inset-x-0 top-0" style={{ height: DECK_H }}>
          {children}
        </div>
      </div>

      {bank("right")}
    </div>
  );
}
