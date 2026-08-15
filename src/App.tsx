import { useCallback, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ResultScreen } from "./screens/ResultScreen";
import type { Settings } from "./config/gameConfig";
import { setHaptics, setSound } from "./lib/feedback";
import { load, saveScore, saveSettings } from "./lib/storage";
import type { RunResult } from "./types";

type Screen = "home" | "game" | "result";

function App() {
  const [record, setRecord] = useState(() => load());
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<RunResult | null>(null);
  // 한 판을 새로 시작할 때 GameScreen을 통째로 새로 만든다.
  // 엔진 안의 상태를 하나씩 되돌리는 것보다 확실하고, 되돌리다 빠뜨릴 것도 없다.
  const [runId, setRunId] = useState(0);

  const changeSettings = useCallback((next: Settings) => {
    setRecord((prev) => ({ ...prev, settings: next }));
    saveSettings(next);
    setSound(next.sound);
    setHaptics(next.haptics);
  }, []);

  const start = useCallback(() => {
    setRunId((n) => n + 1);
    setScreen("game");
  }, []);

  const end = useCallback((r: RunResult) => {
    saveScore(r.score);
    setResult(r);
    setRecord(load());
    setScreen("result");
  }, []);

  return (
    <div className="h-viewport flex w-full justify-center bg-[#e9dcc3]">
      <div className="relative h-full w-full max-w-md overflow-hidden bg-[var(--color-cream)] shadow-2xl">
        {screen === "home" && (
          <HomeScreen
            settings={record.settings}
            bestScore={record.bestScore}
            onChange={changeSettings}
            onStart={start}
          />
        )}
        {screen === "game" && (
          <GameScreen
            key={runId}
            settings={record.settings}
            bestScore={record.bestScore}
            onEnd={end}
            onQuit={() => setScreen("home")}
          />
        )}
        {screen === "result" && result && (
          <ResultScreen
            result={result}
            bestScore={record.bestScore}
            onRetry={start}
            onHome={() => setScreen("home")}
          />
        )}
      </div>
      {/* 방문 통계. 개인을 식별하지 않고, 아이의 기록은 여전히 이 기기 안에만 남는다 */}
      <Analytics />
    </div>
  );
}

export default App;
