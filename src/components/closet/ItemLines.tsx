'use client';
// 아이템 전용 대사 — 이 옷을 입었을 때 입은 쪽과 상대가 하는 말 (줄바꿈 = 랜덤, 비우면 기본 대사)
import React from 'react';
import type { ClosetItem } from '@/lib/closetStore';

type K = 's1' | 'r1' | 's2' | 'r2';

export function ItemLines({ item, names, onPatch }: { item: ClosetItem; names: [string, string]; onPatch: (p: Partial<ClosetItem>) => void }) {
  const [a, b] = names;
  const rows: [K, string][] = [
    ['s1', `${a} 착용 → ${a}`], ['r1', `${a} 착용 → ${b} 반응`],
    ['s2', `${b} 착용 → ${b}`], ['r2', `${b} 착용 → ${a} 반응`],
  ];
  const filled = rows.filter(([k]) => (item[k] || '').trim()).length;
  return (
    <details className="item-lines">
      <summary>전용 대사{filled ? ` (${filled})` : ''}</summary>
      {rows.map(([k, label]) => (
        <label key={k} className="item-lines-row">
          <span>{label}</span>
          <textarea className="k-input" rows={2} defaultValue={item[k] || ''} key={`${item.id}:${k}:${item[k] || ''}`}
            placeholder="비우면 기본 대사 · 줄바꿈 = 랜덤"
            onBlur={e => { const v = e.target.value; if (v !== (item[k] || '')) onPatch({ [k]: v } as Partial<ClosetItem>); }} />
        </label>
      ))}
    </details>
  );
}
