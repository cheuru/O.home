// 옷장 캐릭터 엔진 — 원본(room1/index.php)의 makeChar() 상태기계를 React 밖에서 돌리는 버전.
// 캐릭터마다 「방치 → 부끄럼 → 패닉」 같은 상태와 타이머를 들고 있고, 화면에 보일 값만 patch()로 내보낸다.
import type { ClosetData, ClosetItem } from '@/lib/closetStore';

export interface Worn { uid: number; src: string; type: string; desc: string; zi: number; anim: string }
export interface CharView {
  face: number;          // 1~5 표정
  text: string; vis: boolean; pop: boolean;   // 말풍선
  cls: string[];         // 캐릭터 전체에 붙는 움직임 클래스
  blush: boolean; sweat: number; clouds: boolean;
  bg: string | null;
  worn: Worn[];
}
export const emptyView = (): CharView => ({
  face: 1, text: '', vis: false, pop: false, cls: [], blush: false, sweat: 0, clouds: false, bg: null, worn: [],
});

export type Cid = 1 | 2;
export interface EngineApi {
  data: ClosetData;
  patch: (cid: Cid, p: Partial<CharView>) => void;
  sfx: (k: 'blop' | 'magic' | 'whoosh' | 'pic') => void;
  askBg: (src: string) => void;
  dragging: boolean;
}

/** 겹쳐 입는 종류 — 같은 종류를 여러 개 입을 수 있다 */
export const STACK_TYPES = ['outer', 'acc', 'acc2', 'hair', 'shoes', 'bg'];
const ZI: Record<string, number> = { top: 20, outer: 35, bottom: 15, shoes: 22, dress: 20, hair: 30, acc: 40, acc2: 5, bg: 3 };
const ANIM_ALL = ['anim-bounce', 'anim-shake', 'anim-jump', 'anim-gloom', 'anim-weak-shake', 'anim-attention', 'anim-heavy', 'anim-heavy-slow'];
const pick = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

interface C {
  cid: Cid; isIdle: boolean; isBlush: boolean; isPanic: boolean;
  t1?: number; t2?: number; t3?: number; nakedT?: number; attI?: number; msgI?: number; rareT?: number; bubT?: number;
  worn: Worn[]; cls: string[];
}

