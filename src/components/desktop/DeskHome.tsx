'use client';
// 데스크톱 첫 화면 장식 (사용자 요청) — 창이 하나도 없을 때만 보인다.
//  · 가운데: 궤도 시계 — 초·분·시가 행성처럼 세 겹 궤도를 돈다 (가운데에 사이트 이름 + 디지털 시각)
//  · 왼쪽 위: 시스템 터미널 — 부팅 로그가 타이핑되고, 접속 시간(uptime)이 실시간으로 흐른다
// 터미널은 제목줄 드래그로 옮기고, 가장자리·모서리를 잡아 크기를 바꾼다(위치·크기는 이 브라우저에 기억). 정해진 명령어는 직접 칠 수도 있다. 나머지는 pointer-events:none — 아래 아이콘·창 조작을 가로막지 않는다.
import React, { useEffect, useRef, useState } from 'react';
import { useMembers } from '@/lib/members';
import { getSetting, setSetting, onSettingChange } from '@/lib/settingStore';
// R 의 대사 데이터 — data/r-dialogue/*.csv 에서 npm run dev / build 때 자동 생성된다 (직접 고치지 않는다)
import { HIDDEN_DATA, GENERAL_DATA, WRONG_DATA, REP_EXTRA, COMPOSITE_DATA, TREE_NODES_DATA, TREE_STARTS_DATA, FOODS_DATA, FOOD_TEXT, TALK_LINES, TALK_REGEX, FOOD_REGEX, SYS_LINES, BOOT_LINES, GREET_LINES, IDLE_LINE, FLAVOR_LINES, NAME_TEXT, NAME_REPLACE, IDENT_LINES } from './rDialogueData.generated';

const rx = (d: { source: string; flags: string }) => new RegExp(d.source, d.flags);   // CSV 의 정규식(05b · 07c) 만들기

const pad = (n: number) => String(n).padStart(2, '0');
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/* ───────── 궤도 시계 ───────── */
const C = 250;                 // viewBox 중심 (500x500)
const R_SEC = 222, R_MIN = 176, R_HR = 130;

// 돌아가는 궤도 호 — 원은 그냥 돌려선 티가 안 나서, 끊어진 호(켜짐/꺼짐 비율, 합 = 1)를 겹쳐 돌린다
const arcs = (r: number, pat: number[]) => { const c = 2 * Math.PI * r; return pat.map(f => (f * c).toFixed(1)).join(' '); };
const A_SEC = [0.18, 0.07, 0.06, 0.05, 0.3, 0.1, 0.1, 0.14];
const A_MIN = [0.22, 0.08, 0.04, 0.06, 0.25, 0.1, 0.15, 0.1];
const A_HR = [0.3, 0.1, 0.12, 0.08, 0.25, 0.15];
const A_IN = [0.4, 0.12, 0.2, 0.1, 0.08, 0.1];

