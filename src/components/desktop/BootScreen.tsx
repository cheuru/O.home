'use client';
// 부팅 화면 — 줄이 하나씩 찍히고 [ENTER]로 다음으로 (aegis 부팅 연출 그대로, 색·글꼴만 사이트 테마)
import React, { useEffect, useState } from 'react';
import { BOOT_LINES } from '@/lib/desktopConfig';

export function BootScreen({ title, ready, onContinue }: { title: string; ready: boolean; onContinue: () => void }) {
  const lines = BOOT_LINES.map(l => l.replace('{TITLE}', title.toUpperCase()));
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (count >= lines.length) {
      const t = window.setTimeout(() => setDone(true), 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCount(c => c + 1), count === 0 ? 450 : 310);
    return () => window.clearTimeout(t);
  }, [count, lines.length]);

  const go = done && ready;
  // Enter 키로도 진행
  useEffect(() => {
    if (!go) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Enter') onContinue(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, onContinue]);

  return (
    <main className="dsk-boot">
      <div className="dsk-noise" />
      <section className="dsk-boot-panel">
        <i className="dsk-corner tl" /><i className="dsk-corner tr" /><i className="dsk-corner bl" /><i className="dsk-corner br" />
        <div className="dsk-boot-head">
          <span className="dsk-mark lg">{title.trim().charAt(0).toUpperCase() || 'O'}</span>
          <div><span className="dsk-eyebrow">PERSONAL ARCHIVE</span><h1>{title.toUpperCase()}</h1></div>
        </div>
        <div className="dsk-boot-log" aria-live="polite">
          {lines.slice(0, count).map((l, i) => <p key={i}><span>{String(i + 1).padStart(2, '0')}</span>{l}</p>)}
          {count < lines.length && <p className="cursor"><span>··</span>_</p>}
        </div>
        <div className="dsk-boot-bottom">
          <span>COLD START</span>
          {go ? <button className="dsk-enter" onClick={onContinue}>[ ENTER ] AUTHENTICATE</button> : <span>INITIALIZING</span>}
        </div>
      </section>
    </main>
  );
}
