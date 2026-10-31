'use client';
// 페어의 옷장 — 관리자 화면 (아이템 · 대사 · 디자인 · 백업)
// 고친 내용은 「저장」을 눌러야 방문자 화면에 반영된다 — 서버 쓰기를 글자마다 하지 않기 위해서다.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClosetData, ClosetItem, DG_FIELDS, defaultCloset, normalizeCloset, tabInfo } from '@/lib/closetStore';
import { putBlob, useUploading, useBlobUrl } from '@/lib/blobStore';
import { newId } from '@/lib/postStore';
import { KInput, KSelect, KStep, KTextarea, KLabel, LiveInput } from '@/components/ui/Kit';
import { ColorField } from '@/components/ui/ColorField';
import { FileDrop } from '@/components/ui/FileDrop';
import { useConfirmDelete } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

type Sec = 'items' | 'dialogue' | 'design' | 'backup';
const SECS: [Sec, string][] = [['items', '아이템'], ['dialogue', '대사'], ['design', '디자인'], ['backup', '백업·초기화']];
const ZI_HINT = '앞뒤 순서 — 클수록 앞. 기본: 하의 15 · 상의/원피스 20 · 신발 22 · 머리 30 · 외투 35 · 악세 40';

const nameOf = (f: File) => f.name.replace(/\.[^.]+$/, '');
const isImg = (f: File) => /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);

/** 그림 한 장 고르기 — 올리면 주소로 바꿔 돌려준다 */
function PickImage({ value, onChange, label, size = 64, fallback }: {
  value: string; onChange: (url: string) => void; label?: string; size?: number; fallback?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const blobUrl = useBlobUrl(value.startsWith('/') ? undefined : value);   // 사이트 안 기본 그림(/closet/…)은 그대로
  const shownSrc = value.startsWith('/') ? value : (blobUrl ?? '');
  const pick = async (f?: File) => {
    if (!f) return;
    if (!isImg(f)) { toast('이미지 파일만 올릴 수 있어요'); return; }
    try { onChange(await putBlob(f)); } catch (e) { toast(`업로드 실패 — ${e instanceof Error ? e.message : ''}`); }
  };
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shownSrc} alt="" onClick={() => ref.current?.click()} title="클릭해서 바꾸기"
        style={{ width: size, height: size, objectFit: 'contain', border: '1.5px solid var(--line)', borderRadius: 8, background: '#fff', cursor: 'pointer' }} />
      {label && <span style={{ fontSize: 11, color: 'var(--sub)' }}>{label}</span>}
      {fallback && value !== fallback && (
        <button type="button" className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => onChange(fallback)}>기본으로</button>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

/** 기본 코디 고르기용 작은 그림 */
function Thumb({ src, title, on, onClick }: { src: string; title: string; on: boolean; onClick: () => void }) {
  const blobUrl = useBlobUrl(src.startsWith('/') ? undefined : src);
  const url = src.startsWith('/') ? src : blobUrl;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url ?? ''} alt={title} title={title} onClick={onClick}
      style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, cursor: 'pointer', background: '#fff',
        border: `2px solid ${on ? 'var(--accent)' : 'var(--line)'}`, opacity: on ? 1 : 0.55 }} />
  );
}

