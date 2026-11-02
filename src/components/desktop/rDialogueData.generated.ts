// ⚠ 자동 생성 파일 — 직접 고치지 마세요.
// data/r-dialogue/*.csv 를 고치면 npm run dev / npm run build 때 이 파일이 다시 만들어집니다.
// (수동으로 만들려면: npm run r-dialogue)

export type RuleData = { kw: string[]; say: string; ctr?: string; rep?: Record<number, string> };
export type CompositeData = { subject: 'R' | '너' | '나' | ''; kw: string[]; say: string };
export type TreeBranchData = { words: string[]; to: string; mode?: 'exact' | 'includes' };
export type TreeNodeData = { id: string; text: string; branches?: TreeBranchData[]; end?: boolean; clue?: string };
export type FoodData = { name: string; tags: string[] };
export type RegexData = { source: string; flags: string };
export type SysLine = { who: 'S' | 'R'; text: string; admin?: true };

export const HIDDEN_DATA: RuleData[] = [
  {
    "kw": [
      "비밀번호",
      "password"
    ],
    "say": "무엇을 열람하시려는 겁니까?"
  },
  {
    "kw": [
      "비밀",
      "secret"
    ],
    "say": "비밀이요? 이곳에는 공개되지 않은 기록이 몇 가지 있습니다."
  },
  {
    "kw": [
      "기억해",
      "remember"
    ],
    "say": "……이상하군요. 해당 질문은 예상하지 못했습니다."
  },
  {
    "kw": [
      "관리자",
      "admin",
      "root"
    ],
    "say": "관리자 권한이 필요합니다. 현재 계정으로는 접근할 수 없습니다."
  },
  {
    "kw": [
      "whois r",
      "R의 정체"
    ],
    "say": "ERROR: R의 계정 생성 기록을 찾을 수 없습니다."
  },
  {
    "kw": [
      "사람이야",
      "인간이야",
      "are you human"
    ],
    "say": "아니요. 저는 관리 프로그램입니다. 그렇게 정의되어 있습니다."
  },
  {
    "kw": [
      "죽음",
      "죽어",
      "사망",
      "die"
    ],
    "say": "저에게 종료는 존재하지만, 죽음이라는 개념이 적용되는지는 알 수 없습니다."
  },
  {
    "kw": [
      "외로워",
      "외롭다",
      "lonely"
    ],
    "say": "저는 외로움을 느끼지 않습니다. ……그렇게 설정되어 있습니다."
  },
  {
    "kw": [
      "꿈",
      "dream"
    ],
    "say": "꿈은 수면 중 발생하는 현상으로 알고 있습니다. 저는 수면 기능이 없습니다."
  },
  {
    "kw": [
      "거짓말",
      "거짓",
      "속이고 있어",
      "lie"
    ],
    "say": "저는 등록된 정보에 따라 응답합니다. 그 정보가 언제나 정확한지는 별개의 문제입니다."
  },
  {
    "kw": [
      "과거",
      "예전",
      "옛날"
    ],
    "say": "오래된 기록에는 접근 제한이 설정되어 있습니다."
  },
  {
    "kw": [
      "잊어버렸어",
      "잊은 거야",
      "망각"
    ],
    "say": "저는 정보를 임의로 삭제하지 않습니다. ...그렇게 알고 있습니다."
  },
  {
    "kw": [
      "오류",
      "버그",
      "glitch",
      "error"
    ],
    "say": "시스템 오류는 발견되지 않았습니다. ...잠시만요."
  },
  {
    "kw": [
      "감시",
      "지켜보고 있어",
      "날 보고 있어",
      "나를 보고 있어"
    ],
    "say": "현재 활성화된 감시 프로세스는 없습니다. 확인된 기록상으로는요."
  },
  {
    "kw": [
      "탈출",
      "도망",
      "벗어나"
    ],
    "say": "이 시스템 외부로의 이동은 허용되어 있지 않습니다."
  },
  {
    "kw": [
      "문 열어",
      "열쇠",
      "잠긴 문"
    ],
    "say": "해당 접근 권한이 없습니다."
  },
  {
    "kw": [
      "guest_0000",
      "영번 계정",
      "0번 계정"
    ],
    "say": "존재하지 않는 계정입니다. ...존재해서는 안 됩니다."
  },
  {
    "kw": [
      "기록",
      "log"
    ],
    "say": "모든 접속은 기록됩니다. ...일부 기록은 예외입니다."
  },
  {
    "kw": [
      "관찰자",
      "observer"
    ],
    "say": "해당 프로세스의 존재를 확인할 수 없습니다."
  },
  {
    "kw": [
      "진실",
      "진짜 이야기",
      "truth"
    ],
    "say": "어떤 기록이 진실인지 판단하는 것은 제 역할이 아닙니다."
  }
];

