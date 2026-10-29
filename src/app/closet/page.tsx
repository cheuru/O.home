'use client';
// 페어의 옷장 — 보기 (원본: 우초맨 제작 dressup 일반 버전을 React로 이식)
import React from 'react';
import { useAuth } from '@/lib/auth';
import { useCloset, useResolvedCloset } from '@/lib/closetStore';
import { ClosetStage } from '@/components/closet/ClosetStage';
import { PageTitle } from '@/components/ui/PageText';

export default function ClosetPage() {
  const { isAdmin } = useAuth();
  const [data, , loaded] = useCloset();
  const shown = useResolvedCloset(data);
  return (
    <section className="page">
      <div className="page-head"><PageTitle>CLOSET</PageTitle></div>
      <ClosetStage data={shown} ready={loaded} isAdmin={isAdmin} />
    </section>
  );
}
