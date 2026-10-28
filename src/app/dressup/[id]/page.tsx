'use client';
// 옷입히기 방 — 로비에서 고른 방의 몸통들을 꾸민다
import React from 'react';
import { useParams } from 'next/navigation';
import DressRoom from '@/components/dressup/DressRoom';

export default function DressupRoomPage() {
  const { id } = useParams<{ id: string }>();
  return <DressRoom roomId={id} />;
}
