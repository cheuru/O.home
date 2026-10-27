'use client';
// 옷입히기 캔버스 — 화면 표시 + 드래그 이동 + PNG 저장
import React, { useRef } from 'react';
import { useBlobUrl, getBlob } from '@/lib/blobStore';
import {
  buildDrawList, type DressBody, type DressCat, type DressPart, type DressState,
} from '@/lib/dressupStore';

export type DragTarget = 'part' | 'slot';

function LayerImg({ fileRef, dx, dy, s }: { fileRef: string; dx: number; dy: number; s: number }) {
  const url = useBlobUrl(fileRef);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="dr-layer" src={url} alt="" draggable={false}
    style={{ transform: `translate(${dx}%, ${dy}%) scale(${s})` }} />;
}

export function DressStage({
  state, bodies, parts, cats, stageW, stageH, activeSlot, activeCat, target, onMove,
}: {
  state: DressState; bodies: DressBody[]; parts: DressPart[]; cats: DressCat[];
  stageW: number; stageH: number;
  activeSlot: number; activeCat: string; target: DragTarget;
  /** 드래그 결과 — 퍼센트 단위 이동량 (이미 배율·반전 보정됨) */
  onMove: (slot: number, target: DragTarget, dx: number, dy: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const slotCount = state.mode === 'pair' ? 2 : 1;

  const down = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = ref.current?.getBoundingClientRect();
    if (!d || !box) return;
    const px = e.clientX - d.x;
    const py = e.clientY - d.y;
    drag.current = { x: e.clientX, y: e.clientY };
    let dx = (px / box.width) * 100;
    let dy = (py / box.height) * 100;
    if (target === 'part') {
      // 파츠는 캐릭터 안쪽 좌표라 캐릭터 배율·반전을 되돌려 준다
      const sl = state.slots[activeSlot];
      dx = (dx / (sl.sc || 1)) * (sl.flip ? -1 : 1);
      dy = dy / (sl.sc || 1);
    }
    onMove(activeSlot, target, dx, dy);
  };
  const up = () => { drag.current = null; };

  return (
    <div ref={ref} className="dr-stage" style={{ aspectRatio: `${stageW} / ${stageH}` }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {state.slots.slice(0, slotCount).map((sl, i) => (
        <div key={i} className={`dr-slot ${i === activeSlot && slotCount > 1 ? 'on' : ''}`}
          style={{ transform: `translate(${sl.ox}%, ${sl.oy}%) scale(${sl.flip ? -sl.sc : sl.sc}, ${sl.sc})` }}>
          {buildDrawList(sl, bodies, parts, cats).map(it => (
            <LayerImg key={it.key} fileRef={it.ref} dx={it.dx} dy={it.dy} s={it.s} />
          ))}
        </div>
      ))}
      {!state.slots[0].bodyId && <div className="dr-empty">몸통을 선택해 주세요</div>}
      {/* 선택 중인 카테고리 표시 — 어떤 걸 움직이는지 헷갈리지 않게 */}
      {target === 'part' && activeCat && <span className="dr-hint">{cats.find(c => c.id === activeCat)?.name} 이동 중</span>}
      {target === 'slot' && <span className="dr-hint">캐릭터 전체 이동 중</span>}
    </div>
  );
}

/* ---------- PNG 저장 ---------- */
async function resolveUrl(ref: string): Promise<string> {
  if (/^(https?:|data:)/.test(ref)) return ref;
  const b = await getBlob(ref);
  if (!b) throw new Error('파일을 찾지 못했어요');
  return URL.createObjectURL(b);
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('이미지를 불러오지 못했어요'));
    im.src = url;
  });
}

/** 현재 상태를 PNG Blob으로 — 배경은 투명. 원격 이미지는 서버가 CORS를 허용해야 저장된다 */
export async function exportPng(
  state: DressState, bodies: DressBody[], parts: DressPart[], cats: DressCat[],
  W: number, H: number, scale = 2,
): Promise<Blob> {
  const cv = document.createElement('canvas');
  cv.width = W * scale; cv.height = H * scale;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('캔버스를 만들지 못했어요');
  ctx.scale(scale, scale);
  const slotCount = state.mode === 'pair' ? 2 : 1;
  for (const sl of state.slots.slice(0, slotCount)) {
    for (const it of buildDrawList(sl, bodies, parts, cats)) {
      const im = await loadImg(await resolveUrl(it.ref));
      ctx.save();
      // 화면(CSS)과 같은 순서: 캐릭터 변환 → 파츠 변환 → contain으로 맞춰 그리기
      ctx.translate(W / 2 + (sl.ox / 100) * W, H / 2 + (sl.oy / 100) * H);
      ctx.scale(sl.flip ? -sl.sc : sl.sc, sl.sc);
      ctx.translate(-W / 2, -H / 2);
      ctx.translate(W / 2 + (it.dx / 100) * W, H / 2 + (it.dy / 100) * H);
      ctx.scale(it.s, it.s);
      ctx.translate(-W / 2, -H / 2);
      const k = Math.min(W / im.naturalWidth, H / im.naturalHeight);
      const w = im.naturalWidth * k;
      const h = im.naturalHeight * k;
      ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
      ctx.restore();
    }
  }
  return new Promise((res, rej) => {
    try {
      cv.toBlob(b => (b ? res(b) : rej(new Error('PNG 변환 실패'))), 'image/png');
    } catch {
      rej(new Error('이미지 서버가 저장을 허용하지 않아요 (CORS 설정 필요)'));
    }
  });
}
