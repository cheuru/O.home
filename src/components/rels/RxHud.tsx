'use client';
// 인덱스 틀(.rx) 장식 — 단말기 화면처럼 돌고·훑고·좌표를 잡고·맥박이 뛰는 얇은 선 장식.
// 이미지(png/apng) 대신 SVG + CSS 로 그려서 ① 테마 포인트색(--accent)을 그대로 따르고 ② 확대해도 선명하고
// ③ 용량이 거의 없고 ④ 「동작 줄이기」 설정에서 알아서 멈춘다.
//
// 쓰는 법 (.rx 안에서)
//   <RxHud />                         → 맨 뒤 장식층 (스캔선 · 레이더 · 좌표 조준 · 눈금자 · 막대). 카드 뒤에 깔리고 클릭을 받지 않는다
//   <RxCoord />                       → 머리줄 가운데 좌표 숫자
//   <RxPulse />                       → 바닥줄 가운데 심박(바이오그래프) 선
import React, { useEffect, useState } from 'react';
import './rxhud.css';

/** 눈금 링 — 원 둘레에 짧은 선을 n개 (긴 눈금은 every 번째마다) */
function ticks(n: number, r: number, short: number, long: number, every: number) {
  const out: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, L = i % every === 0 ? long : short;
    const x1 = 100 + Math.sin(a) * r, y1 = 100 - Math.cos(a) * r;
    const x2 = 100 + Math.sin(a) * (r - L), y2 = 100 - Math.cos(a) * (r - L);
    out.push(<line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)}
      strokeWidth={i % every === 0 ? 1.1 : 0.6} />);
  }
  return out;
}

/** 숫자가 계속 바뀌는 값 — 동작 줄이기면 고정 */
function useJitter(make: () => string, ms: number) {
  const [v, setV] = useState(make);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setV(make()), ms);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
  return v;
}
const rnd = (a: number, b: number, d = 4) => (a + Math.random() * (b - a)).toFixed(d);

/** 머리줄 좌표 숫자 — 조준점이 새 자리를 잡을 때마다 같이 바뀐다 */
export function RxCoord() {
  const t = useJitter(() => `X ${rnd(100, 140)}  Y ${rnd(20, 60)}`, 2200);
  return <span className="rx-coord" aria-hidden="true"><i />{t}</span>;
}

/** 바닥줄 심박선 — 같은 모양 한 토막을 두 번 이어 붙여 끊김 없이 흘려보낸다 */
export function RxPulse() {
  const bpm = useJitter(() => String(Math.round(66 + Math.random() * 18)), 1400);
  // 한 토막: 평평 → 작은 P → 큰 R(QRS) → T → 평평. 폭 120
  const beat = 'M0 12 H18 q4 -4 8 0 H36 l3 3 l4 -20 l4 24 l3 -7 H62 q6 -6 12 0 H120';
  return (
    <span className="rx-pulse" aria-hidden="true">
      <svg className="rx-pulse-svg" viewBox="0 0 240 24" preserveAspectRatio="none">
        <g className="rx-pulse-run">
          <path d={beat} />
          <path d={beat} transform="translate(120 0)" />
          <path d={beat} transform="translate(240 0)" />
        </g>
      </svg>
      <b>{bpm}<small> BPM</small></b>
    </span>
  );
}

/** 카드 뒤에 깔리는 장식층 */
export function RxHud() {
  const sig = useJitter(() => `SIG ${rnd(0, 99.99, 2).padStart(5, '0')}%`, 1700);
  const az = useJitter(() => `AZ ${String(Math.floor(Math.random() * 360)).padStart(3, '0')}°`, 2300);
  return (
    <div className="rx-hud" aria-hidden="true">
      {/* 위에서 아래로 훑는 스캔선 */}
      <div className="rx-hud-scan" />

      {/* 레이더 — 눈금 링이 서로 반대로 돌고, 부채꼴이 한 바퀴씩 쓸고 지나간다 */}
      <div className="rx-hud-radar">
        <div className="rx-hud-sweep" />
        <svg viewBox="0 0 200 200">
          <g className="hr-spin a" fill="none" stroke="currentColor">{ticks(72, 96, 3, 7, 6)}</g>
          <g className="hr-spin b" fill="none" stroke="currentColor" strokeDasharray="2 5">
            <circle cx="100" cy="100" r="78" strokeWidth="0.8" />
          </g>
          <g fill="none" stroke="currentColor" strokeWidth="0.7" opacity=".7">
            <circle cx="100" cy="100" r="58" />
            <circle cx="100" cy="100" r="34" />
            <line x1="100" y1="4" x2="100" y2="196" />
            <line x1="4" y1="100" x2="196" y2="100" />
          </g>
          <g className="hr-spin c" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M100 18 l-5 8 h10 z" fill="currentColor" stroke="none" />
            <path d="M40 100 a60 60 0 0 1 14 -38" />
            <path d="M160 100 a60 60 0 0 1 -14 38" />
          </g>
          {/* 반짝이는 점 — 부채꼴이 지나갈 즈음 켜진다 */}
          <circle className="hr-blip b1" cx="140" cy="62" r="2.4" />
          <circle className="hr-blip b2" cx="64" cy="128" r="2" />
          <circle className="hr-blip b3" cx="118" cy="146" r="1.8" />
          <circle cx="100" cy="100" r="2.2" fill="currentColor" />
        </svg>
        <span className="rx-hud-lab t">{az}</span>
        <span className="rx-hud-lab b">{sig}</span>
      </div>

      {/* 좌표 조준 — 십자선이 이곳저곳을 찾아다니다 한 자리에 잠기며 깜빡인다 */}
      <div className="rx-hud-lock">
        <i className="lk-h" /><i className="lk-v" />
        <b className="lk-box"><u /><u /><u /><u /></b>
        <span className="lk-txt">LOCK</span>
      </div>

      {/* 오른쪽 눈금자 + 위아래로 오가는 표식 */}
      <div className="rx-hud-ruler">
        <svg viewBox="0 0 24 300" preserveAspectRatio="none">
          <g stroke="currentColor" fill="none">
            {Array.from({ length: 31 }, (_, i) => (
              <line key={i} x1={24} x2={i % 5 === 0 ? 10 : 17} y1={i * 10} y2={i * 10} strokeWidth={i % 5 === 0 ? 1 : .6} />
            ))}
          </g>
        </svg>
        <em className="rx-hud-mark" />
      </div>

      {/* 아래 왼쪽 막대 — 신호 세기처럼 제각각 오르내린다 */}
      <div className="rx-hud-bars">
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ['--d' as string]: `${(i * 0.37) % 2.1}s`, ['--s' as string]: `${1.1 + (i % 5) * 0.28}s` }} />)}
      </div>
    </div>
  );
}
