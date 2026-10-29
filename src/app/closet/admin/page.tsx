'use client';
// 페어의 옷장 — 관리자 (설정은 관리자만 쓸 수 있고, 서버 규칙이 한 번 더 막는다)
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCloset } from '@/lib/closetStore';
import { ClosetAdmin } from '@/components/closet/ClosetAdmin';
import { PageTitle } from '@/components/ui/PageText';

export default function ClosetAdminPage() {
  const { isAdmin, ready } = useAuth();
  const [data, save, loaded] = useCloset();
  if (!ready || !loaded) return <section className="page" />;
  if (!isAdmin) {
    return (
      <section className="page">
        <div className="page-head"><PageTitle href="/closet">CLOSET</PageTitle><p>관리자만 들어올 수 있는 곳입니다</p></div>
      </section>
    );
  }
  return (
    <section className="page">
      <div className="page-head">
        <PageTitle href="/closet">CLOSET ADMIN</PageTitle>
        <p><Link href="/closet">← 옷장으로 돌아가기</Link></p>
      </div>
      <ClosetAdmin data={data} onSave={save} />
    </section>
  );
}
