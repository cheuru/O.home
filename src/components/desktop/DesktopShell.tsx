'use client';
// 데스크톱 셸 — 부팅 → 로그인 → 데스크톱. 메뉴는 하단 앱 아이콘, 누르면 창으로 열린다.
//  · 창 안에는 실제 페이지를 iframe 으로 띄운다 (각 페이지의 기능·링크 이동이 그대로 동작)
//  · 아이콘 목록은 환경설정 > 메뉴 관리를 그대로 따른다 (이름·순서·공개범위·추가 게시판·커스텀 링크)
//  · 창은 처음 열 때 항상 최대화. 드래그 · 크기 조절 · 최소화 · 최대화 · 닫기
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { boardEntries, buildMenu, useMenuSettings } from '@/lib/menuStore';
import { useBoards } from '@/lib/boardStore';
import { sectionMenuEntries, useSections } from '@/lib/sectionStore';
import { linkEntries, useCustomLinks } from '@/lib/linkStore';
import { useSiteSettings } from '@/lib/siteStore';
import { FLAG_BOOTED, FLAG_ENTERED, flag, glyphFor, groupGlyph, setFlag } from '@/lib/desktopConfig';
import { BootScreen } from './BootScreen';
import { LoginScreen } from './LoginScreen';
import { DeskHome } from './DeskHome';

type Screen = 'boot' | 'login' | 'desktop';
interface App { href: string; label: string; group: string; glyph: string }
/** 하단 독에 놓이는 칸 — 바로 열리는 메뉴(app) 또는 하위 메뉴를 품은 상위 메뉴(group) */
type DockItem = { kind: 'app'; app: App } | { kind: 'group'; label: string; glyph: string; apps: App[] };
interface Fly { label: string; left: number; apps: App[] }
interface Win {
  id: string; href: string; title: string; glyph: string;
  x: number; y: number; w: number; h: number;   // 최대화 해제 시 돌아갈 자리·크기
  z: number; min: boolean; max: boolean; nonce: number; loading: boolean;
}

const NARROW = 720;       // 이보다 좁은 화면 — 창은 항상 꽉 차게
const MIN_W = 360, MIN_H = 260;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const isExternal = (href: string) => /^https?:\/\//.test(href);

