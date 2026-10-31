# 마이룸 (그누보드 마이룸 스킨 → O.home 이식)

방 = 회원이 만드는 꾸미기 공간 / 보관함 = 관리자가 카테고리별로 등록해 두는 가구 목록

## 적용
1. 이 zip을 프로젝트 폴더(`package.json`이 있는 곳)에 풀어 같은 경로로 덮어쓰기
   - 새 파일: `src/app/myroom/*`, `src/components/myroom/*`, `src/lib/myroomStore.ts`, `public/myroom/myroom-editor.js`
   - 기존 파일에 줄만 추가: `types.ts`, `settingStore.ts`, `visFloor.ts`, `menu.ts`, `backup.ts` (+ 규칙·SQL 파일 4개)
     직접 고친 적이 있으면 덮어쓰지 말고 아래 "추가된 줄"만 옮기세요
2. GitHub에 올리기 → Vercel 자동 배포
3. **Firebase 규칙 다시 게시 (필수)** — `firebase/firestore.rules` 내용을 콘솔 → Firestore Database → 규칙에 붙여넣고 [게시]
   (Supabase를 쓴다면 `supabase/schema.sql`을 SQL Editor에서 다시 실행)
4. 환경설정 → 메뉴에서 **마이룸**(`/myroom`)을 원하는 그룹에 넣기

## 추가된 줄
- `types.ts` COLLECTION_OF: `'ohome.myroom.v1': 'myrooms'`, `'ohome.myroomcat.v1': 'myroom_catalog'`
- `settingStore.ts` SETTING_KEYS: `'ohome.myroomset.v1'`
- `visFloor.ts` AREA: `myrooms`, `myroom_catalog` → `/myroom`
- `menu.ts` FEATURES: `{ href: '/myroom', label: '마이룸' }`
- `backup.ts` RESET_CONTENT: 마이룸 항목
- 규칙/SQL: 컬렉션 2개 + 보관함(myroom_catalog)은 관리자만 쓰기

## 처음 쓸 때
1. 관리자: 방에 들어가 꾸미기 패널 → 카테고리 탭 → 「+」로 가구 이미지 등록 (원본 픽셀 크기 그대로 방에 들어가요)
2. 회원: `/myroom` 로비의 ✎로 내 방 만들기 → 보관함에서 가구를 눌러 놓고 끌어서 배치 → 저장하고 편집 종료
3. 카테고리 이름·순서·삭제는 꾸미기 패널 아래 「카테고리 관리(관리자)」

## 원본과 달라진 점
- 방 주인 확인은 비밀번호가 아니라 로그인 계정(방 만든 사람 + 관리자)으로 해요
- 방 이름·크기·배치는 저장 시 방 문서에 함께 저장돼요 (게시판 글 → 방 컬렉션)
- 선택 복사/이동 같은 게시판 기능은 없고, 로비에서는 선택 삭제만 있어요
- 이미지 내보내기는 이미지 서버가 CORS를 허용해야 해요 (원본과 동일)
