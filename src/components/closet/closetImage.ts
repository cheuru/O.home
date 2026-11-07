// 옷장 그림 올리기 전처리 — 가로가 넓은 원본은 가운데를 중심으로 좌우를 잘라 가로 500px로 맞춘다.
// 옷·캐릭터 그림은 한 칸 안에 겹쳐 올리므로, 모두 같은 기준(가운데)으로 잘라야 위치가 어긋나지 않는다.
// · 세로 길이는 그대로 둔다 (늘리거나 줄이지 않고 자르기만 한다)
// · 가로가 500px 이하면 그대로 둔다 (빈 칸을 덧붙이지 않는다)
// · GIF(움직임)·SVG(벡터)는 캔버스를 거치면 망가지므로 건드리지 않는다
export const CLOSET_IMG_WIDTH = 500;

const loadBitmap = async (f: File): Promise<{ src: CanvasImageSource; w: number; h: number; done: () => void }> => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(f);
      return { src: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close() };
    } catch { /* 아래 <img> 방식으로 다시 시도 */ }
  }
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => no(new Error('이미지를 읽지 못했어요'));
      i.src = url;
    });
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => {} };
  } finally { URL.revokeObjectURL(url); }
};

/** 가운데 기준으로 가로 500px만 남긴 새 파일을 돌려준다. 자를 필요가 없으면 원본 그대로. */
export async function cropCenterWidth(f: File, width = CLOSET_IMG_WIDTH): Promise<File> {
  if (/gif|svg/i.test(f.type) || /\.(gif|svg)$/i.test(f.name)) return f;
  let bmp: Awaited<ReturnType<typeof loadBitmap>>;
  try { bmp = await loadBitmap(f); } catch { return f; }
  try {
    if (bmp.w <= width || bmp.h <= 0) return f;
    const sx = Math.floor((bmp.w - width) / 2);          // 왼쪽에서 잘라낼 너비 — 좌우 같은 양(홀수면 오른쪽이 1px 더)
    const c = document.createElement('canvas');
    c.width = width; c.height = bmp.h;
    const ctx = c.getContext('2d');
    if (!ctx) return f;
    ctx.drawImage(bmp.src, sx, 0, width, bmp.h, 0, 0, width, bmp.h);
    const blob = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/png'));   // 투명 배경을 지키려고 PNG
    if (!blob) return f;
    return new File([blob], f.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
  } finally { bmp.done(); }
}
