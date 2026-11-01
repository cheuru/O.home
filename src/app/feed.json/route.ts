// 이웃 알림용 공개 피드 — https://내사이트/feed.json
// 이웃이 알림 센터에서 이 주소를 구독하면 내 게시판의 새 글을 알림으로 받는다.
//
// 안전장치
//  · 로그인 없이(API 키만으로) DB를 읽는다 → 서버 규칙이 「전체공개」 행만 내준다.
//    회원전용·비공개 메뉴의 글은 애초에 안 나온다.
//  · 비밀글·수위(adult) 접힘 글은 제목도 내보내지 않는다. 본문은 절대 내보내지 않는다
//    (Firestore에서는 제목·날짜·작성자 필드만 골라 읽는다).
//  · CDN 캐시 — 구독자가 많아도 DB 조회는 캐시 시간당 한 번 수준.
// 지원: Firebase(Firestore) · Supabase
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_ITEMS = 30;
const MAX_ROWS = 400;                  // Firestore에서 한 번에 읽는 공개 글 상한
const CACHE_SECONDS = 300;             // CDN 캐시 시간. 줄이면 반영은 빨라지지만 DB 읽기가 늘어난다.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
};

type Cfg =
  | { kind: 'supabase'; url: string; anonKey: string }
  | { kind: 'firebase'; apiKey: string; projectId: string; databaseId: string }
  | null;

async function loadConfig(origin: string): Promise<Cfg> {
  const e = process.env;
  if (e.NEXT_PUBLIC_SUPABASE_URL && e.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return { kind: 'supabase', url: e.NEXT_PUBLIC_SUPABASE_URL, anonKey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY };
  if (e.NEXT_PUBLIC_FIREBASE_API_KEY && e.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    return { kind: 'firebase', apiKey: e.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: e.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      databaseId: (e.NEXT_PUBLIC_FIREBASE_DATABASE_ID ?? '').trim() || '(default)' };
  try {
    const r = await fetch(`${origin}/ohome.config.json`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const o = await r.json() as Record<string, string>;
    if (o.kind === 'firebase' || (o.apiKey && o.projectId))
      return o.apiKey && o.projectId
        ? { kind: 'firebase', apiKey: o.apiKey, projectId: o.projectId, databaseId: (o.databaseId ?? '').trim() || '(default)' }
        : null;
    if (o.url && o.anonKey) return { kind: 'supabase', url: o.url, anonKey: o.anonKey };
  } catch { /* 설정 없음 */ }
  return null;
}

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...CORS, ...extra } });
const noStore = { 'Cache-Control': 'no-store' };

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }

/** 읽어 온 글 한 줄 */
type Row = { id: string; title: string; date: string; author: string; secret: boolean; adult: boolean };

/* ── Firestore REST 값 풀기 ── */
type FsVal = {
  stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number; timestampValue?: string;
  nullValue?: null; mapValue?: { fields?: Record<string, FsVal> };
};
const fsStr = (v?: FsVal) => (typeof v?.stringValue === 'string' ? v.stringValue : '');
const fsMap = (v?: FsVal) => v?.mapValue?.fields ?? {};

async function readFirebase(cfg: Extract<Cfg, { kind: 'firebase' }>, origin: string): Promise<Row[]> {
  const db = encodeURIComponent(cfg.databaseId);
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/${db}/documents:runQuery?key=${encodeURIComponent(cfg.apiKey)}`;
  const r = await fetch(url, {
    method: 'POST',
    // API 키를 「HTTP 리퍼러 제한」으로 묶어 둔 경우를 위해 내 사이트 주소를 리퍼러로 보낸다
    headers: { 'Content-Type': 'application/json', Referer: `${origin}/` },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'posts' }],
        where: { fieldFilter: { field: { fieldPath: 'visibility' }, op: 'EQUAL', value: { stringValue: 'public' } } },
        // 본문은 가져오지 않는다 — 필요한 칸만
        select: { fields: ['data.title', 'data.date', 'data.author', 'data.secret', 'data.fold'].map(fieldPath => ({ fieldPath })) },
        limit: MAX_ROWS,
      },
    }),
    cache: 'no-store', signal: AbortSignal.timeout(9000),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Firestore 응답 오류 (${r.status}) ${t.slice(0, 160)}`);
  }
  const out = await r.json() as { document?: { name: string; createTime?: string; fields?: Record<string, FsVal> } }[];
  return out.flatMap((x): Row[] => {
    if (!x.document) return [];
    const d = fsMap(x.document.fields?.data);
    return [{
      id: x.document.name.split('/').pop() ?? '',
      title: fsStr(d.title).trim(),
      date: fsStr(d.date) || x.document.createTime || '',
      author: fsStr(d.author),
      secret: d.secret?.booleanValue === true,
      adult: fsStr(fsMap(d.fold).type) === 'adult',
    }];
  });
}

async function readSupabase(cfg: Extract<Cfg, { kind: 'supabase' }>): Promise<Row[]> {
  const q = `${cfg.url.replace(/\/$/, '')}/rest/v1/posts?select=id,data,created_at&visibility=eq.public&order=created_at.desc&limit=80`;
  const r = await fetch(q, {
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
    cache: 'no-store', signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`DB 응답 오류 (${r.status})`);
  const rows = await r.json() as { id: string; data: Record<string, unknown> | null; created_at: string }[];
  return rows.map(row => {
    const d = row.data ?? {};
    const fold = d.fold as { type?: string } | null | undefined;
    return {
      id: row.id,
      title: typeof d.title === 'string' ? d.title.trim() : '',
      date: typeof d.date === 'string' ? d.date : row.created_at,
      author: typeof d.author === 'string' ? d.author : '',
      secret: d.secret === true,
      adult: fold?.type === 'adult',
    };
  });
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const cfg = await loadConfig(origin);
  if (!cfg) return json({ error: '서버 설정(ohome.config.json)을 찾지 못했습니다.' }, 503, noStore);

  try {
    const rows = cfg.kind === 'firebase' ? await readFirebase(cfg, origin) : await readSupabase(cfg);
    const items = rows.flatMap(row => {
      const t = Date.parse(row.date);
      if (!row.id || !row.title || row.secret || row.adult || !Number.isFinite(t)) return [];
      return [{
        id: row.id,
        title: row.title.slice(0, 140),
        url: `${origin}/board/${encodeURIComponent(row.id)}`,
        date_published: new Date(t).toISOString(),
        ...(row.author ? { authors: [{ name: row.author }] } : {}),
      }];
    }).sort((a, b) => b.date_published.localeCompare(a.date_published)).slice(0, MAX_ITEMS);

    return json({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'O.HOME',
      home_page_url: origin,
      feed_url: `${origin}/feed.json`,
      items,
    });
  } catch (e) {
    // 실패 응답은 캐시하지 않는다
    return json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, 502, noStore);
  }
}
