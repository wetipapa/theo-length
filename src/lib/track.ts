import { track } from "@vercel/analytics";

/**
 * 게임에서 세는 것은 **셋뿐이다.**
 *
 * 방문자 수만 보면 게임이 되는지 안 되는지 알 수 없다. 들어와서 그냥 나간 사람과
 * 세 판을 하고 나간 사람이 똑같이 1로 잡히기 때문이다.
 *
 *   start     첫 화면이 제 역할을 하는가 — 들어와서 실제로 시작을 누르는가
 *   complete  난이도가 맞는가 — 한 판을 끝까지 가는가
 *   replay    재미있는가 — 끝나고 한 번 더 누르는가
 *
 * **더 늘리지 않는다.** 이벤트가 많아지면 아무도 안 본다.
 * 개발 중에는 아무 일도 하지 않고, 배포된 곳에서만 전송된다.
 */
export const trackStart = () => track("game_start");
export const trackComplete = () => track("game_complete");
export const trackReplay = () => track("game_replay");
