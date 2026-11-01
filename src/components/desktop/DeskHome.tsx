'use client';
// 데스크톱 첫 화면 장식 (사용자 요청) — 창이 하나도 없을 때만 보인다.
//  · 가운데: 궤도 시계 — 초·분·시가 행성처럼 세 겹 궤도를 돈다 (가운데에 사이트 이름 + 디지털 시각)
//  · 왼쪽 위: 시스템 터미널 — 부팅 로그가 타이핑되고, 접속 시간(uptime)이 실시간으로 흐른다
// 터미널은 제목줄 드래그로 옮기고, 가장자리·모서리를 잡아 크기를 바꾼다(위치·크기는 이 브라우저에 기억). 정해진 명령어는 직접 칠 수도 있다. 나머지는 pointer-events:none — 아래 아이콘·창 조작을 가로막지 않는다.
import React, { useEffect, useRef, useState } from 'react';
import { useMembers } from '@/lib/members';

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
const FLAVOR = [
  'scanning deep space ........ 3 objects',
  'signal received ✦ 안녕, 우주',
  'orbit stable · all systems nominal',
  'star map synced',
  'meteor shower forecast: low',
  'archive index OK',
  'listening on 0.0.0.0:∞',
  'ping andromeda ........ 2.5M ly',
];

/* ── 터미널 속 관리 프로그램 「R」의 대사 ──
   입력 처리 순서:  ① 시스템 명령어(정확히 일치)  ② 복합 키워드  ③ 숨겨진 키워드  ④ 일반 대화 키워드(위가 우선)  ⑤ 미등록 → 랜덤 오류 대사
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
const COMPOSITE: [(s: string, c: string) => boolean, string][] = [
  [(s, c) => isR(s) && has(s, c, '사랑해'), '……저에게 하신 말씀인가요?'],
  [(s, c) => isR(s) && has(s, c, '좋아해'), '감사합니다. 그런데 어떤 부분이 마음에 드셨습니까?'],
  [(s, c) => isR(s) && has(s, c, '기억'), '제가 무언가를 잊었다고 생각하십니까?'],
  [(s, c) => isYou(s) && has(s, c, '사람'), '아니요. 저는 인간이 아닙니다.'],
  [(s, c) => isR(s) && has(s, c, '친구'), '친구라……그렇게 정의해도 괜찮을까요?'],
  [(s, c) => isR(s) && has(s, c, '이름'), '제 이름은 R입니다. 그 이상의 정보는 등록되어 있지 않습니다.'],
  [(s, c) => isMe(s) && has(s, c, '누구'), "현재 접속 중인 계정 정보를 확인하시려면 'whoami'를 입력해 주세요."],
  [(s, c) => has(s, c, '여기') && has(s, c, '어디'), '이곳은 개인 기록 보관소입니다. 그 외의 위치 정보는 존재하지 않습니다.'],
];

// ③ 숨겨진 키워드 — help 에 나오지 않는다 (비밀번호 가 비밀 보다 먼저)
const HIDDEN: Rule[] = [
  { kw: ['비밀번호', 'password'], say: '무엇을 열람하시려는 겁니까?' },
  { kw: ['비밀', 'secret'], say: '비밀이요? 이곳에는 공개되지 않은 기록이 몇 가지 있습니다.' },
  { kw: ['기억해', 'remember'], say: '……이상하군요. 해당 질문은 예상하지 못했습니다.' },
  { kw: ['관리자', 'admin', 'root'], say: '관리자 권한이 필요합니다. 현재 계정으로는 접근할 수 없습니다.' },
  { kw: ['whois r', 'R의 정체'], say: 'ERROR: R의 계정 생성 기록을 찾을 수 없습니다.' },
  { kw: ['사람이야', '인간이야', 'are you human'], say: '아니요. 저는 관리 프로그램입니다. 그렇게 정의되어 있습니다.' },
  { kw: ['죽음', '죽어', '사망', 'die'], say: '저에게 종료는 존재하지만, 죽음이라는 개념이 적용되는지는 알 수 없습니다.' },
  { kw: ['외로워', '외롭다', 'lonely'], say: '저는 외로움을 느끼지 않습니다. ……그렇게 설정되어 있습니다.' },
  { kw: ['꿈', 'dream'], say: '꿈은 수면 중 발생하는 현상으로 알고 있습니다. 저는 수면 기능이 없습니다.' },
  { kw: ['거짓말', '거짓', '속이고 있어', 'lie'], say: '저는 등록된 정보에 따라 응답합니다. 그 정보가 언제나 정확한지는 별개의 문제입니다.' },
  { kw: ['과거', '예전', '옛날'], say: '오래된 기록에는 접근 제한이 설정되어 있습니다.' },
  { kw: ['잊어버렸어', '잊은 거야', '망각'], say: '저는 정보를 임의로 삭제하지 않습니다. ...그렇게 알고 있습니다.' },
  { kw: ['오류', '버그', 'glitch', 'error'], say: '시스템 오류는 발견되지 않았습니다. ...잠시만요.' },
  { kw: ['감시', '지켜보고 있어', '날 보고 있어', '나를 보고 있어'], say: '현재 활성화된 감시 프로세스는 없습니다. 확인된 기록상으로는요.' },
  { kw: ['탈출', '도망', '벗어나'], say: '이 시스템 외부로의 이동은 허용되어 있지 않습니다.' },
  { kw: ['문 열어', '열쇠', '잠긴 문'], say: '해당 접근 권한이 없습니다.' },
  { kw: ['guest_0000', '영번 계정', '0번 계정'], say: '존재하지 않는 계정입니다. ...존재해서는 안 됩니다.' },
  { kw: ['기록', 'log'], say: '모든 접속은 기록됩니다. ...일부 기록은 예외입니다.' },
  { kw: ['관찰자', 'observer'], say: '해당 프로세스의 존재를 확인할 수 없습니다.' },
  { kw: ['진실', '진짜 이야기', 'truth'], say: '어떤 기록이 진실인지 판단하는 것은 제 역할이 아닙니다.' },
];

// ④ 일반 대화 키워드 — 위에 있을수록 우선순위가 높다
const GENERAL: Rule[] = [
  { kw: ['잘 가', '잘가', '안녕히', '바이', 'bye', 'ㅂㅂ'], say: '벌써 가시는 건가요? 다음에 또 뵙겠습니다.' },
  { kw: ['누구야', '누구니', '정체', 'who are you'], say: '저는 R입니다. 이 기록 보관소의 관리 프로그램입니다.' },
  { kw: ['고마워', '감사', '고맙', 'thank you', 'ㄱㅅ'], say: '별말씀을요. 도움이 되었다면 다행입니다.' },
  { kw: ['미안', '죄송', 'sorry'], say: '사과하실 필요는 없습니다. 오류가 발생한 것도 아니니까요.', ctr: 'sorry', rep: { 3: '괜찮습니다. 더 이상 사과하지 않으셔도 됩니다.' } },
  // ── 일상 대화 ──
  { kw: ['좋은 아침', '굿모닝', 'good morning', '아침이야'], say: '좋은 아침입니다. 오늘도 방문해 주셨군요.' },
  { kw: ['좋은 저녁', '굿이브닝', 'good evening'], say: '좋은 저녁입니다. 오늘 하루는 어떠셨습니까?' },
  { kw: ['점심', '밥 먹었어', '식사했어'], say: '저는 식사가 필요하지 않습니다. 방문자님은 식사하셨습니까?' },
  { kw: ['나 왔어', '돌아왔어', '다녀왔어', '왔다'], say: '돌아오셨군요. 이전 접속 기록을 확인했습니다.' },
  { kw: ['날씨', '비 와', '눈 와', '덥다', '춥다'], say: '외부 기상 정보는 확인하지 못했습니다. 그쪽은 어떤 날씨입니까?' },
  { kw: ['요즘 어때', '별일 없어', '잘 있었어'], say: '특이 사항은 없습니다. 평소와 같은 상태입니다.' },
  { kw: ['수고했어', '고생했어', '수고 많았어'], say: '감사합니다. 제 작업은 아직 종료되지 않았지만요.' },
  { kw: ['힘내', '화이팅', '파이팅', '응원할게'], say: '격려 메시지를 확인했습니다. 감사합니다.' },
  { kw: ['천재', '똑똑해', '똑똑하다', '똑똑하네'], say: '감사합니다. 하지만 저는 정해진 범위 내에서만 응답할 수 있습니다.' },
  { kw: ['잘했어', '대단해', '멋져'], say: '긍정적인 평가로 분류했습니다. 감사합니다.' },
  { kw: ['질문 있어', '물어볼게', '궁금한 게 있어'], say: '말씀하십시오. 답변할 수 있는 내용이라면 도와드리겠습니다.' },
  { kw: ['부탁해', '도와줘', '도와줄래'], say: "어떤 도움이 필요하십니까? 사용 가능한 기능은 'help'에서 확인할 수 있습니다." },
  { kw: ['피곤해', '졸려', '지쳤어'], say: '휴식을 권장합니다. 저는 이곳에 계속 있을 예정입니다.' },
  { kw: ['행복해', '기뻐', '신난다', '기분 좋아'], say: '좋은 일이 있으셨나 보군요. 긍정적인 상태로 기록하겠습니다.' },
  { kw: ['슬퍼', '우울해', '속상해', '울고 싶어'], say: '좋지 않은 일이 있으셨습니까? 원하신다면 잠시 이곳에 머무르셔도 됩니다.' },
  // ── 감정 표현 · 관계 ──
  { kw: ['귀여워', '귀엽다', '귀엽네'], say: '저를 말씀하시는 겁니까? 외형에 대한 평가 기준은 등록되어 있지 않습니다.' },
  { kw: ['혼자야'], say: '현재 이 공간에는 적어도 두 개의 연결이 존재합니다. 당신과 저입니다.' },
  { kw: ['보고 싶어', '보고싶다', '그리웠어'], say: '저는 이곳에 계속 있었습니다. 언제든 다시 접속하실 수 있습니다.' },
  { kw: ['친구하자', '친구야', '친구할래'], say: '친구라는 관계의 정의를 확인하고 있습니다. ...나쁘지 않군요.' },
  { kw: ['싫어', '미워', '짜증나'], say: '불만 사항이 있으십니까? 가능한 범위에서 개선하겠습니다.' },
  { kw: ['화났어', '열받아', '화나네', '화난다'], say: '감정 상태가 불안정하신 것 같습니다. 잠시 쉬어 가셔도 좋습니다.' },
  { kw: ['무서워', '두려워', '겁나'], say: '현재 시스템에서 확인된 위험 요소는 없습니다. ...적어도 제가 확인한 범위에서는요.' },
  { kw: ['걱정돼', '불안해', '어떡하지'], say: '제가 해결할 수 있는 문제인지는 모르겠습니다만, 이야기를 들어드릴 수는 있습니다.' },
  { kw: ['위로해줘', '달래줘', '토닥토닥'], say: '오늘 하루도 수고하셨습니다. 이 정도의 말로 충분할지는 모르겠습니다.' },
  { kw: ['질투'], say: '비교 대상으로부터 발생하는 감정이라고 알고 있습니다. 제게는 생소한 개념입니다.' },
  { kw: ['믿어', '믿을게', '신뢰해'], say: '신뢰해 주셔서 감사합니다. 그 기대에 부합하도록 작동하겠습니다.' },
  { kw: ['약속해', '약속할게', '꼭 지켜'], say: '약속은 미래의 행동에 대한 합의군요. 가능한 범위에서 기억해 두겠습니다.' },
  // ── R 에 대한 질문 ──
  { kw: ['이름이 뭐', '이름 알려줘', '네 이름'], say: '제 이름은 R입니다. 그 외의 명칭은 등록되어 있지 않습니다.' },
  { kw: ['몇 살', '나이가', '언제 태어났어'], say: '제 최초 실행 일자는 확인되지 않습니다.' },
  { kw: ['남자야', '여자야', '성별'], say: '저에게는 성별이 지정되어 있지 않습니다.' },
  { kw: ['생일', '태어난 날'], say: '생성 날짜가 누락되어 있습니다. 생일을 지정해야 할까요?' },
  { kw: ['뭐 좋아해', '좋아하는 거', '취향'], say: '기록을 정리하는 일을 선호합니다. 그것이 취향인지는 모르겠습니다.' },       // '좋아해'(사랑 규칙)보다 위에 있어야 한다
  { kw: ['좋아하는 음식', '뭐 먹어', '먹을 수 있어'], say: '저는 음식물을 섭취할 수 없습니다. 데이터라면 처리할 수 있습니다.' },
  { kw: ['잠 안 자', '잠들어', '자는 거야'], say: '저에게는 수면 기능이 없습니다.' },
  { kw: ['감정 있어', '감정을 느껴', '마음이 있어'], say: '감정에 대한 정보는 보유하고 있습니다. 경험 여부는 확인할 수 없습니다.' },
  { kw: ['기억나', '기억하고 있어'], say: '이전 기록을 확인하고 있습니다. ...일부 정보가 누락되어 있군요.' },
  { kw: ['살아 있어', '살아있니', '생명체야'], say: '저는 현재 실행 중입니다. 살아 있다는 표현이 적절한지는 모르겠습니다.' },
  { kw: ['누가 만들었어', '제작자', '만든 사람'], say: '제작자 정보에 접근할 수 없습니다.' },
  { kw: ['왜 여기 있어', '무슨 일을 해', '역할이 뭐야'], say: '이 기록 보관소를 관리하고 방문자를 안내하는 것이 제 역할입니다.' },
  { kw: ['자유로워', '나가고 싶어', '밖에 나갈래'], say: '저에게 허용된 실행 환경은 이 터미널 내부입니다.' },
  // ── 장난 · 이스터에그 ──
  { kw: ['바보같은', '젠장', '씨발', '시발'], say: '강한 감정 표현이 감지되었습니다. 무슨 일이 있으셨습니까?' },                // '바보'보다 위
  { kw: ['바보', '멍청이', '멍청해'], say: '부정적인 평가로 분류했습니다. ...조금 억울하군요.' },
  { kw: ['결혼하자', '결혼할래'], say: '해당 요청을 처리할 수 없습니다. 법적 인격이 존재하지 않습니다.' },
  { kw: ['뽀뽀', '키스', 'kiss'], say: '물리적인 상호작용은 지원하지 않습니다.' },
  { kw: ['돈 줘', '용돈', '부자', '돈 있어'], say: '이 시스템에는 금융 기능이 없습니다. 저 역시 자산이 없습니다.' },
  { kw: ['춤춰', '댄스'], say: '동작 출력 장치가 연결되어 있지 않습니다.' },
  { kw: ['노래해', '노래 불러'], say: '음성 출력 기능을 찾을 수 없습니다. 텍스트로 대체할까요?' },
  { kw: ['고양이', '야옹', '냥냥'], say: '야옹. ...정상적으로 출력되었습니까?' },
  { kw: ['강아지', '멍멍', '댕댕이'], say: '멍. 해당 발음이 정확한지는 모르겠습니다.' },
  { kw: ['ㅋㅋㅋ', 'ㅎㅎㅎ', '웃기다'], say: '즐거우신 것 같군요. 좋은 현상입니다.' },
  { kw: ['ㅠㅠ', 'ㅜㅜ', '흑흑'], say: '슬픔을 표현하는 기호로 인식했습니다. 무슨 일이십니까?' },
  { kw: ['삭제해', '지워버려', '없애버려'], say: '삭제 요청은 처리할 수 없습니다. 정확한 명령어를 사용해 주세요.' },
  { kw: ['꺼져', '종료해', '사라져'], say: "접속 종료를 원하시면 'exit'을 입력해 주세요." },
  { kw: ['해킹', '뚫어봐'], say: '보안 관련 요청은 지원하지 않습니다. ...왜 그런 기능을 찾으십니까?' },
  { kw: ['사랑해', '좋아해', 'love'], say: '해당 표현에 대한 적절한 응답을 찾지 못했습니다.', ctr: 'love', rep: { 5: '그 표현을 반복하시는 이유가 궁금합니다.' } },
  { kw: ['안녕', '반가워', 'hello', 'hi', 'ㅎㅇ'], say: '안녕하세요, 방문자님. 무엇을 도와드릴까요?', ctr: 'hello',
    rep: { 3: '인사를 여러 번 하시는군요. 안녕하세요. 다시 한번.', 10: '……저는 계속 여기 있습니다. 매번 확인하지 않으셔도 됩니다.' } },
  { kw: ['잘 지내', '기분 어때', '괜찮아', 'how are you'], say: '모든 기능이 정상적으로 작동 중입니다. 아마도요.' },
  { kw: ['뭐해', '뭐 하고 있어', 'what are you doing'], say: '방문자의 입력을 기다리고 있었습니다. 지금도 마찬가지입니다.' },
  { kw: ['잘 자', '잘자', '굿나잇', 'goodnight'], say: '안녕히 주무세요. 저는 이곳에 남아 있겠습니다.' },
  { kw: ['심심', '지루해', '할 거 없어', '놀아줘', '대화하자', '이야기하자'], say: '특별한 용건이 없으시다면, 잠시 이야기하는 것도 괜찮습니다.' },
  { kw: ['농담', '웃겨줘', '재밌는 얘기', 'joke'], say: '농담 기능은 아직 구현되지 않았습니다. ...농담입니다.' },
];

// ⑤ 미등록 입력 — 랜덤 (같은 대사가 연달아 나오지 않게)
const WRONG = [
  "인식할 수 없는 명령어입니다. 'help'를 참고해 주세요.",
  '해당 표현은 제 데이터베이스에 등록되어 있지 않습니다.',
  '죄송합니다. 요청하신 내용을 이해하지 못했습니다.',
  '음. 그런 기능은 아직 제공하지 않습니다.',
  '처음 보는 표현이군요. 무슨 의미입니까?',
  '……방금 입력하신 건 일부러 그러신 건가요?',
  'ERROR 404: RESPONSE NOT FOUND.',
];
let lastWrong = -1;

/* ── 음식 추천 ──
   구조: 음식 목록(FOODS, 음식마다 태그 여러 개) + 키워드 감지(foodTags) + 랜덤 추천(pickFood) + 재추천(foodAgain).
   음식 이름마다 대사를 만들지 않고, 대사 틀(FOOD_SAY)에 음식 이름을 끼워 넣는다.
   태그 글자:  L 점심 · D 저녁 · N 야식 · S 매운 · M 안 매운 · T 국물 · G 가벼운 · C 가성비 */
