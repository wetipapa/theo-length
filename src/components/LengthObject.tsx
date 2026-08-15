import type { ObjectKind } from "../types";

/**
 * 길이를 재는 물건 그림.
 *
 * 예전에는 칸 안에 `붓 3칸`처럼 **글씨로** 적어 뒀다. 두 줄에 다섯 개씩 놓이니
 * 화면이 글자로 빽빽해졌고, 일곱 살이 읽어야 할 것이 그림이 아니라 텍스트가 됐다.
 * 물건은 그림으로 보여주고 길이는 위쪽 범례에서 한 번만 말한다.
 *
 * **가로로 늘어나게 그린다.** 같은 물건이라도 몇 칸짜리인지에 따라 폭이 달라지는데,
 * 그림 파일을 늘리면 뭉개진다. 그래서 몸통만 늘어나고 끝 장식(성냥 머리, 연필 촉)은
 * 크기를 지키도록 CSS로 조립했다.
 */
export const OBJECT_NAMES: Record<ObjectKind, string> = {
  log: "통나무",
  match: "성냥",
  pencil: "연필",
  straw: "빨대",
  brush: "붓",
  eraser: "지우개",
};

/** 물건마다 굵기가 다르다. 통나무는 굵고 성냥은 가늘다 — 그것만으로도 구별된다 */
const THICKNESS: Record<ObjectKind, number> = {
  log: 1,
  match: 0.42,
  pencil: 0.6,
  straw: 0.5,
  brush: 0.6,
  eraser: 0.86,
};

export function LengthObject({ kind, width, height }: { kind: ObjectKind; width: number; height: number }) {
  const h = Math.max(8, Math.round(height * THICKNESS[kind]));
  const box = { width, height: h } as const;
  const cap = Math.min(Math.round(h * 0.9), Math.round(width * 0.3));

  if (kind === "log") {
    return (
      <div className="relative rounded-full" style={{ ...box, background: "linear-gradient(#b98a5a,#8a6a4a)" }}>
        {/* 나이테 — 잘린 단면이 보여야 통나무로 읽힌다 */}
        <span
          className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-[#6b5138] bg-[#c9a879]"
          style={{ left: 2, width: h * 0.42, height: h * 0.72 }}
        />
        <span className="absolute inset-x-[18%] top-[30%] h-[2px] rounded bg-[#00000018]" />
      </div>
    );
  }

  if (kind === "match") {
    return (
      <div className="relative flex items-center" style={box}>
        <span className="h-full flex-1 rounded-sm" style={{ background: "linear-gradient(#f0dcb4,#d9bd8a)" }} />
        {/* 머리는 늘어나지 않는다 */}
        <span
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ right: 0, width: cap, height: h * 1.5, background: "linear-gradient(#f0645a,#c2352b)" }}
        />
      </div>
    );
  }

  if (kind === "pencil") {
    return (
      <div className="relative flex items-center" style={box}>
        <span className="rounded-l-sm" style={{ width: cap * 0.5, height: "100%", background: "#f2a6b8" }} />
        <span style={{ width: 3, height: "100%", background: "#c9ccd1" }} />
        <span className="flex-1" style={{ height: "100%", background: "linear-gradient(#f7c65a,#e0a72e)" }} />
        {/* 깎인 촉 */}
        <span
          style={{ width: cap * 0.7, height: "100%", background: "#e8cfa8", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
        />
      </div>
    );
  }

  if (kind === "straw") {
    return (
      <div
        className="rounded-full border border-[#00000018]"
        style={{
          ...box,
          background: "repeating-linear-gradient(115deg,#ffffff 0 6px,#4b9bd5 6px 12px)",
        }}
      />
    );
  }

  if (kind === "brush") {
    return (
      <div className="relative flex items-center" style={box}>
        <span className="flex-1 rounded-l-full" style={{ height: "100%", background: "linear-gradient(#c08b52,#96693a)" }} />
        <span style={{ width: Math.max(4, cap * 0.35), height: "100%", background: "linear-gradient(#e6e9ec,#aeb4ba)" }} />
        <span
          className="rounded-r-[3px]"
          style={{ width: cap * 0.8, height: h * 1.25, background: "linear-gradient(#5a4636,#2f2620)" }}
        />
      </div>
    );
  }

  // 지우개 — 가운데 띠가 있어야 지우개로 읽힌다
  return (
    <div className="relative overflow-hidden rounded-[4px]" style={{ ...box, background: "#f2a6b8" }}>
      <span className="absolute inset-x-0 top-1/2 h-[26%] -translate-y-1/2 bg-[#ffffffcc]" />
      <span className="absolute inset-0 rounded-[4px] border border-[#00000020]" />
    </div>
  );
}
