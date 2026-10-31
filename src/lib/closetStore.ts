'use client';
// 페어의 옷장 — 데이터 모델·기본값·저장 훅
// 원본(PHP, 우초맨 제작)의 custom_data.json 한 벌을 사이트 설정 한 칸(ohome.closet.v1)에 담는다.
// 설정은 「읽기 공개 · 쓰기 관리자」라 방문자는 보기만, 관리자만 고칠 수 있다.
// 이미지는 다른 글과 같은 저장소(putBlob)에 올리고 주소만 저장한다 → 백업·이미지 정리가 그대로 따라온다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBlob } from './blobStore';
import { getSetting, onSettingChange, setSetting } from './settingStore';

export const CLOSET_KEY = 'ohome.closet.v1';

export interface ClosetItem {
  id: string;
  src: string;      // 이미지 주소
  type: string;     // top / bottom / dress / shoes / outer / acc / bg … (탭 키)
  desc: string;     // 이름 — 끝에 A/B 를 붙이면 더블클릭 때 해당 캐릭터에게 입는다
  zi: number;       // 앞뒤 순서(z-index)
  // 페어 반응 대사 (줄바꿈 = 랜덤, 비우면 기본 대사)
  s1?: string;      // 캐릭터1이 입었을 때 캐릭터1이 하는 말
  r1?: string;      // 캐릭터1이 입었을 때 캐릭터2가 하는 말
  s2?: string;      // 캐릭터2가 입었을 때 캐릭터2가 하는 말
  r2?: string;      // 캐릭터2가 입었을 때 캐릭터1이 하는 말
}

/** 저장한 코디 — 아이템은 id로 들고 있어서 아이템을 지워도 나머지는 그대로 불러온다 */
export interface LookEntry { i: string; z: number }
export interface ClosetLook {
  id: string; name: string; created: number;
  c1: LookEntry[]; c2: LookEntry[];
  b1?: string; b2?: string;        // 배경 아이템 id
}

export type DialogueSet = Record<string, string>;

export interface ClosetDesign {
  ribbonColor: string; pointColor: string; titleColor: string;
  gameTitle: string; saveName: string;
  titleFont: string; mainFont: string;       // 비우면 사이트 글꼴
  char1Name: string; char2Name: string;
  char1Label: string; char2Label: string;    // 이름 끝 A/B 표시
  char1Bodies: string[]; char2Bodies: string[];   // 표정 5장 — 기본·말하는·웃는·방치/부끄러움·레어
  char1Width: number; char1Height: number;
  char2Width: number; char2Height: number;
  blush1: string; blush2: string;            // 홍조 위치 "왼쪽,위,너비,높이"
  tabList: string;                           // 줄마다 "탭키|이름"
  tabRemap: string;                          // 줄마다 "원래타입>보여줄탭"
  startTab: string;                          // auto 면 아이템이 든 첫 탭
  char1Default: string[]; char2Default: string[];   // 기본 코디 — 아이템 id
  thumb: string;                             // 방 목록에 보일 그림 — 비우면 두 캐릭터 그림
}

export interface ClosetData {
  items: ClosetItem[];
  dialogue1: DialogueSet;
  dialogue2: DialogueSet;
  design: ClosetDesign;
  looks: ClosetLook[];
}

