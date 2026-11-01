'use client';
// 지금 화면이 데스크톱 창(iframe) 안에서 열린 것인지 — 서버·첫 렌더는 false, 이어서 바로 실제 값으로 바뀐다
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const snapshot = () => { try { return window.self !== window.top; } catch { return true; } };

export function useEmbedded(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
