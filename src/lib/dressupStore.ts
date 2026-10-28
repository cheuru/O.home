'use client';
// 옷입히기 (dressup) — 몸통(베이스) + 카테고리별 파츠 레이어 + 위치 조정
// 컬렉션: dressup_bodies(몸통, 관리자만) · dressup_parts(파츠, 관리자 등록 / 회원은 승인제)
import { useCallback, useEffect, useState } from 'react';
import type { Visibility } from './charStore';
import { getRawSetting, setSetting } from './settingStore';

export const BODY_KEY = 'ohome.dressbody.v1';   // → dressup_bodies
export const PART_KEY = 'ohome.dresspart.v1';   // → dressup_parts
export const DRESS_SET_KEY = 'ohome.dressupset.v1';

/* ---------- 카테고리 / 설정 ---------- */
export interface DressCat {
  id: string;
  name: string;
  /** true면 몸통 뒤에 그린다 (뒷머리·배경 소품 등). 기본은 몸통 앞 */
  behind?: boolean;
}

/** 방 — 로비에서 썸네일로 보이고, 들어가면 그 방의 몸통들을 꾸민다. 설정(관리자만 쓰기)에 저장 */
export interface DressRoom {
  id: string;
  name: string;
  /** 표지 이미지 파일 참조 — 없으면 첫 몸통을 보여준다 */
  cover?: string;
}

export interface DressSettings {
  /** 방 하나에 올릴 수 있는 몸통 수 */
  maxBodies: number;
  rooms: DressRoom[];
  /** 회원의 파츠 등록 허용 (승인 후 공개) */
  allowMemberParts: boolean;
  /** 캔버스 크기 — 모든 이미지는 이 비율로 겹쳐진다 */
  stageW: number;
  stageH: number;
  cats: DressCat[];
}

export const DEFAULT_DRESS_SETTINGS: DressSettings = {
  maxBodies: 5,
  rooms: [],
  allowMemberParts: true,
  stageW: 600,
  stageH: 800,
  cats: [
    { id: 'hair-back', name: '뒷머리', behind: true },
    { id: 'eyes', name: '눈' },
    { id: 'hair', name: '앞머리' },
    { id: 'clothes', name: '옷' },
    { id: 'shoes', name: '신발' },
    { id: 'item', name: '소품' },
  ],
};

export function useDressSettings(): [DressSettings, (patch: Partial<DressSettings>) => void, boolean] {
  const [st, setSt] = useState<DressSettings>(DEFAULT_DRESS_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = getRawSetting(DRESS_SET_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<DressSettings>;
        setSt({ ...DEFAULT_DRESS_SETTINGS, ...p, rooms: p.rooms ?? [], cats: p.cats?.length ? p.cats : DEFAULT_DRESS_SETTINGS.cats });
      }
    } catch { /* 기본값 */ }
    setLoaded(true);
  }, []);
  const patch = useCallback((p: Partial<DressSettings>) => {
    setSt(s => {
      const n = { ...s, ...p };
      try { setSetting(DRESS_SET_KEY, n); } catch { /* 무시 */ }
      return n;
    });
  }, []);
  return [st, patch, loaded];
}

/* ---------- 몸통 · 파츠 ---------- */
export interface DressBody {
  id: string;
  /** 소속 방 — 비어 있으면(방 기능 이전에 올린 몸통) 첫 번째 방 소속으로 본다 */
  roomId?: string;
  name: string;
  img: string;               // 파일 참조 (blobStore)
  authorId: string;
  visibility: Visibility;    // 항상 public — 몸통은 관리자만 등록
}

export type PartStatus = 'pending' | 'approved' | 'rejected';

export interface DressPart {
  id: string;
  bodyId: string;            // 이 파츠가 맞는 몸통 (몸통별 파츠)
  catId: string;
  name: string;
  img: string;
  status: PartStatus;
  author: string;            // 등록 당시 닉네임
  authorId: string;
  /** 승인 전·반려는 private(작성자+관리자만 읽음), 승인되면 public */
  visibility: Visibility;
  date: string;              // ISO
}

export const BODY_SEED: DressBody[] = [];
export const PART_SEED: DressPart[] = [];

/* ---------- 입히기 상태 ---------- */
export interface LayerPick {
  partId: string;
  dx: number; dy: number;    // 캔버스 대비 % — 파츠 미세 위치
  s: number;                 // 파츠 배율
}

export interface SlotState {
  bodyId: string;
  ox: number; oy: number;    // 캐릭터 전체 위치 (% — 페어일 때 좌우 배치용)
  sc: number;                // 캐릭터 전체 배율
  flip: boolean;
  layers: Record<string, LayerPick>;   // catId → 선택
}

export interface DressState {
  mode: 'single' | 'pair';
  slots: [SlotState, SlotState];
}

export const emptySlot = (bodyId = '', ox = 0, sc = 1): SlotState =>
  ({ bodyId, ox, oy: 0, sc, flip: false, layers: {} });

export const PAIR_OX = 24;
export const PAIR_SC = 0.82;

export const newDressState = (bodyId = ''): DressState => ({
  mode: 'single',
  slots: [emptySlot(bodyId), emptySlot(bodyId)],
});

/** 화면·PNG 저장이 같은 순서로 그리도록 — 뒤(behind 카테고리) → 몸통 → 앞 카테고리 */
export interface DrawItem {
  key: string;
  ref: string;
  kind: 'body' | 'part';
  dx: number; dy: number; s: number;
}

export function buildDrawList(
  slot: SlotState, bodies: DressBody[], parts: DressPart[], cats: DressCat[],
): DrawItem[] {
  const body = bodies.find(b => b.id === slot.bodyId);
  if (!body) return [];
  const pick = (c: DressCat): DrawItem | null => {
    const l = slot.layers[c.id];
    if (!l) return null;
    const p = parts.find(x => x.id === l.partId);
    if (!p || !p.img) return null;
    return { key: `p-${c.id}`, ref: p.img, kind: 'part', dx: l.dx, dy: l.dy, s: l.s };
  };
  const back = cats.filter(c => c.behind).map(pick);
  const front = cats.filter(c => !c.behind).map(pick);
  const bodyItem: DrawItem = { key: 'body', ref: body.img, kind: 'body', dx: 0, dy: 0, s: 1 };
  return [...back, bodyItem, ...front].filter((x): x is DrawItem => !!x);
}

/** 이 몸통이 해당 방 소속인가 */
export const bodyInRoom = (b: DressBody, roomId: string, rooms: DressRoom[]) =>
  b.roomId ? b.roomId === roomId : rooms[0]?.id === roomId;