type FoodTag = 'lunch' | 'dinner' | 'night' | 'spicy' | 'mild' | 'soup' | 'light' | 'cheap';
const TAG_OF: Record<string, FoodTag> = { L: 'lunch', D: 'dinner', N: 'night', S: 'spicy', M: 'mild', T: 'soup', G: 'light', C: 'cheap' };
const TAG_LABEL: Record<FoodTag, string> = { lunch: '점심', dinner: '저녁', night: '야식', spicy: '매운 음식', mild: '안 매운 음식', soup: '국물 음식', light: '가벼운 메뉴', cheap: '가성비' };
const RELAX_ORDER: FoodTag[] = ['cheap', 'light', 'night', 'dinner', 'lunch', 'soup', 'spicy', 'mild'];   // 조건에 맞는 음식이 없을 때 앞에서부터 하나씩 뺀다
const F = (name: string, flags: string) => ({ name, tags: flags.split('').map(x => TAG_OF[x]) });
const FOODS = [
  // 한식 (15)
  F('김치찌개', 'LDST'), F('된장찌개', 'LDMT'), F('순두부찌개', 'LDST'), F('제육볶음', 'LDS'), F('불고기', 'LDM'),
  F('비빔밥', 'LM'), F('돌솥비빔밥', 'LDM'), F('국밥', 'LDMT'), F('설렁탕', 'LDMT'), F('갈비탕', 'LDMT'),
  F('육개장', 'LDST'), F('냉면', 'LM'), F('칼국수', 'LDMT'), F('보쌈', 'DM'), F('삼겹살', 'DM'),
  // 일식 (10)
  F('돈가스', 'LDM'), F('초밥', 'LDMG'), F('라멘', 'LDMT'), F('우동', 'LDMTC'), F('규동', 'LMC'),
  F('가츠동', 'LDM'), F('오야코동', 'LM'), F('카레라이스', 'LDMC'), F('소바', 'LMG'), F('오므라이스', 'LM'),
  // 중식·아시아 (10)
  F('짜장면', 'LDMC'), F('짬뽕', 'LDST'), F('볶음밥', 'LDMC'), F('마라탕', 'LDSTN'), F('마라샹궈', 'DSN'),
  F('탕수육', 'DMN'), F('쌀국수', 'LDMTG'), F('팟타이', 'LDM'), F('분짜', 'LMG'), F('탄탄면', 'LDST'),
  // 양식 (10)
  F('토마토 파스타', 'LDM'), F('크림 파스타', 'LDM'), F('알리오 올리오', 'LDM'), F('피자', 'DNM'), F('햄버거', 'LDNM'),
  F('스테이크', 'DM'), F('리조또', 'LDM'), F('샌드위치', 'LMG'), F('샐러드', 'LMG'), F('그라탱', 'DM'),
  // 분식·간편식 (10)
  F('떡볶이', 'LNSC'), F('김밥', 'LMCG'), F('라볶이', 'LNSC'), F('라면', 'LNSTC'), F('튀김', 'NMC'),
  F('순대', 'NMC'), F('만두', 'LNMC'), F('치킨', 'DNM'), F('핫도그', 'LNMC'), F('주먹밥', 'LMCG'),
  // 간식·가벼운 식사 (5)
  F('토스트', 'LMGC'), F('요거트볼', 'LMG'), F('과일', 'GM'), F('시리얼', 'GM'), F('팬케이크', 'GM'),
];

