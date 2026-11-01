'use client';
// 우주 배경 (사용자 요청) — 사이트 전체 뒤에 깔리는 캔버스 한 장.
//  · 깊은 밤하늘 + 성운 (미리 그려둔 레이어를 마우스에 따라 느리게 흔듦)
//  · 3겹 별 (깜빡임 + 마우스 시차)
//  · 노드 별 ↔ 노드 별 / 커서를 잇는 성좌선 — 네트워크 그래프 느낌 (컴공)
//  · 위에서 쏟아지는 유성우 + 가끔 쏟아지는 무리 (sf)
//  · 아주 옅게 흐르는 16진수·이진수 코드 비 (매트릭스 느낌)
//  · 클릭하면 퍼지는 펄스 링 + 유성
// 성능: 보이지 않는 탭에선 멈춤, 모션 줄이기 설정이면 정지 화면만, DPR 상한 2.
import { useEffect, useRef } from 'react';
import { useEmbedded } from '@/lib/useEmbedded';

type Star = { x: number; y: number; r: number; a: number; tw: number; sp: number; hue: number };
type Pt = { x: number; y: number; vx: number; vy: number; r: number };
type Meteor = { x: number; y: number; vx: number; vy: number; len: number; life: number; max: number; w: number; hue: number };
type Pulse = { x: number; y: number; t: number };
type Col = { x: number; y: number; sp: number; chars: string[]; t: number };

const HEX = '0123456789ABCDEF';
const GLYPH = '01{}<>/=;$#%&*+';

