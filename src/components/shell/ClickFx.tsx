'use client';
// 전역 클릭 효과 — 어느 페이지(스킨 화면·창 안 페이지 포함)에서든 클릭하면
//  · 클릭한 자리에서 링이 퍼지고 (맨 위 투명 캔버스, 클릭은 그대로 통과)
//  · 짧은 비프음이 난다 (WebAudio — 파일 없음).
// 예전에는 메인의 우주 배경 캔버스 안에서만 그려져서 스킨 화면·다른 페이지에선 보이지 않았다.
// 소리 끄기: 콘솔/설정에서 localStorage 'ohome-click-sound' 를 'off' 로 (기본은 켜짐).
// 모션 줄이기 설정이면 링은 생략하고 소리만 낸다.
import { useEffect, useRef } from 'react';

type Ring = { x: number; y: number; t: number };
const LIFE = 1.1;           // 링 하나가 사라지기까지(초)
const SOUND_KEY = 'ohome-click-sound';

function accentRgb(): [number, number, number] {
  try {
    const cs = getComputedStyle(document.documentElement);
    const v = (cs.getPropertyValue('--accent-soft').trim() || cs.getPropertyValue('--accent').trim());
    const c = document.createElement('canvas').getContext('2d');
    if (c && v) {
      c.fillStyle = '#ff8fd0'; c.fillStyle = v;                 // 못 읽으면 앞의 기본색이 남는다
      const m = /^#([0-9a-f]{6})$/i.exec(c.fillStyle as string);
      if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    }
  } catch { /* 기본색 */ }
  return [255, 143, 208];
}

export function ClickFx() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, rgb = accentRgb();
    const rings: Ring[] = [];
    let audio: AudioContext | null = null;
    let lastBeep = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const beep = () => {
      try {
        if (localStorage.getItem(SOUND_KEY) === 'off') return;
        const now = performance.now();
        if (now - lastBeep < 45) return;      // 연타해도 겹쳐 울리지 않게
        lastBeep = now;
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        if (!audio) audio = new AC();
        if (audio.state === 'suspended') void audio.resume();
        const t0 = audio.currentTime;
        // 삑 — 짧은 두 음(높은 → 더 높은), 네모파를 낮은 음량으로
        const tone = (freq: number, at: number, dur: number) => {
          const o = audio!.createOscillator(), g = audio!.createGain();
          o.type = 'square'; o.frequency.setValueAtTime(freq, t0 + at);
          g.gain.setValueAtTime(0.0001, t0 + at);
          g.gain.exponentialRampToValueAtTime(0.035, t0 + at + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
          o.connect(g); g.connect(audio!.destination);
          o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
        };
        tone(1040, 0, 0.05);
        tone(1560, 0.055, 0.06);
      } catch { /* 소리 실패는 무시 */ }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      for (let i = rings.length - 1; i >= 0; i--) {
        const p = rings[i]; p.t += dt;
        if (p.t > LIFE) { rings.splice(i, 1); continue; }
        const k = p.t / LIFE, e = 1 - Math.pow(1 - k, 3);      // 처음엔 빠르게, 끝에서 천천히
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(1 - k) * 0.75})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8 + e * 90, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.5})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + e * 55, 0, 6.2832); ctx.stroke();
      }
      raf = rings.length ? requestAnimationFrame(frame) : 0;
      if (!raf) ctx.clearRect(0, 0, W, H);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button > 0) return;                                  // 왼쪽 클릭·터치만
      beep();
      if (reduce) return;
      rgb = accentRgb();
      rings.push({ x: e.clientX, y: e.clientY, t: 0 });
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', onDown, { capture: true, passive: true });   // 안쪽에서 전파를 막아도 받는다
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onDown, { capture: true });
      try { void audio?.close(); } catch { /* 무시 */ }
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true"
    style={{ position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 2147483000 }} />;
}
