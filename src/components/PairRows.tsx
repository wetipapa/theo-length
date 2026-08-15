import { LengthObject, OBJECT_NAMES } from "./LengthObject";
import type { ItemBlock, ObjectKind } from "../types";

/**
 * 위아래 두 줄 견주기.
 *
 * 두 줄의 **전체 길이가 같다.** 그게 이 문제의 전제이고, 그래서 눈금을 그리지 않는다 —
 * 칸을 셀 수 있으면 지울 이유가 없어지고, 그냥 자로 재는 문제가 된다.
 *
 * **물건은 그림으로만 보여준다.** 예전에는 칸마다 `붓 3칸`처럼 글씨를 적었는데,
 * 두 줄에 다섯 개씩이면 화면이 글자로 빽빽해져서 정작 봐야 할 길이 차이가 안 보였다.
 * 몇 칸인지는 **위쪽 범례에서 한 번만** 말한다.
 *
 * 지운 것은 사라지지 않고 자리에 흐리게 남는다. 없애 버리면 두 줄의 길이가
 * 달라져 보여서, 정작 배워야 할 것("양쪽에서 같은 만큼 덜어내도 나머지는 같다")이 깨진다.
 */
export function PairRows({
  top,
  bottom,
  unknown,
  unitPx,
  cleared,
  onTap,
}: {
  top: ItemBlock[];
  bottom: ItemBlock[];
  unknown: ObjectKind;
  unitPx: number;
  /** 이미 지운 물건들의 id */
  cleared: Set<number>;
  onTap: (block: ItemBlock, row: "top" | "bottom") => void;
}) {
  const blockH = 44;

  // 범례에 넣을 물건들. 같은 물건이 여러 개 있어도 한 번만 말한다
  const legend: { kind: ObjectKind; units: number; known: boolean }[] = [];
  for (const b of [...top, ...bottom]) {
    if (legend.some((l) => l.kind === b.kind)) continue;
    legend.push({ kind: b.kind, units: b.units, known: b.known });
  }

  const row = (blocks: ItemBlock[], which: "top" | "bottom") => (
    <div className="flex items-center gap-[3px]">
      {blocks.map((b) => {
        const gone = cleared.has(b.id);
        const w = b.units * unitPx;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onTap(b, which)}
            disabled={gone}
            aria-label={`${OBJECT_NAMES[b.kind]} ${b.known ? `${b.units}칸` : "모르는 길이"}`}
            className={`flex items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-white transition-opacity ${
              gone ? "opacity-20" : ""
            }`}
            style={{ width: w, height: blockH }}
          >
            <LengthObject kind={b.kind} width={Math.max(6, w - 10)} height={blockH - 14} />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
      {/* 어느 물건이 몇 칸인지는 여기서 한 번만 말한다 */}
      <div className="mb-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {legend.map((l) => (
          <span key={l.kind} className="flex items-center gap-1.5">
            <LengthObject kind={l.kind} width={22} height={16} />
            <span className="text-[12px] font-black text-[var(--color-ink)]">
              {OBJECT_NAMES[l.kind]}{" "}
              <span className={l.kind === unknown ? "text-[var(--color-accent-deep)]" : "text-[var(--color-ink-soft)]"}>
                {l.known ? `${l.units}칸` : "?"}
              </span>
            </span>
          </span>
        ))}
      </div>

      {row(top, "top")}
      {/* 두 줄이 같은 길이라는 것을 선으로 못박아 둔다. 전제를 말로만 적어 두면
          아이는 두 줄을 따로따로 본다 */}
      <div className="relative h-3 w-full">
        <div className="absolute left-0 top-1/2 h-0.5 w-full bg-[var(--color-accent-soft)]" />
        <div className="absolute left-0 top-0 h-3 w-0.5 bg-[var(--color-accent-deep)]" />
        <div className="absolute right-0 top-0 h-3 w-0.5 bg-[var(--color-accent-deep)]" />
      </div>
      {row(bottom, "bottom")}
    </div>
  );
}
