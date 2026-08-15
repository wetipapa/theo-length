import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PieceBar } from "../components/PieceBar";
import { Ruler } from "../components/Ruler";
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
import type { Placed, Piece, RunResult } from "../types";

interface GameScreenProps {
  settings: Settings;
  bestScore: number;
  onEnd: (result: RunResult) => void;
  onQuit: () => void;
}

/**
 * 게임 화면.
 *
 * 한 가지 조작만 있다 — **트레이 조각을 다리 위로 끌어다 놓는다.**
 * 문제 종류가 다섯이지만 아이가 하는 일은 늘 같아서, 새 개념을 만나도 조작을 다시 배우지 않는다.
 *
 * 판정은 자동이다. 합이 목표와 같아지는 순간 바로 다리가 완성된다.
 * 버튼을 눌러 "확인"하게 만들면 맞혀 놓고도 한 단계를 더 거쳐야 해서 손맛이 죽는다.
 */
export function GameScreen({ settings, bestScore, onEnd, onQuit }: GameScreenProps) {
  const level = LEVELS[settings.level];
  const [problems] = useState(() => makeRun(level, Math.random));
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [score, setScore] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const [removedAny, setRemovedAny] = useState(false);
  const [crossing, setCrossing] = useState(false);
  const [shake, setShake] = useState(false);
  const [paused, setPaused] = useState(false);

  const bridgeRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(1);
  const problem = problems[round];
  const filled = sumUnits(placed);
  const remaining = problem.target - filled;

  // 한 칸의 픽셀 길이. 목표가 길어도 화면 밖으로 나가지 않게 폭에 맞춰 줄인다.
  // 이 값이 게임 안의 "1칸"이고, 실제 1cm가 아니다.
  const [boxWidth, setBoxWidth] = useState(340);
  useEffect(() => {
    const el = bridgeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const unitPx = useMemo(() => {
    // 자가 나오는 문제만 자 길이에 맞춘다. 안 나오는데 자 길이로 재면
    // 다리가 쓸데없이 작아져 조각을 누르기도 세기도 어렵다.
    const widest = problem.onRuler ? problem.rulerSpan : problem.target;
    return Math.max(14, Math.min(46, Math.floor((boxWidth - 12) / widest)));
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

  /** 조각을 다리에 올린다. 남은 틈보다 길면 들어가지 않는다 */
  const place = useCallback(
    (piece: Piece) => {
      if (crossing || paused) return;
      if (piece.units > remaining) {
        // 벌점 없이 되돌린다. 틀린 게 아니라 "이건 안 들어간다"를 보여 줄 뿐이다
        playTooLong();
        setShake(true);
        window.setTimeout(() => setShake(false), 360);
        return;
      }

      const next = [...placed, { key: nextKey.current++, ...piece }];
      setPlaced(next);
      playSnap(next.length - 1);

      if (sumUnits(next) !== problem.target) return;

      // 딱 맞았다 — 다리가 완성되고 수레가 건넌다
      const gained = RULES.baseScore + (removedAny ? 0 : RULES.perfectBonus);
      const nextScore = score + gained;
      const nextPerfect = perfect + (removedAny ? 0 : 1);
      setScore(nextScore);
      setPerfect(nextPerfect);
      setCrossing(true);
      playComplete();
      window.setTimeout(playCross, 220);

      window.setTimeout(() => {
        if (round + 1 >= problems.length) {
          finish(nextScore, nextPerfect);
          return;
        }
        setRound((r) => r + 1);
        setPlaced([]);
        setRemovedAny(false);
        setCrossing(false);
      }, 1700);
    },
    [crossing, paused, remaining, placed, problem.target, removedAny, score, perfect, round, problems.length, finish],
  );

  /** 놓은 조각을 도로 빼낸다. 언제든 고칠 수 있어야 한다 */
  const remove = useCallback(
    (key: number) => {
      if (crossing || paused) return;
      setPlaced((prev) => prev.filter((p) => p.key !== key));
      setRemovedAny(true);
      playUndo();
    },
    [crossing, paused],
  );

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

      <p className="mx-4 mt-2 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-4 py-2.5 text-center text-sm font-black text-[var(--color-ink)]">
        {problem.prompt}
      </p>

      <div ref={bridgeRef} className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-3">

        {/* 재야 할 자 — measure·offset 문제에만 나온다 */}
        {problem.onRuler && (
          <div className="relative z-10">
            <Ruler span={problem.rulerSpan} unitPx={unitPx} object={problem.onRuler} />
          </div>
        )}

        {/* 다리. 왼쪽 언덕에서 오른쪽 언덕까지 정확히 목표 길이만큼 비어 있다.
            아래로 계곡을 깔아 왜 다리를 놓는지가 보이게 한다 — 빈 여백으로 두면
            그냥 조각 맞추기가 되고, 수레가 건너는 장면도 밋밋해진다 */}
        <p
          className="text-center text-sm font-black text-[var(--color-accent-deep)]"
          aria-live="polite"
        >
          {crossing ? "건넜다!" : remaining > 0 ? `${remaining}칸 더 필요해요` : "딱 맞았어요!"}
        </p>

        <div className={`relative z-10 ${shake ? "animate-[shake_0.36s_ease-in-out]" : ""}`}>
          <div
            className="pointer-events-none absolute left-9 right-9 top-9 -z-10 rounded-b-[40px] bg-gradient-to-b from-[#bfe3ea] to-[#8ec9d4]"
            style={{ height: 86 }}
            aria-hidden="true"
          />
          <div className="flex items-end">
            <div className="h-14 w-9 rounded-l-lg bg-[#8a6a4a] shadow-[0_4px_0_#6b5138]" />
            <div
              className="relative flex h-14 items-center border-y-[3px] border-dashed border-[var(--color-accent-soft)] bg-[var(--color-accent-tint)]"
              style={{ width: problem.target * unitPx }}
            >
              {placed.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => remove(p.key)}
                  aria-label={`${p.units}칸 조각 빼기`}
                  className="animate-[pop-in_0.22s_ease-out]"
                >
                  <PieceBar units={p.units} color={p.color} ticks={p.ticks} unitPx={unitPx} />
                </button>
              ))}
              {/* 수레 — 다리가 완성되면 달려 건넌다 */}
              {crossing && (
                <span
                  className="absolute -top-8 text-3xl animate-[cross_1.5s_ease-in-out_forwards]"
                  aria-hidden="true"
                >
                  🛻
                </span>
              )}
            </div>
            <div className="h-14 w-9 rounded-r-lg bg-[#8a6a4a] shadow-[0_4px_0_#6b5138]" />
          </div>

        </div>
      </div>

      {/* 조각 트레이 */}
      <div className="border-t-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-3 safe-bottom">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {problem.tray.map((piece) => (
            <button
              key={piece.id}
              type="button"
              onClick={() => place(piece)}
              disabled={crossing}
              aria-label={`${piece.units}칸 조각 놓기`}
              className="transition-transform active:scale-95 disabled:opacity-40"
            >
              <PieceBar
                units={piece.units}
                color={piece.color}
                ticks={piece.ticks}
                unitPx={unitPx}
                dimmed={piece.units > remaining}
              />
            </button>
          ))}
        </div>
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
