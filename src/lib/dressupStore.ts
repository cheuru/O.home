'use client';
// 옷입히기 (dressup) — 「페어의 옷장」 방식
// 방 하나 = 페어(캐릭터 2명 고정)의 옷장. 방 정보(캐릭터·표정·대사)는 설정에, 옷은 dressup_parts 컬렉션에 둔다.
// 옷: 관리자 등록은 즉시 공개 / 회원 등록은 관리자 승인 후 공개.
import { useCallback, useEffect, useState } from 'react';
import type { Visibility } from './charStore';
import { getRawSetting, setSetting } from './settingStore';

export const PART_KEY = 'ohome.dresspart.v1';   // → dressup_parts
export const DRESS_SET_KEY = 'ohome.dressupset.v1';
export const PART_SEED: DressPart[] = [];

/* ---------- 카테고리 ---------- */
export interface DressCat {
  id: string;
  name: string;
  /** 겹치는 순서 (클수록 앞). 캐릭터 몸은 10 */
  z: number;
  /** true면 같은 카테고리를 여러 개 입을 수 있다 (외투·신발·악세 등). false면 새 옷이 기존 옷을 대체 */
  stack?: boolean;
  /** true면 입고 있을 때 「옷을 입은 상태」로 본다 (상의·하의·원피스). 아무것도 없으면 부끄러워한다 */
  covers?: boolean;
  /** true면 악세서리로 센다 — 5개 이상이면 무거워한다 */
  acc?: boolean;
  /** true면 옷이 아니라 배경 — 입히면 캐릭터 칸의 배경이 된다 */
  bg?: boolean;
}

export const DEFAULT_CATS: DressCat[] = [
  { id: 'bottom', name: '하의', z: 15, covers: true },
  { id: 'top', name: '상의', z: 20, covers: true },
  { id: 'shoes', name: '신발', z: 22, stack: true },
  { id: 'dress', name: '원피스', z: 20, covers: true },
  { id: 'outer', name: '외투', z: 35, stack: true },
  { id: 'acc', name: '악세', z: 40, stack: true, acc: true },
  { id: 'bg', name: '배경', z: 0, bg: true },
];

/* ---------- 캐릭터 · 방 ---------- */
export const FACE_LABELS = ['기본 표정', '말하는 얼굴', '웃는 얼굴', '방치 · 부끄러울 때', '드물게 나오는 반응'];

export interface Blush { x: number; y: number; w: number; h: number }   // px — 캐릭터 그림 왼쪽 위가 0,0

export interface DressChar {
  name: string;
  /** 표정 5장 (파일 참조). 비어 있으면 '' */
  faces: string[];
  blush: Blush;
  lines: Record<string, string>;
}

export interface DressRoom {
  id: string;
  name: string;
  /** 로비 표지 — 없으면 첫 캐릭터의 기본 표정 */
  cover?: string;
  /** 화면 위 제목 — 없으면 방 이름 */
  title?: string;
  /** 찰칵 저장 파일명 기본값 */
  saveName?: string;
  /** 캐릭터 그림 크기(px). 모든 그림(몸·옷)이 이 크기로 겹쳐진다 */
  stageW: number;
  stageH: number;
  chars: [DressChar, DressChar];
}

export interface DressSettings {
  rooms: DressRoom[];
  allowMemberParts: boolean;
  cats: DressCat[];
}

/* ---------- 대사 ---------- */
export interface LineKey { key: string; label: string; hint: string; list?: boolean }

export const LINE_KEYS: LineKey[] = [
  { key: 'welcome', label: '인사', hint: '방에 처음 들어왔을 때' },
  { key: 'reset_all', label: '다시 입히기', hint: '[다시 입히기]를 눌렀을 때' },
  { key: 'save_photo', label: '찰칵 저장', hint: '[찰칵!]으로 저장한 뒤' },
  { key: 'too_many', label: '과다 착용', hint: '악세서리를 5개 이상 달았을 때' },
  { key: 'nothing', label: '벗길 옷 없음', hint: '입은 옷이 없는데 [전부 벗기]를 눌렀을 때' },
  { key: 'panic_enter', label: '전부 벗기', hint: '[전부 벗기!] 직후 (당황)' },
  { key: 'panic_click', label: '당황 중 클릭', hint: '당황한 상태에서 캐릭터를 눌렀을 때' },
  { key: 'panic_exit', label: '당황 해제', hint: '당황한 상태에서 옷을 입혀 줬을 때' },
  { key: 'return_msg', label: '방치 복귀', hint: '오래 방치된 뒤 옷을 입혀 줬을 때' },
  { key: 'return_panic', label: '부끄러움 중 장식', hint: '옷이 없는 채로 방치/부끄러워하다 장식만 입혀 줬을 때' },
  { key: 'thanks_msg', label: '부끄러움 해제', hint: '부끄러워하다가 옷을 입혀 줬을 때' },
  { key: 'rare_msg', label: '희귀', hint: '아주 가끔 나오는 반응 (표정 5번)' },
  { key: 'blush_msg', label: '부끄러움', hint: '옷이 없어서 부끄러울 때' },
  { key: 'idle_stage1', label: '방치 1단계', hint: '30초쯤 가만히 두었을 때' },
  { key: 'idle_stage2', label: '방치 2단계', hint: '1단계 후 15초 더 두었을 때' },
  { key: 'wait_partner', label: '상대 대기', hint: '상대가 입는 중이라 기다릴 때' },
  { key: 'boast_success', label: '알몸 방치', hint: '옷 없이 방치되었을 때' },
  { key: 'idle_list', label: '방치 혼잣말', hint: '방치 중 가끔 하는 말 (한 줄에 하나, 무작위)', list: true },
  { key: 'click_list', label: '클릭', hint: '캐릭터를 눌렀을 때 (한 줄에 하나, 무작위)', list: true },
  { key: 'dress_list', label: '착용', hint: '옷을 입혀 줬을 때 (한 줄에 하나, 무작위)', list: true },
  { key: 'take_off_list', label: '탈의', hint: '옷을 하나 벗겼을 때 (한 줄에 하나, 무작위)', list: true },
];

