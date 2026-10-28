'use client';
// 옷입히기 방 — 「페어의 옷장」: 두 명을 나란히 세우고 옷을 끌어다 놓거나 더블클릭해서 입힌다
// 원본: 우초맨 (https://uchoman.ivyro.net/) · 효과음: 셀바이뮤직
import React, { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList } from '@/lib/postStore';
import { useBlobUrl } from '@/lib/blobStore';
import {
  PART_KEY, PART_SEED, DEFAULT_LINES, isDefaultWear, useDressSettings,
  type DressCat, type DressPart, type DressRoom as RoomT,
} from '@/lib/dressupStore';
import { PairChar, type CharEls, type Sfx, type WornItem } from '@/lib/dressupChar';
import { loadImage, resolveRefUrl } from './DressStage';
import { PageTitle } from '@/components/ui/PageText';
import { useToast } from '@/components/ui/Toast';
import '../../app/dressup/dressup.css';

/* ---------- 작은 조각들 ---------- */
function useFaces(refs: string[]): string[] {
  const a = useBlobUrl(refs[0] || undefined);
  const b = useBlobUrl(refs[1] || undefined);
  const c = useBlobUrl(refs[2] || undefined);
  const d = useBlobUrl(refs[3] || undefined);
  const e = useBlobUrl(refs[4] || undefined);
  return [a, b, c, d, e].map(x => x || '');
}

const FX_CLASS: Record<string, string> = {
  'fly-down': 'anim-fly-down', 'fly-up': 'anim-fly-up', 'in-up': 'anim-fly-in-up', 'in-down': 'anim-fly-in-down',
};

function WornLayer({ item, part }: { item: WornItem; part: DressPart }) {
  const url = useBlobUrl(part.img);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`dp-worn ${item.fx ? FX_CLASS[item.fx] : ''}`} src={url} alt="" draggable={false} style={{ zIndex: item.z }} />;
}

function Thumb({ fileRef, className, title }: { fileRef: string; className?: string; title?: string }) {
  const url = useBlobUrl(fileRef);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img className={className} src={url} alt="" title={title} draggable={false} /> : <span className={className} />;
}

let SFX_CACHE: Partial<Record<Sfx, HTMLAudioElement>> = {};
function playSfx(n: Sfx) {
  try {
    const a = SFX_CACHE[n] ?? (SFX_CACHE[n] = new Audio(`/dressup/sfx/${n}.mp3`));
    a.currentTime = 0;
    void a.play().catch(() => { /* 자동재생 차단 — 무시 */ });
  } catch { /* 소리가 없어도 동작 */ }
}

const dblKey = { auto: 'auto', a: 1, b: 2 } as const;

/* ---------- 방 ---------- */
export default function DressRoom({ roomId }: { roomId: string }) {
  const { user, isAdmin } = useAuth();
  const [set, , setLoaded] = useDressSettings();
  const [partsAll, , pLoaded] = useLocalList<DressPart>(PART_KEY, PART_SEED);
  const room = set.rooms.find(r => r.id === roomId);

  if (!setLoaded || !pLoaded) return <section className="page" />;
  if (!room) {
    return (
      <section className="page">
        <div className="page-head"><PageTitle>DRESS UP</PageTitle><p>방을 찾을 수 없어요</p>
          <div className="head-actions"><Link className="btn btn-dark" href="/dressup">← 방 목록</Link></div></div>
      </section>
    );
  }
  const parts = partsAll.filter(p => p.roomId === room.id && (p.status === 'approved' || (!!user && p.authorId === user.id)));
  return <Inner key={room.id} room={room} cats={set.cats} parts={parts} canManage={isAdmin || (!!user && set.allowMemberParts)} isAdmin={isAdmin} />;
}