/** 대사 칸 — [키, 이름, 설명, 여러 줄(줄마다 랜덤)인가] */
export const DG_FIELDS: [string, string, string, boolean][] = [
  ['welcome', '인사', '접속 인사', false],
  ['reset_all', '다시입히기', '다시 입히기 클릭', false],
  ['save_photo', '저장', '찰칵! 저장', false],
  ['too_many', '과다착용', '악세사리 많을 때', false],
  ['nothing', '벗길옷없음', '아무것도 없는데 벗기 누름', false],
  ['panic_enter', '전부벗기', '전부 벗기! 클릭', false],
  ['panic_click', '패닉중장식', '패닉 중 옷 아닌 것 입힘', false],
  ['panic_exit', '패닉해제', '패닉 중 옷 입혀줌', false],
  ['return_msg', '방치복귀', '방치 후 상호작용', false],
  ['return_panic', '부끄럼중장식', '부끄럼 중 장식 입힘', false],
  ['thanks_msg', '부끄럼해제', '부끄럼 중 옷 입혀줌', false],
  ['rare_msg', '희귀', '방치 중 10% 희귀 대사', false],
  ['blush_msg', '부끄럼', '부끄럼/패닉 방치 중 클릭', false],
  ['idle_stage1', '방치1', '방치 1단계(~30초)', false],
  ['idle_stage2', '방치2', '방치 2단계(~45초)', false],
  ['wait_partner', '상대대기', '상대방 입히는 중 방치 1단계 대사', false],
  ['boast_success', '알몸방치', '옷 없이 방치됐을 때 대사', false],
  ['idle_list', '방치혼잣말', '완전 방치 혼잣말 (줄바꿈 = 랜덤)', true],
  ['click_list', '클릭', '캐릭터 클릭 반응 (줄바꿈 = 랜덤)', true],
  ['dress_list', '착용', '옷 입혔을 때 반응 (줄바꿈 = 랜덤)', true],
  ['take_off_list', '탈의', '옷 벗길 때 반응 (줄바꿈 = 랜덤)', true],
  ['partner_dress', '상대입음', '상대가 옷을 입었을 때 내가 하는 말 (줄바꿈 = 랜덤, 비우면 없음)', true],
  ['partner_strip', '상대벗음', '상대가 옷을 벗었을 때 내가 하는 말 (줄바꿈 = 랜덤, 비우면 없음)', true],
  ['look_load', '코디불러옴', '저장한 코디를 불러왔을 때 (비우면 착용 대사)', false],
  ['look_save', '코디저장', '코디를 저장했을 때 (비우면 없음)', false],
];
/** 기본값을 비워 두는 칸 — 안 쓰면 아무 말도 나오지 않는다 */
const EMPTY_DEFAULT = ['partner_dress', 'partner_strip', 'look_load', 'look_save'];

/** 안내용 기본 대사 — 어떤 상황의 칸인지 바로 보이게 채운다 */
function placeholderDialogue(tag: string): DialogueSet {
  const lists: Record<string, number> = { idle_list: 3, click_list: 3, dress_list: 3, take_off_list: 2 };
  const out: DialogueSet = {};
  DG_FIELDS.forEach(([k, name, , multi]) => {
    if (EMPTY_DEFAULT.includes(k)) { out[k] = ''; return; }
    out[k] = multi
      ? Array.from({ length: lists[k] ?? 2 }, (_, i) => `${name} ${tag} 대사 ${i + 1}`).join('\n')
      : `${name} ${tag} 대사`;
  });
  return out;
}

const BASE = '/closet';
const bodies = (c: 1 | 2) => [1, 2, 3, 4, 5].map(n => `${BASE}/c${c}body${n === 1 ? '' : n}.png`);

export const BASE_ITEMS: ClosetItem[] = [
  { id: 'base-wear0', src: `${BASE}/wear0.png`, type: 'dress', desc: '기본 원피스 A', zi: 20 },
  { id: 'base-wear1', src: `${BASE}/wear1.png`, type: 'dress', desc: '기본 원피스 B', zi: 20 },
  { id: 'base-ace1', src: `${BASE}/ace1_2.png`, type: 'acc', desc: '기본 장식 A', zi: 40 },
  { id: 'base-ace2', src: `${BASE}/ace2_2.png`, type: 'acc', desc: '기본 장식 B', zi: 40 },
];

export const DEFAULT_TAB_LIST =
  'top|상의\nbottom|하의\ndress|원피스\nshoes|신발\nouter|외투\nacc|악세\nbg|배경';

const PREV_TAB_LIST = 'bottom|하의\ntop|상의\nshoes|신발\ndress|원피스\nouter|외투\nacc|악세\nbg|배경';
const OLD_TAB_LIST = 'bottom|👖 하의\ntop|👕 상의\nshoes|👟 신발\ndress|👗 원피스\nouter|🧥 외투\nacc|✨ 악세\nbg|🏞 배경';

