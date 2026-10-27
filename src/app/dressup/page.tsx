'use client';
// 옷입히기 — 몸통 선택 → 카테고리별 파츠 레이어 → 위치 조정 → PNG 저장
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList } from '@/lib/postStore';
import { useBlobUrl } from '@/lib/blobStore';
import {
  BODY_KEY, PART_KEY, BODY_SEED, PART_SEED, PAIR_OX, PAIR_SC, emptySlot, newDressState,
  useDressSettings, type DressBody, type DressPart, type DressState, type LayerPick,
} from '@/lib/dressupStore';
import { DressStage, exportPng, type DragTarget } from '@/components/dressup/DressStage';
import { EditableDesc, PageTitle } from '@/components/ui/PageText';
import { useToast } from '@/components/ui/Toast';
import './dressup.css';

function Thumb({ fileRef }: { fileRef: string }) {
  const url = useBlobUrl(fileRef);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" draggable={false} /> : null;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export default function DressupPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [set, , setLoaded] = useDressSettings();
  const [bodiesAll, , bLoaded] = useLocalList<DressBody>(BODY_KEY, BODY_SEED);
  const [partsAll, , pLoaded] = useLocalList<DressPart>(PART_KEY, PART_SEED);

  const bodies = useMemo(() => bodiesAll.slice(0, set.maxBodies), [bodiesAll, set.maxBodies]);
  // 승인된 파츠 + 내가 올려서 대기 중인 파츠(본인에게만 보인다 — 서버가 남의 것은 안 내줌)
  const parts = useMemo(
    () => partsAll.filter(p => p.status === 'approved' || (!!user && p.authorId === user.id)),
    [partsAll, user],
  );

  const [state, setState] = useState<DressState>(() => newDressState());
  const [slot, setSlot] = useState(0);
  const [catId, setCatId] = useState('');
  const [target, setTarget] = useState<DragTarget>('part');

  // 몸통이 로드되면 첫 몸통을 기본으로
  useEffect(() => {
    if (!bodies.length) return;
    setState(s => (s.slots[0].bodyId && bodies.some(b => b.id === s.slots[0].bodyId)) ? s : {
      ...s, slots: [{ ...s.slots[0], bodyId: bodies[0].id }, { ...s.slots[1], bodyId: bodies[1]?.id ?? bodies[0].id }],
    });
  }, [bodies]);
  useEffect(() => { if (!catId && set.cats[0]) setCatId(set.cats[0].id); }, [set.cats, catId]);

  const cur = state.slots[slot];
  const slotCount = state.mode === 'pair' ? 2 : 1;
  const layer: LayerPick | undefined = cur.layers[catId];
  const catParts = parts.filter(p => p.bodyId === cur.bodyId && p.catId === catId);

  const patchSlot = (i: number, f: (s: DressState['slots'][0]) => DressState['slots'][0]) =>
    setState(s => {
      const slots = [...s.slots] as DressState['slots'];
      slots[i] = f(slots[i]);
      return { ...s, slots };
    });

  const setMode = (mode: DressState['mode']) => {
    setState(s => {
      const a = s.slots[0], b = s.slots[1];
      if (mode === 'pair') {
        return { mode, slots: [{ ...a, ox: -PAIR_OX, sc: PAIR_SC }, { ...b, bodyId: b.bodyId || a.bodyId, ox: PAIR_OX, sc: PAIR_SC }] };
      }
      return { mode, slots: [{ ...a, ox: 0, oy: 0, sc: 1 }, b] };
    });
    setSlot(0);
  };

  const chooseBody = (id: string) => patchSlot(slot, s => ({ ...s, bodyId: id, layers: {} }));   // 파츠는 몸통별이라 몸통이 바뀌면 비운다

  const choosePart = (p: DressPart | null) => patchSlot(slot, s => {
    const layers = { ...s.layers };
    if (!p) delete layers[catId];
    else {
      const old = layers[catId];
      layers[catId] = { partId: p.id, dx: old?.dx ?? 0, dy: old?.dy ?? 0, s: old?.s ?? 1 };
    }
    return { ...s, layers };
  });

  const onMove = (i: number, t: DragTarget, dx: number, dy: number) => {
    if (t === 'slot') {
      patchSlot(i, s => ({ ...s, ox: clamp(round1(s.ox + dx), -100, 100), oy: clamp(round1(s.oy + dy), -100, 100) }));
    } else {
      patchSlot(i, s => {
        const l = s.layers[catId];
        if (!l) return s;
        return { ...s, layers: { ...s.layers, [catId]: { ...l, dx: clamp(round1(l.dx + dx), -100, 100), dy: clamp(round1(l.dy + dy), -100, 100) } } };
      });
    }
  };

  const setLayerField = (k: 'dx' | 'dy' | 's', v: number) => patchSlot(slot, s => {
    const l = s.layers[catId];
    return l ? { ...s, layers: { ...s.layers, [catId]: { ...l, [k]: v } } } : s;
  });

  const resetLayer = () => patchSlot(slot, s => {
    const l = s.layers[catId];
    return l ? { ...s, layers: { ...s.layers, [catId]: { ...l, dx: 0, dy: 0, s: 1 } } } : s;
  });

  const randomize = () => {
    for (let i = 0; i < slotCount; i++) {
      patchSlot(i, s => {
        const layers: DressState['slots'][0]['layers'] = {};
        set.cats.forEach(c => {
          const pool = parts.filter(p => p.bodyId === s.bodyId && p.catId === c.id && p.status === 'approved');
          if (pool.length) layers[c.id] = { partId: pool[Math.floor(Math.random() * pool.length)].id, dx: 0, dy: 0, s: 1 };
        });
        return { ...s, layers };
      });
    }
  };

  const clearAll = () => patchSlot(slot, s => ({ ...emptySlot(s.bodyId, s.ox, s.sc), oy: s.oy, flip: s.flip }));

  const save = async () => {
    try {
      const blob = await exportPng(state, bodies, parts, set.cats, set.stageW, set.stageH);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dressup-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'PNG 저장에 실패했어요');
    }
  };

  const canManage = isAdmin || (!!user && set.allowMemberParts);

  if (!bLoaded || !pLoaded || !setLoaded) return <section className="page" />;

  return (
    <section className="page">
      <div className="page-head">
        <PageTitle>DRESS UP</PageTitle>
        <EditableDesc k="dressup-desc" def="몸통을 고르고 옷을 입혀 보세요 — 끌어서 위치를 맞출 수 있어요" />
        <div className="head-actions">
          {canManage && <Link className="btn btn-dark" href="/dressup/manage">{isAdmin ? 'MANAGE' : '파츠 등록'}</Link>}
        </div>
      </div>

      {bodies.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 44, fontSize: 13, color: 'var(--faint)' }}>
          {isAdmin ? '아직 몸통이 없어요 — MANAGE에서 몸통을 먼저 등록해 주세요' : '등록된 몸통이 없습니다'}
        </div>
      ) : (
        <div className="dr-wrap">
          {/* 캔버스 */}
          <div className="panel dr-stagebox">
            <DressStage state={state} bodies={bodies} parts={parts} cats={set.cats}
              stageW={set.stageW} stageH={set.stageH} activeSlot={slot} activeCat={catId} target={target} onMove={onMove} />
            <div className="dr-row">
              <span className="lb">모드</span>
              <button className={`dr-chip ${state.mode === 'single' ? 'on' : ''}`} onClick={() => setMode('single')}>싱글</button>
              <button className={`dr-chip ${state.mode === 'pair' ? 'on' : ''}`} onClick={() => setMode('pair')}>페어</button>
              {state.mode === 'pair' && (<>
                <span className="lb" style={{ marginLeft: 8 }}>편집 중</span>
                <button className={`dr-chip ${slot === 0 ? 'on' : ''}`} onClick={() => setSlot(0)}>A</button>
                <button className={`dr-chip ${slot === 1 ? 'on' : ''}`} onClick={() => setSlot(1)}>B</button>
              </>)}
            </div>
            <div className="dr-row">
              <span className="lb">몸통{state.mode === 'pair' ? ` ${slot === 0 ? 'A' : 'B'}` : ''}</span>
              <div className="dr-bodies">
                {bodies.map(b => (
                  <button key={b.id} className={`dr-bthumb ${cur.bodyId === b.id ? 'on' : ''}`} title={b.name} onClick={() => chooseBody(b.id)}>
                    <Thumb fileRef={b.img} />
                  </button>
                ))}
              </div>
            </div>
            <div className="dr-row">
              <button className="dr-chip" onClick={() => patchSlot(slot, s => ({ ...s, flip: !s.flip }))}>좌우반전</button>
              <button className="dr-chip" onClick={randomize}>랜덤</button>
              <button className="dr-chip" onClick={clearAll}>옷 벗기기</button>
              <button className="dr-chip on" onClick={save}>PNG 저장</button>
            </div>
          </div>

          {/* 옷 고르기 / 위치 조정 */}
          <div className="panel dr-side">
            <div className="dr-row" style={{ marginTop: 0 }}>
              {set.cats.map(c => (
                <button key={c.id} className={`dr-chip ${catId === c.id ? 'on' : ''}`} onClick={() => { setCatId(c.id); setTarget('part'); }}>{c.name}</button>
              ))}
            </div>

            <div className="dr-grid">
              <button className={`dr-part none ${!layer ? 'on' : ''}`} onClick={() => choosePart(null)}>없음</button>
              {catParts.map(p => (
                <button key={p.id} className={`dr-part ${layer?.partId === p.id ? 'on' : ''}`} title={p.name} onClick={() => choosePart(p)}>
                  <Thumb fileRef={p.img} />
                  {p.status !== 'approved' && <span className="tag">{p.status === 'pending' ? '대기' : '반려'}</span>}
                </button>
              ))}
            </div>
            {catParts.length === 0 && <div className="dr-sub">이 몸통에 맞는 {set.cats.find(c => c.id === catId)?.name ?? ''} 파츠가 아직 없어요</div>}

            <div className="dr-row" style={{ marginTop: 0 }}>
              <span className="lb">드래그로 움직일 대상</span>
              <button className={`dr-chip ${target === 'part' ? 'on' : ''}`} onClick={() => setTarget('part')}>선택한 파츠</button>
              <button className={`dr-chip ${target === 'slot' ? 'on' : ''}`} onClick={() => setTarget('slot')}>캐릭터 전체</button>
            </div>

            {target === 'part' ? (
              <div className="dr-adjust">
                {layer ? (<>
                  <label>가로<input type="range" min={-50} max={50} step={0.5} value={layer.dx} onChange={e => setLayerField('dx', +e.target.value)} /><span className="val">{layer.dx}</span></label>
                  <label>세로<input type="range" min={-50} max={50} step={0.5} value={layer.dy} onChange={e => setLayerField('dy', +e.target.value)} /><span className="val">{layer.dy}</span></label>
                  <label>크기<input type="range" min={0.3} max={2.5} step={0.01} value={layer.s} onChange={e => setLayerField('s', +e.target.value)} /><span className="val">{layer.s.toFixed(2)}</span></label>
                  <button className="dr-chip" style={{ justifySelf: 'start' }} onClick={resetLayer}>파츠 위치 초기화</button>
                </>) : <div className="dr-sub">파츠를 고르면 여기서 위치와 크기를 맞출 수 있어요</div>}
              </div>
            ) : (
              <div className="dr-adjust">
                <label>가로<input type="range" min={-60} max={60} step={0.5} value={cur.ox} onChange={e => patchSlot(slot, s => ({ ...s, ox: +e.target.value }))} /><span className="val">{cur.ox}</span></label>
                <label>세로<input type="range" min={-60} max={60} step={0.5} value={cur.oy} onChange={e => patchSlot(slot, s => ({ ...s, oy: +e.target.value }))} /><span className="val">{cur.oy}</span></label>
                <label>크기<input type="range" min={0.3} max={1.8} step={0.01} value={cur.sc} onChange={e => patchSlot(slot, s => ({ ...s, sc: +e.target.value }))} /><span className="val">{cur.sc.toFixed(2)}</span></label>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