export function makeEngine(A: { current: EngineApi }) {
  let seq = 0;
  const mk = (cid: Cid): C => ({ cid, isIdle: false, isBlush: false, isPanic: false, worn: [], cls: [] });
  const chars: Record<Cid, C> = { 1: mk(1), 2: mk(2) };
  const other = (c: C) => chars[c.cid === 1 ? 2 : 1];
  const P = (c: C, p: Partial<CharView>) => A.current.patch(c.cid, p);
  const raf = (f: () => void) => requestAnimationFrame(f);

  /* ── 대사 ── */
  const dgSet = (c: C) => (c.cid === 1 ? A.current.data.dialogue1 : A.current.data.dialogue2);
  const dg = (c: C, k: string, fb = '...') => { const v = dgSet(c)[k]; return v != null && v !== '' ? v : fb; };
  const dgList = (c: C, k: string) => {
    const v = dgSet(c)[k];
    const l = v && v.trim() ? v.split('\n').map(s => s.trim()).filter(Boolean) : [];
    return l.length ? l : ['...'];
  };

  /* ── 보이는 값 ── */
  const pushWorn = (c: C) => P(c, { worn: c.worn.map(w => ({ ...w })) });
  const pushCls = (c: C) => P(c, { cls: [...c.cls] });
  const cvRemove = (c: C, l: string[]) => { c.cls = c.cls.filter(x => !l.includes(x)); pushCls(c); };
  const cvAdd = (c: C, cls: string) => { if (!c.cls.includes(cls)) { c.cls = [...c.cls, cls]; pushCls(c); } };
  /** 같은 움직임을 다시 처음부터 — 뺐다가 한두 프레임 뒤에 다시 붙인다 */
  const anim = (c: C, cls: string) => {
    const again = c.cls.includes(cls);
    cvRemove(c, ANIM_ALL);
    if (again) raf(() => raf(() => cvAdd(c, cls))); else raf(() => cvAdd(c, cls));
  };
  const chBody = (c: C, n: number) => P(c, { face: n });
  const hasTop = (c: C) => c.worn.some(w => w.type === 'top' || w.type === 'bottom' || w.type === 'dress');

  const resetT = (c: C) => {
    clearTimeout(c.t1); clearTimeout(c.t2); clearTimeout(c.t3); clearTimeout(c.nakedT); clearTimeout(c.rareT);
    clearInterval(c.msgI); clearInterval(c.attI);
  };

  function bubble(c: C, msg: string, face?: number, dur?: number) {
    clearTimeout(c.bubT);
    P(c, { text: msg, vis: false, pop: false });
    const stay = dur || 2500;
    if (!c.isIdle && !c.isBlush) chBody(c, face || (Math.random() < 0.5 ? 2 : 3));
    else if (face) chBody(c, face);
    if (c.isIdle || c.isBlush) {
      raf(() => P(c, { vis: true }));
      c.bubT = window.setTimeout(() => P(c, { vis: false }), stay);
    } else {
      P(c, { vis: true, pop: true });
      c.bubT = window.setTimeout(() => {
        P(c, { vis: false });
        window.setTimeout(() => { P(c, { pop: false }); if (!c.isIdle && !c.isBlush) chBody(c, 1); }, 400);
      }, stay);
    }
  }

  function sweat(c: C) { P(c, { sweat: Date.now() }); window.setTimeout(() => P(c, { sweat: 0 }), 1000); }
  const clouds = (c: C, on: boolean) => P(c, { clouds: on });
  const blush = (c: C, on: boolean) => P(c, { blush: on });

  function attn(c: C) {
    if (c.isIdle || c.isBlush || c.isPanic || A.current.dragging) return;
    cvRemove(c, ['anim-bounce', 'anim-shake', 'anim-jump', 'anim-heavy']);
    raf(() => { cvAdd(c, 'anim-attention'); window.setTimeout(() => cvRemove(c, ['anim-attention']), 600); });
  }

  function motion(c: C, cls: string, dur: number) {
    cvRemove(c, ['anim-attention', 'anim-weak-shake', 'anim-shake', 'anim-bounce', 'anim-peep', 'anim-heavy-slow', 'anim-heavy']);
    raf(() => cvAdd(c, cls));
    window.setTimeout(() => {
      cvRemove(c, [cls]);
      if (!hasTop(c) && !c.isIdle) window.setTimeout(() => cvAdd(c, 'anim-weak-shake'), 50);
    }, dur);
  }

  /* ── 방치 단계 ── */
  function startIdle(c: C) {
    resetT(c);
    c.t1 = window.setTimeout(() => s1(c), 30000);
    if (hasTop(c) && !c.isBlush && !c.isIdle && !c.isPanic) {
      clearInterval(c.attI);
      c.attI = window.setInterval(() => attn(c), 3000);
    }
  }
  function s1(c: C) {
    clearInterval(c.msgI); clearInterval(c.attI);
    const o = other(c);
    const partnerBusy = !o.isIdle && !o.isPanic && !o.isBlush;
    if (!hasTop(c)) {
      chBody(c, 2); bubble(c, dg(c, 'boast_success'), 2);
      window.setTimeout(() => { if (!hasTop(c)) chBody(c, 4); }, 3000);
    } else if (partnerBusy) { chBody(c, 1); bubble(c, dg(c, 'wait_partner'), 1); }
    else { chBody(c, 2); motion(c, 'anim-peep', 2000); bubble(c, dg(c, 'idle_stage1'), 2); }
    c.t2 = window.setTimeout(() => s2(c), 15000);
  }
  function s2(c: C) {
    clearInterval(c.msgI); clearInterval(c.attI);
    chBody(c, 4);
    if (hasTop(c)) motion(c, 'anim-heavy-slow', 2500);
    bubble(c, dg(c, 'idle_stage2'), 4);
    c.t3 = window.setTimeout(() => { if (hasTop(c)) stdIdle(c); else nakedIdle(c); }, 15000);
  }
  function startBlush(c: C) {
    resetT(c); clearInterval(c.msgI);
    c.isBlush = true; c.isPanic = false; clearInterval(c.attI);
    chBody(c, 4); blush(c, true);
    cvRemove(c, ['anim-heavy', 'anim-bounce', 'anim-shake', 'anim-jump', 'anim-gloom', 'anim-heavy-slow']);
    raf(() => cvAdd(c, 'anim-weak-shake'));
    bubble(c, dg(c, 'blush_msg'), 4);
    c.msgI = window.setInterval(() => bubble(c, dg(c, 'blush_msg'), 4), 15000);
  }
  function stdIdle(c: C) {
    resetT(c); c.isIdle = true; c.isBlush = false; c.isPanic = false; clearInterval(c.attI);
    const o = other(c);
    const partnerBusy = !o.isIdle && !o.isPanic && !o.isBlush;
    if (partnerBusy) chBody(c, 1); else { chBody(c, 4); anim(c, 'anim-gloom'); clouds(c, true); }
    spkIdle(c);
    c.msgI = window.setInterval(() => spkIdle(c), 15000);
  }
  function nakedIdle(c: C) {
    resetT(c); c.isIdle = true; c.isBlush = false; c.isPanic = false; clearInterval(c.attI);
    chBody(c, 4); clouds(c, true); blush(c, true);
    cvAdd(c, 'anim-weak-shake');
    spkMix(c);
    c.msgI = window.setInterval(() => spkMix(c), 15000);
  }
  function spkIdle(c: C) {
    const list = dgList(c, 'idle_list');
    if (Math.random() < 0.1) {
      clearInterval(c.msgI); cvRemove(c, ['anim-gloom']); chBody(c, 5); bubble(c, dg(c, 'rare_msg'), 5);
      c.rareT = window.setTimeout(() => {
        if (c.isIdle) {
          cvAdd(c, 'anim-gloom'); chBody(c, 4); spkIdle(c);
          c.msgI = window.setInterval(() => spkIdle(c), 15000);
        }
      }, 5000);
    } else bubble(c, pick(list), 4);
  }
  function spkMix(c: C) {
    const pool = dgList(c, 'idle_list').concat([dg(c, 'blush_msg'), dg(c, 'blush_msg')]);
    if (Math.random() < 0.1) {
      clearInterval(c.msgI); cvRemove(c, ['anim-weak-shake']); blush(c, false); chBody(c, 5); bubble(c, dg(c, 'rare_msg'), 5);
      c.rareT = window.setTimeout(() => {
        if (!hasTop(c)) {
          cvAdd(c, 'anim-weak-shake'); blush(c, true); bubble(c, pick(pool), 4);
          c.msgI = window.setInterval(() => spkMix(c), 15000);
        }
      }, 5000);
    } else bubble(c, pick(pool), 4);
  }

  /* ── 상호작용 ── */
  function click(c: C) {
    resetT(c); clouds(c, false); cvRemove(c, ['anim-gloom']);
    if (c.isBlush) {
      blush(c, true); chBody(c, 2); anim(c, 'anim-weak-shake'); bubble(c, dg(c, 'blush_msg'), 2);
      window.setTimeout(() => { if (c.isBlush) { chBody(c, 4); startBlush(c); } }, 2000);
    } else if (c.isPanic) {
      chBody(c, 2); anim(c, 'anim-shake'); bubble(c, dg(c, 'panic_click'), 2);
      c.nakedT = window.setTimeout(() => startBlush(c), 2000);
    } else if (c.isIdle) interact(c, false);
    else if (hasTop(c)) {
      anim(c, 'anim-bounce'); bubble(c, pick(dgList(c, 'click_list'))); startIdle(c);
    }
  }
  function interact(c: C, isInit: boolean, skipDlg = false) {
    const wi = c.isIdle, wb = c.isBlush, wp = c.isPanic;
    resetT(c); clouds(c, false); blush(c, false); cvRemove(c, ['anim-gloom', 'anim-weak-shake']);
    c.isBlush = false; c.isIdle = false; c.isPanic = false;
    if (hasTop(c)) {
      if (!isInit && !skipDlg) {
        if (wi) { chBody(c, 3); anim(c, 'anim-bounce'); bubble(c, dg(c, 'return_msg'), 3); }
        else if (wb) { chBody(c, 3); anim(c, 'anim-bounce'); bubble(c, dg(c, 'thanks_msg'), 3); }
        else if (wp) { chBody(c, 2); anim(c, 'anim-bounce'); bubble(c, dg(c, 'panic_exit'), 2); }
        else { anim(c, 'anim-bounce'); bubble(c, pick(dgList(c, 'dress_list'))); }
      } else if (!isInit) chBody(c, 1);
      startIdle(c);
    } else {
      if (!isInit) {
        if (wi || wb) { chBody(c, 2); anim(c, 'anim-bounce'); bubble(c, dg(c, 'return_panic'), 2); }
        else if (wp) { chBody(c, 2); anim(c, 'anim-bounce'); bubble(c, dg(c, 'panic_click'), 2); }
        else anim(c, 'anim-bounce');
      } else chBody(c, 1);
      startIdle(c);
      c.nakedT = window.setTimeout(() => startBlush(c), 3000);
    }
  }

  /* ── 입히고 벗기기 ── */
  const wornAnywhere = (src: string) => ([1, 2] as Cid[]).some(i => chars[i].worn.some(w => w.src === src));

  function drop(cid: Cid, it: Pick<ClosetItem, 'src' | 'type' | 'desc' | 'zi'>) {
    const c = chars[cid];
    A.current.sfx('blop');
    if (it.type === 'bg') { A.current.askBg(it.src); return; }
    const stack = STACK_TYPES.includes(it.type);
    if (stack && c.worn.some(w => w.src === it.src)) return;           // 같은 장식을 두 번 입지 않는다
    if (!stack) c.worn = c.worn.filter(w => w.type !== it.type);       // 같은 종류는 하나만 — 입던 것은 벗는다
    c.worn.push({ uid: ++seq, src: it.src, type: it.type, desc: it.desc || '', zi: it.zi || ZI[it.type] || 20, anim: '' });
    pushWorn(c);
    const acc = c.worn.filter(w => w.type === 'acc' || w.type === 'acc2' || w.type === 'hair').length;
    if ((it.type === 'acc' || it.type === 'acc2' || it.type === 'hair') && acc >= 5) {
      anim(c, 'anim-heavy'); bubble(c, dg(c, 'too_many'), 2); startIdle(c);
    } else interact(c, false);
  }
  function removeWorn(cid: Cid, uid: number) {
    const c = chars[cid];
    A.current.sfx('blop');
    c.worn = c.worn.filter(w => w.uid !== uid);
    pushWorn(c);
    interact(c, false, true);
    bubble(c, pick(dgList(c, 'take_off_list')));
  }
  function bumpZ(cid: Cid, uid: number, d: number) {
    const c = chars[cid];
    c.worn = c.worn.map(w => w.uid === uid ? { ...w, zi: w.zi + d } : w);
    pushWorn(c);
  }
  const outfitOf = (c: C) => {
    const ids = c.cid === 1 ? A.current.data.design.char1Default : A.current.data.design.char2Default;
    return (ids || []).map(id => A.current.data.items.find(i => i.id === id)).filter((i): i is ClosetItem => !!i);
  };
  function wearDefault(c: C, flyIn = false) {
    outfitOf(c).forEach(it => {
      c.worn.push({ uid: ++seq, src: it.src, type: it.type, desc: it.desc, zi: it.zi || 20, anim: flyIn ? (it.type === 'hair' ? 'anim-fly-in-down' : 'anim-fly-in-up') : '' });
    });
    pushWorn(c);
    if (flyIn) window.setTimeout(() => { c.worn = c.worn.map(w => ({ ...w, anim: '' })); pushWorn(c); }, 600);
  }

  function restore(cid: Cid) {
    const c = chars[cid];
    if (c.worn.length) {
      c.worn = c.worn.map(w => ({ ...w, anim: w.type === 'hair' ? 'anim-fly-up' : 'anim-fly-down' }));
      pushWorn(c);
      window.setTimeout(() => doRestore(c), 450);
    } else doRestore(c);
  }
  function doRestore(c: C) {
    resetT(c); A.current.sfx('magic');
    clouds(c, false); blush(c, false);
    cvRemove(c, ['anim-gloom', 'anim-weak-shake', 'anim-heavy', 'anim-heavy-slow']);
    c.isIdle = false; c.isBlush = false; c.isPanic = false;
    c.worn = [];
    wearDefault(c, true);
    chBody(c, 3); anim(c, 'anim-jump'); bubble(c, dg(c, 'reset_all'), 3); startIdle(c);
  }
  function reset(cid: Cid) {
    const c = chars[cid];
    resetT(c);
    if (!c.worn.length) {
      anim(c, 'anim-shake'); sweat(c); bubble(c, dg(c, 'nothing'), 2); startIdle(c);
      c.nakedT = window.setTimeout(() => startBlush(c), 3000);
      return;
    }
    A.current.sfx('whoosh');
    clouds(c, false); blush(c, false); cvRemove(c, ['anim-gloom', 'anim-weak-shake']);
    c.isIdle = false; c.isBlush = false;
    c.worn = c.worn.map(w => ({ ...w, anim: w.type === 'hair' ? 'anim-fly-up' : 'anim-fly-down' }));
    pushWorn(c);
    c.isPanic = true; anim(c, 'anim-shake'); sweat(c); bubble(c, dg(c, 'panic_enter'), 2);
    window.setTimeout(() => {
      c.worn = []; pushWorn(c); startIdle(c);
      c.nakedT = window.setTimeout(() => startBlush(c), 3000);
    }, 500);
  }
  function init(cid: Cid) {
    const c = chars[cid];
    A.current.sfx('magic');
    c.worn = []; wearDefault(c);
    chBody(c, 2); anim(c, 'anim-jump'); bubble(c, dg(c, 'welcome'), 2); interact(c, true);
  }
  function dispose() { ([1, 2] as Cid[]).forEach(i => { resetT(chars[i]); clearTimeout(chars[i].bubT); }); }

  return {
    init, restore, reset, drop, removeWorn, bumpZ, dispose,
    click: (cid: Cid) => click(chars[cid]),
    bubble: (cid: Cid, msg: string, face?: number) => bubble(chars[cid], msg, face),
    dg: (cid: Cid, k: string) => dg(chars[cid], k),
    wornOf: (cid: Cid) => chars[cid].worn,
  };
}
export type Engine = ReturnType<typeof makeEngine>;
