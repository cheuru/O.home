'use client';
// 우주 배경 (사용자 요청) — 기본 배경 자리에 깔리는 캔버스 한 장 (창(iframe) 안 페이지도 각자 하나씩).
//  · 깊은 밤하늘 + 성운 (미리 그려둔 레이어를 마우스에 따라 느리게 흔듦)
//  · 3겹 별 (깜빡임 + 마우스 시차)
//  · 노드 별 ↔ 노드 별 / 커서를 잇는 성좌선 — 네트워크 그래프 느낌 (컴공)
//  · 가끔 떨어지는 유성 + 아주 드물게 쏟아지는 무리 (sf)
//  · 아주 옅게 흐르는 16진수·이진수 코드 비
//  · 클릭하면 퍼지는 펄스 링 + 유성 한 줄기
// 색: 사이트 포인트색(--accent-soft)의 색상에서 뽑은 흰색~연한 톤 (테마를 바꾸면 따라간다).
// 스킨 존중: 캐릭터·자관 등 페이지별 배경/테마색이 지정된 화면(<html data-skin-bg>)이나 배경 사진이 있는 화면
//  (<html data-bg-img>)에서는 그리지 않는다 — 그 화면의 배경이 그대로 보인다 (globals.css가 캔버스를 숨김).
// 성능: 보이지 않는 탭·스킨 화면에선 멈춤, 모션 줄이기 설정이면 정지 화면만, DPR 상한 2.
import { useEffect, useRef } from 'react';
import { toRgba } from '@/lib/color';

type Star = { x: number; y: number; r: number; a: number; tw: number; sp: number; tint: boolean };
type Pt = { x: number; y: number; vx: number; vy: number; r: number };
type Meteor = { x: number; y: number; vx: number; vy: number; len: number; life: number; max: number; w: number };
type Pulse = { x: number; y: number; t: number };
type Col = { x: number; y: number; sp: number; chars: string[]; t: number };

// 팔레트 — 포인트색의 hue만 가져온다. 별·성좌선·유성은 흰색~그 hue의 연한 톤
function readHue(): number {
  try {
    const cs = getComputedStyle(document.documentElement);
    const css = cs.getPropertyValue('--accent-soft').trim() || cs.getPropertyValue('--accent').trim();
    if (css) {
      const { r, g, b } = toRgba(css);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (d > 18) { // 거의 회색이면 기본 핑크 유지
        const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return Math.round(((hh * 60) + 360) % 360);
      }
    }
  } catch { /* 기본값 */ }
  return 335;
}

const HEX = '0123456789ABCDEF';
const GLYPH = '01{}<>/=;$#%&*+';

