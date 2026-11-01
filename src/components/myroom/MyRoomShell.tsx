'use client';
// 마이룸 화면 틀 — 옷장과 같은 구성. 목록(list)은 자관·캐릭터와 같은 표준 폭(.page), 방 안(room)만 화면 가로 전체.
//  · variant='list' (방 목록): 머리줄·모서리 표식·큰 배경 글씨·바닥줄이 있는 「인덱스 틀」만
//  · variant='room' (방 안): 배경 장식 없음 (예전엔 반원·눈금·반짝이 장식이 있었음)
import React from 'react';
import { RxHud, RxCoord, RxBio } from '@/components/rels/RxHud';

const CSS = `
.page.cl-stage-page{max-width:none;width:100%;margin:0;padding:0 0 80px;position:relative;animation:none}
.page.cl-stage-page>*{animation:none}
.cl-content{position:relative;z-index:1;padding:16px clamp(20px,3.4vw,64px) 0}
.cl-content.list{padding:0}
/* 목록 틀의 선 색은 자관·캐릭터 목록(.rx)과 같게 — 선 색 변수를 따로 두지 않는다 */
.cl-rx{position:relative;margin-top:10px}
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
  variant: 'list' | 'room';       // list = 큰 배경 글씨 틀만 · room = 장식 없음
  head?: React.ReactNode;         // 맨 위 제목줄(.page-head) — 방 안에서는 자체 상단바가 있어 비워 둔다
  count?: number;                 // list 머리줄 오른쪽 숫자
  children: React.ReactNode;
}) {
  const list = variant === 'list';
  const n = String(count).padStart(2, '0');
  return (
    <section className={list ? 'page' : 'page cl-stage-page'}>
      <style>{CSS}</style>
      <div className={list ? 'cl-content list' : 'cl-content'}>
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
