// R 대사 CSV → 코드 변환 —  node scripts/build-r-dialogue.mjs
//
// data/r-dialogue/*.csv 를 읽어 src/components/desktop/rDialogueData.generated.ts 를 만든다.
// npm run dev / npm run build 때 자동으로 실행되므로, CSV 만 고쳐서 GitHub 에 올리면 Vercel 이 알아서 반영한다.
// 검사에 걸리면 어느 파일 몇 번째 줄이 문제인지 알려 주고 멈춘다(배포가 실패해도 기존 사이트는 그대로 유지된다).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIR = join(ROOT, 'data', 'r-dialogue');
const OUT = join(ROOT, 'src', 'components', 'desktop', 'rDialogueData.generated.ts');

// DeskHome.tsx 의 COUNT_KEYS 와 같아야 한다 (반복 카운터 이름으로 쓸 수 있는 값)
const COUNT_KEYS = ['whoami', 'clear', 'hello', 'love', 'sorry', 'unknown'];
const FOOD_TAGS = [['점심', 'lunch'], ['저녁', 'dinner'], ['야식', 'night'], ['매운', 'spicy'], ['안 매운', 'mild'], ['국물', 'soup'], ['가벼운', 'light'], ['가성비', 'cheap']];

/* ───────── CSV 읽기 ───────── */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function load(name, needCols, errors, raw = []) {   // raw: 앞뒤 공백을 지우지 않는 열 (help 의 들여쓰기 등)
  const path = join(DIR, name);
  if (!existsSync(path)) { errors.push(`${name}: 파일이 없습니다 (data/r-dialogue 폴더에 있어야 합니다)`); return []; }
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)); }
  catch { errors.push(`${name}: UTF-8 이 아닌 인코딩으로 저장된 것 같습니다. 엑셀에서 「CSV UTF-8(쉼표로 분리)」로 다시 저장해 주세요`); return []; }
  text = text.replace(/^\uFEFF/, '');
  const table = parseCsv(text);
  const head = (table[0] ?? []).map(h => h.trim());
  const idx = {}; const missing = [];
  for (const c of needCols) { const k = head.indexOf(c); if (k < 0) missing.push(c); else idx[c] = k; }
  if (missing.length) { errors.push(`${name}: 첫 줄(제목)에 필요한 열이 없습니다 → ${missing.join(', ')}  (현재 열: ${head.join(', ')})`); return []; }
  const out = [];
  table.slice(1).forEach((r, i) => {
    if (r.every(c => c.trim() === '')) return;               // 빈 줄은 건너뜀
    const o = { _line: i + 2 };
    for (const c of needCols) o[c] = raw.includes(c) ? (r[idx[c]] ?? '') : (r[idx[c]] ?? '').trim();
    out.push(o);
  });
  return out;
}

const splitKw = s => s.split('|').map(x => x.trim()).filter(Boolean)
  .map(k => (/^[A-Za-z][A-Za-z ]*$/.test(k) ? k.toLowerCase() : k));   // 영어 낱말은 소문자로(입력이 소문자로 바뀌어 비교되므로)
const isRegex = p => { try { new RegExp(p); return true; } catch { return false; } };
// 「/패턴/플래그」 형태의 셀을 읽는다 (g·y 플래그는 .test() 가 이전 위치를 기억해 오작동하므로 막는다)
const parseRegex = s => {
  const m = /^\/(.+)\/([a-z]*)$/s.exec(s);
  if (!m || /[gy]/.test(m[2])) return null;
  try { new RegExp(m[1], m[2]); } catch { return null; }
  return { source: m[1], flags: m[2] };
};
const isTruthy = v => v !== '' && !['x', 'X', '0', '-', 'n', 'N'].includes(v);