export function SpaceBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    // 우주 모드 표시 (layout 의 인라인 스크립트도 첫 페인트 전에 같은 속성을 단다 — 핑크 바탕이 먼저 뜨지 않게)
    root.setAttribute('data-space', '1');
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1;
    let hue = readHue();
    const hh = (o: number) => (hue + o + 360) % 360;
    let stars: Star[][] = [];
    let nodes: Pt[] = [];
    let cols: Col[] = [];
    const meteors: Meteor[] = [];
    const pulses: Pulse[] = [];
    let nebula: HTMLCanvasElement | null = null;
    const m = { x: -9999, y: -9999, nx: 0, ny: 0, sx: 0, sy: 0 };
    let scrollY = 0;
    let raf = 0;
    let last = performance.now();
    function rnd(a: number, b: number) { return a + Math.random() * (b - a); }
    let nextMeteor = rnd(3, 6);
    let nextShower = rnd(50, 80);
    let showerLeft = 0;
    let showerGap = 0;
    const skinOn = () => root.hasAttribute('data-skin-bg') || root.hasAttribute('data-bg-img');

    // ---- 성운: 한 번만 그려 두고 매 프레임 통째로 옮긴다
    function buildNebula() {
      const c = document.createElement('canvas');
      const pad = 160;
      c.width = Math.ceil((W + pad * 2) * 0.5);
      c.height = Math.ceil((H + pad * 2) * 0.5);
      const g = c.getContext('2d')!;
      g.scale(0.5, 0.5);
      // [x, y, 반지름 비율, hue(절대값: 남색·보라·푸른 계열), 채도, 밝기, 진하기] — 포인트색은 한 군데만 살짝
      const blobs: [number, number, number, number, number, number, number][] = [
        [0.16, 0.24, 0.6, 255, 70, 46, 0.26],
        [0.84, 0.28, 0.52, 228, 75, 42, 0.22],
        [0.55, 0.80, 0.64, 275, 62, 40, 0.24],
        [0.10, 0.86, 0.42, 215, 70, 38, 0.2],
        [0.92, 0.88, 0.4, 262, 60, 44, 0.2],
        [0.50, 0.38, 0.30, hh(0), 55, 46, 0.07],
      ];
      const base = Math.max(W, H);
      for (const [fx, fy, fr, ho, sat, lig, al] of blobs) {
        const x = pad + fx * W, y = pad + fy * H, r = fr * base;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `hsla(${ho},${sat}%,${lig}%,${al * 0.8})`);
        gr.addColorStop(0.45, `hsla(${ho},${sat}%,${lig}%,${al * 0.28})`);
        gr.addColorStop(1, `hsla(${ho},${sat}%,${lig}%,0)`);
        g.fillStyle = gr;
        g.fillRect(0, 0, W + pad * 2, H + pad * 2);
      }
      nebula = c;
    }

    // ---- 행성(왼쪽 아래) · 달(오른쪽 위) · 인공위성 — 데스크톱 첫 화면(<html data-desktop>)에서만
    let planet: { tex: HTMLCanvasElement; r: number } | null = null;
    let sat: { x: number; y: number; vx: number; vy: number } | null = null;
    let nextSat = rnd(12, 25);
    const isDesk = () => root.hasAttribute('data-desktop');

    function buildPlanet() {
      const r = Math.round(Math.min(H * 0.36, W * 0.2));
      if (r < 60) { planet = null; return; }
      const D = r * 2, TW = D * 2;
      const tex = document.createElement('canvas');
      tex.width = TW; tex.height = D;
      const g = tex.getContext('2d')!;
      const bg = g.createLinearGradient(0, 0, 0, D);
      bg.addColorStop(0, '#2b2a86'); bg.addColorStop(0.5, '#4a2f9a'); bg.addColorStop(1, '#232a80');
      g.fillStyle = bg; g.fillRect(0, 0, TW, D);
      // 가로 줄무늬 구름대 — 가로로 한 바퀴(TW)가 이음매 없이 이어지도록 주기 함수로 굽힌다
      for (let b = 0; b < 16; b++) {
        const y0 = (b / 16) * D, h = (D / 16) * rnd(0.5, 1.3);
        const k = 1 + ((Math.random() * 3) | 0), ph = rnd(0, 6.28), A = rnd(2, 10);
        g.fillStyle = `hsla(${rnd(225, 325)},65%,${rnd(38, 68)}%,${rnd(0.12, 0.32)})`;
        for (let x = 0; x < TW; x += 3) g.fillRect(x, y0 + A * Math.sin((2 * Math.PI * k * x) / TW + ph), 3.5, h);
      }
      // 핑크빛 폭풍 몇 개
      for (let i = 0; i < 6; i++) {
        const x = rnd(0, TW), y = rnd(D * 0.2, D * 0.8), rx = rnd(18, 60);
        for (const dx of [-TW, 0, TW]) {
          const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx);
          gr.addColorStop(0, `hsla(${hh(0)},85%,75%,.4)`); gr.addColorStop(1, `hsla(${hh(0)},85%,75%,0)`);
          g.fillStyle = gr; g.save(); g.translate(0, y); g.scale(1, 0.4); g.translate(0, -y); g.fillRect(x + dx - rx, y - rx, rx * 2, rx * 2); g.restore();
        }
      }
      planet = { tex, r };
    }

    function drawPlanet(t: number) {
      if (!planet) return;
      const { tex, r } = planet;
      const cx = r * 0.62 - m.sx * 12, cy = H - r * 0.34 - m.sy * 8;
      // 대기 빛 번짐
      const at = ctx!.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.22);
      at.addColorStop(0, `hsla(${hh(-30)},85%,72%,.38)`); at.addColorStop(1, `hsla(${hh(-30)},85%,72%,0)`);
      ctx!.fillStyle = at; ctx!.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
      ctx!.save();
      ctx!.beginPath(); ctx!.arc(cx, cy, r, 0, 6.2832); ctx!.clip();
      const off = (t * 5) % (r * 4);
      ctx!.drawImage(tex, cx - r - off, cy - r);
      ctx!.drawImage(tex, cx - r - off + r * 4, cy - r);
      // 구 모양 음영: 오른쪽 위에서 빛, 왼쪽 아래는 어둡게
      const sh = ctx!.createRadialGradient(cx + r * 0.5, cy - r * 0.45, r * 0.05, cx + r * 0.5, cy - r * 0.45, r * 1.75);
      sh.addColorStop(0, 'rgba(255,225,242,.26)'); sh.addColorStop(0.4, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(2,3,22,.92)');
      ctx!.fillStyle = sh; ctx!.fillRect(cx - r, cy - r, r * 2, r * 2);
      const lm = ctx!.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
      lm.addColorStop(0, 'rgba(2,2,20,0)'); lm.addColorStop(1, 'rgba(2,2,20,.5)');
      ctx!.fillStyle = lm; ctx!.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx!.restore();
      // 달
      const mr = Math.max(14, Math.min(W, H) * 0.045);
      const mx = W * 0.88 - m.sx * 18 + Math.sin(t * 0.04) * 10, my = H * 0.2 - m.sy * 12 + Math.cos(t * 0.05) * 6;
      const mg = ctx!.createRadialGradient(mx - mr * 0.45, my - mr * 0.4, mr * 0.1, mx, my, mr * 1.05);
      mg.addColorStop(0, '#fff3f8'); mg.addColorStop(0.55, '#c9bde8'); mg.addColorStop(1, '#4a4290');
      const halo = ctx!.createRadialGradient(mx, my, mr * 0.9, mx, my, mr * 2.6);
      halo.addColorStop(0, `hsla(${hh(0)},80%,85%,.18)`); halo.addColorStop(1, `hsla(${hh(0)},80%,85%,0)`);
      ctx!.fillStyle = halo; ctx!.fillRect(mx - mr * 2.7, my - mr * 2.7, mr * 5.4, mr * 5.4);
      ctx!.fillStyle = mg; ctx!.beginPath(); ctx!.arc(mx, my, mr, 0, 6.2832); ctx!.fill();
      ctx!.save(); ctx!.beginPath(); ctx!.arc(mx, my, mr, 0, 6.2832); ctx!.clip();
      ctx!.fillStyle = 'rgba(70,60,130,.22)';
      for (const [ax, ay, ar] of [[-0.3, 0.1, 0.22], [0.25, -0.3, 0.14], [0.1, 0.4, 0.16], [0.42, 0.2, 0.1]]) {
        ctx!.beginPath(); ctx!.arc(mx + ax * mr, my + ay * mr, ar * mr, 0, 6.2832); ctx!.fill();
      }
      const ms = ctx!.createRadialGradient(mx - mr * 0.5, my - mr * 0.4, mr * 0.3, mx - mr * 0.5, my - mr * 0.4, mr * 1.6);
      ms.addColorStop(0, 'rgba(0,0,0,0)'); ms.addColorStop(1, 'rgba(3,3,30,.7)');
      ctx!.fillStyle = ms; ctx!.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      ctx!.restore();
    }

    function drawSat(dt: number, t: number) {
      nextSat -= dt;
      if (nextSat <= 0 && !sat) { sat = { x: -10, y: rnd(H * 0.12, H * 0.5), vx: rnd(35, 55), vy: rnd(-6, 6) }; nextSat = rnd(40, 70); }
      if (!sat) return;
      sat.x += sat.vx * dt; sat.y += sat.vy * dt;
      if (sat.x > W + 10) { sat = null; return; }
      ctx!.fillStyle = 'rgba(230,235,255,.8)';
      ctx!.fillRect(sat.x - 1, sat.y - 1, 2, 2);
      const b = Math.max(0, Math.sin(t * 5));
      ctx!.fillStyle = `hsla(${hh(0)},100%,80%,${b * 0.9})`;
      ctx!.beginPath(); ctx!.arc(sat.x + 3, sat.y, 1.6 + b, 0, 6.2832); ctx!.fill();
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv!.width = Math.floor(W * dpr);
      cv!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = W * H;
      // 별은 듬성듬성 — 이전의 절반 이하
      const mk = (n: number, rMin: number, rMax: number): Star[] =>
        Array.from({ length: n }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: rnd(rMin, rMax), a: rnd(0.4, 1),
          tw: Math.random() * Math.PI * 2, sp: rnd(0.4, 2),
          tint: Math.random() < 0.4,
        }));
      stars = [
        mk(Math.round(area / 14000), 0.3, 0.7),
        mk(Math.round(area / 34000), 0.6, 1.0),
        mk(Math.round(area / 100000), 0.9, 1.5),
      ];
      const nn = Math.min(34, Math.max(12, Math.round(area / 50000)));
      nodes = Array.from({ length: nn }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: rnd(-0.1, 0.1), vy: rnd(-0.1, 0.1), r: rnd(1.1, 1.9),
      }));
      const colW = 56;
      cols = Array.from({ length: Math.ceil(W / colW) }, (_, i) => ({
        x: i * colW + rnd(0, colW * 0.6),
        y: rnd(-H, H),
        sp: rnd(14, 34),
        chars: Array.from({ length: Math.floor(rnd(6, 14)) }, () =>
          Math.random() < 0.6 ? HEX[(Math.random() * 16) | 0] : GLYPH[(Math.random() * GLYPH.length) | 0]),
        t: 0,
      })).filter(() => Math.random() < 0.3);
      buildNebula();
      buildPlanet();
    }

    function spawnMeteor(x?: number, y?: number) {
      // 오른쪽 위 → 왼쪽 아래로 (각도 약간씩 다르게)
      const ang = rnd(Math.PI * 0.62, Math.PI * 0.72);
      const speed = rnd(520, 900);
      meteors.push({
        x: x ?? rnd(W * 0.15, W * 1.25),
        y: y ?? rnd(-80, H * 0.25),
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        len: rnd(90, 200), life: 0, max: rnd(0.9, 1.6), w: rnd(1, 1.9),
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
      if (!reduce) spawnMeteor(e.clientX + rnd(-40, 160), e.clientY - rnd(60, 160));
    }
    function onScroll(e: Event) {
      const t = e.target as HTMLElement | Document;
      if (t instanceof HTMLElement && t.id === 'appMain') scrollY = t.scrollTop;
    }

    function paintSky() {
      const bg = ctx!.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#03041a');
      bg.addColorStop(0.55, '#0a0b2e');
      bg.addColorStop(1, '#160f3d');
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);
    }

    function drawStatic() {
      paintSky();
      if (nebula) ctx!.drawImage(nebula, -160, -160, nebula.width * 2, nebula.height * 2);
      for (const layer of stars) for (const s of layer) {
        ctx!.fillStyle = s.tint ? `hsla(${hh(0)},85%,90%,${s.a})` : `rgba(255,248,252,${s.a})`;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, 6.2832); ctx!.fill();
      }
      if (isDesk()) drawPlanet(0);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (skinOn()) return; // 스킨 화면 — 가려져 있으니 그리지 않는다
      const t = now / 1000;
      m.sx += (m.nx - m.sx) * Math.min(1, dt * 3);
      m.sy += (m.ny - m.sy) * Math.min(1, dt * 3);

      paintSky();

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
          const a = (1 - i / c.chars.length) * 0.13;
          ctx!.fillStyle = i === 0 ? `hsla(${hh(0)},80%,92%,.3)` : `hsla(${hh(0)},60%,80%,${a})`;
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
          ctx!.fillStyle = s.tint ? `hsla(${hh(0)},85%,90%,${s.a * tw})` : `rgba(255,248,252,${s.a * tw})`;
          ctx!.beginPath(); ctx!.arc(x, y, s.r, 0, 6.2832); ctx!.fill();
          if (li === 2 && tw > 0.9) { // 밝은 별은 십자 반짝임
            ctx!.strokeStyle = `hsla(${hh(0)},90%,92%,${0.35 * (tw - 0.9) * 10})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(x - s.r * 5, y); ctx!.lineTo(x + s.r * 5, y);
            ctx!.moveTo(x, y - s.r * 5); ctx!.lineTo(x, y + s.r * 5);
            ctx!.stroke();
          }
        }
      }

      if (isDesk()) { drawPlanet(t); drawSat(dt, t); }

      // 성좌 네트워크 — 노드끼리, 그리고 커서와 이어진다
      const LINK = 170, LINK2 = LINK * LINK;
      const CUR = 190, CUR2 = CUR * CUR;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
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
            ctx!.strokeStyle = `hsla(${hh(0)},70%,86%,${(1 - d2 / LINK2) * 0.22})`;
            ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke();
          }
        }
        const mx = a.x - m.x, my = a.y - m.y, md2 = mx * mx + my * my;
        if (md2 < CUR2) {
          ctx!.strokeStyle = `hsla(${hh(-6)},95%,90%,${(1 - md2 / CUR2) * 0.55})`;
          ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(m.x, m.y); ctx!.stroke();
        }
      }
      for (const n of nodes) {
        const near = (n.x - m.x) ** 2 + (n.y - m.y) ** 2 < CUR2;
        ctx!.fillStyle = near ? `hsla(${hh(-6)},95%,94%,.95)` : `hsla(${hh(0)},60%,92%,.75)`;
        ctx!.shadowColor = near ? `hsla(${hh(-6)},100%,80%,.9)` : `hsla(${hh(0)},90%,80%,.6)`;
        ctx!.shadowBlur = near ? 10 : 5;
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, 6.2832); ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      // 유성 — 드문드문, 무리는 아주 가끔
      nextMeteor -= dt;
      if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = rnd(5, 10); }
      nextShower -= dt;
      if (nextShower <= 0) { showerLeft = Math.floor(rnd(4, 8)); showerGap = 0; nextShower = rnd(70, 120); }
      if (showerLeft > 0) {
        showerGap -= dt;
        if (showerGap <= 0) { spawnMeteor(); showerLeft--; showerGap = rnd(0.15, 0.4); }
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const mt = meteors[i];
        mt.life += dt; mt.x += mt.vx * dt; mt.y += mt.vy * dt;
        if (mt.life > mt.max || mt.x < -300 || mt.y > H + 300) { meteors.splice(i, 1); continue; }
        const k = Math.sin((mt.life / mt.max) * Math.PI);
        const sp = Math.hypot(mt.vx, mt.vy);
        const tx = mt.x - (mt.vx / sp) * mt.len, ty = mt.y - (mt.vy / sp) * mt.len;
        const g = ctx!.createLinearGradient(mt.x, mt.y, tx, ty);
        g.addColorStop(0, `hsla(${hh(-8)},100%,96%,${k})`);
        g.addColorStop(0.25, `hsla(${hh(0)},90%,82%,${k * 0.45})`);
        g.addColorStop(1, `hsla(${hh(0)},90%,75%,0)`);
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
        ctx!.strokeStyle = `hsla(${hh(-6)},95%,90%,${(1 - k) * 0.6})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, 8 + k * 90, 0, 6.2832); ctx!.stroke();
        ctx!.strokeStyle = `hsla(${hh(30)},80%,85%,${(1 - k) * 0.35})`;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, 4 + k * 55, 0, 6.2832); ctx!.stroke();
      }

      // 커서 주변 은은한 빛
      if (m.x > -999) {
        const gl = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, 130);
        gl.addColorStop(0, `hsla(${hh(0)},90%,85%,.10)`); gl.addColorStop(1, `hsla(${hh(0)},90%,85%,0)`);
        ctx!.fillStyle = gl; ctx!.fillRect(m.x - 130, m.y - 130, 260, 260);
      }
    }

    function start() {
      if (reduce || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function onVis() { if (document.hidden) stop(); else start(); }

    resize();
    if (reduce) drawStatic(); else start();

    // 테마(포인트색)가 바뀌면 색을 다시 읽는다
    let tt = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(tt);
      tt = window.setTimeout(() => {
        const h = readHue();
        if (h !== hue) { hue = h; buildNebula(); if (reduce) drawStatic(); }
      }, 200);
    });
    mo.observe(root, { attributes: true, attributeFilter: ['style'] });

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
      mo.disconnect();
      clearTimeout(rt); clearTimeout(tt);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="space-bg" />;
}
