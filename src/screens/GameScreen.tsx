import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BentPath, pathPad } from "../components/BentPath";
import { BANK_W, RIVER_H, BridgeScene } from "../components/BridgeScene";
import { NumberLine } from "../components/NumberLine";
import { PairRows } from "../components/PairRows";
import { PieceBar } from "../components/PieceBar";
import { Ruler } from "../components/Ruler";
import { SegmentArcs } from "../components/SegmentArcs";
import { Button } from "../components/ui/Button";
import { LEVELS, RULES, type Settings } from "../config/gameConfig";
import {
  playComplete,
  playCross,
  playFinish,
  playSnap,
  playTap,
  playTooLong,
  playUndo,
} from "../lib/feedback";
import { makeRun, sumUnits } from "../lib/problems";
import type { ItemBlock, Placed, Piece, RunResult } from "../types";

/** 다리 양쪽 언덕의 폭(px). BridgeScene의 BANK_W를 그대로 쓴다 */
const ABUTMENT = BANK_W;

interface GameScreenProps {
  settings: Settings;
  bestScore: number;
  onEnd: (result: RunResult) => void;
  onQuit: () => void;
}

/**
 * 게임 화면.
 *
 * 문제 종류가 열둘이지만 **조작은 둘뿐이다.**
 * 대부분은 트레이 조각을 눌러 틈을 채우고, 수직선 문제만 눈금을 짚는다.
 * 새 개념을 만날 때마다 조작을 다시 배우게 하지 않으려고 이렇게 묶었다.
 *
 * 판정은 자동이다. 딱 맞는 순간 바로 완성된다.
 * "확인" 버튼을 두면 맞혀 놓고도 한 단계를 더 거쳐야 해서 손맛이 죽는다.
 */
