/**
 * 웨티아빠 블로그로 가는 링크.
 *
 * 아이가 노는 화면을 방해하지 않는 자리(첫 화면 맨 아래, 결과 화면)에만 둔다.
 * 게임 중에는 띄우지 않는다 — 이 게임을 아이 손에 쥐여 준 부모가 보는 자리다.
 * 형제 서비스가 같은 문구와 같은 자리를 쓴다.
 */
export function BlogLink({ className = "" }: { className?: string }) {
  // 한 줄로 두면 좁은 폰에서 어중간한 자리에 접히거나 잘린다.
  // 의미 단위(어디서 / 무엇을)로 끊어 두 줄로 고정한다.
  return (
    <p className={`text-center text-xs font-bold leading-relaxed text-[var(--color-ink-soft)] ${className}`}>
      <span className="block">
        <a
          href="https://blog.naver.com/wetipapa"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-2 underline-offset-4 hover:text-[var(--color-ink)]"
        >
          ✍️ 웨티아빠 블로그
        </a>
        에서
      </span>
      <span className="block">아들 웨티와 함께하는 소소한 일상을 만나요</span>
    </p>
  );
}