/* ───────── 변환 ───────── */
export function buildData() {
  const errors = [], warns = [];
  const at = (f, o, msg) => errors.push(`${f} ${o._line}번째 줄: ${msg}`);

  // 01 숨겨진 키워드
  const f01 = '01_숨겨진키워드.csv';
  const HIDDEN = load(f01, ['키워드(|로 구분)', 'R의 대사'], errors).flatMap(o => {
    const kw = splitKw(o['키워드(|로 구분)']);
    if (!kw.length || !o['R의 대사']) { at(f01, o, '키워드와 대사가 모두 있어야 합니다'); return []; }
    return [{ kw, say: o['R의 대사'] }];
  });

  // 02b 반복 횟수 특별 대사
  const f02b = '02b_반복횟수특별대사.csv';
  const repBy = {};
  for (const o of load(f02b, ['카운터 이름', '몇 번째', 'R의 대사'], errors)) {
    const ctr = o['카운터 이름'], n = Number(o['몇 번째']);
    if (!COUNT_KEYS.includes(ctr)) { at(f02b, o, `카운터 이름은 ${COUNT_KEYS.join(' / ')} 중 하나여야 합니다 (입력: ${ctr})`); continue; }
    if (!Number.isInteger(n) || n < 1) { at(f02b, o, `「몇 번째」는 1 이상의 정수여야 합니다 (입력: ${o['몇 번째']})`); continue; }
    if (!o['R의 대사']) { at(f02b, o, '대사가 비어 있습니다'); continue; }
    (repBy[ctr] ??= {})[n] = o['R의 대사'];
  }

  // 02 일반 대화 키워드
  const f02 = '02_일반대화키워드.csv';
  const GENERAL = load(f02, ['키워드(|로 구분)', 'R의 대사', '반복 카운터 이름'], errors).flatMap(o => {
    const kw = splitKw(o['키워드(|로 구분)']), ctr = o['반복 카운터 이름'];
    if (!kw.length || !o['R의 대사']) { at(f02, o, '키워드와 대사가 모두 있어야 합니다'); return []; }
    if (ctr && !COUNT_KEYS.includes(ctr)) { at(f02, o, `반복 카운터 이름은 비우거나 ${COUNT_KEYS.join(' / ')} 중 하나여야 합니다 (입력: ${ctr})`); return []; }
    const r = { kw, say: o['R의 대사'] };
    if (ctr) { r.ctr = ctr; if (repBy[ctr]) r.rep = repBy[ctr]; }
    return [r];
  });
  const usedCtr = new Set(GENERAL.map(r => r.ctr).filter(Boolean));
  const REP_EXTRA = Object.fromEntries(Object.entries(repBy).filter(([k]) => !usedCtr.has(k)));   // 키워드와 무관한 카운터(whoami·clear·unknown)

  // 03 복합 키워드 (호칭 + 키워드). 「문장 전체 일치」 줄은 코드에 고정이라 읽지 않는다
  const f03 = '03_복합키워드_정확일치.csv';
  const allSays = [];
  const COMPOSITE = [];
  const IDENT = {};                                              // 「문장 전체 일치」 줄의 대사 (조건은 코드에 고정)
  for (const o of load(f03, ['종류', '호칭 조건', '키워드', 'R의 대사', '코드 키'], errors)) {
    allSays.push(o['R의 대사']);
    if (o['종류'] !== '복합조건') {
      const k = o['코드 키'];
      if (k === 'whoAreYou' || k === 'maker') { if (!o['R의 대사']) at(f03, o, '대사가 비어 있습니다'); else IDENT[k] = o['R의 대사']; }
      else warns.push(`${f03} ${o._line}번째 줄: 「코드 키」가 whoAreYou / maker 가 아니라 사이트에 반영되지 않습니다`);
      continue;
    }
    const h = o['호칭 조건'];
    const subject = h.startsWith('R') ? 'R' : h.startsWith('너') ? '너' : h.startsWith('나') ? '나' : (h === '' || h === '-' || h.startsWith('호칭 없음')) ? '' : null;
    const kw = o['키워드'].split('+').map(x => x.trim()).filter(Boolean).map(k => (/^[A-Za-z][A-Za-z ]*$/.test(k) ? k.toLowerCase() : k));
    if (subject === null) { at(f03, o, `호칭 조건은 「R 호칭」 「너(당신) 호칭」 「나 호칭」 「호칭 없음」 중 하나여야 합니다 (입력: ${h})`); continue; }
    if (!kw.length || !o['R의 대사']) { at(f03, o, '키워드와 대사가 모두 있어야 합니다 (키워드를 여러 개 모두 요구하려면 +로 연결)'); continue; }
    COMPOSITE.push({ subject, kw, say: o['R의 대사'] });
  }

  if (!errors.some(e => e.startsWith(f03))) for (const k of ['whoAreYou', 'maker']) if (!IDENT[k]) errors.push(`${f03}: 코드 키 「${k}」 줄(문장 전체 일치)이 없습니다 (코드가 쓰는 줄이라 지우면 안 됩니다)`);

  // 04 미등록 입력
  const f04 = '04_미등록입력_랜덤대사.csv';
  const WRONG = load(f04, ['R의 대사'], errors).map(o => o['R의 대사']).filter(Boolean);
  if (!WRONG.length && !errors.some(e => e.startsWith(f04))) errors.push(`${f04}: 대사가 한 줄도 없습니다 (최소 1개 필요)`);

  // 06 꼬투리 트리
  const f06 = '06_꼬투리트리_노드.csv', f06b = '06b_꼬투리트리_분기.csv', f06c = '06c_꼬투리트리_시작조건.csv';
  const TREE_NODES = {};
  for (const o of load(f06, ['노드ID', 'R의 대사', '마지막 노드(O)', '단서(clue) 저장'], errors)) {
    const id = o['노드ID'];
    if (!id || !o['R의 대사']) { at(f06, o, '노드ID와 대사가 모두 있어야 합니다'); continue; }
    if (TREE_NODES[id]) { at(f06, o, `노드ID 「${id}」가 중복되었습니다`); continue; }
    const n = { id, text: o['R의 대사'] };
    if (isTruthy(o['마지막 노드(O)'])) n.end = true;
    if (o['단서(clue) 저장']) n.clue = o['단서(clue) 저장'];
    TREE_NODES[id] = n; allSays.push(n.text);
  }
  for (const o of load(f06b, ['출발 노드ID', '방문자 입력 단어(|로 구분)', '이동할 노드ID', '일치 방식'], errors)) {
    const from = o['출발 노드ID'], to = o['이동할 노드ID'], words = splitKw(o['방문자 입력 단어(|로 구분)']);
    const mode = o['일치 방식'];
    if (!TREE_NODES[from]) { at(f06b, o, `출발 노드ID 「${from}」가 06 파일에 없습니다`); continue; }
    if (!TREE_NODES[to]) { at(f06b, o, `이동할 노드ID 「${to}」가 06 파일에 없습니다`); continue; }
    if (!words.length) { at(f06b, o, '입력 단어가 비어 있습니다'); continue; }
    if (mode !== '' && mode !== '정확히 일치' && mode !== '포함') { at(f06b, o, `일치 방식은 「정확히 일치」 또는 「포함」이어야 합니다 (입력: ${mode})`); continue; }
    const b = { words, to };
    if (mode === '포함') b.mode = 'includes';
    (TREE_NODES[from].branches ??= []).push(b);
  }
  const TREE_STARTS = [];
  for (const o of load(f06c, ['R 대사에 이 패턴이 나오면(정규식)', '시작 노드ID'], errors)) {
    const pattern = o['R 대사에 이 패턴이 나오면(정규식)'], node = o['시작 노드ID'];
    if (!isRegex(pattern)) { at(f06c, o, `정규식이 올바르지 않습니다: ${pattern}`); continue; }
    if (!TREE_NODES[node]) { at(f06c, o, `시작 노드ID 「${node}」가 06 파일에 없습니다`); continue; }
    TREE_STARTS.push({ pattern, node });
  }

  // 07 음식 목록
  const f07 = '07_음식추천_목록.csv';
  const FOODS = [], seenFood = new Set();
  for (const o of load(f07, ['음식 이름', ...FOOD_TAGS.map(t => t[0])], errors)) {
    const name = o['음식 이름'];
    if (!name) { at(f07, o, '음식 이름이 비어 있습니다'); continue; }
    if (seenFood.has(name)) warns.push(`${f07} ${o._line}번째 줄: 「${name}」이(가) 두 번 들어 있습니다`);
    seenFood.add(name);
    FOODS.push({ name, tags: FOOD_TAGS.filter(([k]) => isTruthy(o[k])).map(([, v]) => v) });
  }
  if (!FOODS.length && !errors.some(e => e.startsWith(f07))) errors.push(`${f07}: 음식이 한 줄도 없습니다`);

  // 07b 음식 대사 틀
  const f07b = '07b_음식추천_대사틀.csv';
  const FOOD_TEXT = { say: [], againLine: {}, againPre: {}, notes: {} };
  const NOTE_KEY = { '조건 제외': 'relax', '후보 1개': 'only', '목록 초기화': 'reset' };
  for (const o of load(f07b, ['종류', '번호/횟수/이름', 'R의 대사'], errors)) {
    const kind = o['종류'], key = o['번호/횟수/이름'], say = o['R의 대사'];
    if (!say) { at(f07b, o, '대사가 비어 있습니다'); continue; }
    for (const m of say.match(/\{[^}]*\}/g) ?? []) {
      if (!['{음식}', '{을}', '{이}', '{은}', '{제외한 조건}'].includes(m)) warns.push(`${f07b} ${o._line}번째 줄: 알 수 없는 자리표시자 ${m} (그대로 출력됩니다)`);
    }
    if (kind === '추천 대사틀') FOOD_TEXT.say.push(say);
    else if (kind.startsWith('재추천') && kind.includes('통째로')) FOOD_TEXT.againLine[Number(key)] = say;
    else if (kind === '재추천 앞에 붙는 줄') FOOD_TEXT.againPre[Number(key)] = say;
    else if (kind === '안내 줄') {
      if (!NOTE_KEY[key]) at(f07b, o, `안내 줄의 이름은 ${Object.keys(NOTE_KEY).join(' / ')} 중 하나여야 합니다 (입력: ${key})`);
      else FOOD_TEXT.notes[NOTE_KEY[key]] = say;
    } else at(f07b, o, `알 수 없는 종류입니다: ${kind}`);
  }
  if (!errors.some(e => e.startsWith(f07b))) {
    if (!FOOD_TEXT.say.length) errors.push(`${f07b}: 「추천 대사틀」이 한 줄도 없습니다`);
    for (const [k, v] of Object.entries(NOTE_KEY)) if (!FOOD_TEXT.notes[v]) errors.push(`${f07b}: 안내 줄 「${k}」가 없습니다`);
  }

  // ── 「코드 키」 열로 연결되는 파일 (05 · 08 · 09 · 10) ──
  // 코드 키 = 코드가 어느 줄인지 찾는 이름. 「참고」 라고 적은 줄은 일부러 연결하지 않는다.
  const keyed = (file, cols, allowed, multi = [], adminKeys = [], raw = []) => {
    const map = {};
    for (const o of load(file, [...cols, '코드 키'], errors, raw)) {
      const code = o['코드 키'];
      if (code === '참고') continue;
      if (!code) { warns.push(`${file} ${o._line}번째 줄: 「코드 키」가 비어 있어 사이트에 반영되지 않습니다 (일부러 뺀 줄이면 「참고」라고 적어 두세요)`); continue; }
      const [key, cond = ''] = code.split(':').map(x => x.trim());
      if (!allowed.includes(key)) { at(file, o, `코드 키 「${code}」을(를) 알 수 없습니다. 쓸 수 있는 값: ${allowed.join(' / ')} (연결하지 않을 줄은 「참고」)`); continue; }
      if (cond && !(cond === 'admin' && adminKeys.includes(key))) { at(file, o, `코드 키 「${code}」의 「:${cond}」는 쓸 수 없습니다`); continue; }
      if (!multi.includes(key) && map[key]) { at(file, o, `코드 키 「${key}」가 두 번 나옵니다 (한 줄만 쓸 수 있습니다)`); continue; }
      (map[key] ??= []).push({ ...o, admin: cond === 'admin' });
    }
    if (!errors.some(e => e.startsWith(file)))
      for (const k of allowed) if (!map[k]) errors.push(`${file}: 코드 키 「${k}」 줄이 없습니다 (코드가 쓰는 줄이라 지우면 안 됩니다)`);
    return map;
  };
  const checkVars = (file, o, text, allowedVars) => {
    for (const m of text.match(/\{[^}]*\}/g) ?? [])
      if (!allowedVars.includes(m)) warns.push(`${file} ${o._line}번째 줄: 알 수 없는 자리표시자 ${m} (그대로 출력됩니다)`);
  };

  // 05 맥락 질문 대화 — 대사만 연결 (발동 조건은 코드에 고정)
  const f05 = '05_맥락질문대화.csv';
  const TALK_KEYS = ['cancel', 'treeRepeat', 'day.start', 'day.hard', 'day.good', 'day.meh', 'hard.start', 'hard.work', 'hard.people', 'hard.silent', 'hard.other', 'secret.start', 'secret.yes', 'secret.no', 'birthday.start', 'birthday.yes', 'birthday.no'];
  const TALK_LINES = {};
  for (const [k, [o]] of Object.entries(keyed(f05, ['R의 대사1', 'R의 대사2(있으면)'], TALK_KEYS))) {
    if (!o['R의 대사1']) { at(f05, o, 'R의 대사1이 비어 있습니다'); continue; }
    TALK_LINES[k] = o['R의 대사2(있으면)'] ? [o['R의 대사1'], o['R의 대사2(있으면)']] : [o['R의 대사1']];
    allSays.push(...TALK_LINES[k]);
  }

  // 05b 맥락 판정어
  const f05b = '05b_맥락_판정어(정규식).csv';
  const TALK_REGEX = {};
  for (const o of load(f05b, ['이름', '정규식 원문'], errors)) {
    if (!['AFFIRM', 'DECLINE', 'GOOD_DAY', 'HARD_DAY'].includes(o['이름'])) { at(f05b, o, `이름은 AFFIRM / DECLINE / GOOD_DAY / HARD_DAY 중 하나여야 합니다 (입력: ${o['이름']})`); continue; }
    const re = parseRegex(o['정규식 원문']);
    if (!re) { at(f05b, o, `정규식이 올바르지 않습니다. /패턴/ 형태로 쓰고 g·y 플래그는 쓸 수 없습니다 (입력: ${o['정규식 원문']})`); continue; }
    TALK_REGEX[o['이름']] = re;
  }
  if (!errors.some(e => e.startsWith(f05b))) for (const k of ['AFFIRM', 'DECLINE', 'GOOD_DAY', 'HARD_DAY']) if (!TALK_REGEX[k]) errors.push(`${f05b}: 「${k}」 줄이 없습니다`);

  // 07c 음식 감지어
  const f07c = '07c_음식추천_감지어(정규식).csv';
  const FOOD_RE_KEYS = { '새 추천을 부르는 말': 'trigger', '재추천을 부르는 말(14자 이하)': 'reroll', '안 매운 감지': 'mild', '매운 감지': 'spicy', '점심 태그': 'lunch', '저녁 태그': 'dinner', '야식 태그': 'night', '국물 태그': 'soup', '가벼운 태그': 'light', '가성비 태그': 'cheap' };
  const FOOD_REGEX = {};
  for (const o of load(f07c, ['용도', '정규식 원문(공백 제거한 입력 기준)'], errors)) {
    const id = FOOD_RE_KEYS[o['용도']];
    if (!id) { at(f07c, o, `용도 「${o['용도']}」를 알 수 없습니다. 쓸 수 있는 값: ${Object.keys(FOOD_RE_KEYS).join(' / ')}`); continue; }
    const re = parseRegex(o['정규식 원문(공백 제거한 입력 기준)']);
    if (!re) { at(f07c, o, `정규식이 올바르지 않습니다. /패턴/ 형태로 쓰고 g·y 플래그는 쓸 수 없습니다 (입력: ${o['정규식 원문(공백 제거한 입력 기준)']})`); continue; }
    FOOD_REGEX[id] = re;
  }
  if (!errors.some(e => e.startsWith(f07c))) for (const [label, id] of Object.entries(FOOD_RE_KEYS)) if (!FOOD_REGEX[id]) errors.push(`${f07c}: 용도 「${label}」 줄이 없습니다`);

  // 08 시스템 명령어 응답
  const f08 = '08_시스템명령어_응답.csv';
  const SYS_KEYS = ['help', 'about', 'whoami', 'whoami.reg', 'whoami.unreg', 'users.ok', 'users.fail', 'status', 'guide', 'guide.edit', 'guide.edit.denied', 'exit'];
  const SYS_LINES = {};
  for (const [k, rows] of Object.entries(keyed(f08, ['명령어', '화자', '출력 줄'], SYS_KEYS, ['help', 'whoami'], ['help'], ['출력 줄']))) {
    SYS_LINES[k] = rows.flatMap(o => {
      const who = o['화자'] === 'SYSTEM' ? 'S' : o['화자'] === 'R' ? 'R' : null;
      if (!who) { at(f08, o, `화자는 SYSTEM 또는 R 이어야 합니다 (입력: ${o['화자']})`); return []; }
      if (!o['출력 줄'].trim()) { at(f08, o, '출력 줄이 비어 있습니다'); return []; }
      checkVars(f08, o, o['출력 줄'], ['{계정ID}', '{번호4자리}', '{ADMIN 또는 VISITOR}', '{번호}', '{총수}']);
      if (who === 'R') allSays.push(o['출력 줄']);
      return [o.admin ? { who, text: o['출력 줄'], admin: true } : { who, text: o['출력 줄'] }];
    });
  }
  if (SYS_LINES.help && !SYS_LINES.help.some(l => !l.admin) && !errors.some(e => e.startsWith(f08))) errors.push(`${f08}: help 에 모든 방문자에게 보이는 줄이 하나도 없습니다`);

  // 09 자동 출력 (부팅·첫 인사·대기·우주 문구)
  const f09 = '09_자동출력_부팅_인사.csv';
  const AUTO_KEYS = ['boot', 'greet.first', 'greet.100', 'greet.1000', 'greet.visit10', 'idle', 'flavor'];
  const AUTO_WHO = { boot: 'SYSTEM', flavor: 'SYSTEM' };      // 나머지는 R
  const AUTO = {};
  for (const [k, rows] of Object.entries(keyed(f09, ['종류', '화자', '출력 줄'], AUTO_KEYS, ['boot', 'flavor']))) {
    AUTO[k] = rows.flatMap(o => {
      const want = AUTO_WHO[k] ?? 'R';
      if (o['화자'] !== want) { at(f09, o, `이 줄(${k})의 화자는 ${want} 여야 합니다 (입력: ${o['화자']})`); return []; }
      if (!o['출력 줄']) { at(f09, o, '출력 줄이 비어 있습니다'); return []; }
      checkVars(f09, o, o['출력 줄'], ['{사용자}', '{역할}']);
      if (want === 'R') allSays.push(o['출력 줄']);
      return [o['출력 줄']];
    });
  }
  const BOOT_LINES = AUTO.boot ?? [], FLAVOR_LINES = AUTO.flavor ?? [];
  const GREET_LINES = { first: AUTO['greet.first']?.[0], '100': AUTO['greet.100']?.[0], '1000': AUTO['greet.1000']?.[0], visit10: AUTO['greet.visit10']?.[0] };
  const IDLE_LINE = AUTO.idle?.[0];

  // 10 호칭·이름 기억
  const f10 = '10_호칭_이름기억.csv';
  const NAME_KEYS = ['intro', 'intro.noacct', 'ask.known', 'ask.unknown', 'forget', 'forget.noacct', 'replace'];
  const NAME_TEXT = {}, NAME_REPLACE = [];
  for (const [k, rows] of Object.entries(keyed(f10, ['방문자 입력(조건)', 'R의 대사'], NAME_KEYS, ['replace']))) {
    for (const o of rows) {
      if (!o['R의 대사']) { at(f10, o, 'R의 대사가 비어 있습니다'); continue; }
      checkVars(f10, o, o['R의 대사'], ['{이름}']);
      if (k === 'replace') {                                   // 「바꿀 말」 → 「바뀐 말」 ({이름} 사용 가능)
        const from = /「([^」]+)」/.exec(o['방문자 입력(조건)'])?.[1];
        if (!from) { at(f10, o, '「방문자 입력(조건)」 칸에 바꿀 말을 「」 안에 적어 주세요 (예: R의 모든 대사 속 「방문자님」)'); continue; }
        NAME_REPLACE.push({ from, to: o['R의 대사'] });
      } else { NAME_TEXT[k] = o['R의 대사']; allSays.push(o['R의 대사']); }
    }
  }

  // 꼬투리 시작 패턴이 실제로 어떤 R 대사와도 안 맞으면 알려 준다(대사를 고치다가 연결이 끊기기 쉽다)
  const corpus = [...HIDDEN.map(r => r.say), ...GENERAL.flatMap(r => [r.say, ...Object.values(r.rep ?? {})]), ...WRONG, ...COMPOSITE.map(r => r.say), ...allSays];
  for (const s of TREE_STARTS) {
    if (isRegex(s.pattern) && !corpus.some(t => new RegExp(s.pattern).test(t)))
      warns.push(`${f06c}: 패턴 「${s.pattern}」과 맞는 R 대사가 CSV 어디에도 없습니다 → 「${s.node}」 대화가 시작되지 않습니다 (R의 대사를 고쳤다면 패턴도 같이 고쳐 주세요)`);
  }

  return { data: { HIDDEN, GENERAL, WRONG, REP_EXTRA, COMPOSITE, TREE_NODES, TREE_STARTS, FOODS, FOOD_TEXT, TALK_LINES, TALK_REGEX, FOOD_REGEX, SYS_LINES, BOOT_LINES, GREET_LINES, IDLE_LINE, FLAVOR_LINES, NAME_TEXT, NAME_REPLACE, IDENT }, errors, warns };
}

