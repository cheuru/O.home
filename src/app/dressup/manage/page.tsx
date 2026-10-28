'use client';
// 옷입히기 관리 — 관리자: 방·캐릭터·표정·대사·옷·승인·설정 / 회원: 내 옷 등록(승인 후 공개)
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList, newId } from '@/lib/postStore';
import { putBlob, useBlobUrl } from '@/lib/blobStore';
import {
  PART_KEY, PART_SEED, FACE_LABELS, LINE_KEYS, DEFAULT_LINES, newDressRoom, useDressSettings,
  type DressPart, type DressRoom, type DressChar, type DressCat, type PartWho,
} from '@/lib/dressupStore';
import { FileDrop } from '@/components/ui/FileDrop';
import { useConfirmDelete } from '@/components/ui/Modal';
import { PageTitle } from '@/components/ui/PageText';
import { useToast } from '@/components/ui/Toast';
import '../dressup.css';

type Tab = 'rooms' | 'room' | 'parts' | 'queue' | 'settings';
const MEMBER_MAX_BYTES = 3 * 1024 * 1024;
const WHO_LABEL: Record<PartWho, string> = { a: 'A용', b: 'B용', any: '공용' };

const isImg = (f: File) => /^image\/(png|webp)$/.test(f.type);
const baseName = (f: File) => f.name.replace(/\.[^.]+$/, '');

function imgSize(f: File): Promise<{ w: number; h: number }> {
  return new Promise(res => {
    const u = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); };
    im.onerror = () => { res({ w: 0, h: 0 }); URL.revokeObjectURL(u); };
    im.src = u;
  });
}

function Thumb({ fileRef }: { fileRef?: string }) {
  const url = useBlobUrl(fileRef || undefined);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" draggable={false} /> : null;
}

/** 입력 중에는 로컬로만 들고 있다가, 포커스를 잃을 때 한 번만 저장한다 (설정 저장이 글자마다 일어나지 않게) */
function Field({ value, onCommit, area, number, placeholder, style }: {
  value: string | number; onCommit: (v: string) => void; area?: boolean; number?: boolean; placeholder?: string; style?: React.CSSProperties;
}) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const done = () => { if (v !== String(value)) onCommit(v); };
  const common = { value: v, placeholder, style: { width: '100%', ...style }, onBlur: done };
  return area
    ? <textarea {...common} rows={3} onChange={e => setV(e.target.value)}
        style={{ ...common.style, padding: '8px 10px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-s)', fontSize: 13, background: '#fff', color: '#1d2025' }} />
    : <input {...common} type={number ? 'number' : 'text'} onChange={e => setV(e.target.value)} />;
}

