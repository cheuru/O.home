'use client';
// 페어의 옷장 — 관리자 (/closet/admin?room=<id>). 설정은 관리자만 쓸 수 있고, 서버 규칙이 한 번 더 막는다.
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ClosetData, useClosetBook } from '@/lib/closetStore';
import { ClosetAdmin } from '@/components/closet/ClosetAdmin';
import { PageTitle } from '@/components/ui/PageText';

function Inner() {
  const { isAdmin, ready } = useAuth();
  const [book, save, loaded] = useClosetBook();
  const roomId = useSearchParams().get('room') ?? '';
  const room = book.rooms.find(r => r.id === roomId);
  if (!ready || !loaded) return <section className="page" />;
  if (!isAdmin) {
    return <section className="page"><div className="page-head"><PageTitle href="/closet">CLOSET</PageTitle><p>관리자만 들어올 수 있는 곳입니다</p></div></section>;
  }
  if (!room) {
    return <section className="page"><div className="page-head"><PageTitle href="/closet">CLOSET ADMIN</PageTitle><p>옷장을 찾지 못했어요 — <Link href="/closet">옷장 목록으로</Link></p></div></section>;
  }
  const onSave = (d: ClosetData) => save({ rooms: book.rooms.map(r => r.id === room.id ? { ...r, ...d, looks: r.looks } : r) });   // 룩북은 옷장 화면에서 관리 — 여기서 덮어쓰지 않는다
  return (
    <section className="page">
      <div className="page-head">
        <PageTitle href={`/closet?room=${encodeURIComponent(room.id)}`}>CLOSET ADMIN</PageTitle>
        <p><Link href={`/closet?room=${encodeURIComponent(room.id)}`}>← {room.design.gameTitle || '옷장'}으로 돌아가기</Link></p>
      </div>
      <ClosetAdmin key={room.id} data={room} onSave={onSave} />
    </section>
  );
}

export default function ClosetAdminPage() {
  return <Suspense fallback={<section className="page" />}><Inner /></Suspense>;
}