export function defaultCloset(): ClosetData {
  return {
    items: BASE_ITEMS.map(i => ({ ...i })),
    dialogue1: placeholderDialogue('A'),
    dialogue2: placeholderDialogue('B'),
    looks: [],
    design: {
      ribbonColor: '', pointColor: '', titleColor: '',   // 비우면 사이트 색을 따른다
      gameTitle: '페어명의 옷장', saveName: '페어명의 옷장',
      titleFont: '', mainFont: '',
      char1Name: '캐릭터A', char2Name: '캐릭터B', char1Label: 'A', char2Label: 'B',
      char1Bodies: bodies(1), char2Bodies: bodies(2),
      char1Width: 300, char1Height: 600, char2Width: 300, char2Height: 600,
      blush1: '100,92,100,56', blush2: '100,92,100,56',
      tabList: DEFAULT_TAB_LIST, tabRemap: 'acc2>acc\nhair>acc', startTab: 'auto',
      char1Default: ['base-wear0', 'base-ace1'], char2Default: ['base-wear1', 'base-ace2'],
      thumb: '',
    },
  };
}

/** 저장돼 있던 값에 빠진 칸이 있어도 화면이 깨지지 않게 기본값으로 메운다 */
export function normalizeCloset(raw: unknown): ClosetData {
  const d = defaultCloset();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<ClosetData>;
  const items = Array.isArray(r.items)
    ? r.items
      .filter((i): i is ClosetItem => !!i && typeof i === 'object' && typeof (i as ClosetItem).src === 'string' && !!(i as ClosetItem).src.trim())
      .map((i, n) => ({
        id: typeof i.id === 'string' && i.id ? i.id : `it-${n}`,
        src: i.src.trim(),
        type: i.type ? String(i.type) : 'top',
        desc: i.desc != null ? String(i.desc) : String(i.type ?? ''),
        zi: Number.isFinite(Number(i.zi)) ? Number(i.zi) : 0,
        ...(['s1', 'r1', 's2', 'r2'] as const).reduce<Partial<ClosetItem>>((o, k) => {
          const v = (i as ClosetItem)[k]; if (typeof v === 'string' && v.trim()) o[k] = v; return o;
        }, {}),
      }))
    : d.items;
  const design = { ...d.design, ...(r.design ?? {}) };
  // 예전 기본값(파란 리본·이모지 탭)은 「사이트 톤 따르기」로 옮긴다 — 직접 고른 값은 건드리지 않는다
  if (design.ribbonColor === '#7a9ba8') design.ribbonColor = '';
  if (design.pointColor === '#97c3d1') design.pointColor = '';
  if (design.titleColor === '#555555') design.titleColor = '';
  if (design.tabList === OLD_TAB_LIST || design.tabList === PREV_TAB_LIST) design.tabList = DEFAULT_TAB_LIST;
  // 표정 5장 — 비었거나 모자라면 기본 그림으로
  design.char1Bodies = [0, 1, 2, 3, 4].map(n => design.char1Bodies?.[n] || d.design.char1Bodies[n]);
  design.char2Bodies = [0, 1, 2, 3, 4].map(n => design.char2Bodies?.[n] || d.design.char2Bodies[n]);
  const ent = (v: unknown): LookEntry[] => (Array.isArray(v) ? v : [])
    .filter((e): e is LookEntry => !!e && typeof (e as LookEntry).i === 'string')
    .map(e => ({ i: e.i, z: Number.isFinite(Number(e.z)) ? Number(e.z) : 0 }));
  const looks: ClosetLook[] = Array.isArray(r.looks)
    ? r.looks.filter(l => !!l && typeof l === 'object' && typeof l.id === 'string').map(l => ({
      id: l.id, name: String(l.name ?? '코디'), created: Number(l.created) || 0,
      c1: ent(l.c1), c2: ent(l.c2),
      ...(typeof l.b1 === 'string' && l.b1 ? { b1: l.b1 } : {}), ...(typeof l.b2 === 'string' && l.b2 ? { b2: l.b2 } : {}),
    }))
    : [];
  return {
    items,
    dialogue1: { ...d.dialogue1, ...(r.dialogue1 ?? {}) },
    dialogue2: { ...d.dialogue2, ...(r.dialogue2 ?? {}) },
    design,
    looks,
  };
}

/** 줄 단위 설정 읽기 — 빈 줄과 # 주석은 건너뛴다 */
export const lines = (v: string) =>
  String(v ?? '').split(/\r\n|\r|\n/).map(s => s.trim()).filter(s => s && s[0] !== '#');

export interface TabInfo { order: string[]; label: Record<string, string>; remap: (t: string) => string }

