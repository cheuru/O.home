'use client';
// 창(윈도우) 관리자 저장소 — 메인 화면에서 메뉴를 누르면 페이지 이동 대신
// 드래그 가능한 창으로 띄운다 (v2.1 데스크톱 창모드). 새로고침 시 초기화(휘발성) —
// 열려 있던 창까지 저장하면 주소창 이동이나 로그아웃 흐름과 꼬일 수 있어 세션 동안만 유지.
import React, { createContext, useCallback, useContext, useState } from 'react';

export interface WinState {
  id: string;
  href: string;
  title: string;
  x: number; y: number;
  w: number; h: number;
  z: number;
  minimized: boolean;
}

interface WindowCtx {
  windows: WinState[];
  openWindow: (href: string, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  minimizeWindow: (id: string) => void;
}

const Ctx = createContext<WindowCtx | null>(null);

let seq = 0;
const nextId = () => `win-${Date.now()}-${seq++}`;
const CASCADE = 28; // 새 창마다 살짝 어긋나게 배치 — 전부 같은 자리에 겹치지 않도록

/** 창 안에서 열리는 페이지에는 자기 상단바를 또 그리지 않도록 표시를 남긴다 (v2.2) */
function withWinFlag(href: string): string {
  if (/^https?:\/\//.test(href)) return href; // 외부 주소는 그대로
  const sep = href.includes('?') ? '&' : '?';
  return href.includes('__win=1') ? href : `${href}${sep}__win=1`;
}

export function WindowStoreProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<WinState[]>([]);

  const openWindow = useCallback((href: string, title: string) => {
    const target = withWinFlag(href);
    setWindows(ws => {
      // 이미 열려 있는 같은 주소 창은 새로 만들지 않고 맨 앞으로만 올린다
      const exist = ws.find(w => w.href === target);
      const z = (ws.length ? Math.max(...ws.map(w => w.z)) : 0) + 1;
      if (exist) return ws.map(w => (w.id === exist.id ? { ...w, z, minimized: false } : w));
      const n = ws.length;
      return [...ws, {
        id: nextId(), href: target, title,
        x: 70 + (n % 6) * CASCADE, y: 50 + (n % 6) * CASCADE,
        w: 720, h: 520, z, minimized: false,
      }];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(ws => ws.filter(w => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(ws => {
      const z = (ws.length ? Math.max(...ws.map(w => w.z)) : 0) + 1;
      return ws.map(w => (w.id === id ? { ...w, z, minimized: false } : w));
    });
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(ws => ws.map(w => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(ws => ws.map(w => (w.id === id ? { ...w, minimized: !w.minimized } : w)));
  }, []);

  return (
    <Ctx.Provider value={{ windows, openWindow, closeWindow, focusWindow, moveWindow, minimizeWindow }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWindows(): WindowCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWindows must be used within WindowStoreProvider');
  return ctx;
}