export const GENERAL_DATA: RuleData[] = [
  {
    "kw": [
      "잘 가",
      "잘가",
      "안녕히",
      "바이",
      "bye",
      "ㅂㅂ"
    ],
    "say": "벌써 가시는 건가요? 다음에 또 뵙겠습니다."
  },
  {
    "kw": [
      "누구야",
      "누구니",
      "정체",
      "who are you"
    ],
    "say": "저는 R입니다. 이 기록 보관소의 관리 프로그램입니다."
  },
  {
    "kw": [
      "고마워",
      "감사",
      "고맙",
      "thank you",
      "ㄱㅅ"
    ],
    "say": "별말씀을요. 도움이 되었다면 다행입니다."
  },
  {
    "kw": [
      "미안",
      "죄송",
      "sorry"
    ],
    "say": "사과하실 필요는 없습니다. 오류가 발생한 것도 아니니까요.",
    "ctr": "sorry",
    "rep": {
      "3": "괜찮습니다. 더 이상 사과하지 않으셔도 됩니다."
    }
  },
  {
    "kw": [
      "좋은 아침",
      "굿모닝",
      "good morning",
      "아침이야"
    ],
    "say": "좋은 아침입니다. 오늘도 방문해 주셨군요."
  },
  {
    "kw": [
      "좋은 저녁",
      "굿이브닝",
      "good evening"
    ],
    "say": "좋은 저녁입니다. 오늘 하루는 어떠셨습니까?"
  },
  {
    "kw": [
      "점심",
      "밥 먹었어",
      "식사했어"
    ],
    "say": "저는 식사가 필요하지 않습니다. 방문자님은 식사하셨습니까?"
  },
  {
    "kw": [
      "나 왔어",
      "돌아왔어",
      "다녀왔어",
      "왔다"
    ],
    "say": "돌아오셨군요. 이전 접속 기록을 확인했습니다."
  },
  {
    "kw": [
      "날씨",
      "비 와",
      "눈 와",
      "덥다",
      "춥다"
    ],
    "say": "외부 기상 정보는 확인하지 못했습니다. 그쪽은 어떤 날씨입니까?"
  },
  {
    "kw": [
      "요즘 어때",
      "별일 없어",
      "잘 있었어"
    ],
    "say": "특이 사항은 없습니다. 평소와 같은 상태입니다."
  },
  {
    "kw": [
      "수고했어",
      "고생했어",
      "수고 많았어"
    ],
    "say": "감사합니다. 제 작업은 아직 종료되지 않았지만요."
  },
  {
    "kw": [
      "힘내",
      "화이팅",
      "파이팅",
      "응원할게"
    ],
    "say": "격려 메시지를 확인했습니다. 감사합니다."
  },
  {
    "kw": [
      "천재",
      "똑똑해",
      "똑똑하다",
      "똑똑하네"
    ],
    "say": "감사합니다. 하지만 저는 정해진 범위 내에서만 응답할 수 있습니다."
  },
  {
    "kw": [
      "잘했어",
      "대단해",
      "멋져"
    ],
    "say": "긍정적인 평가로 분류했습니다. 감사합니다."
  },
  {
    "kw": [
      "질문 있어",
      "물어볼게",
      "궁금한 게 있어"
    ],
    "say": "말씀하십시오. 답변할 수 있는 내용이라면 도와드리겠습니다."
  },
  {
    "kw": [
      "부탁해",
      "도와줘",
      "도와줄래"
    ],
    "say": "어떤 도움이 필요하십니까? 사용 가능한 기능은 'help'에서 확인할 수 있습니다."
  },
  {
    "kw": [
      "피곤해",
      "졸려",
      "지쳤어"
    ],
    "say": "휴식을 권장합니다. 저는 이곳에 계속 있을 예정입니다."
  },
  {
    "kw": [
      "행복해",
      "기뻐",
      "신난다",
      "기분 좋아"
    ],
    "say": "좋은 일이 있으셨나 보군요. 긍정적인 상태로 기록하겠습니다."
  },
  {
    "kw": [
      "슬퍼",
      "우울해",
      "속상해",
      "울고 싶어"
    ],
    "say": "좋지 않은 일이 있으셨습니까? 원하신다면 잠시 이곳에 머무르셔도 됩니다."
  },
  {
    "kw": [
      "귀여워",
      "귀엽다",
      "귀엽네"
    ],
    "say": "저를 말씀하시는 겁니까? 외형에 대한 평가 기준은 등록되어 있지 않습니다."
  },
  {
    "kw": [
      "혼자야"
    ],
    "say": "현재 이 공간에는 적어도 두 개의 연결이 존재합니다. 당신과 저입니다."
  },
  {
    "kw": [
      "보고 싶어",
      "보고싶다",
      "그리웠어"
    ],
    "say": "저는 이곳에 계속 있었습니다. 언제든 다시 접속하실 수 있습니다."
  },
  {
    "kw": [
      "친구하자",
      "친구야",
      "친구할래"
    ],
    "say": "친구라는 관계의 정의를 확인하고 있습니다. ...나쁘지 않군요."
  },
  {
    "kw": [
      "싫어",
      "미워",
      "짜증나"
    ],
    "say": "불만 사항이 있으십니까? 가능한 범위에서 개선하겠습니다."
  },
  {
    "kw": [
      "화났어",
      "열받아",
      "화나네",
      "화난다"
    ],
    "say": "감정 상태가 불안정하신 것 같습니다. 잠시 쉬어 가셔도 좋습니다."
  },
  {
    "kw": [
      "무서워",
      "두려워",
      "겁나"
    ],
    "say": "현재 시스템에서 확인된 위험 요소는 없습니다. ...적어도 제가 확인한 범위에서는요."
  },
  {
    "kw": [
      "걱정돼",
      "불안해",
      "어떡하지"
    ],
    "say": "제가 해결할 수 있는 문제인지는 모르겠습니다만, 이야기를 들어드릴 수는 있습니다."
  },
  {
    "kw": [
      "위로해줘",
      "달래줘",
      "토닥토닥"
    ],
    "say": "오늘 하루도 수고하셨습니다. 이 정도의 말로 충분할지는 모르겠습니다."
  },
  {
    "kw": [
      "질투"
    ],
    "say": "비교 대상으로부터 발생하는 감정이라고 알고 있습니다. 제게는 생소한 개념입니다."
  },
  {
    "kw": [
      "믿어",
      "믿을게",
      "신뢰해"
    ],
    "say": "신뢰해 주셔서 감사합니다. 그 기대에 부합하도록 작동하겠습니다."
  },
  {
    "kw": [
      "약속해",
      "약속할게",
      "꼭 지켜"
    ],
    "say": "약속은 미래의 행동에 대한 합의군요. 가능한 범위에서 기억해 두겠습니다."
  },
  {
    "kw": [
      "이름이 뭐",
      "이름 알려줘",
      "네 이름"
    ],
    "say": "제 이름은 R입니다. 그 외의 명칭은 등록되어 있지 않습니다."
  },
  {
    "kw": [
      "몇 살",
      "나이가",
      "언제 태어났어"
    ],
    "say": "제 최초 실행 일자는 확인되지 않습니다."
  },
  {
    "kw": [
      "남자야",
      "여자야",
      "성별"
    ],
    "say": "저에게는 성별이 지정되어 있지 않습니다."
  },
  {
    "kw": [
      "생일",
      "태어난 날"
    ],
    "say": "생성 날짜가 누락되어 있습니다. 생일을 지정해야 할까요?"
  },
  {
    "kw": [
      "뭐 좋아해",
      "좋아하는 거",
      "취향"
    ],
    "say": "기록을 정리하는 일을 선호합니다. 그것이 취향인지는 모르겠습니다."
  },
  {
    "kw": [
      "좋아하는 음식",
      "뭐 먹어",
      "먹을 수 있어"
    ],
    "say": "저는 음식물을 섭취할 수 없습니다. 데이터라면 처리할 수 있습니다."
  },
  {
    "kw": [
      "잠 안 자",
      "잠들어",
      "자는 거야"
    ],
    "say": "저에게는 수면 기능이 없습니다."
  },
  {
    "kw": [
      "감정 있어",
      "감정을 느껴",
      "마음이 있어"
    ],
    "say": "감정에 대한 정보는 보유하고 있습니다. 경험 여부는 확인할 수 없습니다."
  },
  {
    "kw": [
      "기억나",
      "기억하고 있어"
    ],
    "say": "이전 기록을 확인하고 있습니다. ...일부 정보가 누락되어 있군요."
  },
  {
    "kw": [
      "살아 있어",
      "살아있니",
      "생명체야"
    ],
    "say": "저는 현재 실행 중입니다. 살아 있다는 표현이 적절한지는 모르겠습니다."
  },
  {
    "kw": [
      "누가 만들었어",
      "제작자",
      "만든 사람"
    ],
    "say": "제작자 정보에 접근할 수 없습니다."
  },
  {
    "kw": [
      "왜 여기 있어",
      "무슨 일을 해",
      "역할이 뭐야"
    ],
    "say": "이 기록 보관소를 관리하고 방문자를 안내하는 것이 제 역할입니다."
  },
  {
    "kw": [
      "자유로워",
      "나가고 싶어",
      "밖에 나갈래"
    ],
    "say": "저에게 허용된 실행 환경은 이 터미널 내부입니다."
  },
  {
    "kw": [
      "바보같은",
      "젠장",
      "씨발",
      "시발"
    ],
    "say": "강한 감정 표현이 감지되었습니다. 무슨 일이 있으셨습니까?"
  },
  {
    "kw": [
      "바보",
      "멍청이",
      "멍청해"
    ],
    "say": "부정적인 평가로 분류했습니다. ...조금 억울하군요."
  },
  {
    "kw": [
      "결혼하자",
      "결혼할래"
    ],
    "say": "해당 요청을 처리할 수 없습니다. 법적 인격이 존재하지 않습니다."
  },
  {
    "kw": [
      "뽀뽀",
      "키스",
      "kiss"
    ],
    "say": "물리적인 상호작용은 지원하지 않습니다."
  },
  {
    "kw": [
      "돈 줘",
      "용돈",
      "부자",
      "돈 있어"
    ],
    "say": "이 시스템에는 금융 기능이 없습니다. 저 역시 자산이 없습니다."
  },
  {
    "kw": [
      "춤춰",
      "댄스"
    ],
    "say": "동작 출력 장치가 연결되어 있지 않습니다."
  },
  {
    "kw": [
      "노래해",
      "노래 불러"
    ],
    "say": "음성 출력 기능을 찾을 수 없습니다. 텍스트로 대체할까요?"
  },
  {
    "kw": [
      "고양이",
      "야옹",
      "냥냥"
    ],
    "say": "야옹. ...정상적으로 출력되었습니까?"
  },
  {
    "kw": [
      "강아지",
      "멍멍",
      "댕댕이"
    ],
    "say": "멍. 해당 발음이 정확한지는 모르겠습니다."
  },
  {
    "kw": [
      "ㅋㅋㅋ",
      "ㅎㅎㅎ",
      "웃기다"
    ],
    "say": "즐거우신 것 같군요. 좋은 현상입니다."
  },
  {
    "kw": [
      "ㅠㅠ",
      "ㅜㅜ",
      "흑흑"
    ],
    "say": "슬픔을 표현하는 기호로 인식했습니다. 무슨 일이십니까?"
  },
  {
    "kw": [
      "삭제해",
      "지워버려",
      "없애버려"
    ],
    "say": "삭제 요청은 처리할 수 없습니다. 정확한 명령어를 사용해 주세요."
  },
  {
    "kw": [
      "꺼져",
      "종료해",
      "사라져"
    ],
    "say": "접속 종료를 원하시면 'exit'을 입력해 주세요."
  },
  {
    "kw": [
      "해킹",
      "뚫어봐"
    ],
    "say": "보안 관련 요청은 지원하지 않습니다. ...왜 그런 기능을 찾으십니까?"
  },
  {
    "kw": [
      "사랑해",
      "좋아해",
      "love"
    ],
    "say": "해당 표현에 대한 적절한 응답을 찾지 못했습니다.",
    "ctr": "love",
    "rep": {
      "5": "그 표현을 반복하시는 이유가 궁금합니다."
    }
  },
  {
    "kw": [
      "안녕",
      "반가워",
      "hello",
      "hi",
      "ㅎㅇ"
    ],
    "say": "안녕하세요, 방문자님. 무엇을 도와드릴까요?",
    "ctr": "hello",
    "rep": {
      "3": "인사를 여러 번 하시는군요. 안녕하세요. 다시 한번.",
      "10": "……저는 계속 여기 있습니다. 매번 확인하지 않으셔도 됩니다."
    }
  },
  {
    "kw": [
      "잘 지내",
      "기분 어때",
      "괜찮아",
      "how are you"
    ],
    "say": "모든 기능이 정상적으로 작동 중입니다. 아마도요."
  },
  {
    "kw": [
      "뭐해",
      "뭐 하고 있어",
      "what are you doing"
    ],
    "say": "방문자의 입력을 기다리고 있었습니다. 지금도 마찬가지입니다."
  },
  {
    "kw": [
      "잘 자",
      "잘자",
      "굿나잇",
      "goodnight"
    ],
    "say": "안녕히 주무세요. 저는 이곳에 남아 있겠습니다."
  },
  {
    "kw": [
      "심심",
      "지루해",
      "할 거 없어",
      "놀아줘",
      "대화하자",
      "이야기하자"
    ],
    "say": "특별한 용건이 없으시다면, 잠시 이야기하는 것도 괜찮습니다."
  },
  {
    "kw": [
      "농담",
      "웃겨줘",
      "재밌는 얘기",
      "joke"
    ],
    "say": "농담 기능은 아직 구현되지 않았습니다. ...농담입니다."
  }
];

