'use client';
// 옷입히기 — 이미지 불러오기 · 저장용 공용 도구
import { getBlob } from '@/lib/blobStore';

/** 파일 참조(IndexedDB 키 / 원격 주소)를 <img>에서 쓸 수 있는 주소로 바꾼다 */
export async function resolveRefUrl(ref: string): Promise<string> {
  if (/^(https?:|data:|blob:)/.test(ref)) return ref;
  const b = await getBlob(ref);
  if (!b) throw new Error('파일을 찾지 못했어요');
  return URL.createObjectURL(b);
}

/** 이미지를 불러온다. 원격 이미지는 CORS 허용이 있어야 캔버스에 그려 저장할 수 있다 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    if (/^https?:/.test(url)) im.crossOrigin = 'anonymous';
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('이미지를 불러오지 못했어요'));
    im.src = url;
  });
}
