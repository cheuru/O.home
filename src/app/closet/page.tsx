'use client';
// 페어의 옷장 — /closet 은 방 목록, /closet?room=<id> 는 그 방의 옷장
// (원본: 우초맨 제작 dressup 일반 버전을 React로 이식)
import React, { Suspense, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ClosetBook, ClosetItem, ClosetLook, ClosetRoom, newRoom, pruneDefaults, roomWithItems, useClosetBook, useResolvedCloset } from '@/lib/closetStore';
import { newId } from '@/lib/postStore';
import { ClosetStage } from '@/components/closet/ClosetStage';
import { ClosetLobby } from '@/components/closet/ClosetLobby';
import { ClosetShell } from '@/components/closet/ClosetShell';
import { PageTitle } from '@/components/ui/PageText';

function Room({ room, book, save, isAdmin, loaded }: {
  room: ClosetRoom; book: ClosetBook; save: (b: ClosetBook) => void; isAdmin: boolean; loaded: boolean;
}) {
  const shown = useResolvedCloset(useMemo(() => roomWithItems(room, book.items), [room, book.items]));   // 아이템은 모든 방이 같이 쓴다
  // 방 안의 것(코디 등)만 고칠 때
  const patch = useCallback((fn: (r: ClosetRoom) => ClosetRoom) => save({ ...book, rooms: book.rooms.map(r => r.id === room.id ? fn(r) : r) }), [book, room.id, save]);
  // 아이템은 공통 창고에서 고친다 — 지우면 모든 방의 기본 코디에서도 빠진다
  const editItem = (id: string, p: Partial<ClosetItem>) => save({ ...book, items: book.items.map(i => i.id === id ? { ...i, ...p } : i) });
  const delItem = (id: string) => {
    const items = book.items.filter(i => i.id !== id);
    save({ rooms: pruneDefaults(book.rooms, items), items });
  };
  const saveLook = (l: ClosetLook) => patch(r => ({ ...r, looks: [...r.looks, l] }));
  const delLook = (id: string) => patch(r => ({ ...r, looks: r.looks.filter(l => l.id !== id) }));
  return (
    <ClosetStage key={room.id} data={shown} ready={loaded} isAdmin={isAdmin} roomId={room.id} onEditItem={editItem} onDeleteItem={delItem}
      onSaveLook={isAdmin ? saveLook : undefined} onDeleteLook={isAdmin ? delLook : undefined} />
  );
}

function ClosetPageInner() {
  const { isAdmin } = useAuth();
  const [book, save, loaded] = useClosetBook();
  const roomId = useSearchParams().get('room');
  const [asking, setAsking] = useState(false);     // 새 옷장 만들기 모달 — ＋ ADD(제목 옆)와 목록이 같이 쓴다
  const room = roomId ? book.rooms.find(r => r.id === roomId) : undefined;

  if (!loaded) return <section className="page" />;
  if (room) {
    return (
      <ClosetShell
        head={<div className="page-head"><PageTitle href="/closet">CLOSET</PageTitle><p><Link href="/closet">← 옷장 목록</Link></p></div>}
        variant="room" roomName={room.design.gameTitle}>
        <Room room={room} book={book} save={save} isAdmin={isAdmin} loaded={loaded} />
      </ClosetShell>
    );
  }
  return (
    <ClosetShell variant="list"
      head={<div className="page-head"><PageTitle>CLOSET</PageTitle><p>{roomId ? '없는 옷장이에요. 목록에서 골라 주세요' : '페어의 옷장을 골라 들어가세요'}</p>
        {isAdmin && <div className="head-actions"><button className="btn btn-dark" onClick={() => setAsking(true)}>＋ ADD</button></div>}
      </div>}
      count={book.rooms.length}>
      <ClosetLobby book={book} isAdmin={isAdmin} asking={asking} onAsk={() => setAsking(true)} onAskClose={() => setAsking(false)}
        onCreate={name => save({ ...book, rooms: [...book.rooms, newRoom(newId(), name)] })}
        onDelete={id => save({ ...book, rooms: book.rooms.filter(r => r.id !== id) })} />
    </ClosetShell>
  );
}

export default function ClosetPage() {
  return <Suspense fallback={<section className="page" />}><ClosetPageInner /></Suspense>;
}
