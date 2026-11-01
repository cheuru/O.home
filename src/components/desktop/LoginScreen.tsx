'use client';
// 로그인 화면 — 실제 사이트 로그인(useAuth().login)에 연결. 게스트로 둘러보기도 가능.
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

export function LoginScreen({ title, onDone }: { title: string; onDone: () => void }) {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    const r = await login(id.trim(), pw);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? '인증 거부: 아이디 또는 비밀번호가 일치하지 않습니다.'); return; }
    onDone();
  };

  return (
    <main className="dsk-login">
      <div className="dsk-grid" />
      <section className="dsk-login-card">
        <div className="dsk-login-top"><span>{title.toUpperCase()} / IDENTITY GATE</span><span><i className="dsk-live" /> LINKED</span></div>
        <div className="dsk-login-body">
          <div className="dsk-login-seal">
            <span className="dsk-mark xl">{title.trim().charAt(0).toUpperCase() || 'O'}</span>
            <i className="orbit o1" /><i className="orbit o2" />
          </div>
          <div className="dsk-login-copy">
            <p className="dsk-eyebrow">MEMBER ACCESS</p>
            <h2>IDENTITY<br />VERIFICATION</h2>
            <p className="dsk-muted">로그인하면 멤버 전용 메뉴가 열려요. 둘러보기만 해도 괜찮아요.</p>
          </div>
          <form onSubmit={submit}>
            <label>ID<input autoFocus value={id} onChange={e => setId(e.target.value)} autoComplete="username" placeholder="아이디" /></label>
            <label>PASSWORD<input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" placeholder="비밀번호" /></label>
            {err && <p className="dsk-err">! {err}</p>}
            <button type="submit" className="dsk-login-btn" disabled={busy}>{busy ? 'VERIFYING…' : 'REQUEST ACCESS'} <span>→</span></button>
            <div className="dsk-login-sub">
              <button type="button" onClick={onDone}>GUEST ACCESS · 둘러보기</button>
              <button type="button" onClick={() => { window.location.href = '/login'; }}>회원가입 · 비밀번호 찾기</button>
            </div>
          </form>
        </div>
        <div className="dsk-login-foot"><span>SECURITY CHANNEL 01</span><span>{title.toUpperCase()}</span></div>
      </section>
    </main>
  );
}