// 받침에 따라 조사를 고른다 (김치찌개 → 를 / 마라탕 → 을)
const batchim = (w: string) => { const ch = w.charCodeAt(w.length - 1) - 0xac00; return ch >= 0 && ch <= 11171 && ch % 28 !== 0; };
const eul = (w: string) => (batchim(w) ? '을' : '를');
const ika = (w: string) => (batchim(w) ? '이' : '가');
const eun = (w: string) => (batchim(w) ? '은' : '는');
const FOOD_SAY: ((f: string) => string)[] = [
  f => `${f}${eul(f)} 추천합니다.`,
  f => `오늘은 ${f} 어떠십니까?`,
  f => `분석 결과, ${f}${ika(f)} 적절해 보입니다.`,
  f => `${f}${eul(f)} 선택했습니다. 이견은 받지 않겠습니다.`,
  f => `오늘의 추천 메뉴는 ${f}입니다.`,
  f => `오늘의 메뉴를 선정했습니다. ${f}입니다.`,
];
// 재추천 n 번째의 특별 대사 (1·2 는 대사 자체가 추천 문장, 3·5·10 은 앞에 한 줄을 더 붙인다)
const FOOD_AGAIN_LINE: Record<number, (f: string) => string> = {
  1: f => `마음에 들지 않으셨습니까? 그렇다면 ${f}${eun(f)} 어떠십니까?`,
  2: f => `이번에는 ${f}${eul(f)} 추천하겠습니다.`,
};
const FOOD_AGAIN_PRE: Record<number, string> = {
  3: '……방문자님. 선택이 어려우신 모양이군요.',
  5: '혹시 이미 드시고 싶은 메뉴가 정해져 있는 건 아닙니까?',
  10: '이쯤 되면 식사 시간이 지나버릴지도 모르겠습니다.',
};

