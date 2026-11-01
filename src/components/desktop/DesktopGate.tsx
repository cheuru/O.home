'use client';
// 홈(/)을 데스크톱으로 바꾸는 문. 홈이 아닌 주소 · 창 안(iframe) · 기존 홈으로 보기 선택 시에는 아무것도 바꾸지 않는다.
import React, { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { useEmbedded } from '@/lib/useEmbedded';
import { DESKTOP_MODE, FLAG_CLASSIC, flag, setFlag } from '@/lib/desktopConfig';
import { DesktopShell } from './DesktopShell';

const subscribe = (cb: () => void) => {
  window.addEventListener('ohome-desktop-flag', cb);
  return () => window.removeEventListener('ohome-desktop-flag', cb);
};

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const embedded = useEmbedded();
  const classic = useSyncExternalStore(subscribe, () => flag(FLAG_CLASSIC), () => false);

  // ?classic=1 → 이 탭은 기존 홈 · ?desktop=1 → 데스크톱으로 되돌리기
  useEffect(() => {
    if (pathname !== '/') return;
    const q = new URLSearchParams(window.location.search);
    if (q.has('classic')) setFlag(FLAG_CLASSIC, true);
    else if (q.has('desktop')) setFlag(FLAG_CLASSIC, false);
  }, [pathname]);

  const on = DESKTOP_MODE && pathname === '/' && !embedded && !classic;
  // 데스크톱 모드 표시 — 전역 BGM 플레이어가 하단 작업표시줄을 피하게 (desktop.css)
  useEffect(() => {
    if (!on) return;
    document.documentElement.setAttribute('data-desktop', '1');
    return () => document.documentElement.removeAttribute('data-desktop');
  }, [on]);

  if (on) return <DesktopShell />;
  return <>{children}</>;
}
