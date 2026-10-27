# 옷입히기 (dressup) 추가 패치

## 적용 방법
1. 이 zip 안의 파일을 프로젝트에 **같은 경로로 덮어쓰기**
   - 새 파일: `src/app/dressup/*`, `src/components/dressup/DressStage.tsx`, `src/lib/dressupStore.ts`
   - 기존 파일에 **몇 줄만 추가**된 것: `types.ts`, `settingStore.ts`, `visFloor.ts`, `menu.ts`, `backup.ts`
     (직접 고친 적이 있다면 덮어쓰지 말고 아래 "추가된 줄"만 옮기세요)
2. **DB 규칙 갱신 (한 번만)**
   - Firebase: 설치 화면의 [규칙 복사] 또는 `firebase/firestore.rules` 내용을 콘솔 → Firestore → 규칙에 붙여넣고 [게시]
   - Supabase: `supabase/schema.sql`을 SQL Editor에서 다시 실행 (여러 번 실행해도 안전)
3. 환경설정 → 메뉴에서 **옷입히기**(`/dressup`)를 원하는 그룹에 넣기

## 추가된 줄 (기존 파일)
- `src/lib/backend/types.ts` COLLECTION_OF: `'ohome.dressbody.v1': 'dressup_bodies'`, `'ohome.dresspart.v1': 'dressup_parts'`
- `src/lib/settingStore.ts` SETTING_KEYS: `'ohome.dressupset.v1'`
- `src/lib/visFloor.ts` AREA: `dressup_bodies`, `dressup_parts` → `/dressup`
- `src/lib/menu.ts` FEATURES: `{ href: '/dressup', label: '옷입히기' }`
- `src/lib/backup.ts` RESET_CONTENT: 옷입히기 항목
- `src/lib/firebaseRules.ts` · `src/lib/schemaSql.ts` · `firebase/firestore.rules` · `supabase/schema.sql`: 컬렉션 2개 + 권한 규칙
  (`firebase/firestore.rules`는 원래 `firebaseRules.ts`보다 오래된 상태라, 최신 내용으로 맞춰 두었습니다)

## 동작
- 몸통: 관리자만 등록, 최대 5개(설정에서 변경)
- 파츠: **몸통별**로 등록. 관리자는 즉시 공개, 회원은 `대기(비공개)` → 관리자 승인 시 공개
- 입히기: 카테고리별 하나씩 선택 → 드래그/슬라이더로 위치·크기 조정, 싱글/페어(몸통 2개), 좌우반전, 랜덤, PNG 저장
- 카테고리(뒷머리·눈·앞머리·옷·신발·소품)는 관리자 설정에서 추가·삭제·순서 변경, 「몸통 뒤」 지정 가능

## 주의
- 이미지는 **투명 PNG/WEBP, 몸통과 같은 캔버스 크기**로 만들면 그대로 겹쳐집니다 (기본 600×800, 설정에서 변경)
- PNG 저장은 이미지 서버가 CORS를 허용해야 합니다. Supabase 공개 버킷은 보통 되고, Firebase Storage는 안 될 수 있습니다
