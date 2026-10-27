'use client';
// 옷입히기 관리 — 관리자: 몸통·파츠·승인·설정 / 회원: 내 파츠 등록(승인 후 공개)
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList, newId } from '@/lib/postStore';
import { putBlob, useBlobUrl } from '@/lib/blobStore';
import {
  BODY_KEY, PART_KEY, BODY_SEED, PART_SEED, useDressSettings,
  type DressBody, type DressPart, type DressCat,
} from '@/lib/dressupStore';
import { FileDrop } from '@/components/ui/FileDrop';
import { useConfirmDelete } from '@/components/ui/Modal';
import { PageTitle } from '@/components/ui/PageText';
import { useToast } from '@/components/ui/Toast';
import '../dressup.css';

type Tab = 'bodies' | 'parts' | 'queue' | 'settings';
const MEMBER_MAX_BYTES = 3 * 1024 * 1024;

function Thumb({ fileRef }: { fileRef: string }) {
  const url = useBlobUrl(fileRef);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" draggable={false} /> : null;
}

const baseName = (f: File) => f.name.replace(/\.[^.]+$/, '');
const isImg = (f: File) => /^image\/(png|webp)$/.test(f.type);

function imgSize(f: File): Promise<{ w: number; h: number }> {
  return new Promise(res => {
    const u = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); };
    im.onerror = () => { res({ w: 0, h: 0 }); URL.revokeObjectURL(u); };
    im.src = u;
  });
}

