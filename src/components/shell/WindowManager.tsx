'use client';
// 창(윈도우) 매니저 — 메인 화면에서 메뉴 클릭 시 뜨는 드래그 가능한 창들을 렌더링 (v2.1)
// 각 창은 iframe으로 해당 페이지를 그대로 띄운다 — 페이지 컴포넌트를 손대지 않고도
// 어떤 메뉴든 창으로 열 수 있다 (예전 Gnuboard newmain 스킨의 iframe 모달과 동일한 접근).
import React, { useRef } from 'react';
import { useWindows, WinState } from '@/lib/windowStore';

function Win({ w }: { w: WinState }) {
  const { closeWindow, focusWindow, moveWindow, minimizeWindow } = useWindows();
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onBarDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // 버튼 클릭은 드래그로 취급하지 않음
    focusWindow(w.id);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: w.x, oy: w.y };
    const onMove = (ev: MouseEvent) => {
      if (!drag.current) return;
      moveWindow(w.id, drag.current.ox + (ev.clientX - drag.current.sx), drag.current.oy + (ev.clientY - drag.current.sy));
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (w.minimized) return null;

  return (
    <div className="os-win" style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: 1000 + w.z }}
      onMouseDownCapture={() => focusWindow(w.id)}>
      <div className="os-win-bar" onMouseDown={onBarDown}>
        <span className="os-win-title">{w.title}</span>
        <div className="os-win-btns">
          <button onClick={() => minimizeWindow(w.id)} aria-label="최소화" title="최소화">─</button>
          <button onClick={() => closeWindow(w.id)} aria-label="닫기" title="닫기">✕</button>
        </div>
      </div>
      <iframe src={w.href} className="os-win-frame" />
    </div>
  );
}

export function WindowManager() {
  const { windows, focusWindow, minimizeWindow } = useWindows();
  if (!windows.length) return null;
  return (
    <>
      <div className="os-win-layer">
        {windows.map(w => <Win key={w.id} w={w} />)}
      </div>
      {/* 최소화된 창은 화면 아래 작은 탭으로 — 눌러서 다시 펼침 */}
      {windows.some(w => w.minimized) && (
        <div className="os-win-tray">
          {windows.filter(w => w.minimized).map(w => (
            <button key={w.id} className="os-win-tray-tab" onClick={() => { minimizeWindow(w.id); focusWindow(w.id); }}>
              {w.title}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