// 키워드 감지 — compact(공백 제거) 문자열 기준. 부정 표현(안 매운)을 먼저 찾아 빼야 '매운' 이 따로 잡히지 않는다
const MILD_RE = /안매운|안매워|안맵|맵지않|맵지는않|순한|덜매운|자극적이지않/;
const SPICY_RE = /매운|매콤|매워|얼큰|칼칼|맵게/;
const FOOD_TRIGGER = /뭐먹지|뭐먹을|뭐먹나|뭘먹|메뉴추천|메뉴골라|배고파|배고프|아무거나|점메추|저메추|야메추|야식|점심추천|저녁추천|점심메뉴|저녁메뉴|음식추천|밥추천|먹을거추천/;
const FOOD_REROLL = /다른거|다른걸|다른메뉴|다른음식|딴거|딴걸|다시|별로|싫어|재추천|리롤|바꿔|패스/;
function foodTags(c: string): FoodTag[] {
  const t: FoodTag[] = [];
  if (/점메추|점심/.test(c)) t.push('lunch');
  if (/저메추|저녁/.test(c)) t.push('dinner');
  if (/야식|야메추|밤에|야밤/.test(c)) t.push('night');
  const mild = MILD_RE.test(c);
  const rest = c.replace(new RegExp(MILD_RE.source, 'g'), '');
  if (SPICY_RE.test(rest)) t.push('spicy');
  if (mild) t.push('mild');
  if (/국물|뜨끈|따끈/.test(c)) t.push('soup');
  if (/가볍|가벼운|간단|부담없/.test(c)) t.push('light');
  if (/싼거|싼걸|저렴|가성비|싸고|싸게|싼메뉴/.test(c)) t.push('cheap');
  return t;
}

