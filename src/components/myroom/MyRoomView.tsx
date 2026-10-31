'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// 마이룸 방 보기/꾸미기 — 그누보드 마이룸 스킨(view.skin.php)을 옮긴 것.
// 에디터 본체는 public/myroom/myroom-editor.js (드래그·크기·회전·Z순서·잠금·실행취소·스냅·다중선택) 를 그대로 쓰고,
// 화면 배율(줌/핀치/이동)·리모콘·보관함·아이템 편집창은 여기서 React 로 다시 만들었다.
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocalList, newId } from '@/lib/postStore';
import { putBlob, useBlobUrl } from '@/lib/blobStore';
import {
  ROOM_KEY, ROOM_SEED, CATALOG_KEY, CATALOG_SEED, loadMyRoomEditor, resolveUrl, useMyroomCats,
  type CatalogItem, type MyCat, type MyRoom,
} from '@/lib/myroomStore';
import { useToast } from '@/components/ui/Toast';
import '../../app/myroom/myroom.css';

type Ed = any;

function Thumb({ fileRef }: { fileRef: string }) {
  const url = useBlobUrl(fileRef);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" draggable={false} /> : null;
}

const imgDim = (url: string) => new Promise<{ w: number; h: number }>(res => {
  const im = new Image();
  im.onload = () => res({ w: im.naturalWidth || 120, h: im.naturalHeight || 120 });
  im.onerror = () => res({ w: 120, h: 120 });
  im.src = url;
});

/* ============ 바깥: 데이터 불러오기 ============ */
export default function MyRoomView({ roomId }: { roomId: string }) {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms, rLoaded] = useLocalList<MyRoom>(ROOM_KEY, ROOM_SEED);
  const [catalog, setCatalog, cLoaded] = useLocalList<CatalogItem>(CATALOG_KEY, CATALOG_SEED);
  const [cats, setCats, sLoaded] = useMyroomCats();
  const room = rooms.find(r => r.id === roomId);

  if (!rLoaded || !cLoaded || !sLoaded) return <section className="page" />;
  if (!room) {
    return (
      <section className="page"><div className="myroom-wrap">
        <p style={{ color: '#999', padding: '40px 0' }}>방을 찾을 수 없어요.</p>
        <Link href="/myroom" className="mr-back-to-list">← 목록으로</Link>
      </div></section>
    );
  }
  const canEdit = isAdmin || (!!user && user.id === room.authorId);
  return <RoomView key={room.id} room={room} rooms={rooms} setRooms={setRooms} catalog={catalog} setCatalog={setCatalog}
    cats={cats} setCats={setCats} canEdit={canEdit} isAdmin={isAdmin} userId={user?.id ?? ''} />;
}

