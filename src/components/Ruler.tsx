import { LengthObject } from "./LengthObject";
import type { ObjectKind } from "../types";
/**
 * 자.
 *
 * 눈금을 **칸의 경계**로 그린다. 숫자는 눈금 위가 아니라 눈금에 붙여 놓는다.
 * 아이가 흔히 하는 실수가 "눈금 개수를 세는 것"인데, 그러면 4칸짜리를 5라고 읽는다.
 * 그래서 칸 안쪽에 옅은 줄무늬를 넣어 **세어야 할 것은 칸(사이 공간)** 이라는 게 눈에 들어오게 했다.
 *
 * 화면의 1칸은 기기마다 실제 크기가 다르다. 그래서 cm라고 하지 않고 "칸"이라고 부른다.
 */
export function Ruler({
  span,
  unitPx,
  object,
  kind,
}: {
  /** 0부터 몇까지 그릴지 */
  span: number;
  /** 한 칸의 픽셀 길이 */
  unitPx: number;
  /** 자 위에 올려둘 물체 (재야 할 대상) */
  object?: { from: number; to: number; label: string };
  /** 그 물체가 무엇인지. 매 문제 다른 물건이 올라온다 */
  kind?: ObjectKind;
}) {
  const width = span * unitPx;

  return (
    <div className="relative" style={{ width, height: 96 }}>
      {/* 재야 할 물체. 자 바로 위에 붙여 놓아 눈금과 견주기 쉽게 한다 */}
      {object && (
        <>
          {/* 예전에는 주황색 막대 하나였는데, 자 위에 막대가 또 있으니
              그것마저 자처럼 보여서 무엇을 재라는 건지 헷갈렸다.
              시작과 끝이 뚜렷한 물건을 매번 다르게 올린다 */}
          <div
            className="absolute top-0 flex items-center"
            style={{ left: object.from * unitPx, width: (object.to - object.from) * unitPx, height: 36 }}
          >
            <LengthObject kind={kind ?? "log"} width={(object.to - object.from) * unitPx} height={30} />
          </div>
          {/* 0이 아닌 데서 시작하면 어디서부터인지 짚어 준다.
              막대 가운데에 글자를 넣으면 정작 시작점을 가리키지 못한다 */}
          {object.from > 0 && (
            <span
              className="absolute top-[-14px] -translate-x-1/2 text-[10px] font-black text-[#b0642a]"
              style={{ left: object.from * unitPx }}
              aria-hidden="true"
            >
              ▼
            </span>
          )}
        </>
      )}

      {/* 자 몸통 */}
      <div
        className="absolute left-0 rounded-md border-2 border-[var(--color-line-deep)] bg-[#fdf6e3]"
        style={{ top: 44, width, height: 44 }}
      >
        {/* 칸마다 옅은 줄무늬 — 세어야 할 것이 눈금이 아니라 칸이라는 표시 */}
        {Array.from({ length: span }, (_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? "absolute top-0 h-full bg-[#f5ead0]" : "absolute top-0 h-full"}
            style={{ left: i * unitPx, width: unitPx }}
          />
        ))}

        {/* 눈금선과 숫자 */}
        {Array.from({ length: span + 1 }, (_, i) => (
          <div key={i} className="absolute top-0" style={{ left: i * unitPx }}>
            <div
              className="absolute top-0 w-0.5 -translate-x-1/2 bg-[#8a6a4a]"
              style={{ height: i % 5 === 0 ? 20 : 12 }}
            />
            {i % 5 === 0 && (
              <span
                className="absolute top-[22px] -translate-x-1/2 text-[11px] font-black text-[#8a6a4a]"
                style={{ lineHeight: 1 }}
              >
                {i}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
