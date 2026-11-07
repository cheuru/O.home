// 옷장 이미지 불러오기 — 스테이지(저장)와 관리자(자동 트리밍)가 같이 쓴다
import { getBlob } from '@/lib/blobStore';

/** 같은 출처가 아닌 이미지는 서버 중계(/api/font)를 거쳐야 캔버스가 잠기지 않는다 */
export const viaProxy = (src: string) => {
  if (/^(data:|blob:|\/(?!\/))/.test(src)) return src;
  try { if (new URL(src, location.href).origin === location.origin) return src; } catch { return src; }
  return `/api/font?u=${encodeURIComponent(src)}`;
};

export function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const a = new Image();
    a.onload = () => res(a);
    a.onerror = () => {
      const b = new Image(); b.crossOrigin = 'anonymous';
      b.onload = () => res(b); b.onerror = () => res(null); b.src = src;
    };
    a.src = viaProxy(src);
  });
}

const isLocalRef = (r: string) => !!r && !/^(https?:|data:|blob:|\/)/.test(r);

/** 서버 연결 전에 올린 그림(파일 id)까지 포함해서 이미지를 불러온다 */
export async function loadImgRef(ref: string): Promise<HTMLImageElement | null> {
  if (!isLocalRef(ref)) return loadImg(ref);
  try {
    const b = await getBlob(ref); if (!b) return null;
    const u = URL.createObjectURL(b);
    const img = await loadImg(u);
    URL.revokeObjectURL(u);
    return img;
  } catch { return null; }
}

/** 투명하지 않은 부분의 범위(원본 캔버스 대비 0~1 비율) — 모두 투명하면 null */
export function opaqueBox(img: HTMLImageElement): { x0: number; y0: number; x1: number; y1: number } | null {
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh) return null;
  const sc = Math.min(1, 400 / Math.max(nw, nh));            // 큰 그림은 줄여서 훑는다 (속도)
  const w = Math.max(1, Math.round(nw * sc)), h = Math.max(1, Math.round(nh * sc));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;               // 잠긴 캔버스면 여기서 예외 → 호출한 쪽이 처리
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  return { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h };
}
