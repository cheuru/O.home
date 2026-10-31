'use client';
// 룩북 — 저장해 둔 코디 모음. 카드를 누르면 두 캐릭터에게 그 코디를 입힌다.
// 미리보기는 저장된 아이템 id로 그때그때 겹쳐 그린다(이미지를 따로 저장하지 않는다).
import React from 'react';
import type { ClosetData, ClosetLook, LookEntry } from '@/lib/closetStore';

function Mini({ data, entries, bg, cid }: { data: ClosetData; entries: LookEntry[]; bg?: string; cid: 1 | 2 }) {
  const d = data.design;
  const w = cid === 1 ? d.char1Width : d.char2Width, h = cid === 1 ? d.char1Height : d.char2Height;
  const body = (cid === 1 ? d.char1Bodies : d.char2Bodies)[0];
  const s = 118 / h;                                   // 카드 안 높이를 118px로 맞춘다
  const layers = entries
    .map(e => ({ it: data.items.find(i => i.id === e.i), z: e.z }))
    .filter((x): x is { it: NonNullable<typeof x.it>; z: number } => !!x.it)
    .sort((a, b) => a.z - b.z);
  const bgSrc = bg ? data.items.find(i => i.id === bg)?.src : undefined;
  return (
    <div style={{ width: w * s, height: h * s, overflow: 'hidden', borderRadius: 6, position: 'relative', flex: 'none' }}>
      <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: 'top left', position: 'relative',
        ...(bgSrc ? { backgroundImage: `url('${bgSrc}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={body} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 10 }} />
        {layers.map((x, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={x.it.src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: x.z }} />
        ))}
      </div>
    </div>
  );
}

export function Lookbook({ data, canEdit, onLoad, onAsk, onDelete }: {
  data: ClosetData; canEdit: boolean; onLoad: (l: ClosetLook) => void; onAsk: () => void; onDelete: (l: ClosetLook) => void;
}) {
  if (!data.looks.length && !canEdit) return null;
  return (
    <section className="cl-lookbook">
      <div className="cl-lookbook-head">
        <span>룩북</span>
        {canEdit && <button type="button" className="btn_custom" onClick={onAsk}>현재 코디 저장</button>}
      </div>
      {!data.looks.length && <p className="cl-lookbook-empty">마음에 드는 코디를 입혀 놓고 「현재 코디 저장」을 눌러 보세요.</p>}
      <div className="cl-lookbook-list">
        {data.looks.map(l => (
          <div key={l.id} className="cl-look">
            <button type="button" className="cl-look-card" onClick={() => onLoad(l)} title="누르면 이 코디를 입혀요">
              <div className="cl-look-pair">
                <Mini data={data} entries={l.c1} bg={l.b1} cid={1} />
                <Mini data={data} entries={l.c2} bg={l.b2} cid={2} />
              </div>
              <div className="cl-look-name">{l.name}</div>
            </button>
            {canEdit && <button type="button" className="cl-look-del" title="이 코디 지우기" onClick={() => onDelete(l)}>✕</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
