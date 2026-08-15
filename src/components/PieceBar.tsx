/**
 * 길이 조각 하나.
 *
 * 눈금(`ticks`)은 조각 안을 칸으로 나눠 그린다. 길이를 숫자로 외우지 않고
 * **몇 칸인지 세어 보게** 하려는 것이다.
 * `blank` 문제에서는 눈금을 끄고 숫자 라벨만 남긴다 — 세는 대신 주어진 길이를 그대로 받아들이는 연습이다.
 */
export function PieceBar({
  units,
  color,
  ticks,
  unitPx,
  height = 44,
  dimmed = false,
  showLabel = true,
}: {
  units: number;
  color: string;
  ticks: boolean;
  unitPx: number;
  height?: number;
  /** 쓸 수 없는 조각(남은 틈보다 길다)은 흐리게 */
  dimmed?: boolean;
  showLabel?: boolean;
}) {
  const width = units * unitPx;
  return (
    <div
      className={`relative flex items-center justify-center rounded-[10px] border-[3px] border-black/25 transition-opacity ${
        dimmed ? "opacity-35" : ""
      }`}
      style={{ width, height, background: color, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.16)" }}
    >
      {/* 칸 경계. 테두리 두께에 밀리지 않도록 비율로 그린다.
          이 선을 세는 것이 이 게임에서 아이가 하는 일이라 숫자가 가리면 안 된다 */}
      {ticks &&
        Array.from({ length: units - 1 }, (_, i) => (
          <span
            key={i}
            className="absolute top-1 bottom-1 w-[2px] -translate-x-1/2 rounded bg-white/70"
            style={{ left: `${((i + 1) / units) * 100}%` }}
          />
        ))}
      {/* 숫자는 왼쪽 끝 배지로 뺀다. 가운데 두면 칸 경계선을 덮는다 */}
      {showLabel && (
        <span
          className="absolute left-1 top-1 rounded px-1 font-black leading-none text-white/95"
          style={{ fontSize: Math.min(13, Math.max(10, unitPx * 0.42)), background: "rgba(0,0,0,0.22)" }}
        >
          {units}
        </span>
      )}
    </div>
  );
}
