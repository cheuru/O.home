'use client';
// 페어의 옷장 — 관리자 (/closet/admin?room=<id>). 설정은 관리자만 쓸 수 있고, 서버 규칙이 한 번 더 막는다.
import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ClosetData, pruneDefaults, roomWithItems, useClosetBook } from '@/lib/closetStore';
import { ClosetAdmin } from '@/components/closet/ClosetAdmin';
import { PageTitle } from '@/components/ui/PageText';

function Inner() {
  const { isAdmin, ready } = useAuth();
  const [book, save, loaded] = useClosetBook();
  const roomId = useSearchParams().get('room') ?? '';
  const room = book.rooms.find(r => r.id === roomId);
  const data = useMemo(() => (room ? roomWithItems(room, book.items) : null), [room, book.items]);   // 아이템은 모든 방이 같이 쓴다
  if (!ready || !loaded) return <section className="page" />;
  if (!isAdmin) {
    return <section className="page"><div className="page-head"><PageTitle href="/closet">CLOSET</PageTitle><p>관리자만 들어올 수 있는 곳입니다</p></div></section>;
  }
  if (!room) {
    return <section className="page"><div className="page-head"><PageTitle href="/closet">CLOSET ADMIN</PageTitle><p>옷장을 찾지 못했어요 — <Link href="/closet">옷장 목록으로</Link></p></div></section>;
  }
  // 아이템은 공통 창고에, 나머지(캐릭터·대사·디자인)는 이 방에 저장한다. 룩북은 옷장 화면에서 관리 — 여기서 덮어쓰지 않는다.
  // 아이템을 지웠으면 다른 방의 기본 코디에서도 함께 걷어 낸다.
  const onSave = (d: ClosetData) => {
    const { items, ...rest } = d;
    const rooms = book.rooms.map(r => r.id === room.id ? { ...r, ...rest, items: [], looks: r.looks } : r);
    save({ rooms: pruneDefaults(rooms, items), items });
  };
  return (
    <section className="page">
      <div className="page-head">
        <PageTitle href={`/closet?room=${encodeURIComponent(room.id)}`}>CLOSET ADMIN</PageTitle>
        <p><Link href={`/closet?room=${encodeURIComponent(room.id)}`}>← {room.design.gameTitle || '옷장'}으로 돌아가기</Link></p>
      </div>
      <ClosetAdmin key={room.id} data={data ?? room} onSave={onSave} />
    </section>
  );
}

export default function ClosetAdminPage() {
  return <Suspense fallback={<section className="page" />}><Inner /></Suspense>;
}
