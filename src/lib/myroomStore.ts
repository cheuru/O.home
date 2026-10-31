'use client';
// 마이룸 (myroom) — 그누보드 마이룸 스킨을 O.home 구조로 옮긴 것
// 방(myrooms): 회원이 만들고 본인·관리자가 꾸민다 / 보관함(myroom_catalog): 관리자가 카테고리별로 등록한 가구
import { useCallback, useEffect, useState } from 'react';
import type { Visibility } from './charStore';
import { getBlob } from './blobStore';
import { getRawSetting, setSetting } from './settingStore';

export const ROOM_KEY = 'ohome.myroom.v1';        // → myrooms
export const CATALOG_KEY = 'ohome.myroomcat.v1';  // → myroom_catalog
export const MYROOM_SET_KEY = 'ohome.myroomset.v1';
export const ROOM_SEED: MyRoom[] = [];
export const CATALOG_SEED: CatalogItem[] = [];

export const DEFAULT_CANVAS_W = 2000;
export const DEFAULT_CANVAS_H = 1500;

/** 에디터(public/myroom/myroom-editor.js)가 다루는 아이템 — 저장할 때 src·soundUrl 은 파일 참조로 되돌린다 */
export interface RoomItem {
  id: string; type: 'image' | 'text';
  src?: string; text?: string;
  x: number; y: number; w: number; h: number;
  rot: number; flip: boolean; z: number; opacity: number;
  posLocked?: boolean; clickAction?: 'none' | 'sound'; soundUrl?: string;
  [k: string]: unknown;
}

export interface MyRoom {
  id: string;
  title: string;
  author: string;
  authorId: string;
  visibility: Visibility;
  canvasW: number;
  canvasH: number;
  items: RoomItem[];
  date: string;
}

export interface MyCat { id: string; name: string; zBase: number }

export interface CatalogItem {
  id: string;
  categoryId: string;
  name: string;
  src: string;          // 파일 참조
  w: number; h: number; // 원본 픽셀 크기 그대로 화면 크기로 쓴다
  authorId: string;
  visibility: Visibility;   // 항상 public — 보관함은 관리자만 등록
  date: string;
}

export const DEFAULT_CATS: MyCat[] = [
  { id: 'floor', name: '바닥', zBase: 0 },
  { id: 'wall', name: '벽', zBase: 1 },
  { id: 'furniture', name: '가구', zBase: 2 },
  { id: 'etc', name: '기타', zBase: 3 },
];

/** 카테고리 목록 (관리자만 쓰기 — 설정 저장소) */
export function useMyroomCats(): [MyCat[], (cats: MyCat[]) => void, boolean] {
  const [cats, setCatsState] = useState<MyCat[]>(DEFAULT_CATS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = getRawSetting(MYROOM_SET_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { cats?: MyCat[] };
        if (p.cats?.length) setCatsState(p.cats);
      }
    } catch { /* 기본값 */ }
    setLoaded(true);
  }, []);
  const setCats = useCallback((next: MyCat[]) => {
    setCatsState(next);
    try { setSetting(MYROOM_SET_KEY, { cats: next }); } catch { /* 무시 */ }
  }, []);
  return [cats, setCats, loaded];
}

/* ---------- 파일 참조 → 화면에 쓸 주소 ---------- */
const urlMemo = new Map<string, string>();

/** 서버 모드는 공개 URL 그대로, 로컬 모드는 IndexedDB 의 파일을 objectURL 로 바꾼다 */
export async function resolveUrl(ref: string): Promise<string> {
  if (!ref) return '';
  if (/^(https?:|data:)/.test(ref)) return ref;
  const hit = urlMemo.get(ref);
  if (hit) return hit;
  const b = await getBlob(ref);
  if (!b) return '';
  const u = URL.createObjectURL(b);
  urlMemo.set(ref, u);
  return u;
}

export function loadMyRoomEditor(): Promise<void> {
  return new Promise((res, rej) => {
    const w = window as unknown as { MyRoomEditor?: unknown };
    if (w.MyRoomEditor) return res();
    const old = document.getElementById('myroom-editor-js');
    if (old) { old.addEventListener('load', () => res()); return; }
    const s = document.createElement('script');
    s.id = 'myroom-editor-js'; s.src = '/myroom/myroom-editor.js';
    s.onload = () => res(); s.onerror = () => rej(new Error('에디터를 불러오지 못했어요'));
    document.head.appendChild(s);
  });
}