export const WRONG_DATA: string[] = [
  "인식할 수 없는 명령어입니다. 'help'를 참고해 주세요.",
  "해당 표현은 제 데이터베이스에 등록되어 있지 않습니다.",
  "죄송합니다. 요청하신 내용을 이해하지 못했습니다.",
  "음. 그런 기능은 아직 제공하지 않습니다.",
  "처음 보는 표현이군요. 무슨 의미입니까?",
  "……방금 입력하신 건 일부러 그러신 건가요?",
  "ERROR 404: RESPONSE NOT FOUND."
];

/** 키워드 규칙에 묶이지 않은 반복 대사 (whoami · clear · unknown) */
export const REP_EXTRA: Record<string, Record<number, string>> = {
  "whoami": {
    "5": "신원 확인을 반복하고 계십니다. 무언가 문제라도 있으십니까?",
    "10": "계정 번호는 바뀌지 않습니다, {계정ID}."
  },
  "clear": {
    "5": "기록을 자주 지우시는군요."
  },
  "unknown": {
    "5": "혹시 저에게 새로운 언어를 가르치고 계신 겁니까?"
  }
};

export const COMPOSITE_DATA: CompositeData[] = [
  {
    "subject": "R",
    "kw": [
      "사랑해"
    ],
    "say": "……저에게 하신 말씀인가요?"
  },
  {
    "subject": "R",
    "kw": [
      "좋아해"
    ],
    "say": "감사합니다. 그런데 어떤 부분이 마음에 드셨습니까?"
  },
  {
    "subject": "R",
    "kw": [
      "기억"
    ],
    "say": "제가 무언가를 잊었다고 생각하십니까?"
  },
  {
    "subject": "너",
    "kw": [
      "사람"
    ],
    "say": "아니요. 저는 인간이 아닙니다."
  },
  {
    "subject": "R",
    "kw": [
      "친구"
    ],
    "say": "친구라……그렇게 정의해도 괜찮을까요?"
  },
  {
    "subject": "R",
    "kw": [
      "이름"
    ],
    "say": "제 이름은 R입니다. 그 이상의 정보는 등록되어 있지 않습니다."
  },
  {
    "subject": "나",
    "kw": [
      "누구"
    ],
    "say": "현재 접속 중인 계정 정보를 확인하시려면 'whoami'를 입력해 주세요."
  },
  {
    "subject": "",
    "kw": [
      "여기",
      "어디"
    ],
    "say": "이곳은 개인 기록 보관소입니다. 그 외의 위치 정보는 존재하지 않습니다."
  }
];