export function ClosetAdmin({ data, onSave }: { data: ClosetData; onSave: (d: ClosetData) => void }) {
  const toast = useToast();
  const del = useConfirmDelete();
  const uploading = useUploading();
  const [draft, setDraft] = useState<ClosetData>(data);
  const [dirty, setDirty] = useState(false);
  const [sec, setSec] = useState<Sec>('items');
  const [tabFilter, setTabFilter] = useState('all');
  const [newType, setNewType] = useState('top');
  const [urlText, setUrlText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // 다른 곳에서 값이 바뀌어 들어와도, 고치는 중이 아닐 때만 맞춘다
  useEffect(() => { if (!dirty) setDraft(data); }, [data, dirty]);

  const d = draft.design;
  const tabs = useMemo(() => tabInfo(d), [d]);
  const typeOptions = useMemo(() => {
    const keys = [...tabs.order];
    draft.items.forEach(i => { if (!keys.includes(i.type)) keys.push(i.type); });
    return keys.map(k => ({ value: k, label: tabs.label[k] ?? k }));
  }, [tabs, draft.items]);

  const edit = (fn: (x: ClosetData) => ClosetData) => { setDraft(x => fn(x)); setDirty(true); };
  const setDesign = (p: Partial<ClosetData['design']>) => edit(x => ({ ...x, design: { ...x.design, ...p } }));
  const setItem = (id: string, p: Partial<ClosetItem>) => edit(x => ({ ...x, items: x.items.map(i => i.id === id ? { ...i, ...p } : i) }));
  const save = () => { onSave(draft); setDirty(false); toast('저장했어요'); };

  /* ── 아이템 올리기 ── */
  const addFiles = async (files: File[]) => {
    const imgs = files.filter(isImg);
    if (!imgs.length) { toast('이미지 파일만 올릴 수 있어요'); return; }
    const made: ClosetItem[] = [];
    for (const f of imgs) {
      try { made.push({ id: newId(), src: await putBlob(f), type: newType, desc: nameOf(f), zi: 0 }); }
      catch (e) { toast(`「${f.name}」 업로드 실패 — ${e instanceof Error ? e.message : ''}`); }
    }
    if (made.length) { edit(x => ({ ...x, items: [...x.items, ...made] })); toast(`${made.length}개 올렸어요 — 저장을 눌러야 반영돼요`); }
  };
  const addUrls = () => {
    const made: ClosetItem[] = lines(urlText).map(l => {
      const [u, ...nm] = l.split('|');
      return { id: newId(), src: u.trim(), type: newType, desc: nm.join('|').trim() || u.trim().split('/').pop()?.replace(/\.[^.]+$/, '') || '', zi: 0 };
    }).filter(i => /^(https?:)?\/\//.test(i.src) || i.src.startsWith('/'));
    if (!made.length) { toast('주소를 한 줄에 하나씩 적어 주세요 (https://… | 이름)'); return; }
    edit(x => ({ ...x, items: [...x.items, ...made] })); setUrlText('');
  };
  const lines = (v: string) => v.split(/\r\n|\r|\n/).map(s => s.trim()).filter(Boolean);

  const shown = draft.items.filter(i => tabFilter === 'all' || tabs.remap(i.type) === tabFilter);

  /* ── 기본 코디 고르기 ── */
  const toggleDefault = (cid: 1 | 2, id: string) => {
    const key = cid === 1 ? 'char1Default' : 'char2Default';
    const cur = d[key];
    setDesign({ [key]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] } as Partial<ClosetData['design']>);
  };
  const setBody = (cid: 1 | 2, n: number, url: string) => {
    const key = cid === 1 ? 'char1Bodies' : 'char2Bodies';
    setDesign({ [key]: d[key].map((v, i) => i === n ? url : v) } as Partial<ClosetData['design']>);
  };

  /* ── 백업 ── */
  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 1)], { type: 'application/json' }));
    a.download = 'closet-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  const importJson = async (f?: File) => {
    if (!f) return;
    try { const next = normalizeCloset(JSON.parse(await f.text())); edit(() => next); toast('불러왔어요 — 저장을 눌러야 반영돼요'); }
    catch { toast('옷장 백업 파일이 아니에요'); }
  };
  const dfl = defaultCloset().design;

  const row = (children: React.ReactNode, key?: string) => <div key={key} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>{children}</div>;
  const field = (label: string, node: React.ReactNode, w = 200) => <div style={{ minWidth: w }}><KLabel>{label}</KLabel>{node}</div>;
  const text = (label: string, k: keyof ClosetData['design'], w = 200) => field(label,
    <LiveInput value={String(d[k] ?? '')} onValue={v => setDesign({ [k]: v } as Partial<ClosetData['design']>)} className="k-input" />, w);
  const num = (label: string, k: 'char1Width' | 'char1Height' | 'char2Width' | 'char2Height') => field(label,
    <KStep value={d[k]} min={50} max={1200} step={10} onChange={v => setDesign({ [k]: v })} />, 120);
  const color = (label: string, k: 'ribbonColor' | 'pointColor' | 'titleColor') => field(label,
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <ColorField value={d[k] || '#888888'} onChange={v => setDesign({ [k]: v })} />
      {d[k]
        ? <button type="button" className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setDesign({ [k]: '' })}>사이트 색으로</button>
        : <span style={{ fontSize: 11, color: 'var(--faint)' }}>사이트 색 따르는 중</span>}
    </span>, 220);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {SECS.map(([k, l]) => <button key={k} className={`btn ${sec === k ? 'btn-dark' : 'btn-ghost'}`} onClick={() => setSec(k)}>{l}</button>)}
        <span style={{ flex: 1 }} />
        {uploading > 0 && <span style={{ fontSize: 12, color: 'var(--sub)' }}>올리는 중 {uploading}…</span>}
        {dirty && <span style={{ fontSize: 12, color: 'var(--accent)' }}>저장하지 않은 변경이 있어요</span>}
        <button className="btn btn-dark" disabled={!dirty} onClick={save}>SAVE</button>
      </div>

      {sec === 'items' && (
        <div className="panel">
          {row(<>
            {field('올릴 때 탭', <KSelect options={typeOptions} value={newType} onChange={setNewType} minWidth={140} />, 160)}
            <div style={{ flex: 1, minWidth: 240 }}><FileDrop accept="image/*" multiple label="옷 그림(PNG) 끌어다 놓기 — 여러 장 가능" onFiles={f => void addFiles(f)} /></div>
          </>)}
          <p style={{ fontSize: 12, color: 'var(--sub)', margin: '0 0 6px' }}>
            이름 끝에 사이즈 표시(예: 루즈삭스<b>A</b>)를 붙이면 더블클릭 때 해당 캐릭터에게 입혀져요. 사이즈 표시는 「디자인」에서 바꿀 수 있어요.
          </p>
          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--sub)' }}>이미 올려 둔 그림 주소로 한꺼번에 추가</summary>
            <KTextarea value={urlText} onChange={e => setUrlText(e.target.value)} placeholder={'https://… | 이름\nhttps://… | 이름'} />
            <button className="btn btn-ghost" style={{ marginTop: 6 }} onClick={addUrls}>주소 추가</button>
          </details>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className={`btn ${tabFilter === 'all' ? 'btn-dark' : 'btn-ghost'}`} onClick={() => setTabFilter('all')}>전체 {draft.items.length}</button>
            {tabs.order.map(t => (
              <button key={t} className={`btn ${tabFilter === t ? 'btn-dark' : 'btn-ghost'}`} onClick={() => setTabFilter(t)}>
                {tabs.label[t]} {draft.items.filter(i => tabs.remap(i.type) === t).length}
              </button>
            ))}
          </div>

          {!shown.length && <p style={{ color: 'var(--sub)', fontSize: 13 }}>아이템이 없습니다.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
            {shown.map(it => (
              <div key={it.id} style={{ display: 'flex', gap: 10, padding: 10, border: '1.5px solid var(--line)', borderRadius: 10, alignItems: 'flex-start' }}>
                <PickImage value={it.src} onChange={u => setItem(it.id, { src: u })} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <LiveInput value={it.desc} onValue={v => setItem(it.id, { desc: v })} className="k-input" placeholder="이름" />
                  <KSelect options={typeOptions} value={it.type} onChange={v => setItem(it.id, { type: v })} minWidth={120} />
                  <span title={ZI_HINT}><KStep value={it.zi} min={-99} max={99} onChange={v => setItem(it.id, { zi: v })} /></span>
                  <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: 12 }}
                    onClick={() => del.ask('이 아이템을 삭제할까요?', () => edit(x => ({
                      ...x, items: x.items.filter(i => i.id !== it.id),
                      design: { ...x.design, char1Default: x.design.char1Default.filter(i => i !== it.id), char2Default: x.design.char2Default.filter(i => i !== it.id) },
                    })))}>삭제</button>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--sub)', marginTop: 10 }}>{ZI_HINT}. 비워 두면(0) 종류별 기본값을 써요.</p>
        </div>
      )}

      {sec === 'dialogue' && (
        <div className="panel">
          <p style={{ fontSize: 12.5, color: 'var(--sub)', margin: '0 0 14px' }}>
            왼쪽은 {d.char1Name}, 오른쪽은 {d.char2Name}의 대사예요. 「줄바꿈 = 랜덤」 칸은 한 줄에 대사 하나씩 적으면 그중 하나가 무작위로 나와요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {DG_FIELDS.map(([k, name, desc, multi]) => ([1, 2] as const).map(cid => {
              const set = cid === 1 ? draft.dialogue1 : draft.dialogue2;
              const put = (v: string) => edit(x => ({ ...x, [cid === 1 ? 'dialogue1' : 'dialogue2']: { ...(cid === 1 ? x.dialogue1 : x.dialogue2), [k]: v } }));
              return (
                <div key={`${k}${cid}`}>
                  <KLabel>{name} · {cid === 1 ? d.char1Name : d.char2Name}</KLabel>
                  {multi
                    ? <KTextarea value={set[k] ?? ''} onChange={e => put(e.target.value)} placeholder={desc} />
                    : <KInput value={set[k] ?? ''} onChange={e => put(e.target.value)} placeholder={desc} />}
                  <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{desc}</div>
                </div>
              );
            }))}
          </div>
        </div>
      )}

      {sec === 'design' && (
        <div className="panel">
          {row(<>{text('옷장 이름 (제목·목록에 표시)', 'gameTitle', 260)}{text('저장 파일명 기본값', 'saveName', 220)}</>)}
          {row(<>
            <PickImage value={d.thumb || d.char1Bodies[0]} size={84} label="목록 썸네일" fallback={d.char1Bodies[0]}
              onChange={u => setDesign({ thumb: u === d.char1Bodies[0] ? '' : u })} />
            <span style={{ fontSize: 11.5, color: 'var(--sub)', maxWidth: 360, lineHeight: 1.7 }}>
              옷장 목록에 보일 그림이에요. 바꾸지 않으면 두 캐릭터의 기본 그림이 나란히 보여요.
            </span>
          </>)}
          {row(<>{text('캐릭터 1 이름', 'char1Name')}{text('캐릭터 2 이름', 'char2Name')}{text('캐릭터 1 사이즈 표시', 'char1Label', 120)}{text('캐릭터 2 사이즈 표시', 'char2Label', 120)}</>)}
          {row(<>{color('보조 색 (현재 거의 안 씀)', 'ribbonColor')}{color('강조 색', 'pointColor')}{color('제목 글자 색', 'titleColor')}</>)}
          {row(<>{text('본문 글꼴 (비우면 사이트 글꼴)', 'mainFont', 240)}{text('제목 글꼴', 'titleFont', 240)}</>)}
          {row(<>{num('캐릭터 1 너비', 'char1Width')}{num('캐릭터 1 높이', 'char1Height')}{num('캐릭터 2 너비', 'char2Width')}{num('캐릭터 2 높이', 'char2Height')}</>)}
          {row(<>{text('홍조 1 위치 (왼쪽,위,너비,높이)', 'blush1', 260)}{text('홍조 2 위치', 'blush2', 260)}</>)}

          <KLabel>캐릭터 그림 — 표정 5장 (기본 · 말하는 · 웃는 · 방치/부끄러움 · 레어)</KLabel>
          {([1, 2] as const).map(cid => (
            <div key={cid} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14, alignItems: 'flex-start' }}>
              {(cid === 1 ? d.char1Bodies : d.char2Bodies).map((u, n) => (
                <PickImage key={n} value={u} size={84} label={`${cid === 1 ? d.char1Name : d.char2Name} ${n + 1}`}
                  fallback={(cid === 1 ? dfl.char1Bodies : dfl.char2Bodies)[n]} onChange={url => setBody(cid, n, url)} />
              ))}
            </div>
          ))}

          <KLabel>기본 코디 — 접속하거나 「다시 입히기」를 누르면 입는 옷</KLabel>
          {([1, 2] as const).map(cid => (
            <div key={cid} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 6 }}>{cid === 1 ? d.char1Name : d.char2Name}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {draft.items.filter(i => i.type !== 'bg').map(i => {
                  const on = (cid === 1 ? d.char1Default : d.char2Default).includes(i.id);
                  return (
                    <Thumb key={i.id} src={i.src} title={i.desc} on={on} onClick={() => toggleDefault(cid, i.id)} />
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <KLabel>탭 구성 — 한 줄에 「탭키|화면에 보일 이름」</KLabel>
              <KTextarea value={d.tabList} onChange={e => setDesign({ tabList: e.target.value })} />
              <div style={{ fontSize: 11, color: 'var(--sub)' }}>탭키는 영문·숫자·_·- . 배경 탭의 키는 반드시 bg 예요.</div>
            </div>
            <div>
              <KLabel>탭 묶기 — 한 줄에 「원래타입&gt;보여줄탭」</KLabel>
              <KTextarea value={d.tabRemap} onChange={e => setDesign({ tabRemap: e.target.value })} />
              <div style={{ fontSize: 11, color: 'var(--sub)' }}>예: 상·하의를 따로 두지 않으면 top&gt;dress, bottom&gt;dress</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            {field('처음 열릴 탭', <KSelect value={d.startTab} onChange={v => setDesign({ startTab: v })} minWidth={160}
              options={[{ value: 'auto', label: '자동 (아이템이 든 첫 탭)' }, ...tabs.order.map(t => ({ value: t, label: tabs.label[t] }))]} />, 220)}
          </div>
        </div>
      )}

      {sec === 'backup' && (
        <div className="panel">
          <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--sub)', margin: '0 0 14px' }}>
            옷장 설정(아이템 목록·대사·디자인)을 파일로 받거나 불러옵니다. 그림 파일 자체는 이 사이트의 이미지 저장소에 있고,
            사이트 전체 백업(환경설정 &gt; 데이터 백업)에도 함께 담겨요. 이 파일에는 그림 주소만 들어 있어요.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={exportJson}>설정 내려받기 (.json)</button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>설정 불러오기</button>
            <button className="btn btn-accent" onClick={() => del.ask('옷장을 처음 상태로 되돌릴까요?', () => edit(() => defaultCloset()),
              '올린 아이템 목록·대사·디자인이 기본값으로 바뀝니다(저장을 눌러야 반영). 먼저 설정을 내려받아 두세요.', 'RESET')}>처음 상태로</button>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
              onChange={e => { void importJson(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
      )}
      {del.element}
    </div>
  );
}
