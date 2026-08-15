import type { ItemBlock } from "../types";

/**
 * 위아래 두 줄 견주기.
 *
 * 두 줄의 **전체 길이가 같다.** 그게 이 문제의 전제이고, 그래서 눈금을 그리지 않는다 —
 * 칸을 셀 수 있으면 지울 이유가 없어지고, 그냥 자로 재는 문제가 된다.
 *
 * 아이는 양쪽에 똑같이 들어 있는 물건을 눌러 지운다. 지워진 것은 사라지지 않고
 * **자리에 흐리게 남는다.** 없애 버리면 두 줄의 길이가 달라져 보여서,
 * 정작 배워야 할 것("양쪽에서 같은 만큼 덜어내도 나머지는 여전히 같다")이 깨진다.
 */
export function PairRows({
  top,
  bottom,
  unitPx,
  cleared,
  onTap,
}: {
  top: ItemBlock[];
  bottom: ItemBlock[];
  unitPx: number;
  /** 이미 지운 물건들의 id */
  cleared: Set<number>;
  onTap: (block: ItemBlock, row: "top" | "bottom") => void;
}) {
  const row = (blocks: ItemBlock[], which: "top" | "bottom") => (
    <div className="flex items-center gap-[2px]">
      {blocks.map((b) => {
        const gone = cleared.has(b.id);
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onTap(b, which)}
            disabled={gone}
            aria-label={`${b.name} ${b.known ? `${b.units}칸` : "모르는 길이"}`}
            className={`relative flex h-12 flex-col items-center justify-center rounded-lg border-[3px] border-black/25 transition-opacity ${
              gone ? "opacity-20" : ""
            }`}
            style={{
              width: b.units * unitPx,
              background: b.color,
              boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.16)",
            }}
          >
            <span className="text-[10px] font-black leading-tight text-white/95">{b.name}</span>
            <span className="text-[11px] font-black leading-tight text-white">
              {b.known ? `${b.units}칸` : "?"}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
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
