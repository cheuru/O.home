'use client';
// 떠 있는 옷장 — 제목줄을 잡아 옮기고, 접으면 작은 옷걸이 아이콘이 된다.
// 위치와 접힘 상태는 이 브라우저에 기억한다. 좁은 화면(<1000px)에서는 캐릭터 아래에 그냥 놓인다.
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Pos { l: number; t: number; min: boolean }
const ICON = 46;
const NARROW = 1000;

const Hanger = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 7.5a2.2 2.2 0 1 0-2.2-2.2" />
    <path d="M12 7.5v2L3.2 16a1.3 1.3 0 0 0 .8 2.3h16a1.3 1.3 0 0 0 .8-2.3L12 9.5" />
  </svg>
);

export function FloatPanel({ storageKey, title, width = 410, children }: {
  storageKey: string; title: string; width?: number; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [narrowOpen, setNarrowOpen] = useState(true);

  const W = () => Math.min(width, window.innerWidth - 20);
  // 아이콘 모양일 때는 아이콘이, 펼친 모양일 때는 제목줄이 화면 밖으로 나가지 않게
  const clamp = useCallback((p: Pos): Pos => {
    const w = Math.min(width, window.innerWidth - 20);
    const l = p.min ? Math.min(Math.max(p.l, ICON - w), window.innerWidth - w) : Math.min(Math.max(p.l, 90 - w), window.innerWidth - 90);
    const t = Math.min(Math.max(p.t, 0), Math.max(0, window.innerHeight - 48));
    return { l, t, min: p.min };
  }, [width]);

  useEffect(() => {
    const onR = () => { setNarrow(window.innerWidth < NARROW); setPos(p => (p ? clamp(p) : p)); };
    let saved: Pos | null = null;
    try { const s = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (s && typeof s.l === 'number' && typeof s.t === 'number') saved = { l: s.l, t: s.t, min: !!s.min }; } catch { /* 기본 자리 */ }
    setNarrow(window.innerWidth < NARROW);
    setPos(clamp(saved ?? { l: window.innerWidth - W() - 24, t: 110, min: false }));
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, clamp]);

  const persist = (p: Pos) => { try { localStorage.setItem(storageKey, JSON.stringify(p)); } catch { /* 무시 */ } };

  /** 끌기 — 4px 넘게 움직이면 이동, 아니면 눌림(onTap)으로 본다 */
  const startDrag = (e: React.PointerEvent, onTap?: () => void) => {
    if (narrow || !pos || (e.target as HTMLElement).closest('[data-nodrag]')) return;
    const sx = e.clientX, sy = e.clientY, base = pos; let moved = false;
    ref.current?.classList.add('is-dragging');
    const mv = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
      moved = true;
      setPos(clamp({ ...base, l: base.l + ev.clientX - sx, t: base.t + ev.clientY - sy }));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      ref.current?.classList.remove('is-dragging');
      if (moved) {
        const next = clamp({ ...base, l: base.l + ev.clientX - sx, t: base.t + ev.clientY - sy });
        setPos(next); persist(next);
      } else onTap?.();
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    e.preventDefault();
  };
  const toggle = () => {
    if (narrow) { setNarrowOpen(o => !o); return; }
    setPos(p => { if (!p) return p; const n = clamp({ ...p, min: !p.min }); persist(n); return n; });
  };
  const home = () => {
    const n: Pos = { l: window.innerWidth - W() - 24, t: 110, min: pos?.min ?? false };
    setPos(clamp(n)); persist(clamp(n));
  };

  const min = narrow ? !narrowOpen : !!pos?.min;
  const w = typeof window === 'undefined' ? width : W();

  if (min) {
    const style: React.CSSProperties = narrow || !pos
      ? { position: 'relative', margin: '0 auto' }
      : { position: 'fixed', left: pos.l + w - ICON, top: pos.t, zIndex: 60 };
    return (
      <div ref={ref} style={{ ...style, visibility: pos || narrow ? 'visible' : 'hidden' }}>
        <button type="button" className="cl-float-icon" title={`${title} 열기 (끌어서 옮길 수 있어요)`}
          onPointerDown={e => startDrag(e, toggle)} onClick={narrow ? toggle : undefined}><Hanger /></button>
      </div>
    );
  }
  const style: React.CSSProperties = narrow || !pos
    ? { position: 'relative', width: 'min(95vw, 640px)', margin: '0 auto' }
    : { position: 'fixed', left: pos.l, top: pos.t, width: w, zIndex: 60 };
  return (
    <div ref={ref} className="wardrobe-sidebar cl-float" style={{ ...style, visibility: pos || narrow ? 'visible' : 'hidden' }}>
      <div className="cl-float-head" onPointerDown={e => startDrag(e)} onDoubleClick={home}
        title={narrow ? undefined : '이 줄을 끌어서 옮기세요 (두 번 누르면 제자리로)'}>
        <span className="cl-float-title"><Hanger />{title}</span>
        <span className="cl-float-grip">{narrow ? '' : '⠿'}</span>
        <button type="button" data-nodrag className="cl-float-min" title="작은 아이콘으로 접기" onClick={toggle}>–</button>
      </div>
      {children}
    </div>
  );
}