function Inner({ room, cats, parts, canManage, isAdmin }: { room: RoomT; cats: DressCat[]; parts: DressPart[]; canManage: boolean; isAdmin: boolean }) {
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);

  // 최신 값을 컨트롤러가 읽게 ref 로 들고 있는다
  const roomRef = useRef(room); roomRef.current = room;
  const catsRef = useRef(cats); catsRef.current = cats;
  const partsRef = useRef(parts); partsRef.current = parts;
  const dragging = useRef(false);

  const facesA = useFaces(room.chars[0].faces);
  const facesB = useFaces(room.chars[1].faces);
  const facesRef = useRef<string[][]>([facesA, facesB]); facesRef.current = [facesA, facesB];

  const ctls = useRef<[PairChar, PairChar] | null>(null);
  if (!ctls.current) {
    const mk = (cid: 1 | 2) => new PairChar(cid, {
      faceUrl: n => facesRef.current[cid - 1][n - 1] ?? '',
      line: k => roomRef.current.chars[cid - 1].lines[k] ?? DEFAULT_LINES[k] ?? '',
      list: k => (roomRef.current.chars[cid - 1].lines[k] ?? DEFAULT_LINES[k] ?? '').split('\n').map(s => s.trim()).filter(Boolean),
      cat: id => catsRef.current.find(c => c.id === id),
      partZ: id => partsRef.current.find(p => p.id === id)?.z,
      defaults: () => partsRef.current
        .filter(p => p.status === 'approved' && isDefaultWear(p, (cid - 1) as 0 | 1))
        .map(p => ({ partId: p.id, catId: p.catId, z: p.z ?? catsRef.current.find(c => c.id === p.catId)?.z ?? 20 }))
        .filter(d => !catsRef.current.find(c => c.id === d.catId)?.bg),
      other: () => ctls.current?.[cid === 1 ? 1 : 0],
      sfx: playSfx,
      dragging: () => dragging.current,
      sync: bump,
    });
    ctls.current = [mk(1), mk(2)];
  }
  const [c1, c2] = ctls.current;
  const ctlOf = (n: 1 | 2) => (n === 1 ? c1 : c2);

  // DOM 연결 (컨트롤러가 직접 클래스를 바꾸는 요소들)
  const mkEls = () => ({ cv: useRef<HTMLDivElement>(null), bubble: useRef<HTMLDivElement>(null), blush: useRef<HTMLDivElement>(null),
    sweat: useRef<HTMLDivElement>(null), cloud: useRef<HTMLDivElement>(null), body: useRef<HTMLImageElement>(null), zone: useRef<HTMLDivElement>(null) });
  const refsA = mkEls();
  const refsB = mkEls();
  useLayoutEffect(() => {
    ([[c1, refsA], [c2, refsB]] as const).forEach(([c, r]) => {
      const els: CharEls = { cv: r.cv.current, bubble: r.bubble.current, blush: r.blush.current, sweat: r.sweat.current, cloud: r.cloud.current, body: r.body.current };
      c.els = els;
    });
  });

  // 처음 들어왔을 때 인사 + 기본 코디
  useEffect(() => {
    c1.init(); c2.init();
    return () => { c1.destroy(); c2.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 표정 그림이 뒤늦게 준비되면 반영
  const faceKey = [...facesA, ...facesB].join('|');
  useEffect(() => { c1.refreshFace(); c2.refreshFace(); }, [faceKey, c1, c2]);

  // 배경 (캐릭터별)
  const [bg, setBg] = useState<[string, string]>(['', '']);
  const bgUrlA = useBlobUrl(bg[0] || undefined);
  const bgUrlB = useBlobUrl(bg[1] || undefined);
  const bgUrls = useRef<string[]>(['', '']); bgUrls.current = [bgUrlA || '', bgUrlB || ''];
  const [bgAsk, setBgAsk] = useState<DressPart | null>(null);

  // 옷장 상태
  const [tab, setTab] = useState(cats[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [dbl, setDbl] = useState<'auto' | 'a' | 'b'>('auto');
  const curTab = cats.some(c => c.id === tab) ? tab : cats[0]?.id ?? '';
  const curCat = cats.find(c => c.id === curTab);

  const wornIds = new Set([...c1.worn, ...c2.worn].map(w => w.partId));
  const list = useMemo(
    () => parts.filter(p => p.catId === curTab && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))),
    [parts, curTab, q],
  );

  /* ---------- 입히기 ---------- */
  const wearOn = (n: 1 | 2, part: DressPart) => {
    const cat = cats.find(c => c.id === part.catId); if (!cat) return;
    if (cat.bg) { setBgAsk(part); return; }
    ctlOf(n).wear(part.id, part.catId);
  };

  const dblWear = (part: DressPart) => {
    const cat = cats.find(c => c.id === part.catId);
    if (cat?.bg) { setBgAsk(part); return; }
    const n: 1 | 2 = dbl !== 'auto' ? dblKey[dbl] : part.who === 'b' ? 2 : 1;
    const c = ctlOf(n);
    const on = c.worn.find(w => w.partId === part.id);
    if (on) c.takeOff(on.uid); else c.wear(part.id, part.catId);
  };

  const applyBg = (who: 'a' | 'b' | 'both', part: DressPart) => {
    playSfx('blop');
    setBg(b => [who === 'b' ? b[0] : part.img, who === 'a' ? b[1] : part.img]);
    setBgAsk(null);
  };

  /* ---------- 끌어다 놓기 (마우스·터치 공용) ---------- */
  const [ghost, setGhost] = useState<{ x: number; y: number; part: DressPart } | null>(null);
  const press = useRef<{ part: DressPart; x: number; y: number; on: boolean } | null>(null);
  const lastTap = useRef<{ id: string; t: number }>({ id: '', t: 0 });

  const onDown = (e: React.PointerEvent, part: DressPart) => {
    if (e.button > 0) return;
    press.current = { part, x: e.clientX, y: e.clientY, on: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const p = press.current; if (!p) return;
    if (!p.on && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) { p.on = true; dragging.current = true; }
    if (p.on) setGhost({ x: e.clientX, y: e.clientY, part: p.part });
  };
  const onUp = (e: React.PointerEvent) => {
    const p = press.current; press.current = null;
    if (!p) return;
    if (p.on) {
      dragging.current = false; setGhost(null);
      const hit = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-dp-zone]');
      const n = hit ? Number(hit.getAttribute('data-dp-zone')) : 0;
      if (n === 1 || n === 2) wearOn(n, p.part);
      return;
    }
    // 두 번 탭/클릭 = 더블클릭
    const now = Date.now();
    if (lastTap.current.id === p.part.id && now - lastTap.current.t < 450) { lastTap.current = { id: '', t: 0 }; dblWear(p.part); }
    else lastTap.current = { id: p.part.id, t: now };
  };

  /* ---------- 찰칵! 저장 ---------- */
  const drawChar = async (i: 0 | 1, skipped: string[]) => {
    const r = roomRef.current;
    const cv = document.createElement('canvas'); cv.width = r.stageW; cv.height = r.stageH;
    const ctx = cv.getContext('2d'); if (!ctx) return cv;
    const c = ctlOf((i + 1) as 1 | 2);
    const layers: { src: string; z: number; bg?: boolean; desc: string }[] = [];
    if (bgUrls.current[i]) layers.push({ src: bgUrls.current[i], z: -999, bg: true, desc: '배경' });
    const face = facesRef.current[i][c.face - 1] || facesRef.current[i][0];
    if (face) layers.push({ src: face, z: 10, desc: '캐릭터' });
    c.worn.forEach(w => { const p = partsRef.current.find(x => x.id === w.partId); if (p) layers.push({ src: p.img, z: w.z, desc: p.name }); });
    layers.sort((a, b) => a.z - b.z);
    const imgs = await Promise.all(layers.map(async l => {
      try { return await loadImage(await resolveRefUrl(l.src)); } catch { skipped.push(l.desc); return null; }
    }));
    layers.forEach((l, k) => {
      const im = imgs[k]; if (!im) return;
      if (l.bg) {
        const sc = Math.max(r.stageW / im.naturalWidth, r.stageH / im.naturalHeight);
        const w = im.naturalWidth * sc, h = im.naturalHeight * sc;
        ctx.drawImage(im, (r.stageW - w) / 2, (r.stageH - h) / 2, w, h);
      } else ctx.drawImage(im, 0, 0, r.stageW, r.stageH);
    });
    return cv;
  };

  const save = async () => {
    const dn = room.saveName || room.name;
    const fn = window.prompt('저장 파일명을 입력해주세요!', dn);
    if (fn === null) return;
    playSfx('pic');
    const skipped: string[] = [];
    try {
      const [a, b] = await Promise.all([drawChar(0, skipped), drawChar(1, skipped)]);
      const gap = 20;
      const comb = document.createElement('canvas');
      comb.width = a.width + gap + b.width; comb.height = Math.max(a.height, b.height);
      const ctx = comb.getContext('2d'); if (!ctx) return;
      ctx.drawImage(a, 0, 0); ctx.drawImage(b, a.width + gap, 0);
      const blob: Blob | null = await new Promise(res => { try { comb.toBlob(res, 'image/png'); } catch { res(null); } });
      if (!blob) { toast('저장하지 못했어요 — 이미지 서버가 저장을 허용하지 않는 것 같아요(CORS)'); return; }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = `${fn.trim() || dn}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      if (skipped.length) toast(`저장은 됐지만 일부가 빠졌어요: ${Array.from(new Set(skipped)).join(', ')}`);
      window.setTimeout(() => c1.bubble(c1.host.line('save_photo') || '...', 3), 800);
      window.setTimeout(() => c2.bubble(c2.host.line('save_photo') || '...', 3), 1100);
    } catch { toast('저장에 실패했어요'); }
  };

  /* ---------- 화면 ---------- */
  const col = (n: 1 | 2, refs: ReturnType<typeof mkEls>, bgUrl: string | undefined) => {
    const ctl = ctlOf(n);
    const ch = room.chars[n - 1];
    const bl = ch.blush;
    return (
      <div className="dp-col" style={{ width: room.stageW, maxWidth: '100%' }}>
        <div className="dp-name">{ch.name}</div>
        <div className="dp-btnrow">
          <button className="dr-chip" onClick={() => ctl.restore()}>다시 입히기</button>
          <button className="dr-chip dp-danger" onClick={() => ctl.reset()}>전부 벗기!</button>
        </div>
        <div ref={refs.zone} data-dp-zone={n} className="dp-zone" onClick={() => { if (!dragging.current) ctl.click(); }}
          style={{ aspectRatio: `${room.stageW} / ${room.stageH}`, ...(bgUrl ? { backgroundImage: `url("${bgUrl}")` } : {}) }}>
          <div ref={refs.bubble} className="dp-bubble" />
          <div ref={refs.sweat} className="dp-fx" />
          <div ref={refs.cloud} className="dp-fx" />
          <div ref={refs.blush} className="dp-blush"
            style={{ left: `${(bl.x / room.stageW) * 100}%`, top: `${(bl.y / room.stageH) * 100}%`, width: `${(bl.w / room.stageW) * 100}%`, height: `${(bl.h / room.stageH) * 100}%` }} />
          <div ref={refs.cv} className="dp-cv">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={refs.body} className="dp-base" alt="" draggable={false} />
            {ctl.worn.map(w => { const p = parts.find(x => x.id === w.partId); return p ? <WornLayer key={w.uid} item={w} part={p} /> : null; })}
          </div>
        </div>
        <div className="dp-wornwrap">
          <div className="dp-worntitle">👕 착용 중 — ✕ 벗기 / ▲▼ 앞뒤 조절</div>
          <div className="dp-worn-panel">
            {ctl.worn.length === 0 && <span className="dp-empty">없음</span>}
            {ctl.worn.map(w => {
              const p = parts.find(x => x.id === w.partId); if (!p) return null;
              return (
                <div className="dp-chip" key={w.uid}>
                  <Thumb fileRef={p.img} title={p.name} />
                  <span className="lb">{p.name}</span>
                  <div className="zr">
                    <button onClick={e => { e.stopPropagation(); ctl.setZ(w.uid, 1); }} title="앞으로">▲</button>
                    <span>{w.z}</span>
                    <button onClick={e => { e.stopPropagation(); ctl.setZ(w.uid, -1); }} title="뒤로">▼</button>
                  </div>
                  <button className="x" onClick={e => { e.stopPropagation(); ctl.takeOff(w.uid); }} title="벗기기">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="page dp-root">
      <div className="page-head">
        <PageTitle>{room.title || room.name}</PageTitle>
        <p>끌어다 놓거나 더블클릭(두 번 탭)해서 옷을 입혀 보세요. 캐릭터를 눌러 말을 걸 수도 있어요.</p>
        <div className="head-actions">
          <Link className="btn btn-dark" href="/dressup">← 방 목록</Link>
          {canManage && <Link className="btn btn-dark" href="/dressup/manage">{isAdmin ? 'MANAGE' : '옷 등록'}</Link>}
          <button className="btn btn-dark" onClick={save}>📸 찰칵!</button>
        </div>
      </div>

      <div className="dp-main">
        <div className="dp-stages">
          {col(1, refsA, bgUrlA)}
          {col(2, refsB, bgUrlB)}
        </div>

        <aside className="panel dp-wardrobe">
          <input className="dp-search" type="text" placeholder="아이템 검색..." value={q} onChange={e => setQ(e.target.value)} />
          <div className="dr-row" style={{ marginTop: 0 }}>
            <span className="lb">👆 더블클릭 → 입히기</span>
            <button className={`dr-chip ${dbl === 'auto' ? 'on' : ''}`} onClick={() => setDbl('auto')} title="옷에 정해 둔 캐릭터(A/B)에게 알아서 입혀요">자동</button>
            <button className={`dr-chip ${dbl === 'a' ? 'on' : ''}`} onClick={() => setDbl('a')}>{room.chars[0].name}</button>
            <button className={`dr-chip ${dbl === 'b' ? 'on' : ''}`} onClick={() => setDbl('b')}>{room.chars[1].name}</button>
          </div>
          <div className="dp-tabs">
            {cats.map(c => <button key={c.id} className={`dr-chip ${curTab === c.id ? 'on' : ''}`} onClick={() => setTab(c.id)}>{c.name}</button>)}
          </div>
          <div className="dp-items">
            {curCat?.bg && (
              <>
                <button className="dp-bgx" onClick={() => setBg(b => ['', b[1]])}>🚫<span>{room.chars[0].name}<br />배경제거</span></button>
                <button className="dp-bgx" onClick={() => setBg(b => [b[0], ''])}>🚫<span>{room.chars[1].name}<br />배경제거</span></button>
              </>
            )}
            {list.map(p => (
              <div key={p.id} className={`dp-it ${!curCat?.stack && !curCat?.bg && wornIds.has(p.id) ? 'worn' : ''}`}
                onPointerDown={e => onDown(e, p)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                onClick={() => { if (curCat?.bg) setBgAsk(p); }} title={p.name}>
                <Thumb fileRef={p.img} />
                {p.status !== 'approved' && <span className="tag">{p.status === 'pending' ? '대기' : '반려'}</span>}
              </div>
            ))}
            {list.length === 0 && <div className="dr-sub" style={{ gridColumn: '1 / -1' }}>아이템이 없습니다.</div>}
          </div>
          <div className="dp-credit">
            원본 <a href="https://uchoman.ivyro.net/" target="_blank" rel="noreferrer">우초맨</a> · SFX <a href="https://sellbuymusic.com/md/spjqcbb-efbfbct" target="_blank" rel="noreferrer">셀바이뮤직</a>
          </div>
        </aside>
      </div>

      {ghost && (
        <div className="dp-ghost" style={{ left: ghost.x, top: ghost.y, width: Math.min(room.stageW / 2, 160) }}>
          <Thumb fileRef={ghost.part.img} />
        </div>
      )}

      {bgAsk && (
        <div className="dp-modal" onClick={() => setBgAsk(null)}>
          <div className="box" onClick={e => e.stopPropagation()}>
            <p>어느 캐릭터의 배경으로 할까요?</p>
            <button className="btn btn-dark" onClick={() => applyBg('a', bgAsk)}>🧍 {room.chars[0].name} 만</button>
            <button className="btn btn-dark" onClick={() => applyBg('b', bgAsk)}>🧍 {room.chars[1].name} 만</button>
            <button className="btn btn-dark" onClick={() => applyBg('both', bgAsk)}>👫 둘 다</button>
            <button className="dr-chip" onClick={() => setBgAsk(null)}>취소</button>
          </div>
        </div>
      )}
    </section>
  );
}