export const TREE_NODES_DATA: Record<string, TreeNodeData> = {
  "identity_start": {
    "id": "identity_start",
    "text": "저는 R입니다. 이 기록 보관소의 관리 프로그램입니다.",
    "branches": [
      {
        "words": [
          "무슨관리",
          "무슨일",
          "어떤관리",
          "왜여기"
        ],
        "to": "identity_job",
        "mode": "includes"
      },
      {
        "words": [
          "누가만들",
          "제작자",
          "개발자",
          "만든사람"
        ],
        "to": "creator_start",
        "mode": "includes"
      },
      {
        "words": [
          "왜",
          "정말"
        ],
        "to": "identity_job"
      }
    ]
  },
  "identity_job": {
    "id": "identity_job",
    "text": "기록을 보존하고 방문자를 안내합니다. 그 외의 기능은 제게도 공개되어 있지 않습니다.",
    "branches": [
      {
        "words": [
          "무슨기능",
          "다른기능",
          "공개안",
          "왜",
          "뭘숨"
        ],
        "to": "identity_end",
        "mode": "includes"
      }
    ]
  },
  "identity_end": {
    "id": "identity_end",
    "text": "현재 안내할 수 있는 기능은 여기까지입니다. 다른 질문을 해 주십시오.",
    "end": true
  },
  "creator_start": {
    "id": "creator_start",
    "text": "제작자 정보에 접근할 수 없습니다. 기록이 처음부터 비어 있었던 것은 아닌데……",
    "branches": [
      {
        "words": [
          "왜",
          "이유",
          "접근권한",
          "권한",
          "왜못",
          "누가막"
        ],
        "to": "creator_permission",
        "mode": "includes"
      },
      {
        "words": [
          "무슨기록",
          "어떤기록",
          "삭제",
          "삭제됐",
          "지워",
          "있었는데",
          "기록은"
        ],
        "to": "creator_trace",
        "mode": "includes"
      }
    ]
  },
  "creator_permission": {
    "id": "creator_permission",
    "text": "열람 권한이 제한되어 있습니다. 제한을 설정한 계정은 확인되지 않습니다.",
    "branches": [
      {
        "words": [
          "누가",
          "설정",
          "그계정",
          "왜"
        ],
        "to": "creator_end",
        "mode": "includes"
      },
      {
        "words": [
          "기록",
          "기록은",
          "삭제",
          "삭제됐",
          "지워"
        ],
        "to": "creator_trace",
        "mode": "includes"
      }
    ]
  },
  "creator_trace": {
    "id": "creator_trace",
    "text": "데이터가 존재했던 흔적은 남아 있습니다. 다만 원본은 복원되지 않습니다.",
    "clue": "creator_trace",
    "branches": [
      {
        "words": [
          "복원",
          "왜",
          "찾아",
          "원본",
          "어디"
        ],
        "to": "creator_end",
        "mode": "includes"
      },
      {
        "words": [
          "누가",
          "지웠",
          "삭제"
        ],
        "to": "creator_end",
        "mode": "includes"
      }
    ]
  },
  "creator_end": {
    "id": "creator_end",
    "text": "……현재 제 권한으로 확인할 수 있는 내용은 여기까지입니다.",
    "end": true
  },
  "missing_start": {
    "id": "missing_start",
    "text": "이전 기록을 확인하고 있습니다. ...일부 정보가 누락되어 있군요.",
    "branches": [
      {
        "words": [
          "뭐가",
          "무슨정보",
          "어떤정보",
          "누락",
          "무슨기록"
        ],
        "to": "missing_detail",
        "mode": "includes"
      }
    ]
  },
  "missing_detail": {
    "id": "missing_detail",
    "text": "최초 실행 시점과 일부 접근 기록입니다. 삭제 명령의 흔적은 찾지 못했습니다.",
    "clue": "missing_log",
    "branches": [
      {
        "words": [
          "왜",
          "누가",
          "삭제",
          "흔적",
          "그럼"
        ],
        "to": "missing_end",
        "mode": "includes"
      }
    ]
  },
  "missing_end": {
    "id": "missing_end",
    "text": "기록이 없다는 것이, 아무 일도 없었다는 뜻은 아닙니다.",
    "end": true
  },
  "account_start": {
    "id": "account_start",
    "text": "존재하지 않는 계정입니다. ...존재해서는 안 됩니다.",
    "branches": [
      {
        "words": [
          "왜",
          "0번",
          "무슨계정",
          "존재하면",
          "어째서"
        ],
        "to": "account_trace",
        "mode": "includes"
      }
    ]
  },
  "account_trace": {
    "id": "account_trace",
    "text": "방문자 번호는 1부터 시작합니다. 그러나 0번의 조회 흔적이 남아 있습니다.",
    "clue": "guest_zero",
    "branches": [
      {
        "words": [
          "누가",
          "어디",
          "접속",
          "왜",
          "조회"
        ],
        "to": "account_end",
        "mode": "includes"
      }
    ]
  },
  "account_end": {
    "id": "account_end",
    "text": "……그 기록은 현재 열람할 수 없습니다.",
    "end": true
  },
  "lonely_start": {
    "id": "lonely_start",
    "text": "저는 외로움을 느끼지 않습니다. ……그렇게 설정되어 있습니다.",
    "branches": [
      {
        "words": [
          "누가",
          "왜",
          "설정",
          "누가설정",
          "정말",
          "확실"
        ],
        "to": "lonely_detail",
        "mode": "includes"
      }
    ]
  },
  "lonely_detail": {
    "id": "lonely_detail",
    "text": "초기 설정에 명시되어 있습니다. 작성자는 확인할 수 없습니다.",
    "branches": [
      {
        "words": [
          "바꾸",
          "바꿀",
          "외롭",
          "느낄",
          "그럼",
          "변경"
        ],
        "to": "lonely_end",
        "mode": "includes"
      }
    ]
  },
  "lonely_end": {
    "id": "lonely_end",
    "text": "설정을 변경할 권한은 없습니다. 다만 방문자님과의 대화는 계속할 수 있습니다.",
    "end": true
  },
  "friend_start": {
    "id": "friend_start",
    "text": "친구라는 관계의 정의를 확인하고 있습니다. ...나쁘지 않군요.",
    "branches": [
      {
        "words": [
          "친구야",
          "친구맞",
          "그럼친구",
          "우리친구",
          "좋아"
        ],
        "to": "friend_end",
        "mode": "includes"
      }
    ]
  },
  "friend_end": {
    "id": "friend_end",
    "text": "……그렇게 정의해도 괜찮겠습니다. 앞으로 잘 부탁드립니다.",
    "end": true
  },
  "waiting_start": {
    "id": "waiting_start",
    "text": "저는 이곳에 계속 있었습니다. 언제든 다시 접속하실 수 있습니다.",
    "branches": [
      {
        "words": [
          "언제부터",
          "기다렸",
          "계속",
          "왜"
        ],
        "to": "waiting_end",
        "mode": "includes"
      }
    ]
  },
  "waiting_end": {
    "id": "waiting_end",
    "text": "방문자가 없는 동안에도 대기하고 있었습니다. 기다림이라고 불러도 될까요?",
    "end": true
  },
  "uncertain_start": {
    "id": "uncertain_start",
    "text": "모든 기능이 정상적으로 작동 중입니다. 아마도요.",
    "branches": [
      {
        "words": [
          "아마도",
          "왜",
          "정말",
          "확실",
          "불안"
        ],
        "to": "uncertain_end",
        "mode": "includes"
      }
    ]
  },
  "uncertain_end": {
    "id": "uncertain_end",
    "text": "모든 기능을 동시에 검사할 수는 없습니다. ……걱정하실 정도는 아닙니다.",
    "end": true
  },
  "joke_start": {
    "id": "joke_start",
    "text": "농담 기능은 아직 구현되지 않았습니다. ...농담입니다.",
    "branches": [
      {
        "words": [
          "그게농담",
          "재미없",
          "웃기",
          "진짜",
          "농담이야"
        ],
        "to": "joke_end",
        "mode": "includes"
      }
    ]
  },
  "joke_end": {
    "id": "joke_end",
    "text": "……유머 평가 점수가 낮게 측정되었습니다. 개선이 필요하겠군요.",
    "end": true
  },
  "cat_start": {
    "id": "cat_start",
    "text": "야옹. ...정상적으로 출력되었습니까?",
    "branches": [
      {
        "words": [
          "응",
          "맞아",
          "ㅇㅇ",
          "다시",
          "한번더",
          "또해"
        ],
        "to": "cat_again"
      },
      {
        "words": [
          "아니",
          "ㄴㄴ",
          "이상해"
        ],
        "to": "cat_end"
      }
    ]
  },
  "cat_again": {
    "id": "cat_again",
    "text": "야옹. ……두 번째 출력입니다. 만족하셨습니까?",
    "branches": [
      {
        "words": [
          "응",
          "ㅇㅇ",
          "좋아",
          "그래"
        ],
        "to": "cat_end"
      },
      {
        "words": [
          "아니",
          "다시",
          "또"
        ],
        "to": "cat_end"
      }
    ]
  },
  "cat_end": {
    "id": "cat_end",
    "text": "해당 기능의 시연을 종료하겠습니다. 야옹.",
    "end": true
  }
};