export default function DressupManagePage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const del = useConfirmDelete();
  const [set, patchSet, setLoaded] = useDressSettings();
  const [bodies, setBodies, bLoaded] = useLocalList<DressBody>(BODY_KEY, BODY_SEED);
  const [parts, setParts, pLoaded] = useLocalList<DressPart>(PART_KEY, PART_SEED);
  const [tab, setTab] = useState<Tab>(isAdmin ? 'bodies' : 'parts');

  // 등록 폼 상태
  const [bodyName, setBodyName] = useState('');
  const [fBody, setFBody] = useState('');
  const [fCat, setFCat] = useState('');
  const [fName, setFName] = useState('');
  const [busy, setBusy] = useState(false);
  const [filterBody, setFilterBody] = useState('');

  if (!bLoaded || !pLoaded || !setLoaded) return <section className="page" />;

  const head = (msg: string) => (
    <section className="page"><div className="page-head"><PageTitle>DRESS UP</PageTitle><p>{msg}</p></div></section>
  );
  if (!user) return head('로그인한 회원만 쓸 수 있어요');
  if (!isAdmin && !set.allowMemberParts) return head('지금은 회원 파츠 등록을 받지 않아요');

  const bodyName_ = (id: string) => bodies.find(b => b.id === id)?.name ?? '(삭제된 몸통)';
  const catName = (id: string) => set.cats.find(c => c.id === id)?.name ?? '(삭제된 카테고리)';
  const selBody = fBody || bodies[0]?.id || '';
  const selCat = fCat || set.cats[0]?.id || '';

  /* ---------- 몸통 (관리자) ---------- */
  const addBody = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (!isImg(f)) return toast('PNG 또는 WEBP(투명 배경) 이미지만 올릴 수 있어요');
    if (bodies.length >= set.maxBodies) return toast(`몸통은 최대 ${set.maxBodies}개까지예요`);
    setBusy(true);
    try {
      const ref = await putBlob(f);
      const sz = await imgSize(f);
      if (sz.w && Math.abs(sz.w / sz.h - set.stageW / set.stageH) > 0.03) toast('캔버스 비율과 달라요 — 설정의 캔버스 크기와 맞춰 두면 파츠가 어긋나지 않아요');
      setBodies([...bodies, { id: newId(), name: bodyName.trim() || baseName(f), img: ref, authorId: user.id, visibility: 'public' }]);
      setBodyName('');
    } catch { toast('업로드에 실패했어요'); }
    setBusy(false);
  };

  const moveBody = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= bodies.length) return;
    const n = [...bodies];
    [n[i], n[j]] = [n[j], n[i]];
    setBodies(n);
  };

  const removeBody = (b: DressBody) => del.ask(
    `「${b.name}」를 삭제하시겠습니까?`,
    () => { setBodies(bodies.filter(x => x.id !== b.id)); setParts(parts.filter(p => p.bodyId !== b.id)); },
    '이 몸통에 등록된 파츠도 함께 삭제됩니다.',
  );

  /* ---------- 파츠 등록 (관리자: 즉시 공개 / 회원: 승인 대기) ---------- */
  const addParts = async (files: File[]) => {
    if (!selBody || !selCat) return toast('몸통과 카테고리를 먼저 골라 주세요');
    const ok = files.filter(isImg);
    if (ok.length !== files.length) toast('PNG 또는 WEBP만 올릴 수 있어요 (투명 배경)');
    const list = isAdmin ? ok : ok.filter(f => f.size <= MEMBER_MAX_BYTES);
    if (!isAdmin && list.length !== ok.length) toast('파일은 3MB 이하만 올릴 수 있어요');
    if (!list.length) return;
    setBusy(true);
    try {
      const rows: DressPart[] = [];
      for (const f of list) {
        const ref = await putBlob(f);
        rows.push({
          id: newId(), bodyId: selBody, catId: selCat,
          name: (list.length === 1 && fName.trim()) || baseName(f), img: ref,
          status: isAdmin ? 'approved' : 'pending',
          author: user.nickname, authorId: user.id,
          visibility: isAdmin ? 'public' : 'private',   // 승인 전에는 작성자·관리자만 읽는다
          date: new Date().toISOString(),
        });
      }
      setParts([...parts, ...rows]);
      setFName('');
      toast(isAdmin ? `${rows.length}개 등록했어요` : '올렸어요 — 관리자가 승인하면 공개돼요');
    } catch { toast('업로드에 실패했어요'); }
    setBusy(false);
  };

  const setStatus = (p: DressPart, status: DressPart['status']) =>
    setParts(parts.map(x => x.id === p.id ? { ...x, status, visibility: status === 'approved' ? 'public' : 'private' } : x));

  const removePart = (p: DressPart) => del.ask(`「${p.name}」를 삭제하시겠습니까?`, () => setParts(parts.filter(x => x.id !== p.id)));

  /* ---------- 카테고리 (관리자) ---------- */
  const setCats = (cats: DressCat[]) => patchSet({ cats });
  const moveCat = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= set.cats.length) return;
    const n = [...set.cats];
    [n[i], n[j]] = [n[j], n[i]];
    setCats(n);
  };

  const mine = parts.filter(p => p.authorId === user.id);
  const pending = parts.filter(p => p.status === 'pending');
  const shownParts = (isAdmin ? parts.filter(p => p.authorId === user.id || p.status !== 'pending') : mine)
    .filter(p => !filterBody || p.bodyId === filterBody);

  const form = (
    <div className="panel dr-form">
      <div className="dr-sub">{isAdmin ? '파츠는 몸통별로 등록해요. 투명 PNG/WEBP, 몸통과 같은 캔버스 크기로 만들면 그대로 겹쳐져요.' : '올린 파츠는 관리자가 승인하면 공개돼요. (PNG/WEBP, 3MB 이하)'}</div>
      <select value={selBody} onChange={e => setFBody(e.target.value)}>
        {bodies.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select value={selCat} onChange={e => setFCat(e.target.value)}>
        {set.cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input type="text" placeholder="이름 (여러 장이면 파일명 사용)" value={fName} onChange={e => setFName(e.target.value)} />
      <FileDrop accept="image/png,image/webp" multiple label={busy ? '올리는 중…' : '파츠 이미지를 끌어다 놓기 (여러 장 가능)'} onFiles={addParts} />
    </div>
  );

  const partRow = (p: DressPart, actions: React.ReactNode) => (
    <div className="dr-item" key={p.id}>
      <div className="th"><Thumb fileRef={p.img} /></div>
      <div>
        <div className="nm">{p.name}<span className={`dr-pill ${p.status}`}>{p.status === 'approved' ? '공개' : p.status === 'pending' ? '대기' : '반려'}</span></div>
        <div className="mt">{bodyName_(p.bodyId)} · {catName(p.catId)} · {p.author}</div>
      </div>
      <div className="ac">{actions}</div>
    </div>
  );

  return (
    <section className="page">
      <div className="page-head">
        <PageTitle>DRESS UP</PageTitle>
        <p>{isAdmin ? '몸통·파츠·승인·설정을 관리해요' : '내가 만든 파츠를 올려요'}</p>
        <div className="head-actions"><Link className="btn btn-dark" href="/dressup">← 옷입히기</Link></div>
      </div>

      <div className="dr-tabs">
        {isAdmin && <button className={`dr-chip ${tab === 'bodies' ? 'on' : ''}`} onClick={() => setTab('bodies')}>몸통 {bodies.length}/{set.maxBodies}</button>}
        <button className={`dr-chip ${tab === 'parts' ? 'on' : ''}`} onClick={() => setTab('parts')}>{isAdmin ? '파츠' : '내 파츠'}</button>
        {isAdmin && <button className={`dr-chip ${tab === 'queue' ? 'on' : ''}`} onClick={() => setTab('queue')}>승인 대기 {pending.length}</button>}
        {isAdmin && <button className={`dr-chip ${tab === 'settings' ? 'on' : ''}`} onClick={() => setTab('settings')}>설정</button>}
      </div>

      {isAdmin && tab === 'bodies' && (<>
        <div className="panel dr-form" style={{ marginBottom: 14 }}>
          <div className="dr-sub">몸통은 최대 {set.maxBodies}개까지 올릴 수 있어요. 파츠는 각 몸통에 맞춰 따로 등록합니다.</div>
          <input type="text" placeholder="몸통 이름 (비우면 파일명)" value={bodyName} onChange={e => setBodyName(e.target.value)} />
          <FileDrop accept="image/png,image/webp" label={busy ? '올리는 중…' : bodies.length >= set.maxBodies ? '더 올릴 수 없어요' : '몸통 이미지를 끌어다 놓기'} onFiles={addBody} />
        </div>
        <div className="dr-list">
          {bodies.map((b, i) => (
            <div className="dr-item" key={b.id}>
              <div className="th"><Thumb fileRef={b.img} /></div>
              <div><div className="nm">{b.name}</div><div className="mt">파츠 {parts.filter(p => p.bodyId === b.id).length}개</div></div>
              <div className="ac">
                <button className="dr-chip" disabled={i === 0} onClick={() => moveBody(i, -1)}>↑</button>
                <button className="dr-chip" disabled={i === bodies.length - 1} onClick={() => moveBody(i, 1)}>↓</button>
                <button className="dr-chip" onClick={() => removeBody(b)}>삭제</button>
              </div>
            </div>
          ))}
          {bodies.length === 0 && <div className="dr-sub">아직 몸통이 없어요</div>}
        </div>
      </>)}

      {tab === 'parts' && (<>
        {bodies.length === 0 ? <div className="dr-sub">먼저 관리자가 몸통을 등록해야 해요</div> : (<>
          {form}
          {isAdmin && (
            <div className="dr-row">
              <span className="lb">보기</span>
              <button className={`dr-chip ${!filterBody ? 'on' : ''}`} onClick={() => setFilterBody('')}>전체</button>
              {bodies.map(b => <button key={b.id} className={`dr-chip ${filterBody === b.id ? 'on' : ''}`} onClick={() => setFilterBody(b.id)}>{b.name}</button>)}
            </div>
          )}
          <div className="dr-list" style={{ marginTop: 14 }}>
            {shownParts.map(p => partRow(p, <button className="dr-chip" onClick={() => removePart(p)}>삭제</button>))}
            {shownParts.length === 0 && <div className="dr-sub">등록된 파츠가 없어요</div>}
          </div>
        </>)}
      </>)}

      {isAdmin && tab === 'queue' && (
        <div className="dr-list">
          {pending.map(p => partRow(p, (<>
            <button className="dr-chip on" onClick={() => setStatus(p, 'approved')}>승인</button>
            <button className="dr-chip" onClick={() => setStatus(p, 'rejected')}>반려</button>
            <button className="dr-chip" onClick={() => removePart(p)}>삭제</button>
          </>)))}
          {pending.length === 0 && <div className="dr-sub">승인 대기 중인 파츠가 없어요</div>}
        </div>
      )}

      {isAdmin && tab === 'settings' && (
        <div className="panel dr-form">
          <label className="dr-sub">몸통 최대 개수
            <input type="number" min={1} max={10} value={set.maxBodies} onChange={e => patchSet({ maxBodies: Math.min(10, Math.max(1, +e.target.value || 1)) })} /></label>
          <label className="dr-sub"><input type="checkbox" checked={set.allowMemberParts} onChange={e => patchSet({ allowMemberParts: e.target.checked })} /> 회원의 파츠 등록 허용 (승인 후 공개)</label>
          <label className="dr-sub">캔버스 가로(px)
            <input type="number" min={100} max={4000} value={set.stageW} onChange={e => patchSet({ stageW: Math.max(100, +e.target.value || 600) })} /></label>
          <label className="dr-sub">캔버스 세로(px)
            <input type="number" min={100} max={4000} value={set.stageH} onChange={e => patchSet({ stageH: Math.max(100, +e.target.value || 800) })} /></label>
          <div className="dr-sub">카테고리 — 위에서 아래 순서로 겹쳐요. 「몸통 뒤」를 켜면 몸통 뒤에 그려요 (뒷머리 등)</div>
          {set.cats.map((c, i) => (
            <div className="dr-row" key={c.id} style={{ marginTop: 0 }}>
              <input type="text" style={{ flex: 1 }} value={c.name} onChange={e => setCats(set.cats.map(x => x.id === c.id ? { ...x, name: e.target.value } : x))} />
              <label className="dr-sub"><input type="checkbox" checked={!!c.behind} onChange={e => setCats(set.cats.map(x => x.id === c.id ? { ...x, behind: e.target.checked } : x))} /> 몸통 뒤</label>
              <button className="dr-chip" disabled={i === 0} onClick={() => moveCat(i, -1)}>↑</button>
              <button className="dr-chip" disabled={i === set.cats.length - 1} onClick={() => moveCat(i, 1)}>↓</button>
              <button className="dr-chip" disabled={set.cats.length <= 1} onClick={() => del.ask(`「${c.name}」 카테고리를 삭제하시겠습니까?`, () => setCats(set.cats.filter(x => x.id !== c.id)), '이 카테고리의 파츠는 화면에서 보이지 않게 됩니다.')}>삭제</button>
            </div>
          ))}
          <button className="dr-chip" style={{ justifySelf: 'start' }} onClick={() => setCats([...set.cats, { id: newId(), name: '새 카테고리' }])}>＋ 카테고리 추가</button>
        </div>
      )}
      {del.element}
    </section>
  );
}
