'use client';
// 마이룸 로비 — 방 카드(실시간 미리보기) · 새 방 · 선택 삭제
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocalList, newId } from '@/lib/postStore';
import { useBlobUrl } from '@/lib/blobStore';
import { ROOM_KEY, ROOM_SEED, DEFAULT_CANVAS_W, DEFAULT_CANVAS_H, type MyRoom, type RoomItem } from '@/lib/myroomStore';
import { useToast } from '@/components/ui/Toast';
import '../../app/myroom/myroom.css';

const FRAME_W = 200;
const FRAME_H = 168;

function PreviewItem({ it }: { it: RoomItem }) {
  const url = useBlobUrl(it.src);
  if (!url) return null;
  return (
    <div className="mr-preview-item"
      style={{ left: it.x || 0, top: it.y || 0, width: it.w || 100, height: it.h || 100, transform: `rotate(${it.rot || 0}deg)${it.flip ? ' scaleX(-1)' : ''}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" />
    </div>
  );
}

function Preview({ room }: { room: MyRoom }) {
  const items = (room.items || []).filter(i => i.src);
  if (!items.length) return <div className="mr-preview-empty">방 미리보기</div>;
  const scale = Math.min(FRAME_W / Math.max(1, room.canvasW), FRAME_H / Math.max(1, room.canvasH)) * 1.2;
  const sorted = [...items].sort((a, b) => (a.z || 0) - (b.z || 0));
  return (
    <div className="mr-preview-frame">
      <div className="mr-preview-canvas" style={{ width: room.canvasW, height: room.canvasH, transform: `scale(${scale})` }}>
        {sorted.map(it => <PreviewItem key={it.id} it={it} />)}
      </div>
    </div>
  );
}

export default function MyRoomLobby() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [rooms, setRooms, loaded] = useLocalList<MyRoom>(ROOM_KEY, ROOM_SEED);
  const [picked, setPicked] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  if (!loaded) return <section className="page" />;

  const canDelete = (r: MyRoom) => isAdmin || (!!user && r.authorId === user.id);
  const sorted = [...rooms].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const createRoom = () => {
    if (!user) return;
    const title = newTitle.trim() || `${user.nickname}의 방`;
    const room: MyRoom = {
      id: newId(), title, author: user.nickname, authorId: user.id, visibility: 'public',
      canvasW: DEFAULT_CANVAS_W, canvasH: DEFAULT_CANVAS_H, items: [], date: new Date().toISOString(),
    };
    setRooms([...rooms, room]);
    setNewOpen(false); setNewTitle('');
    router.push(`/myroom/${room.id}`);
  };

  const doDelete = () => {
    const ids = new Set(picked);
    setRooms(rooms.filter(r => !ids.has(r.id)));
    setPicked([]); setConfirm(false);
    toast('삭제했어요');
  };

  return (
    <section className="page">
      <div className="myroom-wrap">
        <div className="myroom-toolbar">
          <h2>마이룸</h2>
          <div className="mr-toolbar-icons">
            {user
              ? <button className="mr-icon-btn" type="button" title="새 방 추가" onClick={() => setNewOpen(true)}>✎</button>
              : <span className="mr-icon-btn mr-icon-btn-disabled" title="로그인하면 방을 만들 수 있어요">✎</span>}
            <button className="mr-icon-btn" type="button" title="선택 삭제" onClick={e => { e.stopPropagation(); setMenu(m => !m); }}>⋮</button>
            <div className="mr-room-more-menu" ref={menuRef} style={{ display: menu ? 'flex' : 'none' }}>
              <button type="button" onClick={() => {
                setMenu(false);
                if (!picked.length) return toast('삭제할 방을 먼저 선택해 주세요');
                setConfirm(true);
              }}>선택 삭제</button>
            </div>
          </div>
        </div>
        {!user && <p className="mr-guest-hint">로그인하면 내 방을 만들 수 있어요.</p>}

        {sorted.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>아직 등록된 방이 없습니다.</p>
        ) : (
          <div className="mr-room-grid">
            {sorted.map(r => {
              const on = picked.includes(r.id);
              return (
                <div key={r.id} className={`mr-room-card${on ? ' selected' : ''}`} onClick={() => router.push(`/myroom/${r.id}`)}>
                  {canDelete(r) && (
                    <button className="mr-room-select" type="button" title="선택"
                      onClick={e => { e.stopPropagation(); setPicked(p => on ? p.filter(x => x !== r.id) : [...p, r.id]); }}>✓</button>
                  )}
                  <Preview room={r} />
                  <div className="mr-room-info">
                    <div className="mr-room-title">{r.title}</div>
                    <div className="mr-room-writer">{r.author}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {confirm && (
          <div className="mr-modal-overlay" style={{ display: 'flex' }} onMouseDown={e => { if (e.target === e.currentTarget) setConfirm(false); }}>
            <div className="mr-modal">
              <div className="mr-modal-title">방 삭제</div>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 14px', whiteSpace: 'pre-line' }}>{`선택한 ${picked.length}개의 방을 삭제하겠습니까?\n이 작업은 되돌릴 수 없습니다.`}</p>
              <div className="mr-modal-btn-row">
                <button type="button" className="mr-modal-btn" onClick={() => setConfirm(false)}>취소</button>
                <button type="button" className="mr-modal-btn mr-modal-btn-danger" onClick={doDelete}>삭제</button>
              </div>
            </div>
          </div>
        )}

        {newOpen && (
          <div className="mr-modal-overlay" style={{ display: 'flex' }} onMouseDown={e => { if (e.target === e.currentTarget) setNewOpen(false); }}>
            <div className="mr-modal">
              <button className="mr-modal-close" type="button" onClick={() => setNewOpen(false)}>✕</button>
              <div className="mr-modal-title">새 방 만들기</div>
              <input type="text" maxLength={100} autoFocus value={newTitle} placeholder={`${user?.nickname ?? '내'}의 방`}
                onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createRoom(); }}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: 12 }} />
              <button type="button" className="mr-remote-save" style={{ width: '100%' }} onClick={createRoom}>만들기</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
