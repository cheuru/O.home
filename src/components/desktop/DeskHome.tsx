'use client';
// 데스크톱 첫 화면 장식 (사용자 요청) — 창이 하나도 없을 때만 보인다.
//  · 가운데: 궤도 시계 — 초·분·시가 행성처럼 세 겹 궤도를 돈다 (가운데에 사이트 이름 + 디지털 시각)
//  · 왼쪽 위: 시스템 터미널 — 부팅 로그가 타이핑되고, 접속 시간(uptime)이 실시간으로 흐른다
// 전부 pointer-events:none — 아래 아이콘·창 조작을 가로막지 않는다.
import React, { useEffect, useRef, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/* ───────── 궤도 시계 ───────── */
const C = 250;                 // viewBox 중심 (500x500)
const R_SEC = 222, R_MIN = 176, R_HR = 130;

function OrbitClock({ title }: { title: string }) {
  const secRef = useRef<SVGGElement>(null);
  const minRef = useRef<SVGGElement>(null);
  const hrRef = useRef<SVGGElement>(null);
  const spinRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGCircleElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const circ = 2 * Math.PI * R_SEC;
    const paint = () => {
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      const sa = reduce ? Math.floor(s) * 6 : (s / 60) * 360;
      secRef.current?.setAttribute('transform', `rotate(${sa} ${C} ${C})`);
      minRef.current?.setAttribute('transform', `rotate(${(m / 60) * 360} ${C} ${C})`);
      hrRef.current?.setAttribute('transform', `rotate(${(h / 12) * 360} ${C} ${C})`);
      // 초 행성 뒤로 꼬리처럼 남는 호 (최근 ~12초)
      if (trailRef.current) {
        const len = circ * (12 / 60);
        trailRef.current.setAttribute('stroke-dasharray', `${len} ${circ}`);
        trailRef.current.setAttribute('transform', `rotate(${sa - 12 * 6 - 90} ${C} ${C})`);
      }
      if (!reduce) raf = requestAnimationFrame(paint);
    };
    paint();
    setNow(new Date());
    const iv = window.setInterval(() => setNow(new Date()), 1000);
    if (!reduce) raf = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);

  // 눈금 — 60개 (5의 배수는 길게)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    const r1 = R_SEC + 14, r2 = r1 + (long ? 9 : 4);
    return <line key={i} x1={C + Math.sin(a) * r1} y1={C - Math.cos(a) * r1} x2={C + Math.sin(a) * r2} y2={C - Math.cos(a) * r2}
      className={long ? 'tk long' : 'tk'} />;
  });

  return (
    <div className="dsk-orbit" aria-hidden="true">
      <svg viewBox="0 0 500 500">
        <defs>
          <radialGradient id="dskPlanet" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#ffd6e8" /><stop offset="1" stopColor="#c58bff" />
          </radialGradient>
          <filter id="dskGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {/* 천천히 도는 바깥 장식 링 */}
        <g ref={spinRef} className="spin"><circle cx={C} cy={C} r={R_SEC + 34} className="ring dash" /></g>
        <g>{ticks}</g>
        <circle cx={C} cy={C} r={R_SEC} className="ring" />
        <circle ref={trailRef} cx={C} cy={C} r={R_SEC} className="trail" strokeLinecap="round" />
        <circle cx={C} cy={C} r={R_MIN} className="ring" />
        <circle cx={C} cy={C} r={R_HR} className="ring" />
        <circle cx={C} cy={C} r={R_HR - 34} className="ring faint" />
        {/* 시 */}
        <g ref={hrRef}>
          <circle cx={C} cy={C - R_HR} r="11" className="halo hr" filter="url(#dskGlow)" />
          <circle cx={C} cy={C - R_HR} r="6.5" className="pl hr" />
        </g>
        {/* 분 */}
        <g ref={minRef}>
          <circle cx={C} cy={C - R_MIN} r="9" className="halo mn" filter="url(#dskGlow)" />
          <circle cx={C} cy={C - R_MIN} r="5" className="pl mn" />
        </g>
        {/* 초 */}
        <g ref={secRef}>
          <circle cx={C} cy={C - R_SEC} r="8" className="halo sc" filter="url(#dskGlow)" />
          <circle cx={C} cy={C - R_SEC} r="3.6" fill="url(#dskPlanet)" />
        </g>
      </svg>
      <div className="dsk-orbit-core">
        <b>{title.toUpperCase()}</b>
        <time>{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : '--:--'}<i>{now ? pad(now.getSeconds()) : '--'}</i></time>
        <span>{now ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} · ${DAYS[now.getDay()]}` : ''}</span>
      </div>
    </div>
  );
}

/* ───────── 시스템 터미널 ───────── */
const FLAVOR = [
  'scanning deep space ........ 3 objects',
  'signal received ✦ 안녕, 우주',
  'orbit stable · all systems nominal',
  'star map synced',
  'meteor shower forecast: low',
  'archive index OK',
  'listening on 0.0.0.0:∞',
  'ping andromeda ........ 2.5M ly',
];

function Terminal({ user, role }: { user: string; role: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [typing, setTyping] = useState('');
  const [up, setUp] = useState('00:00:00');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = Date.now();
    const fmt = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    };
    const iv = window.setInterval(() => setUp(fmt()), 1000);

    const boot = [
      'boot sequence ........ OK',
      'mount /archive ........ OK',
      `login: ${user} [${role}]`,
      'render starfield ........ OK',
      'system ready ✦',
    ];
    let alive = true;
    let timer = 0;
    const push = (l: string) => setLines(p => [...p, l].slice(-8));
    if (reduce) { boot.forEach(push); return () => { clearInterval(iv); }; }

    // 한 줄씩 타이핑 → 끝나면 줄 확정 → 다음 줄. 부팅이 끝난 뒤엔 가끔 한 줄씩 더 흘려 보낸다
    let q = [...boot], fi = 0;
    const typeLine = (text: string, done: () => void) => {
      let i = 0;
      const step = () => {
        if (!alive) return;
        i++; setTyping(text.slice(0, i));
        if (i < text.length) timer = window.setTimeout(step, 22 + Math.random() * 28);
        else timer = window.setTimeout(() => { setTyping(''); push(text); done(); }, 160);
      };
      step();
    };
    const next = () => {
      if (!alive) return;
      if (q.length) { const l = q.shift()!; timer = window.setTimeout(() => typeLine(l, next), 260); }
      else timer = window.setTimeout(() => { typeLine(FLAVOR[fi++ % FLAVOR.length], next); }, 4500 + Math.random() * 3500);
    };
    timer = window.setTimeout(next, 500);
    return () => { alive = false; clearTimeout(timer); clearInterval(iv); };
  }, [user, role]);

  return (
    <div className="dsk-term" aria-hidden="true">
      <div className="dsk-term-bar"><i /><i /><i /><span>terminal — {user}@home</span></div>
      <div className="dsk-term-body">
        {lines.map((l, i) => <p key={i}><em>&gt;</em> {l}</p>)}
        <p className="cur"><em>&gt;</em> {typing}<u /></p>
      </div>
      <div className="dsk-term-foot"><span>UPTIME</span><b>{up}</b></div>
    </div>
  );
}

export function DeskHome({ title, nickname, admin }: { title: string; nickname: string | null; admin: boolean }) {
  return (
    <div className="dsk-home">
      <Terminal user={(nickname || 'guest').toLowerCase()} role={admin ? 'admin' : 'member'} />
      <OrbitClock title={title} />
    </div>
  );
}