export function tabInfo(d: ClosetDesign): TabInfo {
  const order: string[] = []; const label: Record<string, string> = {};
  for (const ln of lines(d.tabList)) {
    const [k, ...rest] = ln.split('|');
    const key = k.trim();
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(key) || label[key]) continue;
    order.push(key); label[key] = rest.join('|').trim() || key;
  }
  if (!order.length) {
    DEFAULT_TAB_LIST.split('\n').forEach(l => { const [k, v] = l.split('|'); order.push(k); label[k] = v; });
  }
  const map: Record<string, string> = {};
  for (const ln of lines(d.tabRemap)) {
    const [a, b] = ln.split('>').map(s => s.trim());
    if (a && b && order.includes(b)) map[a] = b;
  }
  return { order, label, remap: (t: string) => map[t] ?? t };
}

/* ── 방(여러 옷장) ──
   옷장 하나가 방 하나. 모든 방을 설정 한 칸(ohome.closet.v1)에 담아 사이트 백업에 그대로 따라오게 한다.
   방이 생기기 전 단일 옷장 형태({ items, design … })로 저장된 값은 첫 번째 방(main)으로 이어받는다. */
export interface ClosetRoom extends ClosetData { id: string; created: number }
export interface ClosetBook { rooms: ClosetRoom[] }

export function newRoom(id: string, name: string): ClosetRoom {
  const d = defaultCloset();
  d.design.gameTitle = name; d.design.saveName = name;
  return { ...d, id, created: Date.now() };
}

export function normalizeBook(raw: unknown): ClosetBook {
  if (!raw || typeof raw !== 'object') return { rooms: [] };
  const r = raw as { rooms?: unknown; items?: unknown };
  if (Array.isArray(r.rooms)) {
    return {
      rooms: r.rooms
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
        .map((x, n) => ({
          ...normalizeCloset(x),
          id: typeof x.id === 'string' && x.id ? x.id : `room-${n}`,
          created: Number(x.created) || 0,
        })),
    };
  }
  if (Array.isArray(r.items)) return { rooms: [{ ...normalizeCloset(raw), id: 'main', created: 0 }] };   // 예전 단일 옷장
  return { rooms: [] };
}

/** 방 목록 — 읽기는 누구나, 저장은 관리자 (서버 규칙이 막는다) */
export function useClosetBook(): [ClosetBook, (next: ClosetBook) => void, boolean] {
  const [book, setBook] = useState<ClosetBook>({ rooms: [] });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => setBook(normalizeBook(getSetting<unknown>(CLOSET_KEY, null)));
    load(); setLoaded(true);
    return onSettingChange(k => { if (k === CLOSET_KEY) load(); });
  }, []);
  const save = useCallback((next: ClosetBook) => { setBook(next); setSetting(CLOSET_KEY, next); }, []);
  return [book, save, loaded];
}

/* ── 화면에 그릴 주소 ──
   서버에 연결돼 있으면 저장된 값이 곧 공개 주소지만, 연결 전(브라우저 저장 모드)에 올린 그림은
   파일 id로만 남아 있어 그대로는 <img>에 못 쓴다. 그런 것만 골라 표시용 주소로 바꿔 준다. */
const isLocalRef = (r: string) => !!r && !/^(https?:|data:|blob:|\/)/.test(r);

export function useResolvedCloset(data: ClosetData): ClosetData {
  const [map, setMap] = useState<Record<string, string>>({});
  const refs = useMemo(() => {
    const all = [...data.items.map(i => i.src), ...data.design.char1Bodies, ...data.design.char2Bodies];
    return Array.from(new Set(all.filter(isLocalRef)));
  }, [data]);
  useEffect(() => {
    const need = refs.filter(r => !map[r]);
    if (!need.length) return;
    let alive = true;
    Promise.all(need.map(async r => {
      try { const b = await getBlob(r); return b ? [r, URL.createObjectURL(b)] as const : null; } catch { return null; }
    })).then(got => {
      if (!alive) return;
      const add: Record<string, string> = {};
      got.forEach(g => { if (g) add[g[0]] = g[1]; });
      if (Object.keys(add).length) setMap(m => ({ ...m, ...add }));
    });
    return () => { alive = false; };
  }, [refs, map]);
  return useMemo(() => {
    if (!Object.keys(map).length) return data;
    const f = (u: string) => map[u] ?? u;
    return {
      ...data,
      items: data.items.map(i => ({ ...i, src: f(i.src) })),
      design: { ...data.design, char1Bodies: data.design.char1Bodies.map(f), char2Bodies: data.design.char2Bodies.map(f) },
    };
  }, [data, map]);
}
