'use client';
// 옷장 화면 틀 — 자관·캐릭터 화면과 같은 느낌으로 감싼다. 둘 다 화면 가로 전체를 쓴다.
//  · variant='list' (옷장 목록): 머리줄·모서리 표식·큰 배경 글씨·바닥줄이 있는 「인덱스 틀」만
//  · variant='room' (옷장 안): 스테이지 배경 장식(격자·큰 판·반짝이)만 — 스크롤해도 화면에 고정
// 장식·틀 스타일은 globals.css의 .cs-deco / .rx-* 를 그대로 쓰고, 옷장 전용 배치만 여기 CSS에 둔다.
import React from 'react';
import { StageDeco } from '@/components/chars/StageDeco';
import { useBgInk } from '@/lib/useBgInk';

const CSS = `
.page.cl-stage-page{max-width:none;width:100%;margin:0;padding:0 0 80px;position:relative;animation:none}
.page.cl-stage-page>*{animation:none}
/* 장식 — 높이 0짜리 sticky 칸 안에 화면 크기 판을 얹어, 스크롤해도 장식이 제자리에 남는다 */
.cl-deco-wrap{position:sticky;top:0;height:0;z-index:0;pointer-events:none}
.cl-deco{position:absolute;left:0;right:0;top:0;height:calc(100vh - 58px);min-height:560px;overflow:hidden}
.cl-content{position:relative;z-index:1;padding:16px clamp(20px,3.4vw,64px) 0}
.cl-rx{--rx-ln:color-mix(in srgb,var(--page-title,#222) 26%,transparent);position:relative;margin-top:10px}
.cl-rx-body{position:relative;z-index:1;padding:44px 0 52px}
.cl-rx .rx-ghost{z-index:0}
@media (max-width:760px){
.cl-rx-body{padding:30px 0 36px}
}
`;

export function ClosetShell({ head, variant, count = 0, children }: {
  head: React.ReactNode;          // 맨 위 제목줄(.page-head)
  variant: 'list' | 'room';       // list = 큰 배경 글씨 틀만 · room = 배경 장식만
  count?: number;                 // list 머리줄 오른쪽 숫자
  children: React.ReactNode;
}) {
  const bgInk = useBgInk();       // 배경이 밝으면 장식도 밝은 쪽으로 (캐릭터·자관 상세와 같은 규칙)
  const light = bgInk === 'dark';
  const n = String(count).padStart(2, '0');
  const list = variant === 'list';
  return (
    <section className="page cl-stage-page">
      <style>{CSS}</style>
      {!list && (
        <div className="cl-deco-wrap" aria-hidden="true">
          <div className="cl-deco">
            <StageDeco mode="accent" shape="tile" noChrome tone={light ? 'light' : 'dark'} ink={light ? 'dark' : 'light'}
              name="CLOSET" />
          </div>
        </div>
      )}
      <div className="cl-content">
        {head}
        {list ? (
          <div className="cl-rx">
            <i className="rx-fr tl" /><i className="rx-fr tr" /><i className="rx-fr bl" /><i className="rx-fr br" />
            <div className="rx-headline">
              <span className="rx-cap">CLOSET ARCHIVE // PAIR INDEX</span>
              <span className="rx-count"><em>CLOSET</em><b>{n}</b></span>
            </div>
            <div className="rx-ghost" aria-hidden="true">CLOSET</div>
            <div className="cl-rx-body">{children}</div>
            <div className="rx-foot">
              <span className="rx-bar" aria-hidden="true" />
              <span className="rx-cap">CLOSET FILE // {n}</span>
              <span className="rx-chev" aria-hidden="true">›››</span>
            </div>
          </div>
        ) : children}
      </div>
    </section>
  );
}
