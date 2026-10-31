캐릭터(/chars) · 자관(/rels) 게시판 추가 파일
==========================================

전제: 같은 기본 틀(ohome → SISPI 계열, Next.js + Firestore/Supabase)을 쓰는 사이트.
이 파일들은 SISPI 'my-custom' 브랜치 기준이며, 실제 화면·빌드는 확인하지 못했습니다.
먼저 사이트를 백업(또는 새 브랜치)한 뒤 진행하세요.

1) 파일 넣기
   zip 안의 src/ 폴더를 프로젝트 src/ 위에 그대로 덮어씁니다.
   - src/app/chars/**, src/app/rels/**                 (페이지)
   - src/components/chars/**, src/components/rels/**   (화면 부품)
   - src/components/gallery/GalleryPostsEditor.tsx, GalleryPostsView.tsx
   - src/components/bgm/PageBgmEditor.tsx, src/components/ui/FadeImg.tsx
   - src/lib/charStore.ts, charRuleConfig.ts, charLayoutAlive.ts, relqStore.ts,
     cardSort.ts, useBgInk.ts, useBgTone.ts
   ※ charStore.ts · useBgInk.ts 등은 이미 있는 파일을 덮어쓰게 됩니다.
     다른 게시판(TRPG 등)이 쓰는 파일이므로, 덮어쓰기 전에 원본을 보관하세요.

2) CSS
   chars-rels.css 의 내용을 src/app/globals.css 맨 아래에 이어 붙입니다.
   (게시판 클래스만 뽑은 것이라, 기존 디자인과 겹치면 뒤에 붙인 쪽이 우선합니다.)

3) 메뉴 등록
   src/lib/menu.ts 에 아래 두 줄을 추가합니다.
     { href: '/chars', label: '캐릭터' },
     { href: '/rels',  label: '자관' },

4) 이미 있어야 하는 공용 파일 (이 zip에는 들어 있지 않음)
   src/components/ui/{ColorField,CropEditor,DragList,Kit,Lightbox,Modal,PageText,RichEditor,SymbolInput,Toast}.tsx
   src/components/gallery/GalleryViewer.tsx
   src/lib/{ThemeProvider,auth,bgmStore,blobStore,boardStore,color,currentUser,db,dnd,fontStore,
            galleryStore,link,mainStore,members,menuStore,pageRefresh,playOnce,postStore,rpStore,
            sanitize,sectionStore,serverConfig,settingStore,supabase,theme,useImgLight,visFloor}.ts(x)
   src/lib/backend/{index,types}.ts  (types.ts 의 COLLECTION_OF 에
       'ohome.chars.v1': 'characters', 'ohome.rels.v1': 'relations' 가 있어야 함)
   없는 파일이 있으면 빌드할 때 "Module not found" 로 알려 줍니다.

5) 확인
   npx tsc --noEmit  →  오류가 없는지 본 뒤 배포하세요.
