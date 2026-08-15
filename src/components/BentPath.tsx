/**
 * 격자 위의 꺾인 길.
 *
 * 길을 **한 칸짜리 토막들로** 그린다. 긴 직선 하나로 그리면 모서리에서 몇 칸인지
 * 헷갈려서, 꺾이는 지점을 빠뜨리거나 두 번 세는 실수가 그대로 나온다.
 * 토막마다 경계가 보이면 손가락으로 짚어 가며 셀 수 있다.
 *
 * 맞히면 토막들이 아래 한 줄로 **쭉 펴진다.** "꺾여 있어도 길이는 그대로"를
 * 글로 적어 두는 것보다 한 번 보는 게 낫다. 격자 한 칸을 다리 한 칸과 같은 크기로
 * 받아 그리기 때문에, 펴진 길은 바로 아래 아이가 놓은 다리와 너비가 정확히 맞는다.
 *
 * 토막은 격자의 **선 위에** 그린다. 칸 안에 그리면 모서리에서 가로와 세로가
 * 어긋나 길이 끊어져 보인다.
 */
/**
 * 판 가장자리 여백.
 *
 * 토막을 격자 선 **위에** 그리므로 맨 끝 토막이 절반만큼 판 밖으로 나간다.
 * 그만큼 여백을 두어야 잘리지 않는다. 게임 화면도 이 값만큼 왼쪽으로 당겨야
 * 펴진 길과 다리 상판의 왼쪽 끝이 정확히 맞는다.
 */
export function pathPad(cell: number) {
  return Math.ceil(thickness(cell) / 2) + 2;
}

const thickness = (cell: number) => Math.max(7, Math.round(cell * 0.34));

export function BentPath({
  cols,
  rows,
  vertices,
  cell,
  straight,
}: {
  cols: number;
  rows: number;
  vertices: { x: number; y: number }[];
  /** 격자 한 칸 = 다리 한 칸 */
  cell: number;
  /** 참이면 아래 한 줄로 펴진다 */
  straight: boolean;
}) {
  // 꼭짓점 사이를 한 칸씩 끊어 토막 목록을 만든다.
  // 어느 방향으로 가든 토막의 **왼쪽 위 끝**을 기준으로 잡는다
  const steps: { x: number; y: number; horizontal: boolean }[] = [];
  for (let i = 1; i < vertices.length; i++) {
    const a = vertices[i - 1];
    const b = vertices[i];
    const horizontal = a.y === b.y;
    const n = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    const from = horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
    for (let k = 0; k < n; k++) {
      steps.push(horizontal ? { x: from + k, y: a.y, horizontal } : { x: a.x, y: from + k, horizontal });
    }
  }

  const thick = thickness(cell);
  const pad = pathPad(cell);
  const straightY = rows + 0.5; // 격자 아래 한 줄

  // 펴진 길은 꺾여 있을 때보다 옆으로 길다. 그 길이에 판을 맞춰야 잘리지 않고,
  // 폭이 곧 다리 상판 폭이라 바로 아래 다리와 나란히 놓인다.
  // 남는 자리는 모눈을 계속 그려 채운다 — 선을 중간에서 끊으면 판이 깨져 보인다
  const gridCols = Math.max(cols, steps.length);
  const width = gridCols * cell;

  return (
    <div
      className="relative rounded-xl border-2 border-[var(--color-line)] bg-white"
      style={{ width: width + pad * 2, height: (rows + 1) * cell + pad * 2 }}
    >
      {/* 격자. 아주 옅게 — 길보다 눈에 띄면 무엇을 셀지 헷갈린다 */}
      <div className="absolute" style={{ left: pad, top: pad }} aria-hidden="true">
        {Array.from({ length: gridCols + 1 }, (_, i) => (
          <div key={`v${i}`} className="absolute top-0 w-px bg-[#e6eeef]" style={{ left: i * cell, height: rows * cell }} />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <div key={`h${i}`} className="absolute left-0 h-px bg-[#e6eeef]" style={{ top: i * cell, width }} />
        ))}
      </div>

      {steps.map((s, i) => {
        const horizontal = straight ? true : s.horizontal;
        const gx = straight ? i : s.x;
        const gy = straight ? straightY : s.y;
        return (
          <div
            key={i}
            className="absolute rounded-[3px] border border-[#0a565a] bg-[var(--color-accent)] transition-all duration-500 ease-out"
            style={{
              left: pad + gx * cell - (horizontal ? 0 : thick / 2),
              top: pad + gy * cell - (horizontal ? thick / 2 : 0),
              width: horizontal ? cell : thick,
              height: horizontal ? thick : cell,
              transitionDelay: `${i * 45}ms`,
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
