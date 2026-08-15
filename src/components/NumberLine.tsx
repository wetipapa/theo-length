/**
 * 수직선.
 *
 * 자와 같은 구조다 — 눈금 사이의 칸을 센다. 그래서 자와 같은 줄무늬를 쓴다.
 * 다른 점은 숫자를 일정한 간격으로만 붙인다는 것뿐이고, 그 사실을 아이가
 * 알아채는 것이 `tickGap` 문제다.
 *
 * `midpoint`에서는 짚은 자리에서 **양쪽 거리를 화살표로** 보여준다.
 * `(두 수의 합) ÷ 2`를 외우게 하지 않고, 두 숫자가 같아지는 자리를 찾게 하려는 것이다.
 *
 * 층을 위에서부터 **찾을 두 수 → 양쪽 거리 → 자 → 짚은 자리** 순으로 쌓는다.
 * 예전에는 짚는 표시를 자 위에 뒀는데, 그러면 두 수 배지와 겹쳐서
 * 정작 지금 어디를 짚고 있는지가 안 보였다.
 */
export function NumberLine({
  span,
  step,
  unitPx,
  a,
  b,
  hidden,
  marker,
}: {
  span: number;
  /** 숫자를 붙이는 간격 */
  step: number;
  unitPx: number;
  /** 한가운데를 찾을 두 수 */
  a?: number;
  b?: number;
  /** 숫자를 물음표로 가릴 자리 */
  hidden?: number;
  /** 아이가 짚고 있는 자리 */
  marker?: number;
}) {
  const width = span * unitPx;
  const measuring = a !== undefined && b !== undefined && marker !== undefined;
  const bodyTop = measuring ? 52 : 4;

  return (
    <div className="relative" style={{ width, height: bodyTop + (measuring ? 66 : 46) }}>
      {/* 찾을 두 수 */}
      {a !== undefined &&
        b !== undefined &&
        [a, b].map((n) => (
          <span
            key={n}
            className="absolute top-0 -translate-x-1/2 rounded-full bg-[#f2a33c] px-2 text-[12px] font-black leading-[20px] text-[#5a3a12] shadow-[0_2px_0_#c07c22]"
            style={{ left: n * unitPx }}
          >
            {n}
          </span>
        ))}

      {/* 짚은 자리에서 양쪽까지의 거리. 두 숫자가 같아지면 한가운데다 */}
      {measuring &&
        [
          { from: Math.min(a, marker), to: Math.max(a, marker) },
          { from: Math.min(b, marker), to: Math.max(b, marker) },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute top-[26px]"
            style={{ left: s.from * unitPx, width: (s.to - s.from) * unitPx }}
          >
            <div className="absolute top-[13px] left-0 right-0 h-0.5 bg-[var(--color-accent-deep)]" />
            <div className="absolute top-[9px] left-0 h-2.5 w-0.5 bg-[var(--color-accent-deep)]" />
            <div className="absolute top-[9px] right-0 h-2.5 w-0.5 bg-[var(--color-accent-deep)]" />
            <span className="absolute top-[3px] left-1/2 -translate-x-1/2 rounded-full border-2 border-[var(--color-accent-deep)] bg-white px-1.5 text-[11px] font-black leading-[15px] text-[var(--color-accent-deep)]">
              {s.to - s.from}
            </span>
          </div>
        ))}

      {/* 몸통 — 자와 같은 줄무늬. 세어야 할 것은 눈금이 아니라 칸이다 */}
      <div
        className="absolute left-0 rounded-md border-2 border-[var(--color-line-deep)] bg-[#fdf6e3]"
        style={{ top: bodyTop, width, height: 40 }}
      >
        {Array.from({ length: span }, (_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? "absolute top-0 h-full bg-[#f5ead0]" : "absolute top-0 h-full"}
            style={{ left: i * unitPx, width: unitPx }}
          />
        ))}

        {Array.from({ length: span + 1 }, (_, i) => {
          const labelled = i % step === 0;
          return (
            <div key={i} className="absolute top-0" style={{ left: i * unitPx }}>
              <div
                className="absolute top-0 w-0.5 -translate-x-1/2 bg-[#8a6a4a]"
                style={{ height: labelled ? 18 : 10 }}
              />
              {labelled && (
                <span
                  className={`absolute top-[20px] -translate-x-1/2 text-[12px] font-black leading-none ${
                    i === hidden ? "text-[var(--color-accent-deep)]" : "text-[#8a6a4a]"
                  }`}
                >
                  {i === hidden ? "?" : i}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 짚고 있는 자리. 자 아래에서 위를 가리킨다 */}
      {marker !== undefined && (
        <span
          className="absolute -translate-x-1/2 transition-[left] duration-150"
          style={{
            left: marker * unitPx,
            top: bodyTop + 44,
            width: 0,
            height: 0,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderBottom: "11px solid var(--color-accent-deep)",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