export function GameScreen({ settings, bestScore, onEnd, onQuit }: GameScreenProps) {
  const level = LEVELS[settings.level];
  const [problems] = useState(() => makeRun(level, Math.random, settings.level));
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [score, setScore] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const [missed, setMissed] = useState(false);
  const [crossing, setCrossing] = useState(false);
  const [shake, setShake] = useState(false);
  const [paused, setPaused] = useState(false);
  /** 두 줄 견주기에서 이미 지운 물건들 */
  const [cleared, setCleared] = useState<Set<number>>(() => new Set());

  const bridgeRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(1);
  const problem = problems[round];
  const filled = sumUnits(placed);
  const remaining = problem.target - filled;

  // 수직선 문제에서 아이가 짚고 있는 자리. 왼쪽 수에서 시작한다.
  // 문제가 바뀔 때 같이 옮긴다 — effect로 맞추면 한 프레임 동안 지난 문제의 자리가 그려진다
  const [marker, setMarker] = useState(() => problems[0].numberLine?.a ?? 0);

  // 한 칸의 픽셀 길이. 목표가 길어도 화면 밖으로 나가지 않게 폭에 맞춰 줄인다.
  // 이 값이 게임 안의 "1칸"이고, 실제 1cm가 아니다.
  const [box, setBox] = useState({ w: 340, h: 460 });
  useEffect(() => {
    const el = bridgeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const boxWidth = box.w;

  /**
   * 강의 깊이.
   *
   * 화면이 길면 문제·판·조각이 가운데 몰리고 위아래로 크림색 여백만 남는다.
   * 남는 세로 자리를 강이 가져가게 해서, 빈 곳을 줄이면서 장면도 시원해진다.
   *
   * 다만 깊게 팔수록 판이 위로 밀려 조각 트레이와 멀어진다. 이 게임은 판과 조각을
   * 번갈아 보는 게임이라 그게 더 손해다. 그래서 상한을 낮게 잡았다.
   */
  const riverH = Math.round(Math.max(RIVER_H, Math.min(140, (box.h - 320) * 0.5)));

  const unitPx = useMemo(() => {
    // 화면에 나오는 것 중 **가장 넓은 것**에 맞춘다. 하나만 보고 정하면 나머지가 넘친다 —
    // 다리는 양쪽 교대(각 36px)까지 자리를 먹는데 그걸 빼먹으면 다리 끝이 화면 밖으로 나간다.
    const avail = boxWidth - 12;
    const limits: number[] = [];
    if (!problem.numberLine) {
      const bridge = problem.line ? problem.line.span : problem.target;
      limits.push((avail - ABUTMENT * 2) / bridge);
    }
    if (problem.onRuler) limits.push(avail / problem.rulerSpan);
    if (problem.numberLine) limits.push(avail / problem.numberLine.span);
    if (problem.path) limits.push((avail - ABUTMENT * 2) / problem.path.cols);
    if (problem.pair) limits.push(avail / sumUnits(problem.pair.top));
    return Math.max(13, Math.min(46, Math.floor(Math.min(...limits))));
  }, [boxWidth, problem]);

  const finish = useCallback(
    (finalScore: number, finalPerfect: number) => {
      playFinish();
      onEnd({
        score: finalScore,
        solved: problems.length,
        perfect: finalPerfect,
        isBest: finalScore > bestScore,
      });
    },
    [bestScore, onEnd, problems.length],
  );

  /** 양쪽에 겹치는 물건이 아직 남아 있는가 */
  const pairSettled =
    !problem.pair ||
    !problem.pair.top.some(
      (t) =>
        !cleared.has(t.id) &&
        problem.pair!.bottom.some((b) => b.kind === t.kind && !cleared.has(b.id)),
    );

  /** 맞혔다. 점수를 주고 다음 문제로 넘긴다 */
  const solve = useCallback(() => {
    const gained = RULES.baseScore + (missed ? 0 : RULES.perfectBonus);
    const nextScore = score + gained;
    const nextPerfect = perfect + (missed ? 0 : 1);
    setScore(nextScore);
    setPerfect(nextPerfect);
    setCrossing(true);
    playComplete();
    window.setTimeout(playCross, 220);

    // 짚어 주는 말이 있으면 조금 더 머문다. 관계를 읽을 틈은 줘야 한다
    window.setTimeout(
      () => {
        if (round + 1 >= problems.length) {
          finish(nextScore, nextPerfect);
          return;
        }
        setRound((r) => r + 1);
        setMarker(problems[round + 1].numberLine?.a ?? 0);
        setCleared(new Set());
        setPlaced([]);
        setMissed(false);
        setCrossing(false);
      },
      problem.note ? 2600 : 1700,
    );
  }, [missed, score, perfect, round, problems, finish, problem.note]);

  /** 헛짚었다. 벌점은 없고 보너스만 놓친다 */
  const wobble = useCallback(() => {
    playTooLong();
    setShake(true);
    window.setTimeout(() => setShake(false), 360);
  }, []);

  /**
   * 조각을 다리에 올린다.
   *
   * `slots` 문제는 틈이 똑같은 칸으로 나뉘어 있고, **한 칸에 딱 맞는 조각만** 들어간다.
   * 예전에는 조각 하나를 누르면 정해진 개수가 한꺼번에 놓였는데,
   * 한 번 눌러서 답이 되니 생각할 것이 없었다.
   */
  const place = useCallback(
    (piece: Piece) => {
      if (crossing || paused || !pairSettled) return;
      const slotSize = problem.slots ? problem.target / problem.slots : null;
      if (slotSize !== null ? piece.units !== slotSize : piece.units > remaining) {
        // 벌점 없이 되돌린다. 틀린 게 아니라 "이건 안 들어간다"를 보여 줄 뿐이다
        wobble();
        return;
      }

      const next = [...placed, { key: nextKey.current++, ...piece }];
      setPlaced(next);
      playSnap(next.length - 1);
      if (sumUnits(next) === problem.target) solve();
    },
    [crossing, paused, pairSettled, problem.slots, problem.target, remaining, placed, wobble, solve],
  );

  /**
   * 놓은 조각을 도로 빼낸다. 언제든 고칠 수 있어야 한다.
   *
   */
  const remove = useCallback(
    (key: number) => {
      if (crossing || paused) return;
      setPlaced((prev) => prev.filter((p) => p.key !== key));
      setMissed(true);
      playUndo();
    },
    [crossing, paused],
  );

  /** 수직선에서 짚는 자리를 옮긴다. 옮길 때마다 양쪽 거리가 다시 보인다 */
  const step = useCallback(
    (dir: -1 | 1) => {
      if (crossing || paused || !problem.numberLine) return;
      const { span, a, b } = problem.numberLine;
      const next = Math.max(0, Math.min(span, marker + dir));
      setMarker(next);
      playTap();
      if (a !== undefined && b !== undefined && next !== a && next !== b) {
        if (Math.abs(next - a) === Math.abs(next - b)) solve();
      }
    },
    [crossing, paused, problem.numberLine, marker, solve],
  );

  /**
   * 양쪽에 똑같이 들어 있는 물건을 지운다.
   *
   * 짝이 없는 것을 누르면 흔들리기만 한다 — **지울 수 있는 건 양쪽에 다 있는 것뿐**이라는
   * 규칙 자체가 이 문제에서 배울 내용이라, 눌러 보고 알게 두는 편이 낫다.
   */
  const cancel = useCallback(
    (block: ItemBlock, row: "top" | "bottom") => {
      if (crossing || paused || !problem.pair) return;
      const other = (row === "top" ? problem.pair.bottom : problem.pair.top).find(
        (b) => b.kind === block.kind && !cleared.has(b.id),
      );
      if (!other) {
        wobble();
        return;
      }
      setCleared(new Set([...cleared, block.id, other.id]));
      playUndo();
    },
    [crossing, paused, problem.pair, cleared, wobble],
  );

  /** 빠진 수 고르기 */
  const choose = useCallback(
    (n: number) => {
      if (crossing || paused) return;
      if (n === problem.target) {
        solve();
        return;
      }
      setMissed(true);
      wobble();
    },
    [crossing, paused, problem.target, solve, wobble],
  );

  const line = problem.line;
  const gapFrom = line ? line.gap.from : 0;

  /**
   * 문제 아래 한 줄로 붙는 보조 안내.
   *
   * **평소에는 아무것도 띄우지 않는다.** 예전에는 늘 초록 글씨 한 줄이 떠 있었는데,
   * `8칸짜리 다리를 놓아요` 바로 밑에 `8칸 더 필요해요`가 나오는 식이라
   * 문제를 두 번 읽는 꼴이었다. 조각을 눌러 보면 알 것을 굳이 적고 있었다.
   *
   * 조작이 평소와 다른 판에서만 한 줄 쓴다.
   */
  const hint = problem.pair && !pairSettled
    ? "위아래에 똑같이 있는 것을 눌러 지워요"
    : problem.numberLine?.a !== undefined
      ? "화살표로 옮기며 양쪽 거리가 같아지는 자리를 찾아요"
      : problem.numberLine
        ? "눈금 사이가 얼마씩인지 보세요"
        : null;

  return (
    <div className="flex h-full flex-col bg-[var(--color-cream)]">
      <header className="flex items-center justify-between px-4 pt-3 safe-top">
        <button
          type="button"
          onClick={() => {
            playTap();
            setPaused(true);
          }}
          aria-label="잠깐 멈추기"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--color-line)] bg-white text-lg font-black text-[var(--color-ink-soft)] shadow-[0_3px_0_var(--color-line-deep)]"
        >
          ‖
        </button>
        <p className="text-sm font-black text-[var(--color-ink-soft)]">
          {round + 1} / {problems.length}
        </p>
        <p className="text-xl font-black text-[var(--color-ink)]">{score}</p>
      </header>

      <div
        ref={bridgeRef}
        // 남는 세로 자리를 위 2 : 아래 1로 나눈다. 반씩 나누면 판이 조각 트레이에서
        // 멀어지는데, 이 게임은 판과 조각을 번갈아 보는 게임이라 아래쪽이 가까워야 한다
        className="relative flex min-h-0 flex-1 flex-col items-center gap-2 overflow-hidden px-3 pb-2"
      >
        <div className="flex-[2] shrink" aria-hidden="true" />
        {/* 문제. 판과 한 덩어리로 묶어 가운데 정렬한다 —
            맨 위에 붙여 두면 남는 세로 공간이 전부 문제와 판 사이로 몰려
            둘이 상관없는 것처럼 멀어진다.

            맞히면 이 카드가 그대로 칭찬 자리가 된다. 따로 띄우면 눈이 두 군데를 봐야 한다 */}
        <div
          className={`relative mb-1 w-full max-w-sm rounded-2xl border-2 px-4 pb-3 pt-4 transition-colors ${
            crossing
              ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)] shadow-[0_3px_0_var(--color-accent-soft)]"
              : "border-[var(--color-accent-soft)] bg-white shadow-[0_3px_0_var(--color-accent-tint)]"
          }`}
          aria-live="polite"
        >
          <span className="absolute -top-2.5 left-4 rounded-full bg-[var(--color-accent)] px-2.5 text-[11px] font-black leading-[20px] text-white">
            {crossing ? "잘했어요" : `문제 ${round + 1}`}
          </span>
          <p className="text-center text-lg font-black leading-snug text-[var(--color-ink)]">
            {crossing ? (problem.note ?? "다리를 건넜어요!") : problem.prompt}
          </p>
          {!crossing && hint && (
            <p className="mt-1 text-center text-xs font-bold text-[var(--color-accent-deep)]">{hint}</p>
          )}
        </div>

        {/* 재야 할 자        {/* 재야 할 자 — measure·offset 문제에만 나온다 */}
        {problem.onRuler && (
          <div className="relative z-10">
            <Ruler span={problem.rulerSpan} unitPx={unitPx} object={problem.onRuler} kind={problem.rulerObject} />
          </div>
        )}

        {/* 꺾인 길 — 맞히면 아래 한 줄로 쭉 펴진다.
            다리와 같은 눈금으로, 다리 상판이 시작하는 자리에 왼쪽을 맞춰 놓는다.
            펴진 길이 바로 아래 아이가 놓은 다리와 나란해야 "길이는 그대로"가 눈에 들어온다 */}
        {problem.path && (
          <div
            style={{
              // 다리와 **같은 폭**이어야 한다. 둘 다 가운데 정렬이라 폭이 다르면 왼쪽 끝이 어긋나고,
              // 그러면 길이 펴져도 다리와 나란해 보이지 않아 이 문제의 요점이 사라진다
              width: problem.target * unitPx + ABUTMENT * 2,
              paddingLeft: ABUTMENT - pathPad(unitPx),
            }}
          >
            <BentPath
              cols={problem.path.cols}
              rows={problem.path.rows}
              vertices={problem.path.vertices}
              cell={unitPx}
              straight={crossing}
            />
          </div>
        )}

        {/* 두 줄 견주기 */}
        {problem.pair && (
          <PairRows
            top={problem.pair.top}
            bottom={problem.pair.bottom}
            unknown={problem.pair.unknown}
            unitPx={unitPx}
            cleared={cleared}
            onTap={cancel}
          />
        )}

        {/* 수직선 */}
        {problem.numberLine && (
          <div className="relative z-10">
            <NumberLine
              span={problem.numberLine.span}
              step={problem.numberLine.step}
              unitPx={unitPx}
              a={problem.numberLine.a}
              b={problem.numberLine.b}
              hidden={crossing ? undefined : problem.numberLine.hidden}
              marker={problem.numberLine.a !== undefined ? marker : undefined}
            />
          </div>
        )}

        {/* 다리. 선분 문제에서는 이미 놓인 구간까지 함께 그리고, 빈 구간만 채운다.
            아래로 계곡을 깔아 왜 다리를 놓는지가 보이게 한다 — 빈 여백으로 두면
            그냥 조각 맞추기가 되고, 수레가 건너는 장면도 밋밋해진다 */}
        {!problem.numberLine && (
          <div
            // 위쪽 여백은 수레가 상판에 올라설 자리다. 없으면 수레가 문제 카드를 파고든다
            className={`relative z-10 w-full pt-11 ${shake ? "animate-[shake_0.36s_ease-in-out]" : ""}`}
          >
            {/* 호는 흐름 안에 둔다. 예전에는 다리 위에 띄워 뒀는데,
                자리를 차지하지 않으니 위쪽 안내 문구와 겹쳐서 둘 다 못 읽었다 */}
            {line && (
              <div style={{ paddingLeft: ABUTMENT }}>
                <SegmentArcs arcs={line.arcs} unitPx={unitPx} />
              </div>
            )}

            {/* 선분 위의 점 */}
            {line && (
              <div className="relative h-5" style={{ marginLeft: ABUTMENT, width: line.span * unitPx }}>
                {line.posts.map((p) => (
                  <span
                    key={p.label}
                    className="absolute bottom-0 -translate-x-1/2 rounded-full border-2 border-[var(--color-line-deep)] bg-white px-1.5 text-[11px] font-black leading-[16px] text-[var(--color-ink)]"
                    style={{ left: p.at * unitPx }}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            )}

            <BridgeScene deckWidth={(line ? line.span : problem.target) * unitPx} riverH={riverH}>
              <div className="relative h-full">
                {/* 이미 놓여 있는 구간. 눈금을 그리지 않는다 —
                    칸을 셀 수 있으면 위쪽 숫자를 볼 이유가 없어진다 */}
                {line?.filled.map((f) => (
                  <div
                    key={f.from}
                    className="absolute top-0 h-full rounded-sm border-y-[3px] border-[#6b5138] bg-[#c9a879]"
                    style={{ left: f.from * unitPx, width: (f.to - f.from) * unitPx }}
                    aria-hidden="true"
                  />
                ))}

                {/* 채워야 할 틈 */}
                <div
                  // 틈은 비워 둔다. 예전에는 물빛으로 칠해서 "비었다"가 아니라
                  // "물이 차 있다"로 읽혔다
                  className="absolute top-0 flex h-full items-center rounded-sm border-y-[3px] border-dashed border-[var(--color-accent-soft)] bg-[#fffaf0cc]"
                  style={{ left: gapFrom * unitPx, width: problem.target * unitPx }}
                >
                  {/* 나뉜 칸. 12칸이 세 칸으로 갈린 걸 보고 그 한 칸에 맞는 조각을
                      찾는 것이 곧 나눗셈이다 */}
                  {problem.slots &&
                    Array.from({ length: problem.slots - 1 }, (_, i) => (
                      <span
                        key={i}
                        className="pointer-events-none absolute top-0 h-full w-[3px] -translate-x-1/2 rounded bg-[var(--color-accent-soft)]"
                        style={{ left: `${((i + 1) / problem.slots!) * 100}%` }}
                        aria-hidden="true"
                      />
                    ))}

                  {placed.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => remove(p.key)}
                      aria-label={`${p.units}칸 조각 빼기`}
                      className="animate-[pop-in_0.22s_ease-out]"
                    >
                      <PieceBar
                        units={p.units}
                        color={p.color}
                        ticks={p.ticks}
                        showLabel={p.label}
                        unitPx={unitPx}
                      />
                    </button>
                  ))}
                  {/* 수레 — 다리가 완성되면 달려 건넌다 */}
                  {crossing && (
                    <span
                      // 수레 그림이 왼쪽을 보고 있어서 뒤집어 준다.
                      // 안 뒤집으면 오른쪽으로 가면서 후진하는 것처럼 보인다
                      className="absolute -top-10 z-20 scale-x-[-1] text-5xl animate-[cross_1.5s_ease-in-out_forwards]"
                      aria-hidden="true"
                    >
                      🛻
                    </span>
                  )}
                </div>
              </div>

            </BridgeScene>
          </div>
        )}
        <div className="flex-[1] shrink" aria-hidden="true" />
      </div>

      {/* 아래 칸. 문제에 따라 조각 트레이 · 수직선 조작 · 고를 수가 들어온다 */}
      <div className="shrink-0 border-t-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-3 safe-bottom">
        {problem.numberLine?.a !== undefined ? (
          <div className="flex items-center justify-center gap-4">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => step(dir)}
                disabled={crossing}
                aria-label={dir < 0 ? "왼쪽으로 한 칸" : "오른쪽으로 한 칸"}
                className="flex h-14 w-24 items-center justify-center rounded-2xl border-2 border-[var(--color-line)] bg-white text-2xl font-black text-[var(--color-ink)] shadow-[0_4px_0_var(--color-line-deep)] transition-transform active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-line-deep)] disabled:opacity-40"
              >
                {dir < 0 ? "◀" : "▶"}
              </button>
            ))}
          </div>
        ) : problem.choices ? (
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {problem.choices.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => choose(n)}
                disabled={crossing}
                className="h-14 w-16 rounded-2xl border-2 border-[var(--color-line)] bg-white text-xl font-black text-[var(--color-ink)] shadow-[0_4px_0_var(--color-line-deep)] transition-transform active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-line-deep)] disabled:opacity-40"
              >
                {n}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {problem.tray.map((piece) => (
              <button
                key={piece.id}
                type="button"
                onClick={() => place(piece)}
                disabled={crossing || !pairSettled}
                aria-label={`${piece.units}칸 조각 놓기`}
                className="transition-transform active:scale-95 disabled:opacity-40"
              >
                <PieceBar
                  units={piece.units}
                  color={piece.color}
                  ticks={piece.ticks}
                  showLabel={piece.label}
                  unitPx={unitPx}
                  // 목표를 알려주는 문제에서만 흐리게 한다. 아니면 5는 흐린데 4는 아닌 것만으로
                  // 남은 칸이 4라고 알려주는 셈이 된다. 대 봤다가 안 들어가는 건 벌점이 없다
                  dimmed={problem.tellsTarget && !problem.slots && piece.units > remaining}
                />
              </button>
            ))}
          </div>
        )}

      </div>

      {paused && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#4a3626cc] px-8">
          <p className="text-2xl font-black text-white">잠깐 멈췄어요</p>
          <Button size="lg" className="w-full max-w-xs" onClick={() => { playTap(); setPaused(false); }}>
            이어서 하기
          </Button>
          <Button variant="soft" size="md" className="w-full max-w-xs" onClick={() => { playTap(); onQuit(); }}>
            그만하기
          </Button>
        </div>
      )}
    </div>
  );
}