export const DEFAULT_LINES: Record<string, string> = {
  welcome: '어서 와요!', reset_all: '다시 갈아입을게요', save_photo: '잘 나왔어요?',
  too_many: '너무 많이 단 거 아니에요…?', nothing: '벗을 옷이 없어요!', panic_enter: '꺄앗! 갑자기 왜 그래요!',
  panic_click: '지, 지금은 안 돼요!', panic_exit: '휴… 고마워요', return_msg: '아, 돌아왔어요?',
  return_panic: '이, 이것만으로는…', thanks_msg: '고마워요…', rare_msg: '…!',
  blush_msg: '저, 저기… 옷 좀…', idle_stage1: '저기요… 아직 있어요?', idle_stage2: '심심해요…',
  wait_partner: '저쪽 먼저 해 줘요', boast_success: '어때요, 괜찮죠?',
  idle_list: '심심하네요…\n뭐 하고 있어요?\n…',
  click_list: '왜요?\n간지러워요\n후훗',
  dress_list: '예쁘다!\n이거 마음에 들어요\n어울려요?',
  take_off_list: '벗었어요\n다음엔 뭐 입을까?',
};

export const newDressChar = (name: string): DressChar => ({
  name, faces: ['', '', '', '', ''], blush: { x: 100, y: 120, w: 100, h: 40 }, lines: { ...DEFAULT_LINES },
});

export const newDressRoom = (id: string, name: string, cover?: string): DressRoom => ({
  id, name, ...(cover ? { cover } : {}), stageW: 300, stageH: 600,
  chars: [newDressChar('캐릭터A'), newDressChar('캐릭터B')],
});

export const DEFAULT_DRESS_SETTINGS: DressSettings = {
  rooms: [], allowMemberParts: true, cats: DEFAULT_CATS,
};

/** 예전 설정(방 구조 이전)이 섞여 있어도 안전하게 읽는다 */
function normalize(p: Partial<DressSettings> & { cats?: Partial<DressCat>[] }): DressSettings {
  const cats = (p.cats?.length ? p.cats : DEFAULT_CATS).map((c, i) => ({
    id: String(c.id ?? `c${i}`), name: String(c.name ?? '카테고리'),
    z: typeof c.z === 'number' ? c.z : 20,
    stack: c.stack, covers: c.covers, acc: c.acc, bg: c.bg,
  })) as DressCat[];
  // 이전 버전(몸통 선택 방식)으로 만든 방은 이름·표지를 살리고 캐릭터 칸을 새로 채운다
  const rooms = (p.rooms ?? []).filter(Boolean).map(r =>
    Array.isArray(r.chars) && r.chars.length === 2 ? r : newDressRoom(r.id, r.name, r.cover)) as DressRoom[];
  return { rooms, allowMemberParts: p.allowMemberParts ?? true, cats };
}

export function useDressSettings(): [DressSettings, (patch: Partial<DressSettings>) => void, boolean] {
  const [st, setSt] = useState<DressSettings>(DEFAULT_DRESS_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = getRawSetting(DRESS_SET_KEY);
      if (raw) setSt(normalize(JSON.parse(raw)));
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

/* ---------- 옷 ---------- */
export type PartStatus = 'pending' | 'approved' | 'rejected';
export type PartWho = 'a' | 'b' | 'any';

export interface DressPart {
  id: string;
  roomId: string;
  catId: string;
  name: string;
  img: string;
  /** 겹치는 순서 — 없으면 카테고리 기본값 */
  z?: number;
  /** 더블클릭 시 자동으로 입을 캐릭터 */
  who: PartWho;
  /** 방에 들어왔을 때 / [다시 입히기] 때 처음부터 입고 있는 옷 */
  wearA?: boolean;
  wearB?: boolean;
  status: PartStatus;
  author: string;
  authorId: string;
  /** 승인 전·반려는 private(작성자+관리자만 읽음), 승인되면 public */
  visibility: Visibility;
  date: string;
}

/** 이 옷이 해당 캐릭터의 기본 코디인가 (0=A, 1=B) */
export const isDefaultWear = (p: DressPart, ci: 0 | 1) => !!(ci === 0 ? p.wearA : p.wearB);
