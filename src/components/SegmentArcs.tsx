import type { Arc } from "../types";

/**
 * 선분 위에 그리는 구간 표시.
 *
 * 겹치는 구간을 같은 높이에 그리면 호와 숫자가 서로 겹쳐 모바일에서 읽을 수 없다.
 * 그래서 `tier`로 **층을 나눠** 위로 쌓는다. 가장 아래 층이 선분에 가장 가깝다.
 *
 * 숫자는 호 위에 흰 알약으로 앉힌다. 선 위에 그냥 얹으면 호와 겹쳐 뭉갠다.
 */
export function SegmentArcs({ arcs, unitPx }: { arcs: Arc[]; unitPx: number }) {
  const tiers = Math.max(...arcs.map((a) => a.tier)) + 1;
  const tierHeight = 26;

  return (
    <div className="relative w-full" style={{ height: tiers * tierHeight + 6 }}>
      {arcs.map((arc, i) => {
        const bottom = arc.tier * tierHeight;
        return (
          <div
            key={i}
            className="absolute"
            style={{ left: arc.from * unitPx, width: (arc.to - arc.from) * unitPx, bottom }}
          >
            {/* 구간의 양 끝을 짚는 세로 막대와 그 사이를 잇는 가로선 */}
            <div className="absolute bottom-0 left-0 h-3 w-0.5 bg-[var(--color-accent-deep)]" />
            <div className="absolute bottom-0 right-0 h-3 w-0.5 bg-[var(--color-accent-deep)]" />
            <div className="absolute bottom-[5px] left-0 right-0 h-0.5 bg-[var(--color-accent-deep)]" />
            <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 rounded-full border-2 border-[var(--color-accent-deep)] bg-white px-1.5 text-[11px] font-black leading-[15px] text-[var(--color-accent-deep)]">
              {arc.units}
            </span>
          </div>
        );
      })}
    </div>
  );
}
