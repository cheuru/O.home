'use client';
// 데스크톱 창(iframe) 안 페이지용 편집 도구줄.
// 편집모드 켜기·「＋ 위젯」·그리드·편집 종료는 원래 상단바(TopBar)에 있었는데,
// 데스크톱 창 안에서는 상단바를 감추기 때문에(HideInEmbed) 위젯 꾸미기에 들어갈 방법이 사라져 있었다.
// 그래서 창 안에서만 오른쪽 위에 작은 도구줄을 띄워 같은 기능(useMainStore)을 그대로 쓴다.
// 관리자이고, 편집모드를 지원하는 페이지(메인·캐릭터·자관 …)일 때만 보인다.
import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useMainStore } from '@/lib/mainStore';
import { useEmbedded } from '@/lib/useEmbedded';
import { KToggle } from '@/components/ui/Kit';

export function EmbedEditBar() {
  const embedded = useEmbedded();
  const { isAdmin } = useAuth();
  const { editOn, editAvailable, gridOn, setGridOn, toggleEdit, requestExit } = useMainStore();
  const pathname = usePathname();
  if (!embedded || !isAdmin || !(editAvailable || editOn)) return null;

  return (
    <div className={`emb-edit ${editOn ? 'on' : ''}`} role="toolbar" aria-label="편집 도구">
      {editOn ? (
        <>
          {pathname === '/' && (
            <button type="button" onClick={() => window.dispatchEvent(new Event('ohome-add-widget'))}>＋ 위젯</button>
          )}
          <KToggle className="grid-chip show" label="그리드" checked={gridOn} onChange={setGridOn} />
          <button type="button" className="end" onClick={() => requestExit()} data-tip="저장 후 종료 / 취소를 고를 수 있어요">✎ 편집중 · 종료</button>
        </>
      ) : (
        <button type="button" onClick={() => toggleEdit()} data-tip="위젯 추가·이동·꾸미기">✎ 편집모드</button>
      )}
    </div>
  );
}