function OrbitClock({ title }: { title: string }) {
  const secRef = useRef<SVGGElement>(null);
  const minRef = useRef<SVGGElement>(null);
  const hrRef = useRef<SVGGElement>(null);
  const spinRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGCircleElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const circ = 2 * Math.PI * R_SEC;
    const paint = () => {
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      const sa = reduce ? Math.floor(s) * 6 : (s / 60) * 360;
      secRef.current?.setAttribute('transform', `rotate(${sa} ${C} ${C})`);
      minRef.current?.setAttribute('transform', `rotate(${(m / 60) * 360} ${C} ${C})`);
      hrRef.current?.setAttribute('transform', `rotate(${(h / 12) * 360} ${C} ${C})`);
      // 초 행성 뒤로 꼬리처럼 남는 호 (최근 ~12초)
      if (trailRef.current) {
        const len = circ * (12 / 60);
        trailRef.current.setAttribute('stroke-dasharray', `${len} ${circ}`);
        trailRef.current.setAttribute('transform', `rotate(${sa - 12 * 6 - 90} ${C} ${C})`);
      }
      if (!reduce) raf = requestAnimationFrame(paint);
    };
    paint();
    setNow(new Date());
    const iv = window.setInterval(() => setNow(new Date()), 1000);
    if (!reduce) raf = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);

  // 눈금 — 60개 (5의 배수는 길게)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    const r1 = R_SEC + 14, r2 = r1 + (long ? 9 : 4);
    return <line key={i} x1={C + Math.sin(a) * r1} y1={C - Math.cos(a) * r1} x2={C + Math.sin(a) * r2} y2={C - Math.cos(a) * r2}
      className={long ? 'tk long' : 'tk'} />;
  });

  return (
    <div className="dsk-orbit" aria-hidden="true">
      <svg viewBox="0 0 500 500">
        <defs>
          <radialGradient id="dskPlanet" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#ffd6e8" /><stop offset="1" stopColor="#c58bff" />
          </radialGradient>
          <filter id="dskGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {/* 천천히 도는 바깥 장식 링 */}
        <g ref={spinRef} className="spin"><circle cx={C} cy={C} r={R_SEC + 34} className="ring dash" /></g>
        <g>{ticks}</g>
        <circle cx={C} cy={C} r={R_SEC} className="ring" />
        <circle ref={trailRef} cx={C} cy={C} r={R_SEC} className="trail" strokeLinecap="round" />
        <circle cx={C} cy={C} r={R_MIN} className="ring" />
        <circle cx={C} cy={C} r={R_HR} className="ring" />
        <circle cx={C} cy={C} r={R_HR - 34} className="ring faint" />
        {/* 천천히 도는 호 — 바깥은 시계 방향, 안쪽으로 갈수록 번갈아 반대 방향 */}
        <g className="rot r1"><circle cx={C} cy={C} r={R_SEC} className="arc" strokeDasharray={arcs(R_SEC, A_SEC)} /></g>
        <g className="rot r2"><circle cx={C} cy={C} r={R_MIN} className="arc" strokeDasharray={arcs(R_MIN, A_MIN)} /></g>
        <g className="rot r3"><circle cx={C} cy={C} r={R_HR} className="arc" strokeDasharray={arcs(R_HR, A_HR)} /></g>
        <g className="rot r4"><circle cx={C} cy={C} r={R_HR - 34} className="arc dim" strokeDasharray={arcs(R_HR - 34, A_IN)} /></g>
        {/* 시 */}
        <g ref={hrRef}>
          <circle cx={C} cy={C - R_HR} r="11" className="halo hr" filter="url(#dskGlow)" />
          <circle cx={C} cy={C - R_HR} r="6.5" className="pl hr" />
        </g>
        {/* 분 */}
        <g ref={minRef}>
          <circle cx={C} cy={C - R_MIN} r="9" className="halo mn" filter="url(#dskGlow)" />
          <circle cx={C} cy={C - R_MIN} r="5" className="pl mn" />
        </g>
        {/* 초 */}
        <g ref={secRef}>
          <circle cx={C} cy={C - R_SEC} r="8" className="halo sc" filter="url(#dskGlow)" />
          <circle cx={C} cy={C - R_SEC} r="3.6" fill="url(#dskPlanet)" />
        </g>
      </svg>
      <div className="dsk-orbit-core">
        <b>{title.toUpperCase()}</b>
        <time>{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : '--:--'}<i>{now ? pad(now.getSeconds()) : '--'}</i></time>
        <span>{now ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} · ${DAYS[now.getDay()]}` : ''}</span>
      </div>
    </div>
  );
}

/* ───────── 시스템 터미널 ───────── */
const FLAVOR = FLAVOR_LINES;   // 우주 문구는 09 CSV

/* ── 터미널 속 관리 프로그램 「R」의 대사 ──
   입력 처리 순서:  ① 시스템 명령어(정확히 일치)  ② 복합 키워드  ③ 숨겨진 키워드  ④ 일반 대화 키워드(위가 우선)  ⑤ 미등록 → 랜덤 오류 대사
   대사 본문은 코드가 아니라 data/r-dialogue 의 CSV 에서 온다(01 숨김 · 02 일반 · 02b 반복 · 03 복합 · 04 미등록 · 06 트리 · 07 음식).
   ②~④ 는 문장 어디에 들어 있어도 감지(포함 검사). 한글은 띄어쓰기를 무시하고, 영어는 단어 단위로만 감지한다(this 안의 hi 같은 오작동 방지). */
const COUNT_KEYS = ['whoami', 'clear', 'hello', 'love', 'sorry', 'unknown'] as const;
type CountKey = typeof COUNT_KEYS[number];
type Rule = { kw: string[]; say: string; ctr?: CountKey; rep?: Record<number, string> };   // ctr: 반복 횟수를 셀 이름 · rep: 그 횟수째에 나올 특별 대사

const compact = (x: string) => x.toLowerCase().replace(/[\s?!.,~…]+/g, '');
const ASCII_WORD = /^[a-z][a-z ]*$/;
const has = (s: string, c: string, kw: string) =>
  ASCII_WORD.test(kw) ? new RegExp(`(^|[^a-z])${kw.replace(/ /g, '\\s+')}($|[^a-z])`).test(s) : c.includes(compact(kw));
const hasAny = (s: string, c: string, kws: string[]) => kws.some(k => has(s, c, k));
// 호칭 감지 — R아·R은·R이·R한테 는 잡고, 영어 단어 안의 r 은 안 잡는다 / 너·나 는 너무·나무 같은 낱말을 피한다
const isR = (s: string) => /(^|[^a-z0-9])r($|[^a-z0-9])/.test(s);
const isYou = (s: string) => /(^|[^가-힣])(너(?=$|[^가-힣]|는|도|를|한테|랑|의|가)|넌)/.test(s);
const isMe = (s: string) => /(^|[^가-힣])(나(?=$|[^가-힣]|는|도|를|한테|랑|의|가)|난|내가)/.test(s);

// ② 복합 키워드 — 두 조건이 함께 있을 때
const SUBJECT_TEST: Record<'R' | '너' | '나' | '', (s: string) => boolean> = { R: isR, '너': isYou, '나': isMe, '': () => true };
const COMPOSITE: [(s: string, c: string) => boolean, string][] = COMPOSITE_DATA.map((r): [(s: string, c: string) => boolean, string] => [
  (s, c) => SUBJECT_TEST[r.subject](s) && r.kw.every(k => has(s, c, k)),   // 호칭(R·너·나) 조건 + 키워드를 모두 포함
  r.say,
]);

// ③ 숨겨진 키워드 — help 에 나오지 않는다 (비밀번호 가 비밀 보다 먼저)
const HIDDEN: Rule[] = HIDDEN_DATA as Rule[];

// ④ 일반 대화 키워드 — 위에 있을수록 우선순위가 높다
const GENERAL: Rule[] = GENERAL_DATA as Rule[];

// ⑤ 미등록 입력 — 랜덤 (같은 대사가 연달아 나오지 않게)
const WRONG: string[] = WRONG_DATA;
let lastWrong = -1;

/* ── 음식 추천 ──
   구조: 음식 목록(FOODS, 음식마다 태그 여러 개) + 키워드 감지(foodTags) + 랜덤 추천(pickFood) + 재추천(foodAgain).
   음식 이름마다 대사를 만들지 않고, 대사 틀(FOOD_SAY)에 음식 이름을 끼워 넣는다.
   음식 목록(태그)과 대사 틀은 data/r-dialogue 의 07 · 07b CSV 에서 온다. */
type FoodTag = 'lunch' | 'dinner' | 'night' | 'spicy' | 'mild' | 'soup' | 'light' | 'cheap';
const TAG_LABEL: Record<FoodTag, string> = { lunch: '점심', dinner: '저녁', night: '야식', spicy: '매운 음식', mild: '안 매운 음식', soup: '국물 음식', light: '가벼운 메뉴', cheap: '가성비' };
const RELAX_ORDER: FoodTag[] = ['cheap', 'light', 'night', 'dinner', 'lunch', 'soup', 'spicy', 'mild'];   // 조건에 맞는 음식이 없을 때 앞에서부터 하나씩 뺀다
const FOODS = FOODS_DATA.map(f => ({ name: f.name, tags: f.tags as FoodTag[] }));   // 음식 목록은 07 CSV

// 받침에 따라 조사를 고른다 (김치찌개 → 를 / 마라탕 → 을)
const batchim = (w: string) => { const ch = w.charCodeAt(w.length - 1) - 0xac00; return ch >= 0 && ch <= 11171 && ch % 28 !== 0; };
const eul = (w: string) => (batchim(w) ? '을' : '를');
const ika = (w: string) => (batchim(w) ? '이' : '가');
const eun = (w: string) => (batchim(w) ? '은' : '는');
const fillFood = (tpl: string, f: string) => tpl.replace(/\{음식\}/g, () => f).replace(/\{을\}/g, () => eul(f)).replace(/\{이\}/g, () => ika(f)).replace(/\{은\}/g, () => eun(f));   // 대사 틀의 {음식}·{을}·{이}·{은} 채우기
const FOOD_SAY: ((f: string) => string)[] = FOOD_TEXT.say.map(tpl => (f: string) => fillFood(tpl, f));
// 재추천 n 번째의 특별 대사 (1·2 는 대사 자체가 추천 문장, 3·5·10 은 앞에 한 줄을 더 붙인다)
const FOOD_AGAIN_LINE: Record<number, (f: string) => string> = Object.fromEntries(Object.entries(FOOD_TEXT.againLine).map(([n, tpl]) => [n, (f: string) => fillFood(tpl, f)]));
const FOOD_AGAIN_PRE: Record<number, string> = FOOD_TEXT.againPre;

// 키워드 감지 — compact(공백 제거) 문자열 기준. 부정 표현(안 매운)을 먼저 찾아 빼야 '매운' 이 따로 잡히지 않는다
const MILD_RE = rx(FOOD_REGEX.mild);                                       // 감지어는 07c CSV
const SPICY_RE = rx(FOOD_REGEX.spicy);
const FOOD_TRIGGER = rx(FOOD_REGEX.trigger);
const FOOD_REROLL = rx(FOOD_REGEX.reroll);
const TAG_RE = { lunch: rx(FOOD_REGEX.lunch), dinner: rx(FOOD_REGEX.dinner), night: rx(FOOD_REGEX.night), soup: rx(FOOD_REGEX.soup), light: rx(FOOD_REGEX.light), cheap: rx(FOOD_REGEX.cheap) };
function foodTags(c: string): FoodTag[] {
  const t: FoodTag[] = [];
  if (TAG_RE.lunch.test(c)) t.push('lunch');
  if (TAG_RE.dinner.test(c)) t.push('dinner');
  if (TAG_RE.night.test(c)) t.push('night');
  const mild = MILD_RE.test(c);
  const rest = c.replace(new RegExp(MILD_RE.source, 'g'), '');
  if (SPICY_RE.test(rest)) t.push('spicy');
  if (mild) t.push('mild');
  if (TAG_RE.soup.test(c)) t.push('soup');
  if (TAG_RE.light.test(c)) t.push('light');
  if (TAG_RE.cheap.test(c)) t.push('cheap');
  return t;
}

let foodCtx: { tags: FoodTag[]; last: string; n: number; at: number } | null = null;   // 직전 추천(재추천용) — 음식과 상관없는 말을 하면 사라진다
const foodSeen = new Set<string>();                                         // 이 세션에서 이미 추천한 음식

function pickFood(tags: FoodTag[], last: string | null) {
  const notes: TLine[] = [];
  let eff = tags.slice();
  const dropped: FoodTag[] = [];
  const match = (t: FoodTag[]) => FOODS.filter(f => t.every(x => f.tags.includes(x)));
  let cands = match(eff);
  for (const d of RELAX_ORDER) {
    if (cands.length) break;
    if (eff.includes(d)) { eff = eff.filter(x => x !== d); dropped.push(d); cands = match(eff); }
  }
  if (dropped.length) notes.push(R(FOOD_TEXT.notes.relax.replace('{제외한 조건}', () => dropped.map(d => `'${TAG_LABEL[d]}'`).join(', '))));
  let pool = cands.filter(f => f.name !== last);                           // 직전 음식은 제외
  if (!pool.length) {
    pool = cands; notes.push(R(FOOD_TEXT.notes.only));
  } else {
    let fresh = pool.filter(f => !foodSeen.has(f.name));                    // 이미 추천한 음식도 제외 — 다 쓰면 그때만 초기화
    if (!fresh.length) { cands.forEach(f => foodSeen.delete(f.name)); fresh = pool; notes.push(R(FOOD_TEXT.notes.reset)); }
    pool = fresh;
  }
  const food = pool[Math.floor(Math.random() * pool.length)].name;
  foodSeen.add(food);
  return { food, notes, eff };
}
const sayFood = (f: string) => FOOD_SAY[Math.floor(Math.random() * FOOD_SAY.length)](f);

function foodReply(c: string): TLine[] | null {
  if (foodCtx && Date.now() - foodCtx.at > TALK_TTL) foodCtx = null;     // 오래 지난 추천에는 '다른 거' 가 이어지지 않는다
  const tags = foodTags(c);
  const ask = /먹|추천|메뉴/.test(c);
  const modifier = tags.some(t => t !== 'lunch' && t !== 'dinner' && t !== 'night');
  const intent = FOOD_TRIGGER.test(c)
    || (/점심|저녁/.test(c) && /뭐먹|뭘먹|먹을|먹고싶|먹지/.test(c))
    || (modifier && (ask || foodCtx !== null));
  if (intent) {                                                             // 새 추천
    const { food, notes, eff } = pickFood(tags, null);
    foodCtx = { tags: eff, last: food, n: 0, at: Date.now() };
    return [...notes, R(sayFood(food))];
  }
  if (foodCtx && c.length <= 14 && FOOD_REROLL.test(c)) {                   // 재추천
    const ctx = foodCtx;
    ctx.n++;
    const { food, notes, eff } = pickFood(ctx.tags, ctx.last);
    ctx.tags = eff; ctx.last = food; ctx.at = Date.now();
    const out: TLine[] = [...notes];
    if (FOOD_AGAIN_LINE[ctx.n]) { out.push(R(FOOD_AGAIN_LINE[ctx.n](food))); return out; }
    if (FOOD_AGAIN_PRE[ctx.n]) out.push(R(FOOD_AGAIN_PRE[ctx.n]));
    out.push(R(sayFood(food)));
    return out;
  }
  foodCtx = null;
  return null;
}

/* ── 짧은 문맥 대화: 질문 후 다음 입력을 앞선 질문의 답으로 해석 ──
   AI 없이 작동하는 규칙 기반 2~3턴 대화. 명령어/기존 대화 데이터는 유지한다. */
type TalkTopic = 'day' | 'hardDay' | 'secret' | 'birthday';
type TalkContext = { topic: TalkTopic; remaining: number } | null;
const AFFIRM = rx(TALK_REGEX.AFFIRM);                                       // 판정어는 05b CSV
const DECLINE = rx(TALK_REGEX.DECLINE);
const GOOD_DAY = rx(TALK_REGEX.GOOD_DAY);
const HARD_DAY = rx(TALK_REGEX.HARD_DAY);
// 05 — 대사는 CSV(코드 키로 찾음), 발동 조건은 코드에 고정
const talk = (k: string): TLine[] => (TALK_LINES[k] ?? []).map(l => R(l));

function contextReply(input: string, ctx: TalkContext): { out: TLine[]; next: TalkContext } | null {
  if (!ctx) return null;
  const c = compact(input);
  if (/^(그만|대화종료|취소|cancel)$/.test(c)) return { out: talk('cancel'), next: null };
  if (ctx.topic === 'day') {
    if (HARD_DAY.test(c)) return { out: talk('day.hard'), next: { topic: 'hardDay', remaining: 1 } };
    if (GOOD_DAY.test(c)) return { out: talk('day.good'), next: null };
    if (/^(그냥|그럭저럭|보통|몰라|글쎄)$/.test(c)) return { out: talk('day.meh'), next: null };
  }
  if (ctx.topic === 'hardDay') {
    if (c.length <= 30 && /회사|직장|업무|일이|야근|상사|회의|출근/.test(c)) return { out: talk('hard.work'), next: null };
    if (c.length <= 30 && /사람|친구|가족|동료|인간관계|싸웠/.test(c)) return { out: talk('hard.people'), next: null };
    if (/^(그냥|말하기싫어|비밀|몰라)$/.test(c)) return { out: talk('hard.silent'), next: null };
    if (c.length <= 45) return { out: talk('hard.other'), next: null };
  }
  if (ctx.topic === 'secret') {
    if (AFFIRM.test(c)) return { out: talk('secret.yes'), next: null };
    if (DECLINE.test(c)) return { out: talk('secret.no'), next: null };
  }
  if (ctx.topic === 'birthday') {
    if (AFFIRM.test(c)) return { out: talk('birthday.yes'), next: null };
    if (DECLINE.test(c)) return { out: talk('birthday.no'), next: null };
  }
  return null; // 이전 질문의 답이 아니라면 기존 명령어/키워드 처리로 넘긴다.
}

/** 시스템 명령어가 아닌 입력(이미 소문자·끝 문장부호 제거됨)에 대한 R 의 응답 */
function reply(s: string, setContext: (ctx: TalkContext) => void): TLine[] {
  const c = compact(s);
  const food = foodReply(c);                      // 음식 추천 · 재추천 (가장 먼저 확인)
  if (food) return food;
  if (/^(?:(?:r아?|r은)?(?:넌|너는|너)?누구(?:야|니|세요|십니까|냐)|whoareyou)$/.test(c)) {
    return [R(IDENT_LINES.whoAreYou)];
  }
  if (/^(?:r아?|r은)?(?:누가(?:널|너를)?만들었(?:어|니|나|어요|냐)|제작자가누구(?:야|니|세요))$/.test(c)) {
    return [R(IDENT_LINES.maker)];
  }
  // 열린 질문의 시작 — 음식 추천 판정(foodReply) 뒤에 둔다. 그래야 인사·비밀 같은 말이 직전 재추천 상태를 지운다.
  if (/^(안녕|안녕하세요|hello|hi|ㅎㅇ|r안녕|r아안녕|안녕r|안녕r아)$/.test(c)) {
    const n = ++SESS.hello;                                                   // 인사 반복 횟수는 기존대로 센다
    const rep = GENERAL.find(r => r.ctr === 'hello')?.rep;
    if (rep?.[n]) return [R(rep[n])];                                         // 3번째·10번째 인사는 특별 대사(문맥 질문은 걸지 않음)
    setContext({ topic: 'day', remaining: 1 });
    return talk('day.start');
  }
  if (/^(비밀|비밀알려줘|secret)$/.test(c)) {
    setContext({ topic: 'secret', remaining: 1 });
    const [secretLine, firstNote] = TALK_LINES['secret.start'] ?? [];
    const out = secretLine ? [R(secretLine)] : [];
    if (!seen('dsk-term-hidden') && firstNote) out.push(R(firstNote));   // 숨겨진 키워드 최초 발견 안내(05 의 secret.start 대사2)
    return out;
  }
  if (/^(생일|생일이언제야|너생일언제야)$/.test(c)) {
    setContext({ topic: 'birthday', remaining: 1 });
    return talk('birthday.start');
  }
  if (HARD_DAY.test(c) && /힘들|지쳤|우울|속상/.test(c)) {
    setContext({ topic: 'hardDay', remaining: 1 });
    return talk('hard.start');
  }
  const comp = COMPOSITE.find(([cond]) => cond(s, c));
  if (comp) return [R(comp[1])];
  const hid = HIDDEN.find(r => hasAny(s, c, r.kw));
  if (hid) {
    const out = [R(hid.say)];
    const hiddenNote = TALK_LINES['secret.start']?.[1];                      // 최초 발견 안내 — 05 의 secret.start 대사2 와 같은 문장
    if (!seen('dsk-term-hidden') && hiddenNote) out.push(R(hiddenNote));
    return out;
  }
  const g = GENERAL.find(r => hasAny(s, c, r.kw));
  if (g) {
    if (g.ctr) { const n = ++SESS[g.ctr]; if (g.rep?.[n]) return [R(g.rep[n])]; }    // 반복 횟수에 도달하면 특별 대사가 먼저
    return [R(g.say)];
  }
  const unk = REP_EXTRA.unknown?.[++SESS.unknown];                          // n 번째 특별 대사는 02b CSV
  if (unk) return [R(unk)];
  let i = Math.floor(Math.random() * WRONG.length);
  if (i === lastWrong) i = (i + 1) % WRONG.length;
  lastWrong = i;
  return [R(WRONG[i])];
}

const CMD_NAMES = ['help', 'about', 'whoami', 'status', 'users', 'clear', 'guide', 'exit'];
// guide: 이 홈페이지에 대한 안내문. 설정(settings/ohome.guide.v1)에 저장하므로 모든 방문자가 같은 글을 보고, 쓰기는 관리자만 된다(보안 규칙).
const GUIDE_KEY = 'ohome.guide.v1';
const GUIDE_MAX = 6000;
const TALK_TTL = 3 * 60 * 1000;                      // R 이 질문한 뒤 이 시간 안에 답해야 이전 질문의 답으로 본다 (음식 재추천도 같은 기준)
const EXIT_HIDE = 10_000, EXIT_BACK = 15_000;         // exit: 대사 뒤 10초 만에 터미널이 사라지고, 그로부터 15초 뒤에 다시 생긴다
const IDLE_MS = 5 * 60 * 1000;                        // 입력 없이 이만큼 지나면 「아직 계십니까?」
const SESS: Record<CountKey, number> = { whoami: 0, clear: 0, hello: 0, love: 0, sorry: 0, unknown: 0 };   // 페이지가 열려 있는 동안 종류별로 센 횟수
const seen = (k: string) => { try { if (localStorage.getItem(k)) return true; localStorage.setItem(k, '1'); } catch { /* 저장 불가 */ } return false; };
const norm = (s: string) => s.trim().toLowerCase().replace(/[?!.,]+$/g, '').replace(/\s+/g, ' ');

const MIN_W = 220, MIN_H = 120;                       // 터미널을 줄일 수 있는 최소 크기
const RZ_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
type TLine = { t: string; k?: 'in' | 'out' | 'r' };   // in: 내가 친 줄 · out: 시스템 출력 · r: R 의 대사
const R = (t: string): TLine => ({ t, k: 'r' });
const S = (t: string): TLine => ({ t, k: 'out' });
const fill = (t: string, v: Record<string, string>) => t.replace(/\{([^{}]+)\}/g, (m, k: string) => (k in v ? v[k] : m));   // {이름} 같은 자리표시자 채우기
const sys = (key: string, v: Record<string, string> = {}, admin = false): TLine[] =>                                       // 08 CSV 의 명령어 출력
  (SYS_LINES[key] ?? []).filter(l => !l.admin || admin).map(l => (l.who === 'R' ? R : S)(fill(l.text, v)));
type Acct = { no: number | null; total: number };

/* ───────── R의 꼬투리 대화 트리 ─────────
   대사 자체가 단서. start는 실제 출력된 R의 말로 활성화되고, node는 다음 질문을 기다린다.
   짧은 질문은 exact, 구체적인 문구만 includes. 이미 답한 질문을 "왜/정말" 로 한 번 더 캐물으면 범위 밖이라고 안내하고 끝낸다.
   세션 문맥은 브라우저의 현재 터미널에만 존재하며 3분 뒤 만료된다. */
type TreeBranch = { words: string[]; to: string; mode?: 'exact' | 'includes' };
type TreeNode = { id: string; text: string; branches?: TreeBranch[]; end?: boolean; clue?: string };
type TreeState = { node: string; at: number; repeats: number; depth: number } | null;
const TREE_MAX_DEPTH = 5;
const TREE_NODES: Record<string, TreeNode> = TREE_NODES_DATA as Record<string, TreeNode>;   // 노드·분기는 06 · 06b CSV
// 실행된 R 대사와 매칭할 시작점. 기존 GENERAL/HIDDEN 및 새 응답과 연결된다.
const TREE_STARTS: { test: (text: string) => boolean; node: string }[] = TREE_STARTS_DATA.map(x => {   // 시작 조건은 06c CSV
  const re = new RegExp(x.pattern);
  return { test: (text: string) => re.test(text), node: x.node };
});
const treeStartFrom = (lines: TLine[]): TreeState => {
  // 최초 발견 안내 같은 덧붙임 줄이 맨 뒤에 올 수 있으므로 R 의 줄을 뒤에서부터 모두 확인한다
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].k !== 'r') continue;
    const t = lines[i].t;
    const start = TREE_STARTS.find(x => x.test(t));
    if (start) return { node: start.node, at: Date.now(), repeats: 0, depth: 0 };
  }
  return null;
};
const treeMatch = (c: string, b: TreeBranch): boolean =>
  b.words.some(w => b.mode === 'includes' ? (w.length >= 2 && c.includes(w) || c === w) : c === w);
function treeStep(raw: string, active: TreeState): { out: TLine[]; next: TreeState; clue?: string } | null {
  if (!active || Date.now() - active.at > TALK_TTL) return null;
  const c = compact(raw);
  if (/^(그만|그만할래|다른얘기|취소|cancel)$/.test(c))
    return { out: talk('cancel'), next: null };
  const current = TREE_NODES[active.node];
  if (!current || current.end) return null;
  const branch = current.branches?.find(b => treeMatch(c, b));
  if (!branch) {
    // 이미 물은 질문을 반복하는 경우만 짧게 재질문 처리한다. 다른 화제는 기존 입력 처리기로 넘긴다.
    if (/^(왜|정말|그래서|그게뭔데)$/.test(c) && active.repeats > 0)
      return { out: talk('treeRepeat'), next: null };
    return null;
  }
  const node = TREE_NODES[branch.to];
  if (!node) return null;
  const depth = active.depth + 1;
  const next: TreeState = node.end || depth >= TREE_MAX_DEPTH ? null : { node: node.id, at: Date.now(), repeats: active.repeats + 1, depth };
  return { out: [R(node.text)], next, clue: node.clue };
}
const isNewTopic = (s: string) => {
  const c = compact(s), t = s.trim().toLowerCase();
  return FOOD_TRIGGER.test(c) || /^(안녕|안녕하세요|hello|hi|ㅎㅇ|점메추|저메추|비밀|생일)$/.test(c)
    || /(?:^|\s)내\s*이름/.test(t)                                                  // 내 이름은… / 내 이름 기억해
    || /(?:^|\s)(?:나를|날)\s+\S+\s*(?:이라고|라고)\s*불러/.test(t)                    // 나를 ○○라고 불러 ('그날 삭제된…' 의 '날' 은 단어 앞에 공백이 없어 제외)
    || /(?:누가만들|제작자|누구야|누구니|누구세요|누구십니까)/.test(c);
};

/** 이름을 알려준 방문자에게는 '방문자님' 을 이름으로 바꾸고, 귀환 인사에도 이름을 붙인다 (R 의 대사 줄에만 적용 · 규칙은 10 CSV 의 「자동 치환」) */
const personalize = (lines: TLine[], name: string | null): TLine[] => {
  if (!name) return lines;
  return lines.map(l => (l.k === 'r'
    ? { ...l, t: NAME_REPLACE.reduce((t, r) => t.split(r.from).join(r.to.split('{이름}').join(name)), l.t) }   // 치환 규칙은 10 CSV
    : l));
};

function Terminal({ user, uid, role, acct, onExit, onGuide }: { user: string; uid: string | null; role: string; acct: Acct; onExit?: () => void; onGuide?: (mode: 'view' | 'edit') => void }) {
  const [lines, setLines] = useState<TLine[]>([]);
  const [typing, setTyping] = useState('');   // 자동 출력 중인 줄
  const [typingR, setTypingR] = useState(false);
  const [buf, setBuf] = useState('');         // 내가 치고 있는 줄
  const talkRef = useRef<TalkContext>(null); // 현재 기다리는 답변 (터미널 인스턴스별)
  const isAdmin = role === 'admin';
  const talkAtRef = useRef(0);                // 그 질문을 한 시각 — TALK_TTL 이 지나면 문맥을 버린다
  const treeRef = useRef<TreeState>(null);    // 꼬투리 질문 대화 트리
  const [, setClues] = useState<string[]>([]);  // 발견한 단서 (저장만 한다)
  const [visitorName, setVisitorName] = useState<string | null>(null);
  // C: 방문자가 알려준 호칭은 계정별로 이 브라우저에만 저장한다.
  // 키는 회원 id(바뀌지 않음)로 정한다 — 가입 번호나 닉네임은 로딩 시점·변경에 따라 달라질 수 있다. 로그인 전에는 이름을 저장하지 않는다.
  const nameKey = uid ? `dsk-r-name:uid-${uid}` : null;
  useEffect(() => {
    if (!nameKey) { setVisitorName(null); return; }
    try { setVisitorName(localStorage.getItem(nameKey)); }
    catch { setVisitorName(null); }
  }, [nameKey]);
  useEffect(() => { foodCtx = null; }, []);        // 터미널이 새로 뜰 때(exit 후 재부팅 포함) 직전 음식 재추천 상태는 비운다
  const rememberName = (name: string | null) => {
    setVisitorName(name);
    if (!nameKey) return;
    try {
      if (name) localStorage.setItem(nameKey, name);
      else localStorage.removeItem(nameKey);
    } catch { /* 브라우저 설정에 따라 저장되지 않을 수 있음 */ }
  };

  const clueKey = uid ? `dsk-r-clues:uid-${uid}` : null;
  useEffect(() => {
    try { setClues(clueKey ? JSON.parse(localStorage.getItem(clueKey) || '[]') : []); }
    catch { setClues([]); }
  }, [clueKey]);
  const discover = (clue: string) => {
    if (!clueKey) return;
    setClues(prev => {
      if (prev.includes(clue)) return prev;
      const next = [...prev, clue];
      try { localStorage.setItem(clueKey, JSON.stringify(next)); } catch { /* 저장 불가 */ }
      return next;
    });
  };

  const [up, setUp] = useState('00:00:00');
  const busyRef = useRef(false);              // 입력창을 잡고 있거나 치는 중이면 자동 로그를 멈춘다
  const focusRef = useRef(false);
  const bufRef = useRef('');
  const stickRef = useRef(true);              // 맨 아래를 보고 있을 때만 새 줄을 따라 내려간다
  const histRef = useRef<string[]>([]);
  const hiRef = useRef(0);
  const idleRef = useRef(0);
  const acctRef = useRef(acct); acctRef.current = acct;      // 회원 목록이 늦게 와도 최신 값을 읽도록
  const exitRef = useRef(onExit); exitRef.current = onExit;
  const bodyRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);

  // ── 위치(제목줄 드래그) · 크기(가장자리/모서리 드래그) — 놓으면 localStorage 에 저장, 창이 작아지면 화면 안으로 되돌린다
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const rz = useRef<{ d: string; sx: number; sy: number; l: number; t: number; w: number; h: number } | null>(null);
  const KEY = 'dsk-term-pos', SKEY = 'dsk-term-size';
  const clamp = (x: number, y: number) => {
    const el = boxRef.current, par = el?.offsetParent as HTMLElement | null;
    if (!el || !par) return { x, y };
    return {
      x: Math.min(Math.max(0, x), Math.max(0, par.clientWidth - el.offsetWidth)),
      y: Math.min(Math.max(0, y), Math.max(0, par.clientHeight - el.offsetHeight)),
    };
  };
  const place = (x: number, y: number) => {
    const el = boxRef.current; if (!el) return;
    const p = clamp(x, y);
    el.style.left = `${p.x}px`; el.style.top = `${p.y}px`;
    return p;
  };
  const save = () => {
    const el = boxRef.current; if (!el) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ x: el.offsetLeft, y: el.offsetTop }));
      localStorage.setItem(SKEY, JSON.stringify({ w: el.offsetWidth, h: el.offsetHeight }));
    } catch { /* 저장 불가 */ }
  };
  useEffect(() => {
    const el = boxRef.current;
    try {
      const sz = localStorage.getItem(SKEY);
      if (sz && el) { const v = JSON.parse(sz); if (typeof v.w === 'number' && typeof v.h === 'number') { el.style.width = `${Math.max(MIN_W, v.w)}px`; el.style.height = `${Math.max(MIN_H, v.h)}px`; } }
      const raw = localStorage.getItem(KEY);
      if (raw) { const v = JSON.parse(raw); if (typeof v.x === 'number' && typeof v.y === 'number') place(v.x, v.y); }
    } catch { /* 저장값 없음/손상 — 기본 위치·크기 */ }
    const fit = () => {
      const e = boxRef.current, par = e?.offsetParent as HTMLElement | null;
      if (!e || !par) return;
      if (e.offsetWidth > par.clientWidth) e.style.width = `${par.clientWidth}px`;
      if (e.offsetHeight > par.clientHeight) e.style.height = `${par.clientHeight}px`;
      place(e.offsetLeft, e.offsetTop);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 제목줄을 잡고 옮기기
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = boxRef.current; if (!el) return;
    drag.current = { dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    e.preventDefault();
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    place(e.clientX - drag.current.dx, e.clientY - drag.current.dy);
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null; setDragging(false);
    try { boxRef.current?.releasePointerCapture(e.pointerId); } catch { /* 이미 해제됨 */ }
    save();
  };

  // 일반 창처럼: 잡은 쪽 가장자리만 움직이고 반대쪽은 그대로 (왼쪽·위쪽은 위치도 같이 바뀜)
  const onRzDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const el = boxRef.current; if (!el) return;
    e.stopPropagation(); e.preventDefault();
    rz.current = { d: e.currentTarget.dataset.d || '', sx: e.clientX, sy: e.clientY, l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onRzMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = rz.current, el = boxRef.current, par = el?.offsetParent as HTMLElement | null;
    if (!s || !el || !par) return;
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
    let { l, t, w, h } = s;
    if (s.d.includes('e')) w = Math.min(Math.max(MIN_W, s.w + dx), par.clientWidth - s.l);
    if (s.d.includes('s')) h = Math.min(Math.max(MIN_H, s.h + dy), par.clientHeight - s.t);
    if (s.d.includes('w')) { const right = s.l + s.w; l = Math.min(Math.max(0, s.l + dx), right - MIN_W); w = right - l; }
    if (s.d.includes('n')) { const bottom = s.t + s.h; t = Math.min(Math.max(0, s.t + dy), bottom - MIN_H); h = bottom - t; }
    el.style.left = `${l}px`; el.style.top = `${t}px`; el.style.width = `${w}px`; el.style.height = `${h}px`;
  };
  const onRzUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!rz.current) return;
    rz.current = null; setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* 이미 해제됨 */ }
    save();
  };

  // ── 타이핑: 정해진 명령어에만 반응
  const pushLines = (add: TLine[]) => setLines(p => [...p, ...add].slice(-200));
  const accountId = () => acctRef.current.no ? `GUEST_${String(acctRef.current.no).padStart(4, '0')}` : 'GUEST_----';
  const armIdle = () => {
    clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => { if (bufRef.current) armIdle(); else pushLines([R(IDLE_LINE)]); }, IDLE_MS);
  };
  useEffect(() => { armIdle(); return () => clearTimeout(idleRef.current); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (raw: string) => {
    const s = norm(raw);
    stickRef.current = true;
    pushLines([{ t: raw, k: 'in' }]);
    if (!s) return;
    histRef.current.push(raw.trim()); hiRef.current = histRef.current.length;
    const a = acctRef.current, id = accountId();
    let out: TLine[] = [];
    // 명시적인 시스템 명령어는 대화 문맥과 분리하고, 앞선 질문을 종료한다.
    if (CMD_NAMES.includes(s) || s === 'guide edit') { talkRef.current = null; treeRef.current = null; }
    if (talkRef.current && Date.now() - talkAtRef.current > TALK_TTL) talkRef.current = null;   // 오래 전 질문의 답으로 보지 않는다
    switch (s) {                                       // ① 시스템 명령어 — 정확히 일치할 때만
      case 'clear': {
        SESS.clear++;
        const cl = REP_EXTRA.clear?.[SESS.clear];                            // n 번째 특별 대사는 02b CSV
        setLines(cl ? [R(cl)] : []);
        return;
      }
      case 'help':
        out = sys('help', {}, isAdmin);
        break;
      case 'about': out = sys('about'); break;
      case 'whoami': {
        const vars = { '계정ID': id, '번호4자리': a.no ? String(a.no).padStart(4, '0') : '----', 'ADMIN 또는 VISITOR': role === 'admin' ? 'ADMIN' : 'VISITOR', '번호': String(a.no ?? '') };
        out = [...sys('whoami', vars), S('')];
        const n = ++SESS.whoami;
        const rep = REP_EXTRA.whoami?.[n];                                   // n 번째 특별 대사는 02b CSV
        out.push(...(rep ? [R(rep.replace(/\{계정ID\}/g, () => id))] : sys(a.no ? 'whoami.reg' : 'whoami.unreg', vars)));
        break;
      }
      case 'users':
        out = sys(a.total ? 'users.ok' : 'users.fail', { '총수': String(a.total) });
        break;
      case 'status': out = sys('status'); break;
      case 'guide': onGuide?.('view'); out = sys('guide'); break;     // 안내문은 이 터미널이 아니라 별도 창에 나온다
      case 'guide edit':
        if (isAdmin) { onGuide?.('edit'); out = sys('guide.edit'); }
        else out = sys('guide.edit.denied');
        break;
      case 'exit':
        out = sys('exit');
        exitRef.current?.();
        break;
      default: {
        // C: 이름 질문/삭제/등록은 문맥 대화와 일반 키워드보다 먼저 처리한다.
        const plain = raw.trim();
        const normalized = compact(plain);
        const nameQuery = /^(?:r아?|r은|r이)?내이름(?:이|은|을)?(?:기억해|기억나|기억하니|뭐야|뭐니|뭐지|뭔지알아|뭔지아니|알아|알아요|알려줘)$/.test(normalized);
        const nameForget = /^(?:(?:r아?|r은))?내이름(?:을)?(?:잊어줘|지워줘|삭제해|기억하지마)$/.test(normalized);
        // 이름 소개는 '내 이름은 ○○' 또는 '나를 ○○(이)라고 불러' 처럼 이름이라고 분명히 말할 때만 받는다 ('난 피곤해' 같은 문장은 이름이 아니다)
        const introduce = plain.match(/^(?:R[아야]?[,\s]*)?내\s*이름은\s+([가-힣A-Za-z0-9_-]{1,20}?)\s*(?:이라고\s*해|라고\s*해|이라고\s*불러|라고\s*불러|입니다|이야|야)?[.!?~\s]*$/i)
          ?? plain.match(/^(?:R[아야]?[,\s]*)?(?:나를|날)\s+([가-힣A-Za-z0-9_-]{1,20}?)\s*(?:이라고|라고)\s*불러(?:줘|줘요|줄래)?[.!?~\s]*$/i);
        const candidate = introduce?.[1] ?? '';
        if (nameQuery) {
          out = [R(fill(NAME_TEXT[visitorName ? 'ask.known' : 'ask.unknown'], { '이름': visitorName ?? '' }))];
          talkRef.current = null; treeRef.current = null;
        } else if (nameForget) {
          rememberName(null);
          out = [R(NAME_TEXT[nameKey ? 'forget' : 'forget.noacct'])];
          talkRef.current = null; treeRef.current = null;
        } else if (introduce && candidate && !/^(누구|뭐|뭐지|뭘까|뭔데|어떻게|몰라|알아)$/.test(candidate)) {
          if (!nameKey) {
            out = [R(NAME_TEXT['intro.noacct'])];   // 저장할 수 없는 이유를 알려준다
          } else {
            rememberName(candidate);
            out = [R(fill(NAME_TEXT.intro, { '이름': candidate }))];
          }
          talkRef.current = null; treeRef.current = null;
        } else {
        // 새 화제는 이어지던 대화(트리·문맥)보다 우선한다. 아니면 트리 → 문맥 → 일반 키워드 순서로 처리.
        const fresh = isNewTopic(s);
        if (fresh) { treeRef.current = null; talkRef.current = null; }
        const treeResult = fresh ? null : treeStep(s, treeRef.current);
        if (treeResult) {
          out = treeResult.out;
          treeRef.current = treeResult.next;
          talkRef.current = null;
          foodCtx = null;
          if (treeResult.clue) discover(treeResult.clue);
        } else {
          treeRef.current = null;
          const followUp = contextReply(s, talkRef.current);
          if (followUp) {
            out = followUp.out;
            foodCtx = null;                              // 문맥 대화 중에는 음식 재추천 상태를 끊는다
            talkRef.current = followUp.next; talkAtRef.current = Date.now();
          } else {
            talkRef.current = null;
            out = reply(s, ctx => { talkRef.current = ctx; talkAtRef.current = Date.now(); });
          }
          // 실제로 출력된 R 대사로 꼬투리 질문의 시작점을 찾는다
          const tree = treeStartFrom(out);
          if (tree) { treeRef.current = tree; talkRef.current = null; }
        }
        }
        break;
      }
    }
    pushLines(personalize(out, visitorName));
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    armIdle();
    if (e.nativeEvent.isComposing) return;            // 한글 조합 중 Enter 오작동 방지
    if (e.key === 'Enter') { e.preventDefault(); exec(buf); setBuf(''); busyRef.current = false; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hiRef.current > 0) { hiRef.current--; setBuf(histRef.current[hiRef.current]); } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (hiRef.current < histRef.current.length) { hiRef.current++; setBuf(histRef.current[hiRef.current] || ''); } }
    else if (e.key === 'Tab') { e.preventDefault(); const m = CMD_NAMES.filter(k => k.startsWith(buf.toLowerCase())); if (buf && m.length === 1) setBuf(m[0]); }
    else if (e.key === 'Escape') inRef.current?.blur();
  };
  useEffect(() => { bufRef.current = buf; busyRef.current = focusRef.current || buf.length > 0; }, [buf]);
  // 위로 스크롤해 둔 동안엔 새 줄이 와도 따라 내려가지 않는다 (직접 치거나 Enter 를 누르면 입력줄로 내려간다)
  useEffect(() => { const b = bodyRef.current; if (b && stickRef.current) b.scrollTop = b.scrollHeight; }, [lines, typing, buf]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = Date.now();
    const fmt = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    };
    const iv = window.setInterval(() => setUp(fmt()), 1000);

    const boot: TLine[] = BOOT_LINES.map(t => ({ t: fill(t, { '사용자': user, '역할': role }) }));   // 부팅 줄은 09 CSV
    // 부팅이 끝난 직후 한 번 — 처음 열었을 때 / 100번째·1000번째 계정 / 10번째 재접속 인사
    const greetings = (): TLine[] => {
      const g: TLine[] = [];
      if (!seen('dsk-term-opened')) g.push(R(GREET_LINES.first));
      const no = acctRef.current.no;
      if (no === 100 && !seen('dsk-term-m100')) g.push(R(GREET_LINES['100']));
      if (no === 1000 && !seen('dsk-term-m1000')) g.push(R(GREET_LINES['1000']));
      try {
        if (!sessionStorage.getItem('dsk-term-visit')) {      // 브라우저를 연 한 번의 방문을 한 번으로 센다
          sessionStorage.setItem('dsk-term-visit', '1');
          const v = (Number(localStorage.getItem('dsk-term-visits')) || 0) + 1;
          localStorage.setItem('dsk-term-visits', String(v));
          if (v === 10) g.push(R(GREET_LINES.visit10));
        }
      } catch { /* 저장 불가 */ }
      return g;
    };
    let alive = true;
    let timer = 0;
    const push = (l: TLine) => setLines(p => [...p, l].slice(-200));
    if (reduce) { [...boot, ...greetings()].forEach(push); return () => { clearInterval(iv); }; }

    // 한 줄씩 타이핑 → 끝나면 줄 확정 → 다음 줄. 부팅이 끝난 뒤엔 우주 문구를 한 줄씩 한 번만 흘려 보낸다 (내가 입력 중이면 잠시 쉼)
    const q = [...boot]; let fi = 0, greeted = false;
    const typeLine = (l: TLine, done: () => void) => {
      let i = 0;
      setTypingR(l.k === 'r');
      const step = () => {
        if (!alive) return;
        if (busyRef.current) { setTyping(''); push(l); done(); return; }   // 내가 입력을 잡으면 남은 글자를 한 번에 확정
        i++; setTyping(l.t.slice(0, i));
        if (i < l.t.length) timer = window.setTimeout(step, 22 + Math.random() * 28);
        else timer = window.setTimeout(() => { setTyping(''); push(l); done(); }, 160);
      };
      step();
    };
    const next = () => {
      if (!alive) return;
      if (busyRef.current) { timer = window.setTimeout(next, 400); return; }   // 입력을 잡고 있는 동안은 새 줄을 올리지 않는다
      if (!q.length && !greeted) { greeted = true; q.push(...greetings()); }
      if (q.length) { const l = q.shift()!; timer = window.setTimeout(() => typeLine(l, next), 260); }
      else if (fi < FLAVOR.length) timer = window.setTimeout(() => {       // 우주 문구는 한 번씩만 — 다 나오면 더 이상 올리지 않는다
        if (busyRef.current) { next(); return; }
        typeLine({ t: FLAVOR[fi++] }, next);
      }, 4500 + Math.random() * 3500);
    };
    timer = window.setTimeout(next, 500);
    return () => { alive = false; clearTimeout(timer); clearInterval(iv); };
  }, [user, role]);

  return (
    <div ref={boxRef} className={`dsk-term${dragging ? ' drag' : ''}`} role="region" aria-label="terminal"
      onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="dsk-term-bar" onPointerDown={onDown}><i /><i /><i /><span>terminal — {user}@home</span></div>
      <div ref={bodyRef} className="dsk-term-body" onClick={() => inRef.current?.focus({ preventScroll: true })}
        onScroll={e => { const b = e.currentTarget; stickRef.current = b.scrollHeight - b.scrollTop - b.clientHeight < 24; }}>
        <div className="dsk-term-log">
          {lines.map((l, i) => l.k === 'out' ? <p key={i} className="out">{l.t}</p>
            : l.k === 'r' ? <p key={i} className="out r"><em>R</em> {l.t}</p>
            : <p key={i}><em>&gt;</em> {l.t}</p>)}
          <p className="cur"><em>{typing && typingR ? 'R' : '>'}</em> {typing || buf}<u /></p>
        </div>
      </div>
      {/* 입력창은 스크롤 영역 밖에 둔다 — 안에 있으면 스크롤해 둔 상태에서 칠 때 브라우저가 입력창 자리로 화면을 끌고 간다 */}
      <input ref={inRef} className="dsk-term-in" value={buf} onKeyDown={onKey}
        onChange={e => { stickRef.current = true; setBuf(e.target.value); armIdle(); }}
        onFocus={() => { focusRef.current = true; busyRef.current = true; }}
        onBlur={() => { focusRef.current = false; busyRef.current = bufRef.current.length > 0; }}
        autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="terminal input" />
      <div className="dsk-term-foot"><span>UPTIME</span><b>{up}</b></div>
      {RZ_DIRS.map(d => <i key={d} className={`dsk-rz ${d}`} data-d={d}
        onPointerDown={onRzDown} onPointerMove={onRzMove} onPointerUp={onRzUp} onPointerCancel={onRzUp} />)}
    </div>
  );
}

/* ───────── guide 창 ─────────
   guide 를 입력하면 터미널과 따로 뜨는 안내 창. 글만 보여 주고 입력은 받지 않으며 × 로 닫는다.
   관리자에게만 「수정」 이 보이고, 그 자리에서 고쳐 저장한다 (저장 위치·권한은 위 GUIDE_KEY 주석 참고). */
function GuideWindow({ admin, mode, req, onClose }: { admin: boolean; mode: 'view' | 'edit'; req: number; onClose: () => void }) {
  const read = () => { const v = getSetting<unknown>(GUIDE_KEY, ''); return typeof v === 'string' ? v : ''; };
  const [text, setText] = useState(read);
  const [draft, setDraft] = useState<string | null>(null);        // 수정 중인 글 (null 이면 보기 모드)
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dirty = draft !== null && draft !== text;

  // 터미널에서 guide edit 를 다시 입력하면 수정 모드로 — 이미 쓰는 중이면 쓰던 글을 그대로 둔다
  useEffect(() => { if (mode === 'edit' && admin) setDraft(d => (d === null ? read() : d)); }, [req]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onSettingChange(k => { if (k === GUIDE_KEY) setText(read()); }), []);               // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { if (dirty && !window.confirm('저장하지 않은 내용이 있습니다. 그래도 닫을까요?')) return; onClose(); };
  const save = () => {
    if (!admin || draft === null) return;
    const t = draft.replace(/\r\n/g, '\n').trimEnd().slice(0, GUIDE_MAX);
    setSetting(GUIDE_KEY, t);                                  // 캐시·로컬 → DB. 서버 저장이 실패하면 SettingSync 가 알려 준다
    setText(t); setDraft(null);
  };

  // 제목줄을 잡고 옮기기 (놓은 위치는 저장하지 않는다)
  const place = (x: number, y: number) => {
    const el = boxRef.current, par = el?.offsetParent as HTMLElement | null;
    if (!el || !par) return;
    el.style.left = `${Math.min(Math.max(0, x), Math.max(0, par.clientWidth - el.offsetWidth))}px`;
    el.style.top = `${Math.min(Math.max(0, y), Math.max(0, par.clientHeight - el.offsetHeight))}px`;
  };
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const el = boxRef.current; if (!el) return;
    drag.current = { dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
    el.setPointerCapture(e.pointerId); setDragging(true); e.preventDefault();
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => { if (drag.current) place(e.clientX - drag.current.dx, e.clientY - drag.current.dy); };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null; setDragging(false);
    try { boxRef.current?.releasePointerCapture(e.pointerId); } catch { /* 이미 해제됨 */ }
  };

  return (
    <div ref={boxRef} className={`dsk-guide${dragging ? ' drag' : ''}`} role="dialog" aria-label="guide"
      onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="dsk-term-bar" onPointerDown={onDown}>
        <span>guide — home</span>
        <button type="button" className="dsk-guide-x" onClick={close} aria-label="닫기">×</button>
      </div>
      {draft === null ? (
        <>
          <div className="dsk-guide-body">
            {text.trim() ? text : <span className="dim">아직 작성된 가이드가 없습니다.{admin ? ' 아래 「수정」 으로 작성할 수 있습니다.' : ''}</span>}
          </div>
          {admin && <div className="dsk-guide-foot"><span /><span className="btns"><button type="button" onClick={() => setDraft(text)}>수정</button></span></div>}
        </>
      ) : (
        <>
          <div className="dsk-guide-edit">
            <textarea autoFocus value={draft} maxLength={GUIDE_MAX} spellCheck={false} aria-label="guide editor"
              placeholder="이 홈페이지에 대한 안내를 적어 주세요. 줄바꿈은 그대로 표시됩니다."
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation();                                           // 바탕화면 단축키로 새지 않게
                if (e.nativeEvent.isComposing) return;                         // 한글 조합 중 오작동 방지
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
                else if (e.key === 'Escape' && !dirty) setDraft(null);         // 바뀐 게 없을 때만 Esc 로 닫는다
              }} />
          </div>
          <div className="dsk-guide-foot">
            <span>{draft.length}/{GUIDE_MAX}</span>
            <span className="btns"><button type="button" onClick={() => setDraft(null)}>취소</button><button type="button" className="ok" onClick={save}>저장</button></span>
          </div>
        </>
      )}
    </div>
  );
}

export function DeskHome({ title, nickname, admin, userId }: {
  title: string; nickname: string | null; admin: boolean; userId: string | null;
}) {
  // 계정 번호 = 회원 가입 순서 (회원 목록에서 내 자리) — 로그인 전이면 번호 없음
  const members = useMembers();
  const idx = userId ? members.findIndex(m => m.id === userId) : -1;
  const acct: Acct = { no: idx >= 0 ? idx + 1 : null, total: members.length };

  // exit → 10초 뒤 터미널이 사라지고, 사라진 지 15초 뒤에 새로 부팅하며 다시 나타난다
  const [showTerm, setShowTerm] = useState(true);
  const [guide, setGuide] = useState<{ mode: 'view' | 'edit'; req: number } | null>(null);   // guide 창 (null 이면 닫힘)
  useEffect(() => { if (!showTerm) setGuide(null); }, [showTerm]);                              // exit 로 터미널이 사라지면 같이 닫는다
  const exiting = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const onExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    timers.current.push(window.setTimeout(() => {
      setShowTerm(false);
      timers.current.push(window.setTimeout(() => { setShowTerm(true); exiting.current = false; }, EXIT_BACK));
    }, EXIT_HIDE));
  };
  return (
    <div className="dsk-home">
      {showTerm && <Terminal user={(nickname || 'guest').toLowerCase()} uid={userId} role={admin ? 'admin' : 'member'} acct={acct} onExit={onExit}
        onGuide={mode => setGuide(g => ({ mode, req: (g?.req ?? 0) + 1 }))} />}
      {showTerm && guide && <GuideWindow admin={admin} mode={guide.mode} req={guide.req} onClose={() => setGuide(null)} />}
      <OrbitClock title={title} />
    </div>
  );
}
