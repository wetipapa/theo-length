import { useState } from "react";
import { BlogLink } from "../components/BlogLink";
import { HubLink } from "../components/HubLink";
import { Button } from "../components/ui/Button";
import { LEVELS, type LevelId, type Settings } from "../config/gameConfig";
import { playTap, setHaptics, setSound, unlock } from "../lib/feedback";
import wetiSnap from "../assets/characters/weti-scene-snap.png";

interface HomeScreenProps {
  settings: Settings;
  bestScore: number;
  onChange: (next: Settings) => void;
  onStart: () => void;
}

type Panel = "settings" | "how" | null;

/**
 * 첫 화면. 형제 서비스의 표준을 그대로 따른다 —
 * 그림 → 이름 → 한 줄 설명 → 바로 시작 → 접힌 보조 버튼 둘 → 링크.
 *
 * 설명을 읽지 않아도 시작할 수 있어야 한다. 첫 문제가 곧 튜토리얼이다
 * (숫자로 목표를 알려주고 조각을 누르기만 하면 되는 `count` 문제부터 나온다).
 */
export function HomeScreen({ settings, bestScore, onChange, onStart }: HomeScreenProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <div className="theme-service flex h-full flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-6 safe-top safe-bottom">
      <div className="flex flex-col items-center gap-2">
        <img
          src={wetiSnap}
          alt="길이 조각을 이어 붙이는 아이"
          className="h-[20vh] max-h-44 w-auto"
          draggable={false}
        />
        <h1 className="text-3xl font-black text-[var(--color-ink)]">길이 척척</h1>
        <p className="text-sm font-bold text-[var(--color-ink-soft)]">조각을 이어 붙여 다리를 놓아요</p>
      </div>

      <Button
        size="xl"
        className="w-full max-w-xs"
        onClick={() => {
          unlock();
          setSound(settings.sound);
          setHaptics(settings.haptics);
          playTap();
          onStart();
        }}
        aria-label="바로 시작"
      >
        바로 시작
      </Button>

      <p className="-mt-2 text-xs font-bold text-[var(--color-ink-soft)]">
        {LEVELS[settings.level].label}
        {bestScore > 0 && ` · 최고 ${bestScore}점`}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="soft" size="sm" className="flex-1" onClick={() => toggle("settings")}>
            설정 바꾸기 {panel === "settings" ? "▴" : "▾"}
          </Button>
          <Button variant="soft" size="sm" className="flex-1" onClick={() => toggle("how")}>
            게임 방법 {panel === "how" ? "▴" : "▾"}
          </Button>
        </div>

        {panel === "settings" && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-3">
            <div>
              <p className="mb-1.5 text-xs font-black text-[var(--color-ink-soft)]">난이도</p>
              <div className="flex gap-1" role="group" aria-label="난이도">
                {(Object.keys(LEVELS) as LevelId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={settings.level === id}
                    onClick={() => {
                      playTap();
                      onChange({ ...settings, level: id });
                    }}
                    className={`min-h-11 flex-1 rounded-xl border-2 text-[13px] font-black transition-transform active:scale-95 ${
                      settings.level === id
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-line)] bg-white text-[var(--color-ink-soft)]"
                    }`}
                  >
                    {LEVELS[id].label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--color-ink-soft)]">
              {LEVELS[settings.level].hint}
            </p>
            <div className="flex flex-col gap-1.5">
              <Toggle
                label="효과음"
                on={settings.sound}
                onToggle={() => onChange({ ...settings, sound: !settings.sound })}
              />
              <Toggle
                label="진동"
                on={settings.haptics}
                onToggle={() => onChange({ ...settings, haptics: !settings.haptics })}
              />
            </div>
          </div>
        )}

        {panel === "how" && (
          <ol className="flex flex-col gap-1.5 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-4 text-sm font-bold text-[var(--color-ink-soft)]">
            <li>1. 다리에 빈 틈이 몇 칸인지 봐요</li>
            <li>2. 아래 조각을 눌러 <span className="text-[var(--color-accent)]">착</span> 붙여요</li>
            <li>3. 딱 맞으면 다리가 완성되고 수레가 건너요</li>
            <li>4. 잘못 놓았으면 그 조각을 눌러 빼면 돼요</li>
            <li>5. 수직선은 화살표로 눈금을 짚고, 두 줄이 나오면 똑같은 것을 눌러 지워요</li>
            <li className="text-[var(--color-ink)]">틀려도 끝나지 않아요. 맞을 때까지 고쳐도 괜찮아요</li>
          </ol>
        )}
      </div>

      <HubLink className="pt-1" />
      <BlogLink />
    </div>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        playTap();
        onToggle();
      }}
      className="flex min-h-11 items-center justify-between rounded-xl px-1 text-sm font-black text-[var(--color-ink)]"
    >
      {label}
      <span
        className={`inline-flex h-7 w-12 items-center rounded-full border-2 px-0.5 transition-colors ${
          on ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-line)] bg-white"
        }`}
      >
        <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
