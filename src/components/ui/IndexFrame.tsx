'use client';
// 목록 페이지 공통 「인덱스 틀」 — 모서리 표식 · 머리줄(이름 + 개수) · 바닥줄을 한 곳에서 그린다.
// 모든 목록(캐릭터·자관·옷장·게시판·갤러리 …)이 같은 틀 안에 놓이게 하는 부품이다. 본문은 그대로 children 에 둔다.
//
//   <div className="page-head">…</div>
//   <IndexFrame cap="BOARD ARCHIVE // POST INDEX" label="POSTS" count={visible.length} foot="BOARD FILE">
//     …본문(검색줄·표·카드 등)…
//   </IndexFrame>
//
// deco
//   'frame' (기본) — 얇은 선 틀만. 조용하다 (표·줄 목록, 글을 읽는 화면)
//   'full'         — 틀 + 좌표 조준·눈금자·막대·좌표 숫자·바이오리듬 (카드 목록처럼 여백이 있는 화면)
import React from 'react';
import { RxHud, RxCoord, RxBio } from '@/components/rels/RxHud';
import './indexframe.css';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function IndexFrame({ cap, label, count, foot, deco = 'frame', children }: {
  /** 머리줄 왼쪽 글자 — 「○○ ARCHIVE // ○○ INDEX」 */
  cap: string;
  /** 머리줄 오른쪽 이름 — 개수 앞에 붙는다 (예: POSTS) */
  label: string;
  /** 개수 — 없으면 숫자를 그리지 않는다 */
  count?: number;
  /** 바닥줄 글자 — 개수가 있으면 「 // 07」이 뒤에 붙는다 */
  foot: string;
  deco?: 'frame' | 'full';
  children: React.ReactNode;
}) {
  const full = deco === 'full';
  const n = count === undefined ? '' : pad2(count);
  return (
    <div className={`rx ixf${full ? ' ixf-full' : ''}`}>
      <i className="rx-fr tl" /><i className="rx-fr tr" /><i className="rx-fr bl" /><i className="rx-fr br" />
      <div className="rx-headline">
        <span className="rx-cap">{cap}</span>
        {full && <RxCoord />}
        {n && <span className="rx-count"><em>{label}</em><b>{n}</b></span>}
      </div>
      {full && <RxHud />}
      <div className="ixf-body">{children}</div>
      <div className="rx-foot">
        <span className="rx-bar" aria-hidden="true" />
        <span className="rx-cap">{n ? `${foot} // ${n}` : foot}</span>
        {full && <RxBio />}
        <span className="rx-chev" aria-hidden="true">›››</span>
      </div>
    </div>
  );
}