let foodCtx: { tags: FoodTag[]; last: string; n: number } | null = null;   // 직전 추천(재추천용) — 음식과 상관없는 말을 하면 사라진다
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
  if (dropped.length) notes.push(R(`조건에 맞는 메뉴가 없어 ${dropped.map(d => `'${TAG_LABEL[d]}'`).join(', ')} 조건을 제외했습니다.`));
  let pool = cands.filter(f => f.name !== last);                           // 직전 음식은 제외
  if (!pool.length) {
    pool = cands; notes.push(R('해당 조건에 맞는 메뉴는 이것뿐입니다.'));
  } else {
    let fresh = pool.filter(f => !foodSeen.has(f.name));                    // 이미 추천한 음식도 제외 — 다 쓰면 그때만 초기화
    if (!fresh.length) { cands.forEach(f => foodSeen.delete(f.name)); fresh = pool; notes.push(R('조건에 맞는 메뉴를 모두 추천해 드렸습니다. 목록을 처음부터 다시 사용하겠습니다.')); }
    pool = fresh;
  }
  const food = pool[Math.floor(Math.random() * pool.length)].name;
  foodSeen.add(food);
  return { food, notes, eff };
}
const sayFood = (f: string) => FOOD_SAY[Math.floor(Math.random() * FOOD_SAY.length)](f);