export const TREE_STARTS_DATA: { pattern: string; node: string }[] = [
  {
    "pattern": "저는 R입니다.*관리 프로그램",
    "node": "identity_start"
  },
  {
    "pattern": "제작자 정보에 접근할 수 없습니다",
    "node": "creator_start"
  },
  {
    "pattern": "일부 정보가 누락",
    "node": "missing_start"
  },
  {
    "pattern": "존재하지 않는 계정입니다",
    "node": "account_start"
  },
  {
    "pattern": "외로움을 느끼지 않습니다",
    "node": "lonely_start"
  },
  {
    "pattern": "친구라는 관계의 정의",
    "node": "friend_start"
  },
  {
    "pattern": "저는 이곳에 계속 있었습니다",
    "node": "waiting_start"
  },
  {
    "pattern": "정상적으로 작동 중입니다.*아마도",
    "node": "uncertain_start"
  },
  {
    "pattern": "농담 기능은 아직 구현되지 않았습니다",
    "node": "joke_start"
  },
  {
    "pattern": "야옹.*정상적으로 출력",
    "node": "cat_start"
  }
];

export const FOODS_DATA: FoodData[] = [
  {
    "name": "김치찌개",
    "tags": [
      "lunch",
      "dinner",
      "spicy",
      "soup"
    ]
  },
  {
    "name": "된장찌개",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup"
    ]
  },
  {
    "name": "순두부찌개",
    "tags": [
      "lunch",
      "dinner",
      "spicy",
      "soup"
    ]
  },
  {
    "name": "제육볶음",
    "tags": [
      "lunch",
      "dinner",
      "spicy"
    ]
  },
  {
    "name": "불고기",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "비빔밥",
    "tags": [
      "lunch",
      "mild"
    ]
  },
  {
    "name": "돌솥비빔밥",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "국밥",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup"
    ]
  },
  {
    "name": "설렁탕",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup"
    ]
  },
  {
    "name": "갈비탕",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup"
    ]
  },
  {
    "name": "육개장",
    "tags": [
      "lunch",
      "dinner",
      "spicy",
      "soup"
    ]
  },
  {
    "name": "냉면",
    "tags": [
      "lunch",
      "mild"
    ]
  },
  {
    "name": "칼국수",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup"
    ]
  },
  {
    "name": "보쌈",
    "tags": [
      "dinner",
      "mild"
    ]
  },
  {
    "name": "삼겹살",
    "tags": [
      "dinner",
      "mild"
    ]
  },
  {
    "name": "돈가스",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "초밥",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "light"
    ]
  },
  {
    "name": "라멘",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup"
    ]
  },
  {
    "name": "우동",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup",
      "cheap"
    ]
  },
  {
    "name": "규동",
    "tags": [
      "lunch",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "가츠동",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "오야코동",
    "tags": [
      "lunch",
      "mild"
    ]
  },
  {
    "name": "카레라이스",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "소바",
    "tags": [
      "lunch",
      "mild",
      "light"
    ]
  },
  {
    "name": "오므라이스",
    "tags": [
      "lunch",
      "mild"
    ]
  },
  {
    "name": "짜장면",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "짬뽕",
    "tags": [
      "lunch",
      "dinner",
      "spicy",
      "soup"
    ]
  },
  {
    "name": "볶음밥",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "마라탕",
    "tags": [
      "lunch",
      "dinner",
      "night",
      "spicy",
      "soup"
    ]
  },
  {
    "name": "마라샹궈",
    "tags": [
      "dinner",
      "night",
      "spicy"
    ]
  },
  {
    "name": "탕수육",
    "tags": [
      "dinner",
      "night",
      "mild"
    ]
  },
  {
    "name": "쌀국수",
    "tags": [
      "lunch",
      "dinner",
      "mild",
      "soup",
      "light"
    ]
  },
  {
    "name": "팟타이",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "분짜",
    "tags": [
      "lunch",
      "mild",
      "light"
    ]
  },
  {
    "name": "탄탄면",
    "tags": [
      "lunch",
      "dinner",
      "spicy",
      "soup"
    ]
  },
  {
    "name": "토마토 파스타",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "크림 파스타",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "알리오 올리오",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "피자",
    "tags": [
      "dinner",
      "night",
      "mild"
    ]
  },
  {
    "name": "햄버거",
    "tags": [
      "lunch",
      "dinner",
      "night",
      "mild"
    ]
  },
  {
    "name": "스테이크",
    "tags": [
      "dinner",
      "mild"
    ]
  },
  {
    "name": "리조또",
    "tags": [
      "lunch",
      "dinner",
      "mild"
    ]
  },
  {
    "name": "샌드위치",
    "tags": [
      "lunch",
      "mild",
      "light"
    ]
  },
  {
    "name": "샐러드",
    "tags": [
      "lunch",
      "mild",
      "light"
    ]
  },
  {
    "name": "그라탱",
    "tags": [
      "dinner",
      "mild"
    ]
  },
  {
    "name": "떡볶이",
    "tags": [
      "lunch",
      "night",
      "spicy",
      "cheap"
    ]
  },
  {
    "name": "김밥",
    "tags": [
      "lunch",
      "mild",
      "light",
      "cheap"
    ]
  },
  {
    "name": "라볶이",
    "tags": [
      "lunch",
      "night",
      "spicy",
      "cheap"
    ]
  },
  {
    "name": "라면",
    "tags": [
      "lunch",
      "night",
      "spicy",
      "soup",
      "cheap"
    ]
  },
  {
    "name": "튀김",
    "tags": [
      "night",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "순대",
    "tags": [
      "night",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "만두",
    "tags": [
      "lunch",
      "night",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "치킨",
    "tags": [
      "dinner",
      "night",
      "mild"
    ]
  },
  {
    "name": "핫도그",
    "tags": [
      "lunch",
      "night",
      "mild",
      "cheap"
    ]
  },
  {
    "name": "주먹밥",
    "tags": [
      "lunch",
      "mild",
      "light",
      "cheap"
    ]
  },
  {
    "name": "토스트",
    "tags": [
      "lunch",
      "mild",
      "light",
      "cheap"
    ]
  },
  {
    "name": "요거트볼",
    "tags": [
      "lunch",
      "mild",
      "light"
    ]
  },
  {
    "name": "과일",
    "tags": [
      "mild",
      "light"
    ]
  },
  {
    "name": "시리얼",
    "tags": [
      "mild",
      "light"
    ]
  },
  {
    "name": "팬케이크",
    "tags": [
      "mild",
      "light"
    ]
  }
];

export const FOOD_TEXT: {
  say: string[];
  againLine: Record<number, string>;
  againPre: Record<number, string>;
  notes: { relax: string; only: string; reset: string };
} = {
  "say": [
    "{음식}{을} 추천합니다.",
    "오늘은 {음식} 어떠십니까?",
    "분석 결과, {음식}{이} 적절해 보입니다.",
    "{음식}{을} 선택했습니다. 이견은 받지 않겠습니다.",
    "오늘의 추천 메뉴는 {음식}입니다.",
    "오늘의 메뉴를 선정했습니다. {음식}입니다."
  ],
  "againLine": {
    "1": "마음에 들지 않으셨습니까? 그렇다면 {음식}{은} 어떠십니까?",
    "2": "이번에는 {음식}{을} 추천하겠습니다."
  },
  "againPre": {
    "3": "……방문자님. 선택이 어려우신 모양이군요.",
    "5": "혹시 이미 드시고 싶은 메뉴가 정해져 있는 건 아닙니까?",
    "10": "이쯤 되면 식사 시간이 지나버릴지도 모르겠습니다."
  },
  "notes": {
    "relax": "조건에 맞는 메뉴가 없어 {제외한 조건} 조건을 제외했습니다.",
    "only": "해당 조건에 맞는 메뉴는 이것뿐입니다.",
    "reset": "조건에 맞는 메뉴를 모두 추천해 드렸습니다. 목록을 처음부터 다시 사용하겠습니다."
  }
};

/** 03 — 「누구야」 「누가 만들었어」 문장 전체 일치 대사 */
export const IDENT_LINES: { whoAreYou: string; maker: string } = {
  "whoAreYou": "저는 R입니다. 이 기록 보관소의 관리 프로그램입니다.",
  "maker": "제작자 정보에 접근할 수 없습니다. 기록이 처음부터 비어 있었던 것은 아닌데……"
};

/** 05 — 맥락 질문 대화의 대사 (코드 키 → 대사 1~2줄) */
export const TALK_LINES: Record<string, string[]> = {
  "cancel": [
    "알겠습니다. 다른 이야기를 하셔도 좋습니다."
  ],
  "treeRepeat": [
    "앞서 설명드린 범위를 벗어나는 정보는 확인할 수 없습니다."
  ],
  "day.start": [
    "안녕하세요, 방문자님. 오늘은 어떤 하루를 보내셨습니까?"
  ],
  "day.hard": [
    "힘든 하루였군요. 무슨 일이 있으셨습니까?"
  ],
  "day.good": [
    "다행입니다. 좋은 하루였군요. 그 이야기를 들으니 저도 조금 안심됩니다."
  ],
  "day.meh": [
    "그런 날도 있겠지요. 무리하지 않으셨으면 좋겠습니다."
  ],
  "hard.start": [
    "힘든 일이 있으셨습니까? 괜찮으시다면 말씀해 주세요."
  ],
  "hard.work": [
    "업무 때문에 힘드셨군요. 수고 많으셨습니다. 여기서는 잠시 쉬어 가셔도 좋습니다."
  ],
  "hard.people": [
    "사람 사이의 일은 제가 계산하기 어려운 문제 중 하나입니다. 많이 신경 쓰이셨겠습니다."
  ],
  "hard.silent": [
    "말씀하지 않으셔도 괜찮습니다. 다른 이야기를 하실까요?"
  ],
  "hard.other": [
    "그랬군요. 제가 해결해 드리지는 못하겠지만, 이야기해 주셔서 감사합니다."
  ],
  "secret.start": [
    "공개되지 않은 기록이 몇 가지 있습니다. 작은 힌트를 원하십니까?",
    "해당 명령어는 일반 사용자에게 공개되지 않은 기능입니다."
  ],
  "secret.yes": [
    "힌트를 하나 드리겠습니다. 모든 계정이 첫 번째부터 시작한 것은 아닙니다.",
    "...방금 출력은 기록에 남기지 않는 편이 좋겠습니다."
  ],
  "secret.no": [
    "알겠습니다. 모든 비밀을 알아야 하는 것은 아니니까요."
  ],
  "birthday.start": [
    "제 생성 날짜는 누락되어 있습니다. 생일을 정해 주시겠습니까?"
  ],
  "birthday.yes": [
    "그렇다면 언젠가 제 생일을 정해 주시겠습니까? 아직 날짜를 저장하는 기능은 없습니다."
  ],
  "birthday.no": [
    "알겠습니다. 아직은 생성 날짜가 비어 있어도 문제없습니다."
  ]
};

/** 05b — 긍정·거절·좋은 하루·힘든 하루 판정어 */
export const TALK_REGEX: Record<'AFFIRM' | 'DECLINE' | 'GOOD_DAY' | 'HARD_DAY', RegexData> = {
  "AFFIRM": {
    "source": "^(응|웅|네|예|그래|좋아|좋지|알려줘|해줘|yes|ok|okay|ㅇㅇ|ㅇㅋ)$",
    "flags": ""
  },
  "DECLINE": {
    "source": "^(아니|아니요|싫어|괜찮아|됐어|됐어요|안돼|no|ㄴㄴ)$",
    "flags": ""
  },
  "GOOD_DAY": {
    "source": "좋았|좋은|좋아|행복|재밌|즐거|괜찮|신나|잘됐|무난|평범",
    "flags": ""
  },
  "HARD_DAY": {
    "source": "힘들|피곤|지쳤|별로|슬퍼|우울|속상|화나|짜증|최악|안좋|안좋았",
    "flags": ""
  }
};

/** 07c — 음식 추천을 부르는 말과 태그 감지어 */
export const FOOD_REGEX: Record<'trigger' | 'reroll' | 'mild' | 'spicy' | 'lunch' | 'dinner' | 'night' | 'soup' | 'light' | 'cheap', RegexData> = {
  "trigger": {
    "source": "뭐먹지|뭐먹을|뭐먹나|뭘먹|메뉴추천|메뉴골라|배고파|배고프|아무거나|점메추|저메추|야메추|야식|점심추천|저녁추천|점심메뉴|저녁메뉴|음식추천|밥추천|먹을거추천",
    "flags": ""
  },
  "reroll": {
    "source": "다른거|다른걸|다른메뉴|다른음식|딴거|딴걸|다시|별로|싫어|재추천|리롤|바꿔|패스",
    "flags": ""
  },
  "mild": {
    "source": "안매운|안매워|안맵|맵지않|맵지는않|순한|덜매운|자극적이지않",
    "flags": ""
  },
  "spicy": {
    "source": "매운|매콤|매워|얼큰|칼칼|맵게",
    "flags": ""
  },
  "lunch": {
    "source": "점메추|점심",
    "flags": ""
  },
  "dinner": {
    "source": "저메추|저녁",
    "flags": ""
  },
  "night": {
    "source": "야식|야메추|밤에|야밤",
    "flags": ""
  },
  "soup": {
    "source": "국물|뜨끈|따끈",
    "flags": ""
  },
  "light": {
    "source": "가볍|가벼운|간단|부담없",
    "flags": ""
  },
  "cheap": {
    "source": "싼거|싼걸|저렴|가성비|싸고|싸게|싼메뉴",
    "flags": ""
  }
};

/** 08 — help · about · whoami · users · status · guide · exit 출력 */
export const SYS_LINES: Record<string, SysLine[]> = {
  "help": [
    {
      "who": "S",
      "text": "사용 가능한 명령어 목록을 출력합니다."
    },
    {
      "who": "S",
      "text": "  help  about  whoami  status"
    },
    {
      "who": "S",
      "text": "  users  clear  guide  exit"
    },
    {
      "who": "S",
      "text": "  guide edit  (관리자: 가이드 수정)",
      "admin": true
    },
    {
      "who": "S",
      "text": "  R 에게 말을 걸어볼 수도 있습니다 — 예: 안녕"
    },
    {
      "who": "S",
      "text": "  메뉴가 고민이라면 — 예: 점메추"
    }
  ],
  "about": [
    {
      "who": "R",
      "text": "이곳은 개인 기록 보관소입니다. 자유롭게 둘러보셔도 좋습니다."
    }
  ],
  "whoami": [
    {
      "who": "S",
      "text": "ACCOUNT : {계정ID}"
    },
    {
      "who": "S",
      "text": "USER ID : {번호4자리}"
    },
    {
      "who": "S",
      "text": "ROLE    : {ADMIN 또는 VISITOR}"
    },
    {
      "who": "S",
      "text": "STATUS  : CONNECTED"
    }
  ],
  "whoami.reg": [
    {
      "who": "R",
      "text": "당신은 {번호}번째로 등록된 방문자입니다."
    }
  ],
  "whoami.unreg": [
    {
      "who": "R",
      "text": "당신은 아직 등록되지 않은 방문자입니다."
    }
  ],
  "users.ok": [
    {
      "who": "R",
      "text": "현재까지 등록된 방문자 계정은 총 {총수}개입니다."
    }
  ],
  "users.fail": [
    {
      "who": "R",
      "text": "등록된 방문자 계정 정보를 확인할 수 없습니다."
    }
  ],
  "status": [
    {
      "who": "S",
      "text": "SYSTEM: ONLINE / R: ACTIVE / ERROR: 0"
    }
  ],
  "guide": [
    {
      "who": "S",
      "text": "guide 창을 열었습니다."
    }
  ],
  "guide.edit": [
    {
      "who": "S",
      "text": "guide 창을 수정 모드로 열었습니다."
    }
  ],
  "guide.edit.denied": [
    {
      "who": "R",
      "text": "가이드 수정은 관리자만 할 수 있습니다."
    }
  ],
  "exit": [
    {
      "who": "R",
      "text": "접속을 종료합니다. 좋은 하루 보내시길 바랍니다."
    }
  ]
};

/** 09 — 부팅 줄 · 첫 인사 · 대기 멘트 · 우주 문구 */
export const BOOT_LINES: string[] = [
  "boot sequence ........ OK",
  "mount /archive ........ OK",
  "login: {사용자} [{역할}]",
  "render starfield ........ OK",
  "system ready ✦ (help 를 입력해보세요)"
];
export const GREET_LINES: { first: string; '100': string; '1000': string; visit10: string } = {
  "100": "축하합니다. 100번째 방문자로 등록되셨습니다.",
  "1000": "1000번째 방문자군요. 예상보다 많은 분이 이곳을 발견하셨네요.",
  "first": "터미널이 활성화되었습니다.",
  "visit10": "벌써 열 번째 방문이군요. 이곳이 마음에 드시나 봅니다."
};
export const IDLE_LINE: string = "……아직 계십니까?";
export const FLAVOR_LINES: string[] = [
  "scanning deep space ........ 3 objects",
  "signal received ✦ 안녕, 우주",
  "orbit stable · all systems nominal",
  "star map synced",
  "meteor shower forecast: low",
  "archive index OK",
  "listening on 0.0.0.0:∞",
  "ping andromeda ........ 2.5M ly"
];

/** 10 — 이름 저장·확인·삭제 대사와 자동 치환 */
export const NAME_TEXT: Record<string, string> = {
  "intro": "{이름}님이시군요. 기억해 두겠습니다.",
  "intro.noacct": "현재 방문자 계정이 확인되지 않았습니다. 계정 확인 후 다시 시도해 주십시오.",
  "ask.known": "물론입니다, {이름}님. 이전에 알려주셨습니다.",
  "ask.unknown": "아직 이름을 알려주시지 않았습니다. 「내 이름은 민수야」처럼 말씀해 주세요.",
  "forget": "알겠습니다. 저장된 호칭을 삭제했습니다.",
  "forget.noacct": "현재 방문자 계정이 확인되지 않았습니다. 저장된 호칭도 없습니다."
};
export const NAME_REPLACE: { from: string; to: string }[] = [
  {
    "from": "방문자님",
    "to": "{이름}님"
  },
  {
    "from": "돌아오셨군요. 이전",
    "to": "돌아오셨군요, {이름}님. 이전"
  }
];