/* ============ 안쪽: 에디터 ============ */
function RoomView({ room, rooms, setRooms, catalog, setCatalog, cats, setCats, canEdit, isAdmin, userId }: {
  room: MyRoom; rooms: MyRoom[]; setRooms: (n: MyRoom[]) => void;
  catalog: CatalogItem[]; setCatalog: (n: CatalogItem[]) => void;
  cats: MyCat[]; setCats: (c: MyCat[]) => void; canEdit: boolean; isAdmin: boolean; userId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const roomsRef = useRef(rooms); roomsRef.current = rooms;
  const roomRef = useRef(room); roomRef.current = room;
  const catalogRef = useRef(catalog); catalogRef.current = catalog;

  const wrapRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const roomElRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomCtlRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const edRef = useRef<Ed>(null);
  const refOfUrl = useRef(new Map<string, string>());
  const apiRef = useRef<{ fit: () => void; zoomBy: (d: number) => void; setPct: (p: number) => void; place: () => void } | null>(null);

  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [remoteVisible, setRemoteVisibleState] = useState(true);
  const remoteVisRef = useRef(true);
  const [sheetTab, setSheetTab] = useState<'deco' | 'settings'>('deco');
  const [titleShown, setTitleShown] = useState(room.title);
  const [titleInput, setTitleInput] = useState(room.title);
  const [cw, setCw] = useState(room.canvasW);
  const [chh, setChh] = useState(room.canvasH);
  const [cwIn, setCwIn] = useState(String(room.canvasW));
  const [chIn, setChIn] = useState(String(room.canvasH));
  const [snapOn, setSnapOn] = useState(true);
  const [grid, setGrid] = useState('10');
  const [zoomPct, setZoomPct] = useState(100);
  const [panOn, setPanOn] = useState(false);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [activeCat, setActiveCat] = useState(cats[0]?.id ?? '');
  const [modalId, setModalId] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [ms, setMs] = useState<{ active: boolean; count: number; pending: 'delete' | 'copy' | null }>({ active: false, count: 0, pending: null });
  const [msMenu, setMsMenu] = useState(false);
  const pendingRef = useRef<'delete' | 'copy' | null>(null);

  const setRemoteVisible = (v: boolean) => { remoteVisRef.current = v; setRemoteVisibleState(v); };
  const curCat = cats.some(c => c.id === activeCat) ? activeCat : cats[0]?.id ?? '';

  /* ---------- 에디터 만들기 ---------- */
  useEffect(() => {
    let dead = false;
    (async () => {
      try { await loadMyRoomEditor(); } catch { toast('에디터를 불러오지 못했어요'); return; }
      if (dead || !canvasRef.current) return;
      const w = window as any;
      const resolved: any[] = [];
      for (const it of roomRef.current.items || []) {
        const c: any = { ...it };
        if (c.src) { const u = await resolveUrl(c.src); if (u) { refOfUrl.current.set(u, c.src); c.src = u; } }
        if (c.soundUrl) { const u = await resolveUrl(c.soundUrl); if (u) { refOfUrl.current.set(u, c.soundUrl); c.soundUrl = u; } }
        resolved.push(c);
      }
      if (dead) return;
      const back = (u?: string) => (u ? refOfUrl.current.get(u) ?? u : u);
      const ed: Ed = new w.MyRoomEditor({
        canvasEl: canvasRef.current, canvasW: roomRef.current.canvasW, canvasH: roomRef.current.canvasH,
        editable: false, gridSize: 10, snapEnabled: true, title: roomRef.current.title, items: resolved,
        hooks: {
          uploadImage: async (file: File) => {
            if (!/^image\//.test(file.type)) throw new Error('이미지 파일만 올릴 수 있어요');
            if (file.size > 8 * 1024 * 1024) throw new Error('파일은 8MB 이하만 올릴 수 있어요');
            const ref = await putBlob(file);
            const url = await resolveUrl(ref);
            refOfUrl.current.set(url, ref);
            const d = await imgDim(url);
            return { url, w: d.w, h: d.h };
          },
          uploadSound: async (file: File) => {
            if (!/^audio\//.test(file.type)) throw new Error('오디오 파일만 올릴 수 있어요');
            if (file.size > 3 * 1024 * 1024) throw new Error('사운드는 3MB 이하만 올릴 수 있어요');
            const ref = await putBlob(file);
            const url = await resolveUrl(ref);
            refOfUrl.current.set(url, ref);
            return { url };
          },
          save: async (data: any, title: string) => {
            const items = (data.items as any[]).map(it => ({ ...it, ...(it.src ? { src: back(it.src) } : {}), ...(it.soundUrl ? { soundUrl: back(it.soundUrl) } : {}) }));
            const cur = roomRef.current;
            const next: MyRoom = { ...cur, title: title || cur.title, canvasW: data.canvas_w, canvasH: data.canvas_h, items };
            setRooms(roomsRef.current.map(r => (r.id === cur.id ? next : r)));
          },
        },
      });
      edRef.current = ed;
      ed.onSelect = (it: any) => { if (it) bump(); };
      ed.onEdit = (it: any) => setModalId(it.id);
      ed.onBoxSelect = () => updateMs();
      const orig = ed.toggleMultiSelect.bind(ed);
      ed.toggleMultiSelect = (id: string) => { orig(id); updateMs(); };
      setReady(true);
    })();
    return () => { dead = true; edRef.current?.destroy?.(); edRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMs = () => {
    const ed = edRef.current; if (!ed) return;
    setMs({ active: !!ed.multiSelectMode, count: ed.multiSelectIds.length, pending: pendingRef.current });
  };
  const exitMulti = () => {
    edRef.current?.exitMultiSelect(); pendingRef.current = null; setMsMenu(false); updateMs();
  };

  /* ---------- 화면 배율 · 줌 · 핀치 · 이동 ---------- */
  useEffect(() => {
    if (!ready) return;
    const ed = edRef.current as Ed;
    const outer = outerRef.current, roomEl = roomElRef.current, wrap = wrapRef.current, layout = layoutRef.current, zc = zoomCtlRef.current;
    if (!outer) return;
    const Z = { fit: 1, user: 1 };
    const ZMIN = 0.5, ZMAX = 3;

    const updateBigCanvasHeight = () => {
      if (!layout || !wrap || !wrap.classList.contains('mr-fullscreen')) return;
      if (window.innerWidth <= 700) {
        layout.style.height = '';
        if (roomEl) roomEl.style.height = Math.max(260, Math.round(window.innerHeight * 0.5)) + 'px';
        return;
      }
      if (roomEl) roomEl.style.height = '';
      const top = layout.getBoundingClientRect().top;
      layout.style.height = Math.max(320, window.innerHeight - top - 30) + 'px';
    };

    const place = () => {
      if (!zc) return;
      zc.style.transform = '';
      const rp = remoteRef.current;
      if (!remoteVisRef.current || !rp || rp.style.display === 'none') return;
      const overlap = zc.getBoundingClientRect().right - rp.getBoundingClientRect().left;
      if (overlap > 0) zc.style.transform = `translateX(-${Math.ceil(overlap + 10)}px)`;
    };

    const applyZoom = (recenter: boolean, syncSlider?: boolean) => {
      const W = ed.canvasW, H = ed.canvasH;
      const scale = Z.fit * Z.user;
      const viewW = Math.round(W * Z.fit), viewH = Math.round(H * Z.fit);
      outer.style.width = viewW + 'px'; outer.style.height = viewH + 'px';
      if (recenter) { ed.panX = Math.round((viewW - W * scale) / 2); ed.panY = Math.round((viewH - H * scale) / 2); }
      ed.setViewScaleLight(scale);
      if (syncSlider !== false) setZoomPct(Math.round(Z.user * 100));
      zc?.classList.toggle('mr-zoom-active', Z.user > 1.001);
      outer.classList.toggle('mr-zoomed', Z.user > 1.001 && !ed.editable);
    };

    const setZoomAtPoint = (target: number, cx?: number | null, cy?: number | null, sync?: boolean) => {
      const old = Z.user;
      const nz = Math.min(ZMAX, Math.max(ZMIN, Math.round(target * 1000) / 1000));
      if (nz === old) return;
      if (cx != null && cy != null) {
        const oldS = Z.fit * old, newS = Z.fit * nz;
        const rect = outer.getBoundingClientRect();
        const lx = (cx - rect.left - ed.panX) / oldS, ly = (cy - rect.top - ed.panY) / oldS;
        ed.panX = Math.round(cx - rect.left - lx * newS); ed.panY = Math.round(cy - rect.top - ly * newS);
        Z.user = nz; applyZoom(false, sync);
      } else { Z.user = nz; applyZoom(true, sync); }
    };

    const fit = () => {
      updateBigCanvasHeight();
      const W = ed.canvasW, H = ed.canvasH;
      const availW = (roomEl ? roomEl.clientWidth : 0) || outer.clientWidth || W;
      const big = !!wrap && wrap.classList.contains('mr-fullscreen');
      let raw: number;
      if (big && roomEl) raw = Math.min(availW / W, (roomEl.clientHeight || H) / H);
      else raw = availW / W;
      Z.fit = Math.min(1, raw);
      applyZoom(true); place();
    };
    apiRef.current = {
      fit, place,
      zoomBy: (d: number) => setZoomAtPoint(Z.user + d, null, null),
      setPct: (p: number) => { Z.user = Math.min(ZMAX, Math.max(ZMIN, p / 100)); applyZoom(true); },
    };

    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoomAtPoint(Z.user + -e.deltaY * 0.0015, e.clientX, e.clientY); };
    outer.addEventListener('wheel', onWheel, { passive: false });
    const stopWheel = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    zc?.addEventListener('wheel', stopWheel, { passive: false });

    let pinch: { dist: number; start: number } | null = null;
    const td = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const ts = (e: TouchEvent) => { pinch = e.touches.length === 2 ? { dist: td(e.touches[0], e.touches[1]), start: Z.user } : null; };
    const tm = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      if (pinch.dist < 1) return;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setZoomAtPoint(pinch.start * (td(e.touches[0], e.touches[1]) / pinch.dist), mx, my);
    };
    const te = (e: TouchEvent) => { if (e.touches.length < 2) pinch = null; };
    outer.addEventListener('touchstart', ts, { passive: true });
    outer.addEventListener('touchmove', tm, { passive: false });
    outer.addEventListener('touchend', te); outer.addEventListener('touchcancel', te);

    // 보기 전용일 때: 확대한 상태에서 드래그로 화면 옮기기
    let pan: { x: number; y: number; px: number; py: number } | null = null;
    const md = (e: MouseEvent) => {
      if (ed.editable || Z.user <= 1.001) return;
      if (e.target !== outer && e.target !== ed.canvasEl) return;
      pan = { x: e.clientX, y: e.clientY, px: ed.panX, py: ed.panY };
      outer.classList.add('mr-panning');
    };
    const mv = (e: MouseEvent) => {
      if (!pan) return;
      ed.panX = pan.px + (e.clientX - pan.x); ed.panY = pan.py + (e.clientY - pan.y);
      ed.canvasEl.style.transform = ed._panScaleTransform();
    };
    const mu = () => { if (pan) { pan = null; outer.classList.remove('mr-panning'); } };
    outer.addEventListener('mousedown', md);
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', mu);

    // Tab 키: 리모콘 켜고 끄기 (편집 중일 때만)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !ed.editable) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      setRemoteVisible(!remoteVisRef.current);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', fit);
    fit();
    if (canEdit) enterEdit();   // 방 주인/관리자는 들어오면 바로 꾸미기 화면
    return () => {
      outer.removeEventListener('wheel', onWheel); zc?.removeEventListener('wheel', stopWheel);
      outer.removeEventListener('touchstart', ts); outer.removeEventListener('touchmove', tm);
      outer.removeEventListener('touchend', te); outer.removeEventListener('touchcancel', te);
      outer.removeEventListener('mousedown', md);
      document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', mu);
      document.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // 리모콘이 열리고 닫히거나 편집 상태가 바뀌면 배율/줌 컨트롤 위치를 다시 맞춘다
  useEffect(() => { apiRef.current?.fit(); }, [editing, remoteVisible, sheetTab]);

  /* ---------- 편집 시작/종료 ---------- */
  const enterEdit = () => {
    const ed = edRef.current; if (!ed) return;
    ed.setEditable(true);
    setEditing(true); setRemoteVisible(true);
    setTitleInput(roomRef.current.title);
    wrapRef.current?.classList.add('mr-fullscreen', 'mr-editing');
  };
  const exitEdit = () => {
    const ed = edRef.current; if (!ed) return;
    ed.setEditable(false);
    setModalId(null); exitMulti();
    setEditing(false); setRemoteVisible(false);
    if (ed.spaceDown) { ed.spaceDown = false; setPanOn(false); outerRef.current?.classList.remove('mr-pan-mode'); }
    wrapRef.current?.classList.remove('mr-editing');
  };

  const save = () => {
    const ed = edRef.current; if (!ed) return;
    setStatus('저장 중...');
    const t = titleInput.trim();
    ed.setRoomTitle(t);
    ed.save((err: string | null) => {
      if (err) { setStatus('저장 실패: ' + err); setTimeout(() => setStatus(''), 2500); return; }
      if (t) setTitleShown(t);
      setStatus('저장되었습니다.');
      exitEdit();
      setTimeout(() => setStatus(''), 2500);
    });
  };

  const exportImage = () => {
    const ed = edRef.current; if (!ed) return;
    const prev = ed.selectedId;
    ed.deselect();
    setExporting(true);
    const run = () => {
      (window as any).html2canvas(canvasRef.current, { backgroundColor: null, useCORS: true, scale: 2 }).then((cv: HTMLCanvasElement) => {
        setExporting(false);
        const a = document.createElement('a');
        a.download = (titleShown || 'myroom').trim().replace(/[\\/:*?"<>|]/g, '_') + '.png';
        a.href = cv.toDataURL('image/png'); a.click();
        if (prev) ed.select(prev);
      }).catch(() => { setExporting(false); toast('이미지를 만드는 중 문제가 생겼어요 (이미지 서버가 CORS를 허용해야 해요)'); });
    };
    if ((window as any).html2canvas) return run();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = run;
    s.onerror = () => { setExporting(false); toast('이미지 내보내기 기능을 불러오지 못했어요'); };
    document.head.appendChild(s);
  };

  const resizeCanvas = () => {
    const ed = edRef.current; if (!ed) return;
    ed.setCanvasSize(parseInt(cwIn, 10) || ed.canvasW, parseInt(chIn, 10) || ed.canvasH);
    setCw(ed.canvasW); setChh(ed.canvasH); setCwIn(String(ed.canvasW)); setChIn(String(ed.canvasH));
    setTimeout(() => apiRef.current?.fit(), 0);
  };

  const deleteRoom = () => {
    setRooms(roomsRef.current.filter(r => r.id !== room.id));
    router.push('/myroom');
  };

  /* ---------- 보관함 ---------- */
  const catItems = catalog.filter(c => c.categoryId === curCat);
  const addFromCatalog = async (it: CatalogItem) => {
    const ed = edRef.current; if (!ed) return;
    const url = await resolveUrl(it.src);
    refOfUrl.current.set(url, it.src);
    const cat = cats.find(c => c.id === it.categoryId);
    ed.addImageItem(url, it.w, it.h, null, null, cat ? cat.zBase : null);
    bump();
  };
  const pickFile = (accept: string, cb: (f: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept;
    input.onchange = () => { if (input.files?.[0]) cb(input.files[0]); };
    input.click();
  };
  const addCatalogItem = () => pickFile('image/*', async f => {
    if (!/^image\//.test(f.type)) return toast('이미지 파일만 올릴 수 있어요');
    const name = window.prompt('아이템 이름(선택)', '') || '';
    try {
      const ref = await putBlob(f);
      const url = await resolveUrl(ref);
      const d = await imgDim(url);
      setCatalog([...catalogRef.current, { id: newId(), categoryId: curCat, name, src: ref, w: d.w, h: d.h, authorId: userId, visibility: 'public', date: new Date().toISOString() }]);
    } catch { toast('등록에 실패했어요'); }
  });
  const removeCatalogItem = (it: CatalogItem) => {
    if (!window.confirm('이 아이템을 보관함에서 삭제할까요?')) return;
    setCatalog(catalogRef.current.filter(c => c.id !== it.id));
  };

  const moveCat = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= cats.length) return;
    const n = [...cats]; [n[i], n[j]] = [n[j], n[i]]; setCats(n);
  };
  const [newCatName, setNewCatName] = useState('');

  /* ---------- 아이템 편집창 ---------- */
  const ed = edRef.current as Ed;
  const mItem = modalId && ed ? ed.getItem(modalId) : null;

  /* ---------- 다중 선택 ---------- */
  const msMenuAct = (action: 'delete' | 'copy') => {
    setMsMenu(false);
    const e2 = edRef.current; if (!e2) return;
    if (e2.multiSelectMode && e2.multiSelectIds.length > 0) {
      if (action === 'delete') { if (!window.confirm(`${e2.multiSelectIds.length}개 아이템을 삭제할까요?`)) return; e2.deleteMultiSelected(); }
      else e2.copyMultiSelected();
      exitMulti(); bump(); return;
    }
    pendingRef.current = action; e2.enterMultiSelect(); updateMs();
  };
  const msApply = () => {
    const e2 = edRef.current; if (!e2) return;
    if (!e2.multiSelectIds.length) return toast('아이템을 먼저 선택해 주세요');
    if (pendingRef.current === 'delete') { if (!window.confirm(`${e2.multiSelectIds.length}개 아이템을 삭제할까요?`)) return; e2.deleteMultiSelected(); }
    else if (pendingRef.current === 'copy') e2.copyMultiSelected();
    exitMulti(); bump();
  };

  const wrapMax = Math.min(1900, Math.max(700, cw + 300));

  return (
    <section className="page">
      <div className="myroom-wrap" ref={wrapRef} style={{ maxWidth: wrapMax }}>
        <div className="mr-topbar">
          <div className="mr-topbar-title" id="room-title-display">{titleShown}</div>
          <Link href="/myroom" className="mr-back-to-list">← 목록으로</Link>
        </div>
        <div className="mr-layout" ref={layoutRef}>
          <div className="mr-room" ref={roomElRef} style={{ maxWidth: cw }}>
            <div className="mr-canvas-outer" ref={outerRef}>
              {canEdit && !editing && <button className="mr-enter-edit-tab" id="btn-enter-edit" type="button" title="내 방 꾸미기" onClick={enterEdit}>✧</button>}
              <div className="mr-canvas" id="canvas" ref={canvasRef} />
              {canEdit && (
                <button type="button" className={`mr-pan-toggle${panOn ? ' active' : ''}`} id="btn-pan-toggle" title="화면 이동 모드 (가구를 건드리지 않고 화면만 움직여요)"
                  onClick={() => { const e2 = edRef.current; if (!e2) return; e2.spaceDown = !e2.spaceDown; setPanOn(e2.spaceDown); outerRef.current?.classList.toggle('mr-pan-mode', e2.spaceDown); }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="12" x2="21" y2="12" />
                    <polyline points="8.5 6.5 12 3 15.5 6.5" /><polyline points="8.5 17.5 12 21 15.5 17.5" />
                    <polyline points="6.5 8.5 3 12 6.5 15.5" /><polyline points="17.5 8.5 21 12 17.5 15.5" />
                  </svg>
                </button>
              )}
              <div className="mr-zoom-control" id="zoom-control" ref={zoomCtlRef}>
                <button type="button" className="mr-zoom-btn" title="확대" onClick={() => apiRef.current?.zoomBy(0.1)}>
                  <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="14.7" y1="14.7" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </button>
                <div className="mr-zoom-slider-wrap">
                  <input type="range" className="mr-zoom-slider" min={50} max={300} step={5} value={zoomPct} onChange={e => apiRef.current?.setPct(parseInt(e.target.value, 10) || 100)} />
                </div>
                <button type="button" className="mr-zoom-btn" title="축소" onClick={() => apiRef.current?.zoomBy(-0.1)}>
                  <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="14.7" y1="14.7" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="mr-side-slot" id="side-slot">
              <div className="mr-remote" id="remote" ref={remoteRef} style={{ display: editing && remoteVisible ? 'block' : 'none' }}>
                <div className="mr-sheet-handle" id="sheet-handle" onClick={() => { if (editing) setRemoteVisible(!remoteVisible); }} />
                <div className="mr-sheet-header">
                  <div className="mr-sheet-header-title">꾸미기</div>
                  <button className="mr-remote-close" type="button" title="편집 닫기" onClick={exitEdit}>✦</button>
                </div>
                <div className="mr-sheet-tabs">
                  <button type="button" className={`mr-sheet-tab${sheetTab === 'deco' ? ' active' : ''}`} onClick={() => setSheetTab('deco')}>꾸미기</button>
                  <button type="button" className={`mr-sheet-tab${sheetTab === 'settings' ? ' active' : ''}`} onClick={() => setSheetTab('settings')}>설정</button>
                </div>

                <div className="mr-sheet-panel" id="sheet-panel-settings" style={{ display: sheetTab === 'settings' ? 'block' : 'none' }}>
                  <div className="mr-remote-field">
                    <label>방 이름</label>
                    <input type="text" maxLength={100} placeholder="방 이름을 입력하세요" value={titleInput} onChange={e => setTitleInput(e.target.value)} />
                  </div>
                  <div className="mr-remote-controls">
                    <button type="button" onClick={() => { const e2 = edRef.current; if (!e2) return; e2.toggleSnap(); setSnapOn(e2.snapEnabled); }}>그리드 스냅: {snapOn ? '켜짐' : '꺼짐'}</button>
                    <select value={grid} onChange={e => { setGrid(e.target.value); edRef.current?.setGridSize(parseInt(e.target.value, 10)); }}>
                      <option value="10">격자 10px</option><option value="20">격자 20px</option><option value="40">격자 40px</option>
                    </select>
                  </div>
                  <div className="mr-remote-field mr-canvas-size-field">
                    <label>캔버스 크기(px)</label>
                    <div className="mr-canvas-size-row">
                      <input type="number" min={100} max={4000} step={50} value={cwIn} onChange={e => setCwIn(e.target.value)} />
                      <span className="mr-canvas-size-x">×</span>
                      <input type="number" min={100} max={4000} step={50} value={chIn} onChange={e => setChIn(e.target.value)} />
                      <button type="button" onClick={resizeCanvas}>적용</button>
                    </div>
                  </div>
                </div>

                <div className="mr-sheet-panel" id="sheet-panel-deco" style={{ display: sheetTab === 'deco' ? 'block' : 'none' }}>
                  <div className="mr-catalog" id="mr-catalog">
                    <div className="mr-multiselect-menu" style={{ display: msMenu ? 'flex' : 'none' }}>
                      <button type="button" onClick={() => msMenuAct('delete')}>선택 삭제</button>
                      <button type="button" onClick={() => msMenuAct('copy')}>선택 복사</button>
                    </div>
                    <div className="mr-catalog-body">
                      <div className="mr-catalog-tabs-row">
                        <div className="mr-catalog-tabs">
                          {cats.map(c => (
                            <button key={c.id} type="button" className={`mr-cat-tab${c.id === curCat ? ' active' : ''}`} onClick={() => setActiveCat(c.id)}>
                              <span className="mr-cat-tab-icon">{(c.name || '').charAt(0)}</span>
                              <span className="mr-cat-tab-label">{c.name}</span>
                            </button>
                          ))}
                        </div>
                        <button className="mr-catalog-more" type="button" title="더보기" onClick={e => { e.stopPropagation(); setMsMenu(m => !m); }}>⋮</button>
                      </div>
                      <div className="mr-catalog-grid">
                        {catItems.map(it => (
                          <div key={it.id} className="mr-catalog-item" title={it.name || ''} onClick={() => addFromCatalog(it)}>
                            <Thumb fileRef={it.src} />
                            {isAdmin && <button type="button" className="mr-catalog-item-remove" title="보관함에서 삭제" onClick={e => { e.stopPropagation(); removeCatalogItem(it); }}>✕</button>}
                          </div>
                        ))}
                        {isAdmin && <div className="mr-catalog-item mr-catalog-add" title="새 아이템 등록" onClick={addCatalogItem}>+</div>}
                      </div>
                    </div>
                    {isAdmin && (
                      <details className="mr-catalog-manage">
                        <summary>카테고리 관리(관리자)</summary>
                        <div className="mr-catalog-manage-body">
                          {cats.map((c, i) => (
                            <div className="mr-catmanage-row" key={c.id}>
                              <input type="text" defaultValue={c.name}
                                onBlur={e => { const v = e.target.value.trim(); if (!v) { e.target.value = c.name; return; } if (v !== c.name) setCats(cats.map(x => x.id === c.id ? { ...x, name: v } : x)); }} />
                              <button type="button" disabled={i === 0} onClick={() => moveCat(i, -1)}>↑</button>
                              <button type="button" disabled={i === cats.length - 1} onClick={() => moveCat(i, 1)}>↓</button>
                              <button type="button" className="mr-catmanage-del" onClick={() => {
                                if (cats.length <= 1) return toast('최소 1개의 카테고리는 남아 있어야 해요');
                                if (!window.confirm(`"${c.name}" 카테고리와 그 안의 아이템을 모두 삭제할까요?`)) return;
                                setCatalog(catalogRef.current.filter(x => x.categoryId !== c.id));
                                setCats(cats.filter(x => x.id !== c.id));
                              }}>삭제</button>
                            </div>
                          ))}
                          <div className="mr-catmanage-addrow">
                            <input type="text" placeholder="새 카테고리 이름" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                            <button type="button" onClick={() => {
                              const name = newCatName.trim(); if (!name) return;
                              setCats([...cats, { id: newId(), name, zBase: cats.length }]); setNewCatName('');
                            }}>추가</button>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="mr-multiselect-bar" style={{ display: ms.active ? 'flex' : 'none' }}>
                    <span>{ms.count}개 선택됨</span>
                    <button type="button" style={{ display: ms.pending ? '' : 'none' }} onClick={msApply}>{ms.pending === 'delete' ? '삭제' : ms.pending === 'copy' ? '복사' : ''}</button>
                    <button type="button" onClick={exitMulti}>취소</button>
                  </div>
                </div>

                <button className="mr-remote-save" type="button" onClick={save}>저장하고 편집 종료</button>
                <button className="mr-modal-btn" type="button" style={{ width: '100%', marginTop: 8 }} disabled={exporting} onClick={exportImage}>{exporting ? '이미지 준비 중...' : '이미지로 내보내기'}</button>
                <button className="mr-modal-btn mr-modal-btn-danger" type="button" style={{ width: '100%', marginTop: 8 }} onClick={() => setDelOpen(true)}>방 삭제</button>
                <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 6 }}>{status}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 아이템 편집 */}
      {canEdit && modalId && mItem && (
        <div className="mr-modal-overlay" style={{ display: 'flex' }} onMouseDown={e => { if (e.target === e.currentTarget) setModalId(null); }}>
          <div className="mr-modal">
            <button className="mr-modal-close" type="button" onClick={() => setModalId(null)}>✕</button>
            <div className="mr-modal-title">아이템 편집</div>
            <div>
              <div className="mr-panel-row">
                <div className="mr-panel-field"><label>겹침 우선도(Z순서)</label>
                  <input type="number" key={`z${mItem.z}`} defaultValue={mItem.z || 0} onChange={e => { ed.setZOrder(mItem.id, parseInt(e.target.value, 10) || 0); }} />
                </div>
              </div>
              <div className="mr-toggle-row">
                <div className="mr-toggle-text"><div className="mr-toggle-title">위치 고정</div><div className="mr-toggle-desc">현재의 위치와 크기로 오브젝트를 고정</div></div>
                <label className="mr-switch"><input type="checkbox" checked={!!mItem.posLocked} onChange={e => { ed.updateItem(mItem.id, { posLocked: e.target.checked }); bump(); }} /><span className="mr-slider" /></label>
              </div>
              {mItem.type === 'image' && (
                <div style={{ marginTop: 12 }}>
                  <button className="mr-imgbtn" type="button" onClick={() => pickFile('image/*', f => ed.replaceImage(mItem.id, f, (err: string | null) => { if (err) toast(err); bump(); }))}>이미지 선택</button>
                </div>
              )}
              <details className="mr-advanced" open={mItem.clickAction === 'sound'}>
                <summary>고급 설정 · 클릭 액션을 설정할 수 있습니다.</summary>
                <div className="mr-panel-field">
                  <label>클릭 액션</label>
                  <select value={mItem.clickAction || 'none'} onChange={e => { ed.updateItem(mItem.id, { clickAction: e.target.value }); bump(); }}>
                    <option value="none">사용안함</option><option value="sound">사운드 재생</option>
                  </select>
                </div>
                {mItem.clickAction === 'sound' && (<>
                  <button className="mr-imgbtn" type="button" style={{ marginTop: 8 }}
                    onClick={() => pickFile('audio/*', f => ed.uploadSound(mItem.id, f, (err: string | null) => { if (err) toast(err); bump(); }))}>
                    {mItem.soundUrl ? '🔊 사운드 파일 변경' : '🔈 사운드 파일 선택'}</button>
                  {mItem.soundUrl && (
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>등록됨 · <a href="#" onClick={e => { e.preventDefault(); new Audio(mItem.soundUrl).play().catch(() => { /* 무시 */ }); }}>미리듣기</a></div>
                  )}
                </>)}
              </details>
            </div>
          </div>
        </div>
      )}

      {/* 방 삭제 */}
      {canEdit && delOpen && (
        <div className="mr-modal-overlay" style={{ display: 'flex' }} onMouseDown={e => { if (e.target === e.currentTarget) setDelOpen(false); }}>
          <div className="mr-modal">
            <button className="mr-modal-close" type="button" onClick={() => setDelOpen(false)}>✕</button>
            <div className="mr-modal-title">방 삭제</div>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 14px', whiteSpace: 'pre-line' }}>{'이 방을 삭제하겠습니까?\n이 작업은 되돌릴 수 없습니다.'}</p>
            <div className="mr-modal-btn-row">
              <button type="button" className="mr-modal-btn" onClick={() => setDelOpen(false)}>취소</button>
              <button type="button" className="mr-modal-btn mr-modal-btn-danger" onClick={deleteRoom}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