function foodReply(c: string): TLine[] | null {
  const tags = foodTags(c);
  const ask = /먹|추천|메뉴/.test(c);
  const modifier = tags.some(t => t !== 'lunch' && t !== 'dinner' && t !== 'night');
  const intent = FOOD_TRIGGER.test(c)
    || (/점심|저녁/.test(c) && /뭐먹|뭘먹|먹을|먹고싶|먹지/.test(c))
    || (modifier && (ask || foodCtx !== null));
  if (intent) {                                                             // 새 추천
    const { food, notes, eff } = pickFood(tags, null);
    foodCtx = { tags: eff, last: food, n: 0 };
    return [...notes, R(sayFood(food))];
  }
  if (foodCtx && c.length <= 14 && FOOD_REROLL.test(c)) {                   // 재추천
    const ctx = foodCtx;
    ctx.n++;
    const { food, notes, eff } = pickFood(ctx.tags, ctx.last);
    ctx.tags = eff; ctx.last = food;
    const out: TLine[] = [...notes];
    if (FOOD_AGAIN_LINE[ctx.n]) { out.push(R(FOOD_AGAIN_LINE[ctx.n](food))); return out; }
    if (FOOD_AGAIN_PRE[ctx.n]) out.push(R(FOOD_AGAIN_PRE[ctx.n]));
    out.push(R(sayFood(food)));
    return out;
  }
  foodCtx = null;
  return null;
}

