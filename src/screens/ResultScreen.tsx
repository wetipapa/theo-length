import { useState } from "react";
import { BlogLink } from "../components/BlogLink";
import { HubLink } from "../components/HubLink";
import { Button } from "../components/ui/Button";
import { playTap } from "../lib/feedback";
import { buildResultImage, saveResultImage } from "../lib/resultImage";
import type { RunResult } from "../types";
import wetiProud from "../assets/characters/weti-proud.png";
import wetiHappy from "../assets/characters/weti-happy.png";
import wetiIdle from "../assets/characters/weti-idle.png";

interface ResultScreenProps {
  result: RunResult;
  bestScore: number;
  onRetry: () => void;
  onHome: () => void;
}

/**
 * 끝 화면. 형제 서비스와 같은 골격이다.
 *
 * 틀린 횟수를 세어 보여주지 않는다. 이 게임은 애초에 틀려서 끝나지 않고,
 * 되돌려 고치는 것도 길이를 재는 과정이라 벌할 일이 아니다.
 * 대신 "한 번에 놓은 다리"를 세어 다시 해볼 이유를 만든다.
 */
export function ResultScreen({ result, bestScore, onRetry, onHome }: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const savePhoto = async () => {
    playTap();
    setSaving(true);
    setSaved(null);
    try {
      const blob = await buildResultImage(result, bestScore);
      if (!blob) {
        setSaved("저장하지 못했어요");
        return;
      }
      const outcome = await saveResultImage(blob, `길이척척_${result.score}점.png`);
      setSaved(outcome === "failed" ? "저장하지 못했어요" : "사진으로 저장했어요!");
    } catch {
      setSaved("저장하지 못했어요");
    } finally {
      setSaving(false);
    }
  };

  const face = result.isBest ? wetiProud : result.perfect > 0 ? wetiHappy : wetiIdle;
  const headline = result.isBest ? "새 최고 기록이에요!" : "다리를 다 놓았어요!";

  return (
    <div className="theme-service flex h-full flex-col items-center justify-center gap-4 overflow-y-auto px-5 py-6 safe-top safe-bottom">
      <img
        src={face}
        alt=""
        aria-hidden="true"
        className="h-24 w-24 rounded-full border-4 border-[var(--color-accent-soft)] bg-white object-cover"
      />

      <div className="text-center">
        <p className="text-sm font-black text-[var(--color-ink-soft)]">{headline}</p>
        <p className="text-5xl font-black text-[var(--color-ink)]">{result.score}</p>
        <p className="text-xs font-bold text-[var(--color-ink-soft)]">
          최고 {Math.max(bestScore, result.score)}점
        </p>
      </div>

      <div className="grid w-full max-w-xs grid-cols-2 gap-2">
        <Stat label="놓은 다리" value={`${result.solved}개`} />
        <Stat label="한 번에 놓기" value={`${result.perfect}개`} />
      </div>

      {saved && (
        <p className="text-sm font-black text-[var(--color-accent-deep)]" role="status">
          {saved}
        </p>
      )}

      <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <Button size="xl" onClick={() => { playTap(); onRetry(); }}>
          한 번 더 하기
        </Button>
        <Button variant="soft" size="md" onClick={savePhoto} disabled={saving}>
          {saving ? "사진 만드는 중…" : "기록 사진으로 저장"}
        </Button>
        <Button variant="soft" size="sm" onClick={() => { playTap(); onHome(); }}>
          설정 바꾸기
        </Button>
        <HubLink className="pt-1" />
        <BlogLink />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2.5 text-center">
      <p className="text-[11px] font-black text-[var(--color-ink-soft)]">{label}</p>
      <p className="text-lg font-black text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