/* ───────── 파일 쓰기 ───────── */
function render(d) {
  const j = v => JSON.stringify(v, null, 2);
  return `// ⚠ 자동 생성 파일 — 직접 고치지 마세요.
// data/r-dialogue/*.csv 를 고치면 npm run dev / npm run build 때 이 파일이 다시 만들어집니다.
// (수동으로 만들려면: npm run r-dialogue)

export type RuleData = { kw: string[]; say: string; ctr?: string; rep?: Record<number, string> };
export type CompositeData = { subject: 'R' | '너' | '나' | ''; kw: string[]; say: string };
export type TreeBranchData = { words: string[]; to: string; mode?: 'exact' | 'includes' };
export type TreeNodeData = { id: string; text: string; branches?: TreeBranchData[]; end?: boolean; clue?: string };
export type FoodData = { name: string; tags: string[] };
export type RegexData = { source: string; flags: string };
export type SysLine = { who: 'S' | 'R'; text: string; admin?: true };

export const HIDDEN_DATA: RuleData[] = ${j(d.HIDDEN)};

export const GENERAL_DATA: RuleData[] = ${j(d.GENERAL)};

export const WRONG_DATA: string[] = ${j(d.WRONG)};

/** 키워드 규칙에 묶이지 않은 반복 대사 (whoami · clear · unknown) */
export const REP_EXTRA: Record<string, Record<number, string>> = ${j(d.REP_EXTRA)};

export const COMPOSITE_DATA: CompositeData[] = ${j(d.COMPOSITE)};

export const TREE_NODES_DATA: Record<string, TreeNodeData> = ${j(d.TREE_NODES)};

export const TREE_STARTS_DATA: { pattern: string; node: string }[] = ${j(d.TREE_STARTS)};

export const FOODS_DATA: FoodData[] = ${j(d.FOODS)};

export const FOOD_TEXT: {
  say: string[];
  againLine: Record<number, string>;
  againPre: Record<number, string>;
  notes: { relax: string; only: string; reset: string };
} = ${j(d.FOOD_TEXT)};

/** 03 — 「누구야」 「누가 만들었어」 문장 전체 일치 대사 */
export const IDENT_LINES: { whoAreYou: string; maker: string } = ${j(d.IDENT)};

/** 05 — 맥락 질문 대화의 대사 (코드 키 → 대사 1~2줄) */
export const TALK_LINES: Record<string, string[]> = ${j(d.TALK_LINES)};

/** 05b — 긍정·거절·좋은 하루·힘든 하루 판정어 */
export const TALK_REGEX: Record<'AFFIRM' | 'DECLINE' | 'GOOD_DAY' | 'HARD_DAY', RegexData> = ${j(d.TALK_REGEX)};

/** 07c — 음식 추천을 부르는 말과 태그 감지어 */
export const FOOD_REGEX: Record<'trigger' | 'reroll' | 'mild' | 'spicy' | 'lunch' | 'dinner' | 'night' | 'soup' | 'light' | 'cheap', RegexData> = ${j(d.FOOD_REGEX)};

/** 08 — help · about · whoami · users · status · guide · exit 출력 */
export const SYS_LINES: Record<string, SysLine[]> = ${j(d.SYS_LINES)};

/** 09 — 부팅 줄 · 첫 인사 · 대기 멘트 · 우주 문구 */
export const BOOT_LINES: string[] = ${j(d.BOOT_LINES)};
export const GREET_LINES: { first: string; '100': string; '1000': string; visit10: string } = ${j(d.GREET_LINES)};
export const IDLE_LINE: string = ${j(d.IDLE_LINE)};
export const FLAVOR_LINES: string[] = ${j(d.FLAVOR_LINES)};

/** 10 — 이름 저장·확인·삭제 대사와 자동 치환 */
export const NAME_TEXT: Record<string, string> = ${j(d.NAME_TEXT)};
export const NAME_REPLACE: { from: string; to: string }[] = ${j(d.NAME_REPLACE)};
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { data, errors, warns } = buildData();
  for (const w of warns) console.warn(`[R 대사] 주의 — ${w}`);
  if (errors.length) {
    console.error('\n[R 대사] CSV 를 읽는 중 문제가 있어 중단합니다:\n');
    for (const e of errors) console.error('  · ' + e);
    console.error('\n위 파일을 고친 뒤 다시 올려 주세요. (기존 사이트는 그대로 유지됩니다)\n');
    process.exit(1);
  }
  const text = render(data);
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (prev !== text) writeFileSync(OUT, text, 'utf8');
  const c = data;
  console.log(`[R 대사] CSV → 코드 변환 완료 (숨김 ${c.HIDDEN.length} · 일반 ${c.GENERAL.length} · 복합 ${c.COMPOSITE.length} · 미등록 ${c.WRONG.length} · 트리 노드 ${Object.keys(c.TREE_NODES).length} · 음식 ${c.FOODS.length})${prev === text ? ' — 변경 없음' : ''}`);
}
