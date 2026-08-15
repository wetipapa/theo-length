import { DEFAULT_SETTINGS, type Settings } from "../config/gameConfig";

/**
 * localStorage 안전 래퍼.
 *
 * 시크릿 모드·용량 초과·JSON 깨짐 등 어떤 이유로도 게임이 멈추지 않게 한다.
 * 기록을 못 읽으면 처음 하는 것처럼 시작하면 될 뿐, 흰 화면을 보여 줄 일은 아니다.
 * 서버에 보내는 것은 없다 — 기록은 이 기기 안에만 남는다.
 */
const KEY = "wtpp-length-snap:v1";

interface Record {
  bestScore: number;
  settings: Settings;
}

const EMPTY: Record = { bestScore: 0, settings: DEFAULT_SETTINGS };

export function load(): Record {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Record>;
    return {
      bestScore: typeof parsed.bestScore === "number" ? parsed.bestScore : 0,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return EMPTY;
  }
}

export function save(record: Record) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* 저장에 실패해도 게임은 계속된다 */
  }
}

export function saveSettings(settings: Settings) {
  const current = load();
  save({ ...current, settings });
}

export function saveScore(score: number) {
  const current = load();
  if (score > current.bestScore) save({ ...current, bestScore: score });
}