export function SpaceBackground() {
  const embedded = useEmbedded();
  const ref = useRef<HTMLCanvasElement>(null);

  // 우주 모드 표시 — 상단바·작업표시줄·제목 글씨를 밤하늘에 맞게 덮는 CSS가 이 속성에 걸린다 (globals.css)
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-space', '1');
    return () => el.removeAttribute('data-space');
  }, []);

  // 창(iframe) 안 페이지: 캔버스는 바깥 데스크톱에 하나만 — 안쪽 마우스 움직임·클릭을 바깥으로 전달해 반응하게 한다
  useEffect(() => {
    if (!embedded) return;
    const fwd = (type: 'pointermove' | 'pointerdown') => (e: PointerEvent) => {
      try {
        const fr = window.frameElement?.getBoundingClientRect();
        if (!fr) return;
        window.parent.dispatchEvent(new PointerEvent(type, { clientX: e.clientX + fr.left, clientY: e.clientY + fr.top }));
      } catch { /* 다른 출처면 무시 */ }
    };
    const mv = fwd('pointermove'), dn = fwd('pointerdown');
    window.addEventListener('pointermove', mv, { passive: true });
    window.addEventListener('pointerdown', dn, { passive: true });
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerdown', dn); };
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1;
    let stars: Star[][] = [];
    let nodes: Pt[] = [];
    let cols: Col[] = [];
    const meteors: Meteor[] = [];
    const pulses: Pulse[] = [];
    let nebula: HTMLCanvasElement | null = null;
    // 마우스 (-1~1 정규화는 시차용, px는 성좌선용)
    const m = { x: -9999, y: -9999, nx: 0, ny: 0, sx: 0, sy: 0 };
    let scrollY = 0;
    let raf = 0;
    let last = performance.now();
    let nextMeteor = 0.4;
    let nextShower = 9 + Math.random() * 8;
    let showerLeft = 0;
    let showerGap = 0;

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    // ---- 성운: 한 번만 그려 두고 매 프레임 통째로 옮긴다
    function buildNebula() {
      const c = document.createElement('canvas');
      const pad = 160;
      c.width = Math.ceil((W + pad * 2) * 0.5);
      c.height = Math.ceil((H + pad * 2) * 0.5);
      const g = c.getContext('2d')!;
      g.scale(0.5, 0.5);
      const blobs: [number, number, number, string][] = [
        [0.18, 0.22, 0.55, '90,60,200'],
        [0.82, 0.30, 0.5, '30,150,200'],
        [0.55, 0.78, 0.6, '150,50,170'],
        [0.12, 0.85, 0.4, '20,110,160'],
        [0.9, 0.9, 0.38, '70,70,210'],
      ];
      const base = Math.max(W, H);
      for (const [fx, fy, fr, rgb] of blobs) {
        const x = pad + fx * W, y = pad + fy * H, r = fr * base;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${rgb},.20)`);
        gr.addColorStop(0.45, `rgba(${rgb},.07)`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr;
        g.fillRect(0, 0, W + pad * 2, H + pad * 2);
      }
      nebula = c;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv!.width = Math.floor(W * dpr);
      cv!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = W * H;
      const mk = (n: number, rMin: number, rMax: number): Star[] =>
        Array.from({ length: n }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: rnd(rMin, rMax), a: rnd(0.35, 1),
          tw: Math.random() * Math.PI * 2, sp: rnd(0.4, 2.2),
          hue: Math.random() < 0.18 ? rnd(190, 215) : Math.random() < 0.12 ? rnd(260, 290) : 0,
        }));
      stars = [
        mk(Math.round(area / 5200), 0.3, 0.7),
        mk(Math.round(area / 12000), 0.6, 1.0),
        mk(Math.round(area / 36000), 0.9, 1.5),
      ];
      const nn = Math.min(70, Math.max(26, Math.round(area / 26000)));
      nodes = Array.from({ length: nn }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: rnd(-0.12, 0.12), vy: rnd(-0.12, 0.12), r: rnd(1.1, 2),
      }));
      const colW = 46;
      cols = Array.from({ length: Math.ceil(W / colW) }, (_, i) => ({
        x: i * colW + rnd(0, colW * 0.6),
        y: rnd(-H, H),
        sp: rnd(14, 38),
        chars: Array.from({ length: Math.floor(rnd(6, 16)) }, () =>
          Math.random() < 0.6 ? HEX[(Math.random() * 16) | 0] : GLYPH[(Math.random() * GLYPH.length) | 0]),
        t: 0,
      })).filter(() => Math.random() < 0.55);
      buildNebula();
    }

    function spawnMeteor(x?: number, y?: number, hot = false) {
      // 오른쪽 위 → 왼쪽 아래로 쏟아진다 (각도 약간씩 다르게)
      const ang = rnd(Math.PI * 0.62, Math.PI * 0.72);
      const speed = rnd(520, 980);
      meteors.push({
        x: x ?? rnd(W * 0.15, W * 1.25),
        y: y ?? rnd(-80, H * 0.25),
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        len: rnd(90, 220), life: 0, max: rnd(0.9, 1.7),
        w: rnd(1, 2.1), hue: hot ? rnd(170, 200) : Math.random() < 0.25 ? rnd(175, 200) : 215,
      });
    }

    function onMove(e: PointerEvent) {
      m.x = e.clientX; m.y = e.clientY;
      m.nx = (e.clientX / W - 0.5) * 2;
      m.ny = (e.clientY / H - 0.5) * 2;
    }
    function onLeave() { m.x = m.y = -9999; m.nx = m.ny = 0; }
    function onDown(e: PointerEvent) {
      pulses.push({ x: e.clientX, y: e.clientY, t: 0 });
      if (!reduce) for (let i = 0; i < 2; i++) spawnMeteor(e.clientX + rnd(-40, 160), e.clientY - rnd(60, 160), true);
    }
    function onScroll(e: Event) {
      const t = e.target as HTMLElement | Document;
      if (t instanceof HTMLElement && t.id === 'appMain') scrollY = t.scrollTop;
    }

    function drawStatic() {
      ctx!.fillStyle = '#04060f';
      ctx!.fillRect(0, 0, W, H);
      if (nebula) ctx!.drawImage(nebula, -160, -160, nebula.width * 2, nebula.height * 2);
      for (const layer of stars) for (const s of layer) {
        ctx!.fillStyle = s.hue ? `hsla(${s.hue},80%,80%,${s.a})` : `rgba(235,240,255,${s.a})`;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, 6.2832); ctx!.fill();
      }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      // 시차 값 부드럽게 따라가기
      m.sx += (m.nx - m.sx) * Math.min(1, dt * 3);
      m.sy += (m.ny - m.sy) * Math.min(1, dt * 3);

      // 배경
      const bg = ctx!.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#03040c'); bg.addColorStop(0.6, '#060a1c'); bg.addColorStop(1, '#0a0f26');
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);

      // 성운 (아주 느리게 숨 쉬듯 + 마우스 시차)
      if (nebula) {
        const ox = -160 - m.sx * 14 + Math.sin(t * 0.05) * 18;
        const oy = -160 - m.sy * 10 - scrollY * 0.02 + Math.cos(t * 0.04) * 14;
        ctx!.globalAlpha = 0.85 + Math.sin(t * 0.3) * 0.1;
        ctx!.drawImage(nebula, ox, oy, nebula.width * 2, nebula.height * 2);
        ctx!.globalAlpha = 1;
      }

      // 코드 비 (뒤쪽, 아주 옅게)
      ctx!.font = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      ctx!.textAlign = 'left';
      for (const c of cols) {
        c.y += c.sp * dt;
        c.t += dt;
        if (c.t > 0.18) { c.t = 0; c.chars[(Math.random() * c.chars.length) | 0] = Math.random() < 0.6 ? HEX[(Math.random() * 16) | 0] : GLYPH[(Math.random() * GLYPH.length) | 0]; }
        if (c.y - c.chars.length * 13 > H) { c.y = -20; c.x = (c.x + rnd(-20, 20) + W) % W; }
        for (let i = 0; i < c.chars.length; i++) {
          const a = (1 - i / c.chars.length) * 0.16;
          ctx!.fillStyle = i === 0 ? 'rgba(160,255,240,.34)' : `rgba(90,200,230,${a})`;
          ctx!.fillText(c.chars[i], c.x - m.sx * 6, c.y - i * 13);
        }
      }

      // 별 3겹 (멀수록 덜 움직인다)
      const depth = [4, 9, 16];
      for (let li = 0; li < stars.length; li++) {
        const d = depth[li];
        for (const s of stars[li]) {
          const tw = 0.6 + 0.4 * Math.sin(t * s.sp + s.tw);
          const x = ((s.x - m.sx * d) % W + W) % W;
          const y = ((s.y - m.sy * d - scrollY * 0.01 * (li + 1)) % H + H) % H;
          ctx!.fillStyle = s.hue ? `hsla(${s.hue},85%,82%,${s.a * tw})` : `rgba(236,241,255,${s.a * tw})`;
          ctx!.beginPath(); ctx!.arc(x, y, s.r, 0, 6.2832); ctx!.fill();
          if (li === 2 && tw > 0.9) { // 밝은 별은 십자 반짝임
            ctx!.strokeStyle = `rgba(200,225,255,${0.35 * (tw - 0.9) * 10})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(x - s.r * 5, y); ctx!.lineTo(x + s.r * 5, y);
            ctx!.moveTo(x, y - s.r * 5); ctx!.lineTo(x, y + s.r * 5);
            ctx!.stroke();
          }
        }
      }

      // 성좌 네트워크 — 노드끼리, 그리고 커서와 이어진다
      const LINK = 150, LINK2 = LINK * LINK;
      const CUR = 190, CUR2 = CUR * CUR;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
        // 커서가 가까우면 살짝 밀려난다
        const dx = n.x - m.x, dy = n.y - m.y, dd = dx * dx + dy * dy;
        if (dd < 120 * 120 && dd > 1) { const f = (1 - Math.sqrt(dd) / 120) * 0.6; n.x += (dx / Math.sqrt(dd)) * f; n.y += (dy / Math.sqrt(dd)) * f; }
      }
      ctx!.lineWidth = 0.7;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx!.strokeStyle = `rgba(120,190,255,${(1 - d2 / LINK2) * 0.22})`;
            ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke();
          }
        }
        const mx = a.x - m.x, my = a.y - m.y, md2 = mx * mx + my * my;
        if (md2 < CUR2) {
          ctx!.strokeStyle = `rgba(150,255,235,${(1 - md2 / CUR2) * 0.55})`;
          ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(m.x, m.y); ctx!.stroke();
        }
      }
      for (const n of nodes) {
        const near = (n.x - m.x) ** 2 + (n.y - m.y) ** 2 < CUR2;
        ctx!.fillStyle = near ? 'rgba(170,255,240,.95)' : 'rgba(190,215,255,.75)';
        ctx!.shadowColor = near ? 'rgba(120,255,230,.9)' : 'rgba(120,170,255,.6)';
        ctx!.shadowBlur = near ? 10 : 5;
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, 6.2832); ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      // 유성
      nextMeteor -= dt;
      if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = rnd(0.7, 2.2); }
      nextShower -= dt;
      if (nextShower <= 0) { showerLeft = Math.floor(rnd(10, 22)); showerGap = 0; nextShower = rnd(22, 40); }
      if (showerLeft > 0) {
        showerGap -= dt;
        if (showerGap <= 0) { spawnMeteor(); showerLeft--; showerGap = rnd(0.04, 0.16); }
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const mt = meteors[i];
        mt.life += dt; mt.x += mt.vx * dt; mt.y += mt.vy * dt;
        if (mt.life > mt.max || mt.x < -300 || mt.y > H + 300) { meteors.splice(i, 1); continue; }
        const k = Math.sin((mt.life / mt.max) * Math.PI); // 페이드 인/아웃
        const sp = Math.hypot(mt.vx, mt.vy);
        const tx = mt.x - (mt.vx / sp) * mt.len, ty = mt.y - (mt.vy / sp) * mt.len;
        const g = ctx!.createLinearGradient(mt.x, mt.y, tx, ty);
        g.addColorStop(0, `hsla(${mt.hue},100%,92%,${k})`);
        g.addColorStop(0.25, `hsla(${mt.hue},95%,70%,${k * 0.45})`);
        g.addColorStop(1, `hsla(${mt.hue},95%,60%,0)`);
        ctx!.strokeStyle = g; ctx!.lineWidth = mt.w; ctx!.lineCap = 'round';
        ctx!.beginPath(); ctx!.moveTo(mt.x, mt.y); ctx!.lineTo(tx, ty); ctx!.stroke();
        ctx!.fillStyle = `rgba(255,255,255,${k})`;
        ctx!.beginPath(); ctx!.arc(mt.x, mt.y, mt.w * 0.9, 0, 6.2832); ctx!.fill();
      }

      // 클릭 펄스 링
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += dt;
        if (p.t > 1.1) { pulses.splice(i, 1); continue; }
        const k = p.t / 1.1;
        ctx!.strokeStyle = `rgba(140,240,255,${(1 - k) * 0.6})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, 8 + k * 90, 0, 6.2832); ctx!.stroke();
        ctx!.strokeStyle = `rgba(170,150,255,${(1 - k) * 0.35})`;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, 4 + k * 55, 0, 6.2832); ctx!.stroke();
      }

      // 커서 주변 은은한 빛
      if (m.x > -999) {
        const gl = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, 130);
        gl.addColorStop(0, 'rgba(120,220,255,.10)'); gl.addColorStop(1, 'rgba(120,220,255,0)');
        ctx!.fillStyle = gl; ctx!.fillRect(m.x - 130, m.y - 130, 260, 260);
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduce || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function onVis() { document.hidden ? stop() : start(); }

    resize();
    if (reduce) drawStatic(); else start();

    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(() => { resize(); if (reduce) drawStatic(); }, 120); };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      clearTimeout(rt);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [embedded]);

  if (embedded) return null;
  // z-index -1: 본문·상단바 전부 이 위. 클릭은 통과
  return <canvas ref={ref} aria-hidden="true" className="space-bg" />;
}
