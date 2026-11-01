// 데스크톱 모드 설정 — 홈(/)을 「부팅 → 데스크톱」 화면으로 쓴다.
// 끄고 싶으면 DESKTOP_MODE 를 false 로 (전체 끄기). 방문자 한 명만 잠깐 끄려면 주소 뒤에 ?classic=1 (되돌리기: ?desktop=1)

export const DESKTOP_MODE = true;

/** 부팅 화면 줄 — 자유롭게 고쳐도 된다. {TITLE} 은 환경설정의 사이트 제목으로 바뀐다 */
export const BOOT_LINES = [
  '{TITLE} PERSONAL NODE / 1.0',
  'MEMORY INTEGRITY ................. 100%',
  'ARCHIVE LINK ..................... ESTABLISHED',
  'THEME PROFILE .................... LOADED',
  'MEMBER GATE ...................... STANDBY',
  'EXTERNAL NETWORK ................. ONLINE',
];

/** 세션 동안 기억하는 값 — 탭을 닫으면 처음부터 다시 부팅 */
export const FLAG_BOOTED = 'ohome.desktop.booted';    // 부팅 화면을 본 적 있음
export const FLAG_ENTERED = 'ohome.desktop.entered';   // 로그인(또는 게스트 입장)까지 마침
export const FLAG_CLASSIC = 'ohome.desktop.classic';   // 이 탭은 기존 홈으로 보기

/** 아이콘 글리프 — 메뉴 주소별. 없으면 이름 첫 글자 */
const GLYPHS: Record<string, string> = {
  '/': '⌂', '/chars': '◉', '/rels': '◈', '/rp': '✎', '/board': '☰', '/gallery': '▣', '/loadb': '◫',
  '/tchars': '◎', '/trpg': '▤', '/dotori': '❖', '/playlog': '▶', '/comm': '✦', '/comm-apply': '✉',
  '/cal': '▦', '/diary': '▥', '/threads': '◇', '/memo': '□', '/guest': '✉', '/intro': '△',
  '/mypage': '◐', '/settings': '⚙', '/login': '⏻',
};
export function glyphFor(href: string, label: string): string {
  const path = href.split('?')[0];
  return GLYPHS[path] ?? (label.trim().charAt(0) || '■');
}

/** 상위 메뉴(그룹) 아이콘 — 기본 이름이면 아래 글리프, 이름을 바꿨거나 새로 만든 그룹은 첫 하위 메뉴의 글리프를 따른다 */
const GROUP_GLYPHS: Record<string, string> = {
  '자놀': '✧', '게시판': '☰', 'TRPG': '▤', '커미션': '✦', '기록': '▥',
};
export function groupGlyph(label: string, firstChild?: { href: string; label: string }): string {
  return GROUP_GLYPHS[label.trim()] ?? (firstChild ? glyphFor(firstChild.href, firstChild.label) : (label.trim().charAt(0) || '■'));
}

export function flag(key: string): boolean {
  try { return sessionStorage.getItem(key) === '1'; } catch { return false; }
}
export function setFlag(key: string, on: boolean) {
  try { if (on) sessionStorage.setItem(key, '1'); else sessionStorage.removeItem(key); } catch { /* 저장 막힌 환경 */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('ohome-desktop-flag'));
}
