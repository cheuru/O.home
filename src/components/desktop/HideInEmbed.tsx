'use client';
// 데스크톱 창 안에서 열린 페이지에서는 감춘다 — 상단바(창 밖 데스크톱이 대신함), BGM 플레이어(소리 중복 방지)
import React from 'react';
import { useEmbedded } from '@/lib/useEmbedded';

export function HideInEmbed({ children }: { children: React.ReactNode }) {
  return useEmbedded() ? null : <>{children}</>;
}
