'use client';
// 마이룸 화면 틀 — 옷장과 같은 구성. 둘 다 화면 가로 전체를 쓴다.
//  · variant='list' (방 목록): 머리줄·모서리 표식·큰 배경 글씨·바닥줄이 있는 「인덱스 틀」만
//  · variant='room' (방 안): 캐릭터 상세와 같은 배경 장식(반원·눈금·반짝이)만 — 스크롤해도 화면에 고정
import React from 'react';
import { RxHud, RxCoord, RxBio } from '@/components/rels/RxHud';
import { StageDeco } from '@/components/chars/StageDeco';
import { useBgInk } from '@/lib/useBgInk';

const CSS = `
.page.cl-stage-page{max-width:none;width:100%;margin:0;padding:0 0 80px;position:relative;animation:none}
.page.cl-stage-page>*{animation:none}
.cl-deco-wrap{position:sticky;top:0;height:0;z-index:0;pointer-events:none}
.cl-deco{position:absolute;left:0;right:0;top:0;height:calc(100vh - 58px);min-height:560px;overflow:hidden}
.cl-content{position:relative;z-index:1;padding:16px clamp(20px,3.4vw,64px) 0}
.cl-rx{--rx-ln:color-mix(in srgb,var(--page-title,#222) 26%,transparent);position:relative;margin-top:10px}
.cl-rx-body{position:relative;z-index:1;padding:44px 0 52px}
.cl-rx .rx-ghost{z-index:0}
.cl-stage-page .page-head .head-actions{display:flex;align-items:center;gap:8px;position:relative}
/* 목록 — 틀 안에서 카드를 왼쪽부터 놓는다 (예전엔 가운데 정렬) */
.cl-rx .myroom-wrap{padding:0;text-align:left}
.cl-rx .mr-room-grid{justify-content:start;margin-top:0}
@media (max-width:760px){
.cl-rx-body{padding:30px 0 36px}
}
`;

export function MyRoomShell({ variant, head, count = 0, children }: {
  variant: 'list' | 'room';       // list = 큰 배경 글씨 틀만 · room = 배경 장식만
  head?: React.ReactNode;         // 맨 위 제목줄(.page-head) — 방 안에서는 자체 상단바가 있어 비워 둔다
  count?: number;                 // list 머리줄 오른쪽 숫자
  children: React.ReactNode;
}) {
  const bgInk = useBgInk();       // 배경이 밝으면 장식도 밝은 쪽으로 (캐릭터 상세와 같은 규칙)
  const list = variant === 'list';
  const n = String(count).padStart(2, '0');
  return (
    <section className="page cl-stage-page">
      <style>{CSS}</style>
      {!list && (
        <div className="cl-deco-wrap" aria-hidden="true">
          <div className="cl-deco">
            <StageDeco mode="accent" tone={bgInk === 'dark' ? 'light' : 'dark'} ink={bgInk === 'dark' ? 'dark' : 'light'}
              tag="MY ROOM" name="MY ROOM" />
          </div>
        </div>
      )}
      <div className="cl-content">
        {head}
        {list ? (
          <div className="cl-rx">
            <i className="rx-fr tl" /><i className="rx-fr tr" /><i className="rx-fr bl" /><i className="rx-fr br" />
            <div className="rx-headline">
              <span className="rx-cap">MY ROOM ARCHIVE // ROOM INDEX</span>
              <RxCoord />
              <span className="rx-count"><em>ROOM</em><b>{n}</b></span>
            </div>
            <RxHud />
            <div className="cl-rx-body">{children}</div>
            <div className="rx-foot">
              <span className="rx-bar" aria-hidden="true" />
              <span className="rx-cap">MY ROOM FILE // {n}</span>
              <RxBio />
              <span className="rx-chev" aria-hidden="true">›››</span>
            </div>
          </div>
        ) : children}
      </div>
    </section>
  );
}