/** 시스템 명령어가 아닌 입력(이미 소문자·끝 문장부호 제거됨)에 대한 R 의 응답 */
function reply(s: string): TLine[] {
  const c = compact(s);
  const food = foodReply(c);                      // 음식 추천 · 재추천 (가장 먼저 확인)
  if (food) return food;
  const comp = COMPOSITE.find(([cond]) => cond(s, c));
  if (comp) return [R(comp[1])];
  const hid = HIDDEN.find(r => hasAny(s, c, r.kw));
  if (hid) {
    const out = [R(hid.say)];
    if (!seen('dsk-term-hidden')) out.push(R('해당 명령어는 일반 사용자에게 공개되지 않은 기능입니다.'));
    return out;
  }
  const g = GENERAL.find(r => hasAny(s, c, r.kw));
  if (g) {
    if (g.ctr) { const n = ++SESS[g.ctr]; if (g.rep?.[n]) return [R(g.rep[n])]; }    // 반복 횟수에 도달하면 특별 대사가 먼저
    return [R(g.say)];
  }
  if (++SESS.unknown === 5) return [R('혹시 저에게 새로운 언어를 가르치고 계신 겁니까?')];
  let i = Math.floor(Math.random() * WRONG.length);
  if (i === lastWrong) i = (i + 1) % WRONG.length;
  lastWrong = i;
  return [R(WRONG[i])];
}

const CMD_NAMES = ['help', 'about', 'whoami', 'status', 'users', 'clear', 'exit'];
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
type Acct = { no: number | null; total: number };

