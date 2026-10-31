'use client';
// 페어의 옷장 — /closet 은 방 목록, /closet?room=<id> 는 그 방의 옷장
// (원본: 우초맨 제작 dressup 일반 버전을 React로 이식)
import React, { Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ClosetBook, ClosetItem, ClosetLook, ClosetRoom, newRoom, useClosetBook, useResolvedCloset } from '@/lib/closetStore';
import { newId } from '@/lib/postStore';
import { ClosetStage } from '@/components/closet/ClosetStage';
import { ClosetLobby } from '@/components/closet/ClosetLobby';
import { PageTitle } from '@/components/ui/PageText';

function Room({ room, book, save, isAdmin, loaded }: {
  room: ClosetRoom; book: ClosetBook; save: (b: ClosetBook) => void; isAdmin: boolean; loaded: boolean;
}) {
  const shown = useResolvedCloset(room);
  const patch = useCallback((fn: (r: ClosetRoom) => ClosetRoom) => save({ rooms: book.rooms.map(r => r.id === room.id ? fn(r) : r) }), [book, room.id, save]);
  const editItem = (id: string, p: Partial<ClosetItem>) => patch(r => ({ ...r, items: r.items.map(i => i.id === id ? { ...i, ...p } : i) }));
  const delItem = (id: string) => patch(r => ({
    ...r, items: r.items.filter(i => i.id !== id),
    design: { ...r.design, char1Default: r.design.char1Default.filter(x => x !== id), char2Default: r.design.char2Default.filter(x => x !== id) },
  }));
  const saveLook = (l: ClosetLook) => patch(r => ({ ...r, looks: [...r.looks, l] }));
  const delLook = (id: string) => patch(r => ({ ...r, looks: r.looks.filter(l => l.id !== id) }));
  return (
    <>
      <div className="page-head">
        <PageTitle href="/closet">CLOSET</PageTitle>
        <p><Link href="/closet">← 옷장 목록</Link></p>
      </div>
      <ClosetStage key={room.id} data={shown} ready={loaded} isAdmin={isAdmin} roomId={room.id} onEditItem={editItem} onDeleteItem={delItem}
        onSaveLook={isAdmin ? saveLook : undefined} onDeleteLook={isAdmin ? delLook : undefined} />
    </>
  );
}

function ClosetPageInner() {
  const { isAdmin } = useAuth();
  const [book, save, loaded] = useClosetBook();
  const roomId = useSearchParams().get('room');
  const room = roomId ? book.rooms.find(r => r.id === roomId) : undefined;

  if (!loaded) return <section className="page" />;
  if (room) return <section className="page"><Room room={room} book={book} save={save} isAdmin={isAdmin} loaded={loaded} /></section>;
  return (
    <section className="page">
      <div className="page-head">
        <PageTitle>CLOSET</PageTitle>
        <p>{roomId ? '없는 옷장이에요. 목록에서 골라 주세요' : '페어의 옷장을 골라 들어가세요'}</p>
      </div>
      <ClosetLobby book={book} isAdmin={isAdmin}
        onCreate={name => save({ rooms: [...book.rooms, newRoom(newId(), name)] })}
        onDelete={id => save({ rooms: book.rooms.filter(r => r.id !== id) })} />
    </section>
  );
}

export default function ClosetPage() {
  return <Suspense fallback={<section className="page" />}><ClosetPageInner /></Suspense>;
}
