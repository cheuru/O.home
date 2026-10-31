'use client';
// 페어의 옷장 — 보기 화면 (원본: 우초맨 제작 dressup, PHP+jQuery → React 이식)
// 옷 끌어다 놓기 · 더블클릭 입히기 · 방치/부끄럼/패닉 반응 · 찰칵! 저장까지 같은 동작을 한다.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { ClosetData, ClosetItem } from '@/lib/closetStore';
import { tabInfo } from '@/lib/closetStore';
import { Modal, useConfirmDelete } from '@/components/ui/Modal';
import { KInput, KSelect, KStep } from '@/components/ui/Kit';
import { useToast } from '@/components/ui/Toast';
import { CLOSET_CSS } from './closetCss';
import { Cid, CharView, STACK_TYPES, emptyView, makeEngine, EngineApi } from './closetEngine';

const SFX_SRC = { blop: '/closet/sfx/blop.mp3', magic: '/closet/sfx/magic.mp3', whoosh: '/closet/sfx/whoosh.mp3', pic: '/closet/sfx/pic.mp3' };

/** 홍조 위치 "왼쪽,위,너비,높이" → 스타일 */
function blushStyle(spec: string): React.CSSProperties {
  const d = [75, 110, 150, 100];
  const p = String(spec || '').split(',').map(s => s.trim());
  const n = d.map((v, i) => (p[i] !== undefined && p[i] !== '' && !isNaN(Number(p[i])) ? Math.round(Number(p[i])) : v));
  return { left: n[0], top: n[1], width: n[2], height: n[3] };
}

/** 같은 출처가 아닌 이미지는 서버 중계(/api/font)를 거쳐야 캔버스가 잠기지 않는다 */
const viaProxy = (src: string) => {
  if (/^(data:|blob:|\/(?!\/))/.test(src)) return src;
  try { if (new URL(src, location.href).origin === location.origin) return src; } catch { return src; }
  return `/api/font?u=${encodeURIComponent(src)}`;
};

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const a = new Image();
    a.onload = () => res(a);
    a.onerror = () => {
      const b = new Image(); b.crossOrigin = 'anonymous';
      b.onload = () => res(b); b.onerror = () => res(null); b.src = src;
    };
    a.src = viaProxy(src);
  });
}

/** 제목 — 한 글자씩 찍히고 마지막에 살짝 흔들린다 */
function TypedTitle({ text }: { text: string }) {
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  const delays = useMemo(() => Array.from(text, () => Math.random() * 0.2), [text]);
  useEffect(() => {
    setN(0); setDone(false);
    let i = 0;
    const t = window.setInterval(() => { i += 1; setN(i); if (i >= text.length) { window.clearInterval(t); setDone(true); } }, 100);
    return () => window.clearInterval(t);
  }, [text]);
  return (
    <div id="cl-title">
      {Array.from(text).slice(0, n).map((ch, i) => (
        <span key={i} style={done ? { animation: `titleWagle .5s ease-in-out ${delays[i]}s` } : undefined}>{ch === ' ' ? '\u00a0' : ch}</span>
      ))}
    </div>
  );
}