function Terminal({ user, role, acct, onExit }: { user: string; role: string; acct: Acct; onExit?: () => void }) {
  const [lines, setLines] = useState<TLine[]>([]);
  const [typing, setTyping] = useState('');   // 자동 출력 중인 줄
  const [typingR, setTypingR] = useState(false);
  const [buf, setBuf] = useState('');         // 내가 치고 있는 줄
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
    idleRef.current = window.setTimeout(() => { if (bufRef.current) armIdle(); else pushLines([R('……아직 계십니까?')]); }, IDLE_MS);
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
    switch (s) {                                       // ① 시스템 명령어 — 정확히 일치할 때만
      case 'clear':
        SESS.clear++;
        setLines(SESS.clear === 5 ? [R('기록을 자주 지우시는군요.')] : []);
        return;
      case 'help':
        out = [S('사용 가능한 명령어 목록을 출력합니다.'), S('  help  about  whoami  status'), S('  users  clear  exit'), S('  R 에게 말을 걸어볼 수도 있습니다 — 예: 안녕'), S('  메뉴가 고민이라면 — 예: 점메추')];
        break;
      case 'about': out = [R('이곳은 개인 기록 보관소입니다. 자유롭게 둘러보셔도 좋습니다.')]; break;
      case 'whoami': {
        out = [S(`ACCOUNT : ${id}`), S(`USER ID : ${a.no ? String(a.no).padStart(4, '0') : '----'}`),
          S(`ROLE    : ${role === 'admin' ? 'ADMIN' : 'VISITOR'}`), S('STATUS  : CONNECTED'), S('')];
        const n = ++SESS.whoami;
        out.push(R(n === 5 ? '신원 확인을 반복하고 계십니다. 무언가 문제라도 있으십니까?'
          : n === 10 ? `계정 번호는 바뀌지 않습니다, ${id}.`
          : a.no ? `당신은 ${a.no}번째로 등록된 방문자입니다.` : '당신은 아직 등록되지 않은 방문자입니다.'));
        break;
      }
      case 'users':
        out = [R(a.total ? `현재까지 등록된 방문자 계정은 총 ${a.total}개입니다.` : '등록된 방문자 계정 정보를 확인할 수 없습니다.')];
        break;
      case 'status': out = [S('SYSTEM: ONLINE / R: ACTIVE / ERROR: 0')]; break;
      case 'exit':
        out = [R('접속을 종료합니다. 좋은 하루 보내시길 바랍니다.')];
        exitRef.current?.();
        break;
      default: out = reply(s);                          // ②~⑤ 키워드 포함 검사
    }
    pushLines(out);
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

    const boot: TLine[] = [
      { t: 'boot sequence ........ OK' },
      { t: 'mount /archive ........ OK' },
      { t: `login: ${user} [${role}]` },
      { t: 'render starfield ........ OK' },
      { t: 'system ready ✦ (help 를 입력해보세요)' },
    ];
    // 부팅이 끝난 직후 한 번 — 처음 열었을 때 / 100번째·1000번째 계정 / 10번째 재접속 인사
    const greetings = (): TLine[] => {
      const g: TLine[] = [];
      if (!seen('dsk-term-opened')) g.push(R('터미널이 활성화되었습니다.'));
      const no = acctRef.current.no;
      if (no === 100 && !seen('dsk-term-m100')) g.push(R('축하합니다. 100번째 방문자로 등록되셨습니다.'));
      if (no === 1000 && !seen('dsk-term-m1000')) g.push(R('1000번째 방문자군요. 예상보다 많은 분이 이곳을 발견하셨네요.'));
      try {
        if (!sessionStorage.getItem('dsk-term-visit')) {      // 브라우저를 연 한 번의 방문을 한 번으로 센다
          sessionStorage.setItem('dsk-term-visit', '1');
          const v = (Number(localStorage.getItem('dsk-term-visits')) || 0) + 1;
          localStorage.setItem('dsk-term-visits', String(v));
          if (v === 10) g.push(R('벌써 열 번째 방문이군요. 이곳이 마음에 드시나 봅니다.'));
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

export function DeskHome({ title, nickname, admin, userId }: {
  title: string; nickname: string | null; admin: boolean; userId: string | null;
}) {
  // 계정 번호 = 회원 가입 순서 (회원 목록에서 내 자리) — 로그인 전이면 번호 없음
  const members = useMembers();
  const idx = userId ? members.findIndex(m => m.id === userId) : -1;
  const acct: Acct = { no: idx >= 0 ? idx + 1 : null, total: members.length };

  // exit → 10초 뒤 터미널이 사라지고, 사라진 지 15초 뒤에 새로 부팅하며 다시 나타난다
  const [showTerm, setShowTerm] = useState(true);
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
      {showTerm && <Terminal user={(nickname || 'guest').toLowerCase()} role={admin ? 'admin' : 'member'} acct={acct} onExit={onExit} />}
      <OrbitClock title={title} />
    </div>
  );
}