export default function DressupManagePage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const del = useConfirmDelete();
  const [set, patchSet, setLoaded] = useDressSettings();
  const [parts, setParts, pLoaded] = useLocalList<DressPart>(PART_KEY, PART_SEED);
  const [tab, setTab] = useState<Tab>(isAdmin ? 'rooms' : 'parts');
  const [roomSel, setRoomSel] = useState('');
  const [charSel, setCharSel] = useState<0 | 1>(0);
  const [roomName, setRoomName] = useState('');
  const [busy, setBusy] = useState(false);

  // 옷 등록 폼
  const [fCat, setFCat] = useState('');
  const [fWho, setFWho] = useState<PartWho>('any');
  const [fName, setFName] = useState('');
  const [fZ, setFZ] = useState('');
  const [fA, setFA] = useState(false);
  const [fB, setFB] = useState(false);
  const [listCat, setListCat] = useState('');

  if (!setLoaded || !pLoaded) return <section className="page" />;

  const head = (msg: string) => (
    <section className="page"><div className="page-head"><PageTitle>DRESS UP</PageTitle><p>{msg}</p></div></section>
  );
  if (!user) return head('로그인한 회원만 쓸 수 있어요');
  if (!isAdmin && !set.allowMemberParts) return head('지금은 회원 옷 등록을 받지 않아요');

  const rooms = set.rooms;
  const cats = set.cats;
  const curRoomId = roomSel && rooms.some(r => r.id === roomSel) ? roomSel : rooms[0]?.id ?? '';
  const room = rooms.find(r => r.id === curRoomId);
  const selCat = fCat && cats.some(c => c.id === fCat) ? fCat : cats[0]?.id ?? '';
  const roomOf = (id: string) => rooms.find(r => r.id === id)?.name ?? '(삭제된 방)';
  const catName = (id: string) => cats.find(c => c.id === id)?.name ?? '(삭제된 카테고리)';

  /* ---------- 방 ---------- */
  const patchRoom = (id: string, f: (r: DressRoom) => DressRoom) => patchSet({ rooms: rooms.map(r => r.id === id ? f(r) : r) });
  const patchChar = (id: string, ci: 0 | 1, f: (c: DressChar) => DressChar) =>
    patchRoom(id, r => ({ ...r, chars: ci === 0 ? [f(r.chars[0]), r.chars[1]] : [r.chars[0], f(r.chars[1])] }));

  const addRoom = async (files: File[]) => {
    const name = roomName.trim();
    if (!name) return toast('방 이름을 먼저 적어 주세요');
    const f = files[0];
    if (f && !isImg(f)) return toast('PNG 또는 WEBP 이미지만 올릴 수 있어요');
    setBusy(true);
    try {
      const cover = f ? await putBlob(f) : undefined;
      const r = newDressRoom(newId(), name, cover);
      patchSet({ rooms: [...rooms, r] });
      setRoomName(''); setRoomSel(r.id);
      toast('방을 만들었어요 — 「방 설정」에서 캐릭터와 표정을 올려 주세요');
    } catch { toast('업로드에 실패했어요'); }
    setBusy(false);
  };

  const moveRoom = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rooms.length) return;
    const n = [...rooms]; [n[i], n[j]] = [n[j], n[i]];
    patchSet({ rooms: n });
  };

  const removeRoom = (r: DressRoom) => del.ask(
    `「${r.name}」 방을 삭제하시겠습니까?`,
    () => { setParts(parts.filter(p => p.roomId !== r.id)); patchSet({ rooms: rooms.filter(x => x.id !== r.id) }); },
    '방 안의 옷도 모두 함께 삭제됩니다.',
  );

  const upload = async (f: File | undefined, apply: (ref: string) => void) => {
    if (!f) return;
    if (!isImg(f)) return toast('PNG 또는 WEBP(투명 배경) 이미지만 올릴 수 있어요');
    setBusy(true);
    try {
      const ref = await putBlob(f);
      const sz = await imgSize(f);
      if (room && sz.w && (sz.w !== room.stageW || sz.h !== room.stageH)) {
        toast(`그림 크기가 ${sz.w}×${sz.h}예요 — 방 크기(${room.stageW}×${room.stageH})와 같아야 겹쳤을 때 어긋나지 않아요`);
      }
      apply(ref);
    } catch { toast('업로드에 실패했어요'); }
    setBusy(false);
  };

  /* ---------- 옷 ---------- */
  const addParts = async (files: File[]) => {
    if (!room) return toast('먼저 방을 만들어 주세요');
    if (!selCat) return toast('카테고리를 골라 주세요');
    const ok = files.filter(isImg);
    if (ok.length !== files.length) toast('PNG 또는 WEBP만 올릴 수 있어요 (투명 배경)');
    const list = isAdmin ? ok : ok.filter(f => f.size <= MEMBER_MAX_BYTES);
    if (!isAdmin && list.length !== ok.length) toast('파일은 3MB 이하만 올릴 수 있어요');
    if (!list.length) return;
    setBusy(true);
    try {
      const rows: DressPart[] = [];
      const z = fZ.trim() === '' ? undefined : Number(fZ);
      for (const f of list) {
        const ref = await putBlob(f);
        rows.push({
          id: newId(), roomId: room.id, catId: selCat,
          name: (list.length === 1 && fName.trim()) || baseName(f), img: ref,
          ...(z !== undefined && !Number.isNaN(z) ? { z } : {}),
          who: fWho,
          ...(isAdmin && fA ? { wearA: true } : {}), ...(isAdmin && fB ? { wearB: true } : {}),
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

  const patchPart = (id: string, p: Partial<DressPart>) => setParts(parts.map(x => x.id === id ? { ...x, ...p } : x));
  const setStatus = (p: DressPart, status: DressPart['status']) =>
    patchPart(p.id, { status, visibility: status === 'approved' ? 'public' : 'private' });
  const removePart = (p: DressPart) => del.ask(`「${p.name}」를 삭제하시겠습니까?`, () => setParts(parts.filter(x => x.id !== p.id)));

  /* ---------- 카테고리 ---------- */
  const setCats = (c: DressCat[]) => patchSet({ cats: c });
  const patchCat = (id: string, p: Partial<DressCat>) => setCats(cats.map(c => c.id === id ? { ...c, ...p } : c));
  const moveCat = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= cats.length) return;
    const n = [...cats]; [n[i], n[j]] = [n[j], n[i]];
    setCats(n);
  };

  const pending = parts.filter(p => p.status === 'pending');
  const shown = (isAdmin ? parts.filter(p => p.authorId === user.id || p.status !== 'pending') : parts.filter(p => p.authorId === user.id))
    .filter(p => p.roomId === curRoomId && (!listCat || p.catId === listCat));

  const roomChips = (
    <div className="dr-row" style={{ marginTop: 0, marginBottom: 12 }}>
      <span className="lb">방</span>
      {rooms.map(r => <button key={r.id} className={`dr-chip ${curRoomId === r.id ? 'on' : ''}`} onClick={() => setRoomSel(r.id)}>{r.name}</button>)}
    </div>
  );

  const partRow = (p: DressPart, admin: boolean) => (
    <div className="dr-item" key={p.id}>
      <div className="th"><Thumb fileRef={p.img} /></div>
      <div>
        <div className="nm">{p.name}<span className={`dr-pill ${p.status}`}>{p.status === 'approved' ? '공개' : p.status === 'pending' ? '대기' : '반려'}</span></div>
        <div className="mt">{roomOf(p.roomId)} · {catName(p.catId)} · {WHO_LABEL[p.who]} · {p.author}{p.z !== undefined ? ` · z${p.z}` : ''}</div>
        {admin && p.status === 'approved' && (
          <div className="dr-row" style={{ marginTop: 6 }}>
            <button className={`dr-chip ${p.wearA ? 'on' : ''}`} onClick={() => patchPart(p.id, { wearA: !p.wearA })} title="방에 들어올 때 A가 처음부터 입고 나와요">기본 A</button>
            <button className={`dr-chip ${p.wearB ? 'on' : ''}`} onClick={() => patchPart(p.id, { wearB: !p.wearB })} title="방에 들어올 때 B가 처음부터 입고 나와요">기본 B</button>
            <button className="dr-chip" onClick={() => patchPart(p.id, { who: p.who === 'any' ? 'a' : p.who === 'a' ? 'b' : 'any' })} title="더블클릭 시 자동으로 입을 캐릭터">{WHO_LABEL[p.who]}</button>
          </div>
        )}
      </div>
      <div className="ac">
        {admin && p.status === 'pending' && (<>
          <button className="dr-chip on" onClick={() => setStatus(p, 'approved')}>승인</button>
          <button className="dr-chip" onClick={() => setStatus(p, 'rejected')}>반려</button>
        </>)}
        <button className="dr-chip" onClick={() => removePart(p)}>삭제</button>
      </div>
    </div>
  );

  const partForm = (
    <div className="panel dr-form" style={{ marginBottom: 14 }}>
      <div className="dr-sub">{isAdmin
        ? '옷은 투명 PNG/WEBP로, 캐릭터 그림과 같은 크기로 만들어 입을 자리에 그려 주세요. 그러면 캐릭터 위에 그대로 겹쳐져요.'
        : '올린 옷은 관리자가 승인하면 공개돼요. (PNG/WEBP, 3MB 이하, 캐릭터 그림과 같은 크기)'}</div>
      <select value={selCat} onChange={e => setFCat(e.target.value)}>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select value={fWho} onChange={e => setFWho(e.target.value as PartWho)}>
        <option value="any">공용 (더블클릭 시 왼쪽 캐릭터)</option>
        <option value="a">{room?.chars[0].name ?? 'A'}용 (더블클릭 시 자동으로 입음)</option>
        <option value="b">{room?.chars[1].name ?? 'B'}용 (더블클릭 시 자동으로 입음)</option>
      </select>
      <input type="text" placeholder="이름 (여러 장이면 파일명 사용)" value={fName} onChange={e => setFName(e.target.value)} />
      {isAdmin && (<>
        <input type="number" placeholder={`겹치는 순서 z (비우면 카테고리 기본 ${cats.find(c => c.id === selCat)?.z ?? 20})`} value={fZ} onChange={e => setFZ(e.target.value)} />
        <div className="dr-row" style={{ marginTop: 0 }}>
          <label className="dr-sub"><input type="checkbox" checked={fA} onChange={e => setFA(e.target.checked)} /> 기본 코디 A</label>
          <label className="dr-sub"><input type="checkbox" checked={fB} onChange={e => setFB(e.target.checked)} /> 기본 코디 B</label>
        </div>
      </>)}
      <FileDrop accept="image/png,image/webp" multiple label={busy ? '올리는 중…' : '옷 이미지를 끌어다 놓기 (여러 장 가능)'} onFiles={addParts} />
    </div>
  );

  return (
    <section className="page">
      <div className="page-head">
        <PageTitle>DRESS UP</PageTitle>
        <p>{isAdmin ? '방·캐릭터·표정·대사·옷·승인을 관리해요' : '내가 만든 옷을 올려요'}</p>
        <div className="head-actions"><Link className="btn btn-dark" href="/dressup">← 옷입히기</Link></div>
      </div>

      <div className="dr-tabs">
        {isAdmin && <button className={`dr-chip ${tab === 'rooms' ? 'on' : ''}`} onClick={() => setTab('rooms')}>방 {rooms.length}</button>}
        {isAdmin && <button className={`dr-chip ${tab === 'room' ? 'on' : ''}`} onClick={() => setTab('room')}>방 설정</button>}
        <button className={`dr-chip ${tab === 'parts' ? 'on' : ''}`} onClick={() => setTab('parts')}>{isAdmin ? '옷' : '내 옷'}</button>
        {isAdmin && <button className={`dr-chip ${tab === 'queue' ? 'on' : ''}`} onClick={() => setTab('queue')}>승인 대기 {pending.length}</button>}
        {isAdmin && <button className={`dr-chip ${tab === 'settings' ? 'on' : ''}`} onClick={() => setTab('settings')}>카테고리·설정</button>}
      </div>

      {/* ───── 방 목록 ───── */}
      {isAdmin && tab === 'rooms' && (<>
        <div className="panel dr-form" style={{ marginBottom: 14 }}>
          <div className="dr-sub">방 하나가 페어 한 쌍의 옷장이에요. 방을 만든 뒤 「방 설정」에서 캐릭터 이름·표정 5장·대사를 채워 주세요.</div>
          <input type="text" placeholder="방 이름 (예: ○○와 ○○의 옷장)" value={roomName} onChange={e => setRoomName(e.target.value)} />
          <FileDrop accept="image/png,image/webp" label={busy ? '만드는 중…' : '표지 이미지를 끌어다 놓으면 방이 만들어져요 (선택)'} onFiles={addRoom} />
          <button className="dr-chip" style={{ justifySelf: 'start' }} disabled={busy} onClick={() => addRoom([])}>표지 없이 방 만들기</button>
        </div>
        <div className="dr-list">
          {rooms.map((r, i) => (
            <div className="dr-item" key={r.id}>
              <div className="th"><Thumb fileRef={r.cover || r.chars[0].faces[0]} /></div>
              <div>
                <Field value={r.name} onCommit={v => patchRoom(r.id, x => ({ ...x, name: v }))} style={{ padding: '6px 8px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-s)', fontSize: 13 }} />
                <div className="mt">{r.chars[0].name} · {r.chars[1].name} · 옷 {parts.filter(p => p.roomId === r.id).length}벌</div>
              </div>
              <div className="ac">
                <button className="dr-chip on" onClick={() => { setRoomSel(r.id); setTab('room'); }}>방 설정</button>
                <label className="dr-chip">표지 변경<input type="file" accept="image/png,image/webp" hidden onChange={e => { upload(e.target.files?.[0], ref => patchRoom(r.id, x => ({ ...x, cover: ref }))); e.target.value = ''; }} /></label>
                <button className="dr-chip" disabled={i === 0} onClick={() => moveRoom(i, -1)}>↑</button>
                <button className="dr-chip" disabled={i === rooms.length - 1} onClick={() => moveRoom(i, 1)}>↓</button>
                <button className="dr-chip" onClick={() => removeRoom(r)}>삭제</button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <div className="dr-sub">아직 방이 없어요</div>}
        </div>
      </>)}

      {/* ───── 방 설정: 캐릭터 · 표정 · 대사 ───── */}
      {isAdmin && tab === 'room' && (!room ? <div className="dr-sub">먼저 「방」 탭에서 방을 만들어 주세요</div> : (<>
        {roomChips}
        <div className="panel dr-form" style={{ marginBottom: 14 }}>
          <label className="dr-sub">화면 제목 (비우면 방 이름)<Field value={room.title ?? ''} onCommit={v => patchRoom(room.id, r => ({ ...r, title: v }))} /></label>
          <label className="dr-sub">찰칵 저장 기본 파일명<Field value={room.saveName ?? ''} placeholder={room.name} onCommit={v => patchRoom(room.id, r => ({ ...r, saveName: v }))} /></label>
          <div className="dr-row" style={{ marginTop: 0 }}>
            <label className="dr-sub" style={{ flex: 1 }}>캐릭터 그림 가로(px)<Field number value={room.stageW} onCommit={v => patchRoom(room.id, r => ({ ...r, stageW: Math.max(50, Number(v) || 300) }))} /></label>
            <label className="dr-sub" style={{ flex: 1 }}>세로(px)<Field number value={room.stageH} onCommit={v => patchRoom(room.id, r => ({ ...r, stageH: Math.max(50, Number(v) || 600) }))} /></label>
          </div>
          <div className="dr-sub">모든 그림(표정·옷)은 이 크기의 투명 PNG로 만들어야 겹쳤을 때 어긋나지 않아요. 기본 300×600.</div>
        </div>

        <div className="dr-row" style={{ marginTop: 0, marginBottom: 12 }}>
          <span className="lb">캐릭터</span>
          <button className={`dr-chip ${charSel === 0 ? 'on' : ''}`} onClick={() => setCharSel(0)}>A · {room.chars[0].name}</button>
          <button className={`dr-chip ${charSel === 1 ? 'on' : ''}`} onClick={() => setCharSel(1)}>B · {room.chars[1].name}</button>
        </div>

        {(() => {
          const ci = charSel; const ch = room.chars[ci];
          return (
            <div className="panel dr-form">
              <label className="dr-sub">이름<Field value={ch.name} onCommit={v => patchChar(room.id, ci, c => ({ ...c, name: v || c.name }))} /></label>

              <div className="dr-sub">표정 5장 — 올린 그림으로 바로 바뀌어요</div>
              <div className="dr-list">
                {FACE_LABELS.map((lb, k) => (
                  <div className="dr-item" key={k}>
                    <div className="th"><Thumb fileRef={ch.faces[k]} /></div>
                    <div><div className="nm">{k + 1}. {lb}</div><div className="mt">{ch.faces[k] ? '올려져 있어요' : '아직 없어요'}</div></div>
                    <div className="ac">
                      <label className="dr-chip">{ch.faces[k] ? '교체' : '올리기'}
                        <input type="file" accept="image/png,image/webp" hidden onChange={e => { upload(e.target.files?.[0], ref => patchChar(room.id, ci, c => ({ ...c, faces: c.faces.map((f, j) => j === k ? ref : f) }))); e.target.value = ''; }} /></label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="dr-sub">홍조 위치 — 부끄러울 때 뜨는 붉은 기운이에요 (캐릭터 그림 왼쪽 위가 0,0 · px)</div>
              <div className="dr-row" style={{ marginTop: 0 }}>
                {(['x', 'y', 'w', 'h'] as const).map(k => (
                  <label className="dr-sub" key={k} style={{ flex: 1 }}>{({ x: '왼쪽', y: '위', w: '너비', h: '높이' })[k]}
                    <Field number value={ch.blush[k]} onCommit={v => patchChar(room.id, ci, c => ({ ...c, blush: { ...c.blush, [k]: Number(v) || 0 } }))} /></label>
                ))}
              </div>

              <div className="dr-sub" style={{ marginTop: 6 }}>대사 — 줄바꿈으로 여러 줄을 적으면(목록형) 그중 하나가 무작위로 나와요</div>
              {LINE_KEYS.map(lk => (
                <label className="dr-sub" key={lk.key}><b>{lk.label}</b> <span style={{ opacity: .7 }}>— {lk.hint}</span>
                  <Field area={lk.list} value={ch.lines[lk.key] ?? DEFAULT_LINES[lk.key] ?? ''}
                    onCommit={v => patchChar(room.id, ci, c => ({ ...c, lines: { ...c.lines, [lk.key]: v } }))} /></label>
              ))}
              <button className="dr-chip" style={{ justifySelf: 'start' }}
                onClick={() => del.ask('대사를 기본 문구로 되돌리시겠습니까?', () => patchChar(room.id, ci, c => ({ ...c, lines: { ...DEFAULT_LINES } })), '지금 적어 둔 대사가 모두 바뀝니다.')}>대사를 기본 문구로 되돌리기</button>
            </div>
          );
        })()}
      </>))}

      {/* ───── 옷 ───── */}
      {tab === 'parts' && (rooms.length === 0 ? <div className="dr-sub">먼저 관리자가 방을 만들어야 해요</div> : (<>
        {roomChips}
        {partForm}
        <div className="dr-row" style={{ marginTop: 0, marginBottom: 12 }}>
          <span className="lb">보기</span>
          <button className={`dr-chip ${!listCat ? 'on' : ''}`} onClick={() => setListCat('')}>전체</button>
          {cats.map(c => <button key={c.id} className={`dr-chip ${listCat === c.id ? 'on' : ''}`} onClick={() => setListCat(c.id)}>{c.name}</button>)}
        </div>
        <div className="dr-list">
          {shown.map(p => partRow(p, isAdmin))}
          {shown.length === 0 && <div className="dr-sub">등록된 옷이 없어요</div>}
        </div>
      </>))}

      {isAdmin && tab === 'queue' && (
        <div className="dr-list">
          {pending.map(p => partRow(p, true))}
          {pending.length === 0 && <div className="dr-sub">승인 대기 중인 옷이 없어요</div>}
        </div>
      )}

      {/* ───── 카테고리 · 설정 ───── */}
      {isAdmin && tab === 'settings' && (
        <div className="panel dr-form">
          <label className="dr-sub"><input type="checkbox" checked={set.allowMemberParts} onChange={e => patchSet({ allowMemberParts: e.target.checked })} /> 회원의 옷 등록 허용 (승인 후 공개)</label>
          <div className="dr-sub">카테고리 — z는 겹치는 순서(클수록 앞, 캐릭터 몸은 10). <b>여러 개</b>: 같은 카테고리를 겹쳐 입기 · <b>몸 가림</b>: 입고 있으면 옷을 입은 상태 · <b>악세</b>: 5개 이상이면 무거워함 · <b>배경</b>: 옷 대신 배경으로 적용</div>
          {cats.map((c, i) => (
            <div className="dr-row" key={c.id} style={{ marginTop: 0 }}>
              <div style={{ flex: 1, minWidth: 90 }}><Field value={c.name} onCommit={v => patchCat(c.id, { name: v || c.name })} /></div>
              <div style={{ width: 70 }}><Field number value={c.z} onCommit={v => patchCat(c.id, { z: Number(v) || 0 })} /></div>
              <label className="dr-sub"><input type="checkbox" checked={!!c.stack} onChange={e => patchCat(c.id, { stack: e.target.checked })} /> 여러 개</label>
              <label className="dr-sub"><input type="checkbox" checked={!!c.covers} onChange={e => patchCat(c.id, { covers: e.target.checked })} /> 몸 가림</label>
              <label className="dr-sub"><input type="checkbox" checked={!!c.acc} onChange={e => patchCat(c.id, { acc: e.target.checked })} /> 악세</label>
              <label className="dr-sub"><input type="checkbox" checked={!!c.bg} onChange={e => patchCat(c.id, { bg: e.target.checked })} /> 배경</label>
              <button className="dr-chip" disabled={i === 0} onClick={() => moveCat(i, -1)}>↑</button>
              <button className="dr-chip" disabled={i === cats.length - 1} onClick={() => moveCat(i, 1)}>↓</button>
              <button className="dr-chip" disabled={cats.length <= 1} onClick={() => del.ask(`「${c.name}」 카테고리를 삭제하시겠습니까?`, () => setCats(cats.filter(x => x.id !== c.id)), '이 카테고리의 옷은 화면에서 보이지 않게 됩니다.')}>삭제</button>
            </div>
          ))}
          <button className="dr-chip" style={{ justifySelf: 'start' }} onClick={() => setCats([...cats, { id: newId(), name: '새 카테고리', z: 20 }])}>＋ 카테고리 추가</button>
        </div>
      )}
      {del.element}
    </section>
  );
}