export function ClosetStage({ data, ready, isAdmin, roomId, onEditItem, onDeleteItem }: {
  data: ClosetData; ready: boolean; isAdmin: boolean; roomId: string;
  onEditItem?: (id: string, p: Partial<ClosetItem>) => void;
  onDeleteItem?: (id: string) => void;
}) {
  const toast = useToast();
  const del = useConfirmDelete();
  const [detail, setDetail] = useState(false);   // 아이템 자세히 보기(= 수정) 펼침
  const d = data.design;
  const tabs = useMemo(() => tabInfo(d), [d]);
  const [views, setViews] = useState<Record<Cid, CharView>>({ 1: emptyView(), 2: emptyView() });
  const [curTab, setCurTab] = useState('');
  const [kw, setKw] = useState('');
  const [dblTarget, setDblTarget] = useState<'auto' | 1 | 2>('auto');
  const [bgPending, setBgPending] = useState<string | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ src: string; x: number; y: number } | null>(null);
  const [saveAsk, setSaveAsk] = useState(false);
  const [saveName, setSaveName] = useState('');
  const zone = useRef<Record<Cid, HTMLDivElement | null>>({ 1: null, 2: null });

  /* ── 엔진 연결 ── */
  const audio = useRef<Record<string, HTMLAudioElement>>({});
  const sfx = useCallback((k: keyof typeof SFX_SRC) => {
    try {
      const a = audio.current[k] ?? (audio.current[k] = Object.assign(new Audio(), { preload: 'none', src: SFX_SRC[k] }));
      a.currentTime = 0; void a.play().catch(() => { /* 자동재생이 막혀도 괜찮다 */ });
    } catch { /* 무시 */ }
  }, []);
  const api = useRef<EngineApi>({ data, patch: () => {}, sfx, askBg: () => {}, dragging: false });
  api.current.data = data;
  api.current.sfx = sfx;
  api.current.patch = (cid, p) => setViews(v => ({ ...v, [cid]: { ...v[cid], ...p } }));
  api.current.askBg = src => setBgPending(src);
  const E = useMemo(() => makeEngine(api), []);

  useEffect(() => {
    if (!ready) return;
    E.init(1); E.init(2);
    return () => E.dispose();
  }, [ready, E]);

  /* ── 탭·아이템 ── */
  const startTab = useMemo(() => {
    if (tabs.order.includes(d.startTab)) return d.startTab;
    const cnt: Record<string, number> = {};
    data.items.forEach(i => { const t = tabs.remap(i.type); cnt[t] = (cnt[t] || 0) + 1; });
    return tabs.order.find(t => cnt[t] > 0) ?? tabs.order[0];
  }, [tabs, d.startTab, data.items]);
  useEffect(() => { if (!curTab || !tabs.order.includes(curTab)) setCurTab(startTab); }, [startTab, curTab, tabs]);

  const sizeLabel: [string, string] = [(d.char1Label || 'A').trim() || 'A', (d.char2Label || 'B').trim() || 'B'];
  const names: [string, string] = [d.char1Name, d.char2Name];
  const hiddenSrcs = useMemo(() => {
    const s = new Set<string>();
    ([1, 2] as Cid[]).forEach(c => views[c].worn.forEach(w => { if (!STACK_TYPES.includes(w.type)) s.add(w.src); }));
    return s;
  }, [views]);
  const shown = (i: ClosetItem) => !kw || i.desc.toLowerCase().includes(kw.toLowerCase());
  const inTab = (t: string) => data.items.filter(i => tabs.remap(i.type) === t);
  const visibleCount = inTab(curTab).filter(i => shown(i) && !hiddenSrcs.has(i.src)).length;

  /* ── 더블클릭 대상 ── */
  const pickTarget = (it: ClosetItem): Cid => {
    if (dblTarget === 1 || dblTarget === 2) return dblTarget;
    const raw = it.desc.trim(); const up = raw.toUpperCase();
    let hit = ([1, 2] as Cid[]).filter(i => { const lb = sizeLabel[i - 1].toUpperCase(); return lb && up.slice(-lb.length) === lb; });
    if (hit.length === 1) return hit[0];
    hit = ([1, 2] as Cid[]).filter(i => {
      const nm = names[i - 1].trim(); if (!nm) return false;
      if (raw.includes(nm)) return true;
      const first = nm.split(/\s+/)[0]; return first.length >= 2 && raw.includes(first);
    });
    return hit.length === 1 ? hit[0] : 1;
  };
  const tap = useRef<{ id: string; t: number }>({ id: '', t: 0 });
  const justDragged = useRef(false);
  const onItemClick = (it: ClosetItem) => {
    if (justDragged.current) return;
    if (it.type === 'bg') { setBgPending(it.src); return; }
    const now = Date.now();
    if (tap.current.id === it.id && now - tap.current.t < 450) {
      tap.current = { id: '', t: 0 };
      const cid = pickTarget(it);
      const have = views[cid].worn.find(w => w.src === it.src);
      if (have) E.removeWorn(cid, have.uid); else E.drop(cid, it);
    } else tap.current = { id: it.id, t: now };
  };

  /* ── 끌어다 놓기 (마우스·펜) — 터치는 두 번 탭으로 입힌다 ── */
  const onItemDown = (e: React.PointerEvent, it: ClosetItem) => {
    if (e.pointerType === 'touch' || e.button !== 0 || it.type === 'bg') return;
    const sx = e.clientX, sy = e.clientY; let on = false;
    const mv = (ev: PointerEvent) => {
      if (!on && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      on = true; api.current.dragging = true; setTip(null);
      setGhost({ src: it.src, x: ev.clientX, y: ev.clientY });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (!on) return;
      api.current.dragging = false; setGhost(null);
      justDragged.current = true; window.setTimeout(() => { justDragged.current = false; }, 50);
      for (const cid of [1, 2] as Cid[]) {
        const r = zone.current[cid]?.getBoundingClientRect();
        if (r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { E.drop(cid, it); break; }
      }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    e.preventDefault();
  };

  /* ── 배경 ── */
  const applyBg = (which: 1 | 2 | 'both') => {
    if (bgPending) {
      if (which === 1 || which === 'both') setViews(v => ({ ...v, 1: { ...v[1], bg: bgPending } }));
      if (which === 2 || which === 'both') setViews(v => ({ ...v, 2: { ...v[2], bg: bgPending } }));
    }
    setBgPending(null);
  };
  const removeBg = (cid: Cid) => setViews(v => ({ ...v, [cid]: { ...v[cid], bg: null } }));

  /* ── 찰칵! 저장 ── */
  const drawChar = async (cid: Cid, skipped: string[]) => {
    const w = cid === 1 ? d.char1Width : d.char2Width, h = cid === 1 ? d.char1Height : d.char2Height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    const v = views[cid];
    const bodies = cid === 1 ? d.char1Bodies : d.char2Bodies;
    const layers: { src: string; zi: number; bg?: boolean; desc: string; img?: HTMLImageElement | null }[] = [];
    if (v.bg) layers.push({ src: v.bg, zi: -999, bg: true, desc: '배경' });
    layers.push({ src: bodies[v.face - 1], zi: 10, desc: '캐릭터' });
    v.worn.forEach(x => layers.push({ src: x.src, zi: x.zi, desc: x.desc || '아이템' }));
    layers.sort((a, b) => a.zi - b.zi);
    await Promise.all(layers.map(async l => { l.img = await loadImg(l.src); if (!l.img) skipped.push(l.desc); }));
    layers.forEach(l => {
      if (!l.img) return;
      if (l.bg) {
        const sc = Math.max(w / l.img.naturalWidth, h / l.img.naturalHeight);
        const sw = l.img.naturalWidth * sc, sh = l.img.naturalHeight * sc;
        ctx.drawImage(l.img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      } else ctx.drawImage(l.img, 0, 0, w, h);
    });
    return cv;
  };
  const doSave = async () => {
    const fn = saveName.trim() || d.saveName || '옷장';
    setSaveAsk(false); sfx('pic');
    const skipped: string[] = [];
    try {
      const [c1, c2] = await Promise.all([drawChar(1, skipped), drawChar(2, skipped)]);
      const gap = 20;
      const comb = document.createElement('canvas');
      comb.width = c1.width + gap + c2.width; comb.height = Math.max(c1.height, c2.height);
      const ctx = comb.getContext('2d')!;
      ctx.drawImage(c1, 0, 0); ctx.drawImage(c2, c1.width + gap, 0);
      let url = '';
      try { url = comb.toDataURL('image/png'); } catch {
        toast('저장하지 못했습니다 — 다른 사이트 주소의 이미지가 섞여 있으면 브라우저가 막습니다'); return;
      }
      const a = document.createElement('a'); a.download = `${fn}.png`; a.href = url;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      if (skipped.length) toast(`저장은 됐지만 담기지 않은 항목: ${Array.from(new Set(skipped)).join(', ')}`);
      window.setTimeout(() => E.bubble(1, E.dg(1, 'save_photo'), 3), 800);
      window.setTimeout(() => E.bubble(2, E.dg(2, 'save_photo'), 3), 1100);
    } catch { toast('저장 실패'); }
  };

  /* ── 그리기 ── */
  const cssVars = {
    '--pc': d.pointColor || 'var(--accent)', '--rm': d.ribbonColor || 'var(--ink)', '--tc': d.titleColor || 'var(--page-title)',
    '--mf': d.mainFont ? `'${d.mainFont}', var(--sans)` : 'var(--sans)',
    '--tf': d.titleFont ? `'${d.titleFont}', var(--sans)` : 'var(--sans)',
  } as React.CSSProperties;

  const charCol = (cid: Cid) => {
    const v = views[cid];
    const w = cid === 1 ? d.char1Width : d.char2Width, h = cid === 1 ? d.char1Height : d.char2Height;
    const bodies = cid === 1 ? d.char1Bodies : d.char2Bodies;
    return (
      <div className="char-col" key={cid}>
        <div className="char-name-label">{names[cid - 1]}</div>
        <div className="char-btn-row">
          <button type="button" className="btn_custom" onClick={() => E.restore(cid)}>다시 입히기</button>
          <button type="button" className="btn_custom btn_reset" onClick={() => E.reset(cid)}>전부 벗기!</button>
        </div>
        <div ref={el => { zone.current[cid] = el; }} className="character-stage" style={{
          width: w, height: h,
          ...(v.bg ? { backgroundImage: `url('${v.bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
        }} onClick={() => E.click(cid)}>
          <div className={`speech-bubble${v.vis ? ' bvis' : ''}${v.pop ? ' anim-pop' : ''}`}>{v.text}</div>
          <div key={v.sweat}>{v.sweat ? [['26.7%', '0s'], ['66.7%', '.1s'], ['73.3%', '.3s']].map(([l, dl]) => (
            <div key={l} className="sweat-drop" style={{ left: l, animation: `sweatAnim .6s ${dl} linear` }} />
          )) : null}</div>
          <div>{v.clouds && <>
            <div className="dark-cloud" style={{ left: '20%', top: '14.2%', width: '30%', height: '5%', animationDelay: '0s' }} />
            <div className="dark-cloud" style={{ left: '40%', top: '10.8%', width: '36.7%', height: '5.8%', animationDelay: '.5s' }} />
          </>}</div>
          <div className={`blush-overlay${v.blush ? ' active-blush' : ''}`} style={blushStyle(cid === 1 ? d.blush1 : d.blush2)} />
          <div className={`char-visuals ${v.cls.join(' ')}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bodies[v.face - 1]} className="base-layer" alt="" draggable={false} />
            {v.worn.map(x => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={x.uid} src={x.src} alt="" draggable={false} className={`dropped-item worn-${x.type} ${x.anim}`} style={{ zIndex: x.zi }} />
            ))}
          </div>
        </div>
        <div className="worn-panel-wrap" style={{ width: w }}>
          <div className="worn-panel-title">착용 중 · ✕ 벗기 / ▲▼ 앞뒤 조절</div>
          <div className="worn-panel">
            {!v.worn.length && <span className="worn-empty">없음</span>}
            {v.worn.map(x => (
              <div className="worn-chip" key={x.uid}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.src} title={x.desc} alt="" />
                <span className="chip-lbl">{x.desc || x.type}</span>
                <div className="zi-row">
                  <button className="zi-btn" title="앞으로" onClick={e => { e.stopPropagation(); E.bumpZ(cid, x.uid, 1); }}>▲</button>
                  <span className="zi-val">{x.zi}</span>
                  <button className="zi-btn" title="뒤로" onClick={e => { e.stopPropagation(); E.bumpZ(cid, x.uid, -1); }}>▼</button>
                </div>
                <button className="worn-x" title="벗기기" onClick={e => { e.stopPropagation(); E.removeWorn(cid, x.uid); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cl-root" style={cssVars}>
      <style>{CLOSET_CSS}</style>
      <div className="dressup-container">
        <div className="ribbon-wrapper"><div className="ribbon-bg" /><TypedTitle text={d.gameTitle} /></div>
        <div className="title-save-btn">
          <button type="button" className="btn_custom" style={{ padding: '0 22px' }}
            onClick={() => { setSaveName(d.saveName || ''); setSaveAsk(true); }}>찰칵! 이미지로 저장</button>
        </div>

        <div className="cl-main">
          <div className="dual-stage">{charCol(1)}{charCol(2)}</div>

          <div className="wardrobe-sidebar">
            <div className="wardrobe-top-bar">
              <input type="text" className="search-box" placeholder="아이템 검색..." value={kw} onChange={e => setKw(e.target.value)} />
              <div className="dbl-bar">
                <span className="dbl-hint">더블클릭하면 입혀요</span>
                <button type="button" className={`dbl-btn${dblTarget === 'auto' ? ' active' : ''}`} onClick={() => setDblTarget('auto')}
                  title={`아이템 이름 끝의 ${sizeLabel[0]}/${sizeLabel[1]} 를 보고 알아서 정합니다`}>자동</button>
                <button type="button" className={`dbl-btn${dblTarget === 1 ? ' active' : ''}`} onClick={() => setDblTarget(1)}>{names[0]}</button>
                <button type="button" className={`dbl-btn${dblTarget === 2 ? ' active' : ''}`} onClick={() => setDblTarget(2)}>{names[1]}</button>
              </div>
            </div>
            <button type="button" className="btn-toggle-detail" onClick={() => setDetail(v => !v)}>{detail ? '닫기 ▲' : '자세히 ▼'}</button>
            <div className={`cl-fold${detail ? ' open' : ''}`}>
              <div className="cl-fold-inner">
                <div className="tab-nav">
                  {tabs.order.map(t => (
                    <button key={t} className={`tab-btn${t === curTab ? ' active' : ''}`} onClick={() => setCurTab(t)}>{tabs.label[t]}</button>
                  ))}
                </div>
                <div className="wardrobe">
                  {tabs.order.map(t => (
                    <div key={t} className={`tab-panel${t === curTab ? ' active' : ''}`}>
                      {inTab(t).map(it => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={it.id} src={it.src} alt={it.desc} loading="lazy" decoding="async" draggable={false}
                          className={`clothes-item${hiddenSrcs.has(it.src) ? ' item-worn' : ''}${shown(it) ? '' : ' item-hidden'}`}
                          data-type={it.type}
                          onPointerDown={e => onItemDown(e, it)} onClick={() => onItemClick(it)}
                          onMouseEnter={e => it.desc && setTip({ text: it.desc, x: e.clientX, y: e.clientY })}
                          onMouseMove={e => setTip(p => (p ? { ...p, x: e.clientX, y: e.clientY } : p))}
                          onMouseLeave={() => setTip(null)} />
                      ))}
                      {t === 'bg' && ([1, 2] as Cid[]).map(cid => (
                        <div key={cid} className="bg-remove-btn" onClick={() => removeBg(cid)}>
                          <span>{names[cid - 1]}<br />배경제거</span>
                        </div>
                      ))}
                      {t === curTab && visibleCount === 0 && <div className="tab-empty">아이템이 없습니다.</div>}
                      {isAdmin && onEditItem && inTab(t).filter(shown).length > 0 && (
                        <div className="item-edit-head">수정 — 이름·탭·앞뒤 순서를 바로 고칠 수 있어요</div>
                      )}
                      {isAdmin && onEditItem && inTab(t).filter(shown).map(it => (
                        <div key={`e${it.id}`} className="item-detail">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.src} alt={it.desc} draggable={false} />
                          <div className="item-detail-form">
                            <input className="k-input" defaultValue={it.desc} placeholder="이름" key={`${it.id}:${it.desc}`}
                              onBlur={e => { const v = e.target.value; if (v !== it.desc) onEditItem(it.id, { desc: v }); }}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                            <div className="item-detail-line">
                              <KSelect value={it.type} minWidth={110} onChange={v => onEditItem(it.id, { type: v })}
                                options={[...tabs.order, ...(tabs.order.includes(it.type) ? [] : [it.type])].map(k => ({ value: k, label: tabs.label[k] ?? k }))} />
                              <KStep value={it.zi} min={-99} max={99} onChange={v => onEditItem(it.id, { zi: v })} />
                              {onDeleteItem && <button type="button" className="dbl-btn" onClick={() => del.ask('이 아이템을 삭제할까요?', () => onDeleteItem(it.id))}>삭제</button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="footer-credit">
              <a href="https://uchoman.ivyro.net/" target="_blank" rel="noreferrer">우초맨만듦</a>
              <span>✔ SFX: <a href="https://sellbuymusic.com/md/spjqcbb-efbfbct" target="_blank" rel="noreferrer">셀바이뮤직</a></span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ textAlign: 'center', margin: '30px auto 10px' }}>
            <Link href={`/closet/admin?room=${encodeURIComponent(roomId)}`} className="cl-adminlink">관리자 페이지</Link>
          </div>
        )}
      </div>

      {bgPending && (
        <div className="bg-modal" onClick={e => { if (e.target === e.currentTarget) setBgPending(null); }}>
          <div className="bg-modal-box">
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18, color: 'var(--ink)', letterSpacing: '.02em' }}>어디에 배경을 적용할까요?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn_custom" onClick={() => applyBg(1)}>{names[0]} 만</button>
              <button className="btn_custom" onClick={() => applyBg(2)}>{names[1]} 만</button>
              <button className="btn_custom" onClick={() => applyBg('both')}>둘 다</button>
              <button className="btn_custom ghost" onClick={() => setBgPending(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {tip && <div className="item-tooltip" style={{ top: tip.y - 40, left: tip.x > window.innerWidth / 2 ? tip.x - 12 : tip.x + 12, transform: tip.x > window.innerWidth / 2 ? 'translateX(-100%)' : undefined }}>{tip.text}</div>}
      {ghost && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ghost.src} alt="" className="cl-ghost"
          style={{ width: d.char1Width, height: d.char1Height, left: ghost.x - d.char1Width / 2, top: ghost.y - d.char1Width / 2 }} />
      )}

      {del.element}
      <Modal open={saveAsk} small title="찰칵!" desc="저장 파일명을 입력해주세요"
        onClose={() => setSaveAsk(false)}
        actions={<>
          <button className="btn btn-dark" onClick={doSave}>SAVE</button>
          <button className="btn btn-ghost" onClick={() => setSaveAsk(false)}>CANCEL</button>
        </>}>
        <KInput value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void doSave(); }} autoFocus />
      </Modal>
    </div>
  );
}
