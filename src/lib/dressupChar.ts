// 옷입히기 캐릭터 동작 — 「페어의 옷장」(우초맨 원본)의 캐릭터 상태 기계를 그대로 옮긴 것.
// 표정(1~5)·말풍선·부끄러움(홍조)·떨림·구름·땀·방치 타이머를 DOM에 직접 적용한다 (CSS 애니메이션 재시작이 필요해서).
// 옷 목록(worn)만 React가 그린다 — 바뀔 때마다 host.sync() 로 알려 준다.
import type { DressCat } from './dressupStore';

export type Sfx = 'blop' | 'magic' | 'whoosh' | 'pic';
export type WornFx = 'fly-down' | 'fly-up' | 'in-up' | 'in-down';

export interface WornItem { uid: string; partId: string; catId: string; z: number; fx?: WornFx }

export interface CharHost {
  faceUrl(n: number): string;
  line(key: string): string;
  list(key: string): string[];
  cat(catId: string): DressCat | undefined;
  partZ(partId: string): number | undefined;
  /** 처음 입고 나오는 옷 */
  defaults(): { partId: string; catId: string; z: number }[];
  other(): PairChar | undefined;
  sfx(name: Sfx): void;
  dragging(): boolean;
  sync(): void;
}

export interface CharEls {
  cv: HTMLElement | null; bubble: HTMLElement | null; blush: HTMLElement | null;
  sweat: HTMLElement | null; cloud: HTMLElement | null; body: HTMLImageElement | null;
}

