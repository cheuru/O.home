'use client';
// 옷입히기 로비 — 방을 썸네일로 보여주고, 들어가면 그 방의 몸통을 꾸민다
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLocalList } from '@/lib/postStore';
import { useBlobUrl } from '@/lib/blobStore';
import { PART_KEY, PART_SEED, useDressSettings, type DressPart } from '@/lib/dressupStore';
import { EditableDesc, PageTitle } from '@/components/ui/PageText';
import './dressup.css';

function Cover({ fileRef }: { fileRef?: string }) {
  const url = useBlobUrl(fileRef);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" draggable={false} /> : <span className="noimg">방 미리보기</span>;
}

export default function DressupLobbyPage() {
  const { user, isAdmin } = useAuth();
  const [set, , setLoaded] = useDressSettings();
  const [parts, , bLoaded] = useLocalList<DressPart>(PART_KEY, PART_SEED);

  if (!bLoaded || !setLoaded) return <section className="page" />;

  const countOf = (roomId: string) => parts.filter(p => p.roomId === roomId && p.status === 'approved').length;
  const canManage = isAdmin || (!!user && set.allowMemberParts);

  return (
    <section className="page">
      <div className="page-head">
        <PageTitle>DRESS UP</PageTitle>
        <EditableDesc k="dressup-lobby-desc" def="방을 골라 들어가면, 그 방의 페어에게 옷을 입혀 볼 수 있어요" />
        <div className="head-actions">
          {canManage && <Link className="btn btn-dark" href="/dressup/manage">{isAdmin ? 'MANAGE' : '파츠 등록'}</Link>}
        </div>
      </div>

      {set.rooms.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 44, fontSize: 13, color: 'var(--faint)' }}>
          {isAdmin ? '아직 방이 없어요 — MANAGE의 「방」 탭에서 방을 먼저 만들어 주세요' : '열려 있는 방이 없습니다'}
        </div>
      ) : (
        <div className="dr-rooms">
          {set.rooms.map(r => {
            return (
              <Link key={r.id} href={`/dressup/${r.id}`} className="dr-room">
                <div className="cv"><Cover fileRef={r.cover || r.chars[0].faces[0]} /></div>
                <div className="nm">{r.name}</div>
                <div className="mt">{r.chars[0].name} · {r.chars[1].name} · 옷 {countOf(r.id)}벌</div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
