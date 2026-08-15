import type { ReactNode } from "react";

/** 상판 높이(px) */
export const DECK_H = 58;
/** 상판 아래 강의 깊이(px) */
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
export function BridgeScene({ deckWidth, children }: { deckWidth: number; children: ReactNode }) {
  const bank = (side: "left" | "right") => (
    <div
      className="relative flex-1"
      style={{
        minWidth: BANK_W,
        height: DECK_H + RIVER_H,
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

      <div className="relative shrink-0" style={{ width: deckWidth, height: DECK_H + RIVER_H }}>
        {/* 강 — 상판 아래에서 시작한다 */}
        <div
          className="absolute inset-x-0 overflow-hidden"
          style={{
            top: DECK_H,
            height: RIVER_H,
            background: "linear-gradient(180deg,#9fd8e8 0%,#5fb6d4 45%,#2e86b0 100%)",
          }}
          aria-hidden="true"
        >
          {[0.18, 0.42, 0.66].map((t, i) => (
            <div
              key={t}
              className="absolute h-[3px] rounded-full bg-white/35"
              style={{ top: RIVER_H * t, left: `${8 + i * 14}%`, width: `${34 - i * 6}%` }}
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
