'use client';
// AEGIS-NET — 연구시설 내부망 단말 (부팅 → 로그인 → 가상 데스크톱). 화면 전체를 쓰는 몰입형 페이지.
import React, { useEffect, useState } from 'react';
import { AegisTerminal } from '@/components/aegis/AegisTerminal';
import { AEGIS_CSS, AEGIS_FONTS } from '@/components/aegis/aegisCss';

export default function AegisPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // 사이트 본문이 뒤에서 스크롤되지 않게 — 나갈 때 되돌린다
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  if (!mounted) return null;      // 시계·창 위치가 브라우저 크기에 달라서 서버에서는 그리지 않는다
  return (
    <div className="aegis-root">
      <style>{`${AEGIS_FONTS}\n${AEGIS_CSS}`}</style>
      <AegisTerminal />
    </div>
  );
}