const ANIM_ALL = ['anim-bounce', 'anim-shake', 'anim-jump', 'anim-gloom', 'anim-weak-shake', 'anim-attention', 'anim-heavy', 'anim-heavy-slow'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
let UID = 0;

export class PairChar {
  cid: 1 | 2;
  host: CharHost;
  els: CharEls = { cv: null, bubble: null, blush: null, sweat: null, cloud: null, body: null };
  worn: WornItem[] = [];
  face = 1;
  isIdle = false; isBlush = false; isPanic = false;
  private t1?: number; private t2?: number; private t3?: number; private nakedT?: number; private rareT?: number; private bubT?: number;
  private attI?: number; private msgI?: number;
  private pending = new Set<number>();
  private dead = false;

  constructor(cid: 1 | 2, host: CharHost) { this.cid = cid; this.host = host; }

  /* ---------- 공통 도구 ---------- */
  private later(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => { this.pending.delete(id); if (!this.dead) fn(); }, ms);
    this.pending.add(id);
    return id;
  }
  private every(fn: () => void, ms: number): number {
    const id = window.setInterval(() => { if (!this.dead) fn(); }, ms);
    this.pending.add(id);
    return id;
  }
  private clr(id?: number) { if (id != null) { window.clearTimeout(id); window.clearInterval(id); this.pending.delete(id); } }
  destroy() { this.dead = true; this.pending.forEach(id => { window.clearTimeout(id); window.clearInterval(id); }); this.pending.clear(); }

  private dg(key: string) { return this.host.line(key) || '...'; }
  private dgList(key: string) { const l = this.host.list(key); return l.length ? l : ['...']; }
  hasTop() { return this.worn.some(w => this.host.cat(w.catId)?.covers); }
  private partnerBusy() {
    const o = this.host.other();
    return !!o && !o.isIdle && !o.isPanic && !o.isBlush;
  }

  chBody(n: number) {
    this.face = n;
    const b = this.els.body;
    const u = this.host.faceUrl(n) || this.host.faceUrl(1);
    if (b && u && b.getAttribute('src') !== u) b.src = u;
  }
  refreshFace() { this.chBody(this.face); }

  /* ---------- 연출 ---------- */
  bubble(msg: string, face?: number, dur?: number) {
    const b = this.els.bubble; if (!b) return;
    this.clr(this.bubT);
    b.classList.remove('anim-pop', 'bvis'); b.style.transform = ''; b.style.opacity = '';
    b.textContent = msg;
    const stay = dur || 2500;
    if (!this.isIdle && !this.isBlush) this.chBody(face || (Math.random() < 0.5 ? 2 : 3));
    else if (face) this.chBody(face);
    if (this.isIdle || this.isBlush) {
      b.style.transform = 'translateX(-50%)';
      requestAnimationFrame(() => b.classList.add('bvis'));
      this.bubT = this.later(() => b.classList.remove('bvis'), stay);
    } else {
      b.classList.add('anim-pop', 'bvis');
      this.bubT = this.later(() => {
        b.classList.remove('bvis');
        this.later(() => { b.classList.remove('anim-pop'); if (!this.isIdle && !this.isBlush) this.chBody(1); }, 400);
      }, stay);
    }
  }

  anim(cls: string) {
    const v = this.els.cv; if (!v) return;
    v.classList.remove(...ANIM_ALL); void v.offsetWidth;
    requestAnimationFrame(() => v.classList.add(cls));
  }

  attn() {
    if (this.isIdle || this.isBlush || this.isPanic || this.host.dragging()) return;
    const v = this.els.cv; if (!v) return;
    v.classList.remove('anim-bounce', 'anim-shake', 'anim-jump', 'anim-heavy'); void v.offsetWidth;
    v.classList.add('anim-attention');
    this.later(() => v.classList.remove('anim-attention'), 600);
  }

  sweat() {
    const s = this.els.sweat; if (!s) return;
    s.innerHTML = '';
    [{ l: '26.7%', d: '0s' }, { l: '66.7%', d: '.1s' }, { l: '73.3%', d: '.3s' }].forEach(o => {
      const d = document.createElement('div');
      d.className = 'sweat-drop'; d.style.left = o.l; d.style.animation = `dpSweat .6s ${o.d} linear`;
      s.appendChild(d);
    });
    this.later(() => { s.innerHTML = ''; }, 1000);
  }

  clouds() {
    const c = this.els.cloud; if (!c) return;
    c.innerHTML = '';
    [{ l: '20%', t: '14.2%', w: '30%', h: '5%', d: '0s' }, { l: '40%', t: '10.8%', w: '36.7%', h: '5.8%', d: '.5s' }].forEach(o => {
      const d = document.createElement('div');
      d.className = 'dark-cloud';
      Object.assign(d.style, { left: o.l, top: o.t, width: o.w, height: o.h, animationDelay: o.d });
      c.appendChild(d);
    });
  }

  private clearCloud() { if (this.els.cloud) this.els.cloud.innerHTML = ''; }
  private blushOn(on: boolean) { this.els.blush?.classList.toggle('active-blush', on); }

  motion(cls: string, dur: number) {
    const v = this.els.cv; if (!v) return;
    v.classList.remove('anim-attention', 'anim-weak-shake', 'anim-shake', 'anim-bounce', 'anim-peep', 'anim-heavy-slow', 'anim-heavy'); void v.offsetWidth;
    v.classList.add(cls);
    this.later(() => {
      v.classList.remove(cls);
      if (!this.hasTop() && !this.isIdle) this.later(() => v.classList.add('anim-weak-shake'), 50);
    }, dur);
  }

  /* ---------- 방치 · 부끄러움 상태 ---------- */
  resetT() { [this.t1, this.t2, this.t3, this.nakedT, this.rareT, this.msgI, this.attI].forEach(id => this.clr(id)); }

  startIdle() {
    this.resetT();
    this.t1 = this.later(() => this.s1(), 30000);
    if (this.hasTop() && !this.isBlush && !this.isIdle && !this.isPanic) {
      this.clr(this.attI);
      this.attI = this.every(() => this.attn(), 3000);
    }
  }

  private s1() {
    this.clr(this.msgI); this.clr(this.attI);
    if (!this.hasTop()) {
      this.chBody(2); this.bubble(this.dg('boast_success'), 2);
      this.later(() => { if (!this.hasTop()) this.chBody(4); }, 3000);
    } else if (this.partnerBusy()) {
      this.chBody(1); this.bubble(this.dg('wait_partner'), 1);
    } else {
      this.chBody(2); this.motion('anim-peep', 2000); this.bubble(this.dg('idle_stage1'), 2);
    }
    this.t2 = this.later(() => this.s2(), 15000);
  }

  private s2() {
    this.clr(this.msgI); this.clr(this.attI);
    this.chBody(4);
    if (!this.hasTop()) this.bubble(this.dg('idle_stage2'), 4);
    else { this.motion('anim-heavy-slow', 2500); this.bubble(this.dg('idle_stage2'), 4); }
    this.t3 = this.later(() => { if (this.hasTop()) this.stdIdle(); else this.nakedIdle(); }, 15000);
  }

  startBlush() {
    this.resetT(); this.clr(this.msgI);
    this.isBlush = true; this.isPanic = false;
    this.clr(this.attI);
    this.chBody(4); this.blushOn(true);
    const v = this.els.cv;
    if (v) { v.classList.remove('anim-heavy', 'anim-bounce', 'anim-shake', 'anim-jump', 'anim-gloom', 'anim-heavy-slow'); void v.offsetWidth; v.classList.add('anim-weak-shake'); }
    this.bubble(this.dg('blush_msg'), 4);
    this.msgI = this.every(() => this.bubble(this.dg('blush_msg'), 4), 15000);
  }

  stdIdle() {
    this.resetT();
    this.isIdle = true; this.isBlush = false; this.isPanic = false;
    this.clr(this.attI);
    if (this.partnerBusy()) this.chBody(1);
    else { this.chBody(4); this.anim('anim-gloom'); this.clouds(); }
    this.spkIdle();
    this.msgI = this.every(() => this.spkIdle(), 15000);
  }

  nakedIdle() {
    this.resetT();
    this.isIdle = true; this.isBlush = false; this.isPanic = false;
    this.clr(this.attI);
    this.chBody(4); this.clouds(); this.blushOn(true);
    const v = this.els.cv;
    if (v && !v.classList.contains('anim-weak-shake')) v.classList.add('anim-weak-shake');
    this.spkMix();
    this.msgI = this.every(() => this.spkMix(), 15000);
  }

  private spkIdle() {
    const list = this.dgList('idle_list');
    if (Math.random() < 0.1) {
      this.clr(this.msgI);
      this.els.cv?.classList.remove('anim-gloom');
      this.chBody(5); this.bubble(this.dg('rare_msg'), 5);
      this.rareT = this.later(() => {
        if (this.isIdle) {
          this.els.cv?.classList.add('anim-gloom'); this.chBody(4); this.spkIdle();
          this.msgI = this.every(() => this.spkIdle(), 15000);
        }
      }, 5000);
    } else this.bubble(pick(list), 4);
  }

  private spkMix() {
    const pool = this.dgList('idle_list').concat([this.dg('blush_msg'), this.dg('blush_msg')]);
    if (Math.random() < 0.1) {
      this.clr(this.msgI);
      this.els.cv?.classList.remove('anim-weak-shake'); this.blushOn(false);
      this.chBody(5); this.bubble(this.dg('rare_msg'), 5);
      this.rareT = this.later(() => {
        if (!this.hasTop()) {
          this.els.cv?.classList.add('anim-weak-shake'); this.blushOn(true);
          this.bubble(pick(pool), 4);
          this.msgI = this.every(() => this.spkMix(), 15000);
        }
      }, 5000);
    } else this.bubble(pick(pool), 4);
  }

  /* ---------- 클릭 · 상호작용 ---------- */
  click() {
    this.resetT(); this.clearCloud();
    this.els.cv?.classList.remove('anim-gloom');
    if (this.isBlush) {
      this.blushOn(true); this.chBody(2); this.anim('anim-weak-shake'); this.bubble(this.dg('blush_msg'), 2);
      this.later(() => { if (this.isBlush) { this.chBody(4); this.startBlush(); } }, 2000);
    } else if (this.isPanic) {
      this.chBody(2); this.anim('anim-shake'); this.bubble(this.dg('panic_click'), 2);
      this.nakedT = this.later(() => this.startBlush(), 2000);
    } else if (this.isIdle) {
      this.interact(false);
    } else if (this.hasTop()) {
      this.anim('anim-bounce'); this.bubble(pick(this.dgList('click_list'))); this.startIdle();
    }
  }

  interact(isInit: boolean, skipDlg?: boolean) {
    const wi = this.isIdle, wb = this.isBlush, wp = this.isPanic;
    this.resetT(); this.clearCloud(); this.blushOn(false);
    this.els.cv?.classList.remove('anim-gloom', 'anim-weak-shake');
    this.isBlush = false; this.isIdle = false; this.isPanic = false;
    if (this.hasTop()) {
      if (!isInit && !skipDlg) {
        if (wi) { this.chBody(3); this.anim('anim-bounce'); this.bubble(this.dg('return_msg'), 3); }
        else if (wb) { this.chBody(3); this.anim('anim-bounce'); this.bubble(this.dg('thanks_msg'), 3); }
        else if (wp) { this.chBody(2); this.anim('anim-bounce'); this.bubble(this.dg('panic_exit'), 2); }
        else { this.anim('anim-bounce'); this.bubble(pick(this.dgList('dress_list'))); }
      } else if (!isInit) this.chBody(1);
      this.startIdle();
    } else {
      if (!isInit) {
        if (wi || wb) { this.chBody(2); this.anim('anim-bounce'); this.bubble(this.dg('return_panic'), 2); }
        else if (wp) { this.chBody(2); this.anim('anim-bounce'); this.bubble(this.dg('panic_click'), 2); }
        else this.anim('anim-bounce');
      } else this.chBody(1);
      this.startIdle();
      this.nakedT = this.later(() => this.startBlush(), 3000);
    }
  }

  /* ---------- 옷 입히기 · 벗기기 ---------- */
  wear(partId: string, catId: string) {
    this.host.sfx('blop');
    const cat = this.host.cat(catId); if (!cat || cat.bg) return;
    if (this.worn.some(w => w.partId === partId)) return;
    if (!cat.stack) this.worn = this.worn.filter(w => w.catId !== catId);
    this.worn = [...this.worn, { uid: `w${++UID}`, partId, catId, z: this.host.partZ(partId) ?? cat.z ?? 20 }];
    this.host.sync();
    const accCnt = this.worn.filter(w => this.host.cat(w.catId)?.acc).length;
    if (cat.acc && accCnt >= 5) {
      this.anim('anim-heavy'); this.bubble(this.dg('too_many'), 2); this.startIdle();
    } else this.interact(false);
  }

  takeOff(uid: string) {
    this.host.sfx('blop');
    this.worn = this.worn.filter(w => w.uid !== uid);
    this.host.sync();
    this.interact(false, true);
    this.bubble(pick(this.dgList('take_off_list')));
  }

  setZ(uid: string, d: number) {
    this.worn = this.worn.map(w => w.uid === uid ? { ...w, z: w.z + d } : w);
    this.host.sync();
  }

  private defaultWorn(): WornItem[] {
    return this.host.defaults().map(d => ({ uid: `w${++UID}`, partId: d.partId, catId: d.catId, z: d.z, fx: 'in-up' as WornFx }));
  }

  /** [다시 입히기] — 기본 코디로 */
  restore() {
    if (this.worn.length) {
      this.worn = this.worn.map(w => ({ ...w, fx: 'fly-down' as WornFx }));
      this.host.sync();
      this.later(() => this.doRestore(), 450);
    } else this.doRestore();
  }

  private doRestore() {
    this.resetT(); this.host.sfx('magic');
    this.clearCloud(); this.blushOn(false);
    this.els.cv?.classList.remove('anim-gloom', 'anim-weak-shake', 'anim-heavy', 'anim-heavy-slow');
    this.isIdle = false; this.isBlush = false; this.isPanic = false;
    this.worn = this.defaultWorn();
    this.host.sync();
    this.later(() => { this.worn = this.worn.map(w => ({ ...w, fx: undefined })); this.host.sync(); }, 600);
    this.chBody(3); this.anim('anim-jump'); this.bubble(this.dg('reset_all'), 3); this.startIdle();
  }

  /** [전부 벗기!] */
  reset() {
    this.resetT();
    if (!this.worn.length) {
      this.anim('anim-shake'); this.sweat(); this.bubble(this.dg('nothing'), 2); this.startIdle();
      this.nakedT = this.later(() => this.startBlush(), 3000);
      return;
    }
    this.host.sfx('whoosh');
    this.clearCloud(); this.blushOn(false);
    this.els.cv?.classList.remove('anim-gloom', 'anim-weak-shake');
    this.isIdle = false; this.isBlush = false;
    this.worn = this.worn.map(w => ({ ...w, fx: 'fly-down' as WornFx }));
    this.host.sync();
    this.isPanic = true;
    this.anim('anim-shake'); this.sweat(); this.bubble(this.dg('panic_enter'), 2);
    this.later(() => {
      this.worn = []; this.host.sync();
      this.startIdle();
      this.nakedT = this.later(() => this.startBlush(), 3000);
    }, 500);
  }

  /** 방에 들어왔을 때 */
  init() {
    this.dead = false;   // 개발 모드(StrictMode)에서 정리 후 다시 시작해도 동작하게
    this.host.sfx('magic');
    this.worn = this.host.defaults().map(d => ({ uid: `w${++UID}`, partId: d.partId, catId: d.catId, z: d.z }));
    this.host.sync();
    this.chBody(2); this.anim('anim-jump'); this.bubble(this.dg('welcome'), 2);
    this.interact(true);
  }
}
