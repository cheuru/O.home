'use client';
// 옷장 방 목록 — 방마다 썸네일 카드가 놓이고, 누르면 그 페어의 옷장으로 들어간다.
// 만들기·지우기는 관리자만 보인다 (설정 쓰기 권한도 서버가 한 번 더 막는다).
import React, { useState } from 'react';
import Link from 'next/link';
import { ClosetBook, ClosetRoom, useResolvedCloset } from '@/lib/closetStore';
import { Modal, useConfirmDelete } from '@/components/ui/Modal';
import { KInput } from '@/components/ui/Kit';

const CSS = `
.cl-lobby{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px;margin-top:8px;}
.cl-room{position:relative;display:block;text-decoration:none;color:var(--ink);background:var(--panel);border-radius:var(--radius);box-shadow:var(--sh-sm);overflow:hidden;transition:transform .2s,box-shadow .2s;}
.cl-room:hover{transform:translateY(-3px);box-shadow:var(--sh-md);}
.cl-room-thumb{display:flex;align-items:flex-end;justify-content:center;height:230px;background:color-mix(in srgb,var(--panel) 60%,var(--line));overflow:hidden;}
.cl-room-thumb img{height:118%;width:50%;object-fit:cover;object-position:top center;}
.cl-room-thumb img.solo{width:100%;height:100%;object-fit:cover;object-position:center;}
.cl-room-name{padding:12px 14px 14px;font-size:14px;letter-spacing:.04em;font-family:var(--sans);}
.cl-room-del{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;border:none;background:rgba(30,33,38,.7);color:#fff;font-size:13px;cursor:pointer;opacity:0;transition:opacity .2s;}
.cl-room-wrap:hover .cl-room-del{opacity:1;}
.cl-room-wrap{position:relative;}
.cl-new{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:0;height:100%;border:1.5px dashed var(--line);border-radius:var(--radius);background:transparent;color:var(--sub);cursor:pointer;font-family:var(--sans);font-size:13px;transition:border-color .2s,color .2s;}
.cl-new:hover{border-color:var(--accent);color:var(--accent);}
.cl-new span{font-size:28px;font-weight:200;line-height:1;}
.cl-empty{max-width:420px;margin:60px auto;text-align:center;padding:36px 28px;background:var(--panel);border-radius:var(--radius);box-shadow:var(--sh-sm);}
.cl-empty p{margin:0 0 18px;color:var(--sub);font-size:13.5px;line-height:1.8;}
`;

function RoomCard({ room, isAdmin, onDelete }: { room: ClosetRoom; isAdmin: boolean; onDelete: () => void }) {
  const r = useResolvedCloset(room);                      // 서버 연결 전에 올린 그림도 보이게
  const d = r.design;
  return (
    <div className="cl-room-wrap">
      <Link href={`/closet?room=${encodeURIComponent(room.id)}`} className="cl-room">
        <div className="cl-room-thumb">
          {d.thumb
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="solo" src={d.thumb} alt="" draggable={false} />
            : <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.char1Bodies[0]} alt="" draggable={false} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.char2Bodies[0]} alt="" draggable={false} />
            </>}
        </div>
        <div className="cl-room-name">{d.gameTitle || '이름 없는 옷장'}</div>
      </Link>
      {isAdmin && <button type="button" className="cl-room-del" title="이 옷장 지우기" onClick={onDelete}>✕</button>}
    </div>
  );
}

export function ClosetLobby({ book, isAdmin, onCreate, onDelete }: {
  book: ClosetBook; isAdmin: boolean; onCreate: (name: string) => void; onDelete: (id: string) => void;
}) {
  const del = useConfirmDelete();
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState('');
  const open = () => { setName(''); setAsking(true); };
  const make = () => { onCreate(name.trim() || '페어명의 옷장'); setAsking(false); };

  return (
    <div>
      <style>{CSS}</style>
      {book.rooms.length === 0 && (
        <div className="cl-empty">
          {isAdmin ? (
            <>
              <p>아직 페어 옷장이 없어요.<br />새 페어 옷장을 만들어 볼까요?</p>
              <button className="btn btn-dark" onClick={open}>페어 옷장 만들기</button>
            </>
          ) : <p>아직 열린 옷장이 없어요.</p>}
        </div>
      )}
      {book.rooms.length > 0 && (
        <div className="cl-lobby">
          {book.rooms.map(room => (
            <RoomCard key={room.id} room={room} isAdmin={isAdmin}
              onDelete={() => del.ask(`「${room.design.gameTitle}」 옷장을 지울까요?`, () => onDelete(room.id),
                '아이템 목록·대사·디자인이 함께 사라져요. 올린 그림 파일은 이미지 정리에서 따로 지울 수 있어요.')} />
          ))}
          {isAdmin && <button type="button" className="cl-new" onClick={open}><span>＋</span>새 페어 옷장</button>}
        </div>
      )}
      {del.element}
      <Modal open={asking} small title="페어 옷장 만들기" desc="새 옷장의 이름을 정해 주세요. 나중에 디자인 탭에서 바꿀 수 있어요."
        onClose={() => setAsking(false)}
        actions={<>
          <button className="btn btn-dark" onClick={make}>CREATE</button>
          <button className="btn btn-ghost" onClick={() => setAsking(false)}>CANCEL</button>
        </>}>
        <KInput value={name} placeholder="예) 레와 유의 옷장" autoFocus
          onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') make(); }} />
      </Modal>
    </div>
  );
}