export function DesktopShell() {
  const { user, isAdmin, ready, logout } = useAuth();
  const [site] = useSiteSettings();
  const title = (site.title || 'O.HOME').trim() || 'O.HOME';

  // 화면 단계 — 세션에 기록이 있으면 부팅·로그인을 건너뛴다 (판단은 마운트 뒤에)
  const [screen, setScreen] = useState<Screen | null>(null);
  useEffect(() => {
    if (flag(FLAG_ENTERED) || user) setScreen('desktop');
    else if (flag(FLAG_BOOTED)) setScreen('login');
    else setScreen('boot');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 로그인 상태가 확인된 뒤 이미 로그인돼 있으면 로그인 화면은 건너뛴다
  useEffect(() => { if (screen === 'login' && user) { setFlag(FLAG_ENTERED, true); setScreen('desktop'); } }, [screen, user]);

  const enter = useCallback(() => { setFlag(FLAG_ENTERED, true); setScreen('desktop'); }, []);
  const afterBoot = useCallback(() => {
    setFlag(FLAG_BOOTED, true);
    if (user) { setFlag(FLAG_ENTERED, true); setScreen('desktop'); } else setScreen('login');
  }, [user]);

  if (screen === null) return <div className="dsk-root" />;
  return (
    <div className="dsk-root">
      {screen === 'boot' && <BootScreen title={title} ready={ready} onContinue={afterBoot} />}
      {screen === 'login' && <LoginScreen title={title} onDone={enter} />}
      {screen === 'desktop' && (
        <Desktop
          title={title}
          nickname={user?.nickname ?? null}
          isAdmin={isAdmin}
          onLogout={async () => { await logout(); setFlag(FLAG_ENTERED, false); setScreen('login'); }}
          onLogin={() => { setFlag(FLAG_ENTERED, false); setScreen('login'); }}
        />
      )}
    </div>
  );
}

function Desktop({ title, nickname, isAdmin, onLogout, onLogin }: {
  title: string; nickname: string | null; isAdmin: boolean; onLogout: () => void; onLogin: () => void;
}) {
  const { user } = useAuth();
  const [menuSet, , menuLoaded] = useMenuSettings();
  const { boards, loaded: boardsLoaded } = useBoards();
  const { map: secMap } = useSections();
  const { links } = useCustomLinks();

  // ── 홈 = 왼쪽 로고(C) 버튼. 하단 아이콘 줄에는 따로 두지 않는다
  const home: App = useMemo(() => ({ href: '/', label: '홈', group: '', glyph: glyphFor('/', '홈') }), []);

  // ── 하단 아이콘 = 상단 메뉴와 같은 규칙으로 만든 「상위 메뉴」 목록
  //    하위 메뉴가 있는 상위 메뉴는 아이콘 하나로 접어 두고, 누르면 위로 펼쳐진다
  const dock: DockItem[] = useMemo(() => {
    if (!(menuLoaded && boardsLoaded)) return [];
    const menu = buildMenu(menuSet, [...boardEntries(boards), ...sectionMenuEntries(secMap), ...linkEntries(links)],
      { loggedIn: !!user, isAdmin, id: user?.id });
    const out: DockItem[] = [];
    for (const m of menu) {
      if (m.children) {
        if (!m.children.length) continue;
        out.push({
          kind: 'group', label: m.label, glyph: groupGlyph(m.label, m.children[0]),
          apps: m.children.map(c => ({ href: c.href, label: c.label, group: m.label, glyph: glyphFor(c.href, c.label) })),
        });
      } else if (m.href) out.push({ kind: 'app', app: { href: m.href, label: m.label, group: '', glyph: glyphFor(m.href, m.label) } });
    }
    return out;
  }, [menuSet, menuLoaded, boards, boardsLoaded, secMap, links, user, isAdmin]);

  // ── 창 관리
  const areaRef = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 1200, h: 700 });
  const [narrow, setNarrow] = useState(false);
  const zTop = useRef(10);
  const [wins, setWins] = useState<Win[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => { size.current = { w: el.clientWidth, h: el.clientHeight }; setNarrow(el.clientWidth < NARROW); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const topId = useMemo(() => {
    const vis = wins.filter(w => !w.min);
    return vis.length ? vis.reduce((a, b) => (b.z > a.z ? b : a)).id : null;
  }, [wins]);

  const focus = useCallback((id: string) => {
    const z = ++zTop.current;
    setWins(cur => cur.map(w => (w.id === id ? { ...w, z, min: false } : w)));
  }, []);

  const openWin = useCallback((href: string, label: string, group: string, glyph: string) => {
    if (isExternal(href)) { window.open(href, '_blank'); return; }
    setWins(cur => {
      const hit = cur.find(w => w.id === href);
      const z = ++zTop.current;
      if (hit) return cur.map(w => (w.id === href ? { ...w, z, min: false } : w));
      const { w: aw, h: ah } = size.current;
      const ww = clamp(1000, MIN_W, aw - 120), hh = clamp(660, MIN_H, ah - 80);
      const n = cur.length % 6;
      return [...cur, {
        id: href, href, title: group ? `${group} / ${label}` : label, glyph,
        x: Math.max(16, (aw - ww) / 2 + n * 26 - 60), y: Math.max(10, (ah - hh) / 2 + n * 22 - 30), w: ww, h: hh,
        z, min: false, max: true,                       // 처음 열릴 땐 항상 최대화
        nonce: 0, loading: true,
      }];
    });
  }, []);

  // 데스크톱이 처음 뜰 때 홈 창을 바로 열어 둔다 — 빈 바탕 대신 홈 화면이 메인으로 보이게
  // (닫으면 빈 바탕으로 돌아가고, 다시 열려면 왼쪽 로고를 누른다)
  const homeOpened = useRef(false);
  useEffect(() => {
    if (homeOpened.current) return;
    homeOpened.current = true;
    openWin(home.href, home.label, home.group, home.glyph);
  }, [openWin, home]);

  const clickApp = (a: App) => {
    if (isExternal(a.href)) { window.open(a.href, '_blank'); return; }
    const w = wins.find(x => x.id === a.href);
    if (!w) openWin(a.href, a.label, a.group, a.glyph);
    else if (w.min || w.id !== topId) focus(w.id);
    else setWins(cur => cur.map(x => (x.id === w.id ? { ...x, min: true } : x)));     // 맨 위 창을 다시 누르면 최소화
  };

  const patch = (id: string, p: Partial<Win>) => setWins(cur => cur.map(w => (w.id === id ? { ...w, ...p } : w)));
  const closeWin = (id: string) => setWins(cur => cur.filter(w => w.id !== id));

  // 제목줄 드래그 — 포인터 캡처로 iframe 위를 지나가도 끊기지 않는다
  const beginDrag = (e: React.PointerEvent<HTMLDivElement>, w: Win) => {
    if (w.max || narrow || (e.target as HTMLElement).closest('button')) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    focus(w.id);
    const ox = e.clientX - w.x, oy = e.clientY - w.y;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const { w: aw, h: ah } = size.current;
      patch(w.id, { x: clamp(ev.clientX - ox, 90 - w.w, aw - 90), y: clamp(ev.clientY - oy, 0, ah - 40) });
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      setDragging(false);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  const beginResize = (e: React.PointerEvent<HTMLDivElement>, w: Win) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    e.stopPropagation();
    focus(w.id);
    const sx = e.clientX, sy = e.clientY;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const { w: aw, h: ah } = size.current;
      patch(w.id, { w: clamp(w.w + ev.clientX - sx, MIN_W, aw - w.x), h: clamp(w.h + ev.clientY - sy, MIN_H, ah - w.y) });
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      setDragging(false);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  // ── 작업표시줄 오른쪽: 시계 · 사용자
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()));
    tick();
    const t = window.setInterval(tick, 20000);
    return () => window.clearInterval(t);
  }, []);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!userOpen) return;
    const close = (e: MouseEvent) => { if (!userRef.current?.contains(e.target as Node)) setUserOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userOpen]);

  // ── 상위 메뉴 펼침 — 독의 가로 스크롤 영역에 잘리지 않도록 화면 기준(fixed)으로 띄운다
  const [fly, setFly] = useState<Fly | null>(null);
  const toggleFly = (e: React.MouseEvent<HTMLButtonElement>, g: Extract<DockItem, { kind: 'group' }>) => {
    if (fly?.label === g.label) { setFly(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const half = 100;   // 펼침 메뉴 너비의 절반쯤 — 화면 밖으로 나가지 않게 가운데 기준 위치를 안쪽으로 맞춘다
    setFly({ label: g.label, left: Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half), apps: g.apps });
  };
  useEffect(() => {
    if (!fly) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setFly(null); };
    const close = () => setFly(null);
    window.addEventListener('keydown', esc);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('keydown', esc); window.removeEventListener('resize', close); };
  }, [fly]);

  // 아이콘 줄이 길면 휠로 가로 이동
  const appsRef = useRef<HTMLDivElement>(null);
  const onWheel = (e: React.WheelEvent) => { if (appsRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) appsRef.current.scrollLeft += e.deltaY; };

  const mark = title.charAt(0).toUpperCase();
  return (
    <div className={`dsk-desktop ${dragging ? 'dragging' : ''}`}>
      <div className="dsk-grid" />
      <div className="dsk-area" ref={areaRef}>
        {wins.length === 0 && (
          <DeskHome title={title} nickname={nickname} admin={isAdmin} />
        )}
        {wins.map(w => {
          const isTop = w.id === topId;
          const style: React.CSSProperties = { zIndex: w.z, display: w.min ? 'none' : undefined };
          if (!(w.max || narrow)) Object.assign(style, { left: w.x, top: w.y, width: w.w, height: w.h });
          return (
            <section key={w.id} className={`dsk-win ${w.max || narrow ? 'max' : ''} ${isTop ? 'top' : ''}`} style={style}>
              <div className="dsk-title" onPointerDown={e => beginDrag(e, w)} onDoubleClick={() => !narrow && patch(w.id, { max: !w.max })}>
                <span className="dsk-tglyph">{w.glyph}</span>
                <b>{w.title}</b>
                <div className="dsk-ctrl">
                  <button onClick={() => patch(w.id, { nonce: w.nonce + 1, loading: true })} aria-label="새로고침" title="새로고침">↻</button>
                  <button onClick={() => patch(w.id, { min: true })} aria-label="최소화" title="최소화">—</button>
                  {!narrow && <button onClick={() => patch(w.id, { max: !w.max })} aria-label={w.max ? '이전 크기로' : '최대화'} title={w.max ? '이전 크기로' : '최대화'}>{w.max ? '❐' : '□'}</button>}
                  <button className="close" onClick={() => closeWin(w.id)} aria-label="닫기" title="닫기">×</button>
                </div>
              </div>
              <div className="dsk-body">
                <iframe
                  key={w.nonce}
                  src={w.href}
                  title={w.title}
                  onLoad={() => patch(w.id, { loading: false })}
                />
                {/* 뒤에 있는 창은 첫 클릭을 가로채 맨 앞으로 — iframe 안 클릭은 부모가 못 보기 때문 */}
                {!isTop && <div className="dsk-shield" onPointerDown={() => focus(w.id)} />}
                {w.loading && <div className="dsk-loading">LOADING…</div>}
              </div>
              {!(w.max || narrow) && <div className="dsk-grip" onPointerDown={e => beginResize(e, w)} />}
            </section>
          );
        })}
      </div>

      <footer className="dsk-dock">
        {(() => {
          const hw = wins.find(x => x.id === home.href);
          return (
            <button
              className={`dsk-brand ${hw ? 'open' : ''} ${hw && !hw.min && hw.id === topId ? 'on' : ''}`}
              onClick={() => { setFly(null); clickApp(home); }}
              title={`${title} — 홈`}
            >
              <span className="dsk-mark">{mark}</span>
            </button>
          );
        })()}
        <div className="dsk-apps" ref={appsRef} onWheel={onWheel}>
          {dock.map(item => {
            if (item.kind === 'app') {
              const a = item.app;
              const w = wins.find(x => x.id === a.href);
              const on = !!w && !w.min && w.id === topId;
              return (
                <button
                  key={`app|${a.href}`}
                  className={`dsk-app ${w ? 'open' : ''} ${on ? 'on' : ''} ${w?.min ? 'min' : ''}`}
                  onClick={() => { setFly(null); clickApp(a); }}
                  title={a.label}
                >
                  <span className="dsk-glyph">{a.glyph}</span>
                  <span className="dsk-label">{a.label}</span>
                </button>
              );
            }
            const kids = item.apps.map(a => wins.find(x => x.id === a.href)).filter((w): w is Win => !!w);
            const on = kids.some(w => !w.min && w.id === topId);
            return (
              <button
                key={`group|${item.label}`}
                className={`dsk-app dsk-group ${kids.length ? 'open' : ''} ${on ? 'on' : ''} ${fly?.label === item.label ? 'pop' : ''}`}
                onClick={e => toggleFly(e, item)}
                title={item.label}
                aria-haspopup="menu"
                aria-expanded={fly?.label === item.label}
              >
                <span className="dsk-glyph">{item.glyph}</span>
                <span className="dsk-label">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="dsk-sys" ref={userRef}>
          <button className="dsk-user" onClick={() => setUserOpen(o => !o)}>
            <i className="dsk-live" />{nickname ?? 'GUEST'}
          </button>
          <span className="dsk-clock">{clock}</span>
          {userOpen && (
            <div className="dsk-pop">
              {nickname ? (
                <>
                  <button onClick={() => { setUserOpen(false); openWin('/mypage', '정보수정', '', glyphFor('/mypage', '')); }}>정보수정</button>
                  {isAdmin && <button onClick={() => { setUserOpen(false); openWin('/settings', '환경설정', '', glyphFor('/settings', '')); }}>환경설정</button>}
                </>
              ) : (
                <button onClick={() => { setUserOpen(false); onLogin(); }}>로그인</button>
              )}
              {nickname && <button onClick={() => { setUserOpen(false); onLogout(); }}>로그아웃</button>}
            </div>
          )}
        </div>
      </footer>

      {fly && (
        <>
          {/* iframe 안을 눌러도 닫히도록 독 위쪽 전체를 덮는 투명 막 */}
          <div className="dsk-fly-back" onPointerDown={() => setFly(null)} />
          <div className="dsk-fly" role="menu" style={{ left: fly.left }}>
            <b className="dsk-fly-h">{fly.label}</b>
            {fly.apps.map(a => {
              const w = wins.find(x => x.id === a.href);
              const on = !!w && !w.min && w.id === topId;
              return (
                <button
                  key={a.href}
                  role="menuitem"
                  className={`dsk-fly-i ${w ? 'open' : ''} ${on ? 'on' : ''}`}
                  onClick={() => { setFly(null); clickApp(a); }}
                >
                  <span className="dsk-glyph">{a.glyph}</span>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
