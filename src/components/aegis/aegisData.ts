export type AppId = 'status' | 'archive' | 'specimens' | 'incidents' | 'surveillance' | 'mail';

export type FacilityApp = {
  id: AppId;
  label: string;
  code: string;
  glyph: string;
  accent: 'cyan' | 'amber' | 'red' | 'mint';
  description: string;
};

export const apps: FacilityApp[] = [
  { id: 'status', label: 'FACILITY STATUS', code: 'SYS-00', glyph: '◌', accent: 'mint', description: '시설 상태 · 시스템 안내' },
  { id: 'archive', label: 'ARCHIVE BROWSER', code: 'ARC-01', glyph: '▣', accent: 'cyan', description: '기록 보관소 · 디렉터리' },
  { id: 'specimens', label: 'SPECIMEN DATABASE', code: 'BIO-02', glyph: '◉', accent: 'mint', description: '실험체 현황 · 관찰값' },
  { id: 'incidents', label: 'INCIDENT LOG', code: 'SEC-03', glyph: '△', accent: 'amber', description: '보안 사건 · 보고서' },
  { id: 'surveillance', label: 'SURVEILLANCE', code: 'CAM-04', glyph: '◫', accent: 'red', description: '감시망 · 현장 신호' },
  { id: 'mail', label: 'INTERNAL MAIL', code: 'COM-05', glyph: '✉', accent: 'cyan', description: '내부 통신 · 수신함' },
];

export const archiveFiles = [
  { id: 'root', name: 'ROOT // AEGIS-NET', type: 'folder', level: 'L2', date: '2089.10.21' },
  { id: 'operations', name: '01_OPERATIONS', type: 'folder', level: 'L2', date: '2089.10.21' },
  { id: 'bio', name: '02_BIOLOGICAL', type: 'folder', level: 'L2', date: '2089.10.20' },
  { id: 'incident', name: '03_INCIDENTS', type: 'folder', level: 'L2', date: '2089.10.18' },
  { id: 'ops-note', name: 'OPS_NOTE_79.txt', type: 'document', level: 'L2', date: '2089.10.21' },
  { id: 'floor-plan', name: 'LOWER_FACILITY.map', type: 'map', level: 'L1', date: '2089.10.10' },
  { id: 'redacted', name: 'PROJECT_ORPHEUS', type: 'sealed', level: 'L3', date: '2089.09.29' },
];

export const specimenRecords = [
  { id: 'S-01', name: 'SEEDLING', state: 'DORMANT', risk: 'LOW', vital: '04.2 Hz', color: 'mint', note: '배양 47일차. 자극에 대한 반응 없음.' },
  { id: 'S-04', name: 'HOLLOW', state: 'OBSERVATION', risk: 'ELEVATED', vital: '16.8 Hz', color: 'amber', note: '벽면 공명 패턴이 야간에만 발생.' },
  { id: 'S-07', name: 'ORPHEUS', state: 'REDACTED', risk: 'CRITICAL', vital: '—', color: 'red', note: 'L3 인가 필요. 생체 신호는 폐기 후에도 지속됨.' },
  { id: 'S-12', name: 'MORNING STAR', state: 'TRANSFERRED', risk: 'UNKNOWN', vital: '00.0 Hz', color: 'cyan', note: '구역 E 이전 완료. 인계 기록 누락.' },
];

export const incidentReports = [
  { id: 'INC-44', level: 'CRITICAL', title: 'ELEVATOR SHAFT / 층간 불일치', dept: '시설운영 3과', time: '2089.10.21 03:14', body: 'B2 승강기가 존재하지 않는 07층에서 정지했다. 탑승자 2명은 같은 시간 서로 다른 층의 카메라에 기록되었다. 제어반에는 "REDLINE" 문자열이 4초간 표시되었다.', attachment: 'elevator-frame_0314.mkv' },
  { id: 'INC-41', level: 'HIGH', title: '수문 잠금 루프 재발', dept: '보안대응실', time: '2089.10.19 23:02', body: 'D-04 수문이 11초 간격으로 잠금/해제되었다. 교대 근무자는 해당 구역에서 발신된 자신의 음성 메시지를 수신했다.', attachment: 'door-audio_2312.wav' },
  { id: 'INC-37', level: 'MEDIUM', title: '미등록 열원 / 동쪽 복도', dept: '감시통제실', time: '2089.10.12 01:48', body: '복도 E-2에서 인체형 열원이 1분 09초 동안 포착됐다. 출입 기록에는 해당 시간의 승인 이벤트가 없다.', attachment: 'thermal-e2_0148.img' },
  { id: 'INC-29', level: 'CLOSED', title: '문서 보관함 접속 오류', dept: '정보보존실', time: '2089.09.30 08:31', body: 'ORPHEUS 프로젝트 명칭을 포함한 23개 문서의 색인이 자동 변경되었다. 원인은 확인되지 않았다.', attachment: 'index-diff.csv' },
];

export const cameraFeeds = [
  { id: 'C-01', zone: 'MAIN LOBBY', status: 'STABLE', time: '10:42:18', note: '출입 인원 0 · 인증 단말 1 연결', anomaly: false },
  { id: 'C-04', zone: 'ELEVATOR SHAFT B2', status: 'INTERFERENCE', time: '10:42:21', note: '프레임 간 공간 좌표 불일치 · NODE 7 확인', anomaly: true },
  { id: 'C-09', zone: 'WET LAB / E-3', status: 'RECORDING', time: '10:42:06', note: '관찰실 차폐막 정상 · 체온 신호 2개', anomaly: false },
  { id: 'C-12', zone: 'ARCHIVE CORRIDOR', status: 'NO SIGNAL', time: '—:—:—', note: '광섬유 회선 차단 · 마지막 동기화 09:03', anomaly: true },
];

export const mailThreads = [
  { id: 'm-1', from: 'M. KANG / ARCHIVE', subject: 'Re: 야간 색인 변경', time: '08:17', tag: 'NORMAL', body: '색인 오류가 아닙니다. 삭제된 문서가 원래 위치로 돌아오고 있어요. 누가 접근한 흔적도 없습니다. 오늘 안에 물리 백업을 가져가겠습니다.' },
  { id: 'm-2', from: 'SECURITY AUTOMATION', subject: 'ACCESS TIER REVIEW', time: '07:40', tag: 'SYSTEM', body: '사용자 V-07의 읽기 전용 토큰이 발급되었습니다. 기록 간 상호 참조가 탐지되면 임시 L3 조회 권한이 활성화될 수 있습니다.' },
  { id: 'm-3', from: '[REDACTED]', subject: 'FWD: 수조의 소리', time: '02:03', tag: 'FLAGGED', body: '삭제된 수신자 목록 복구됨. 신호명은 ORPH. 숫자 조각은 아카이브의 운영 메모에 남아 있을 겁니다. 소리를 믿지 마세요.' },
  { id: 'm-4', from: 'E. KIM / BIOMED', subject: 'S-07의 상태값에 관하여', time: '어제', tag: 'DELETED', body: '이 메시지는 발신자에 의해 삭제되었습니다. 메타데이터만 복구할 수 있습니다.', deleted: true },
];

export const bootLines = [
  'AEGIS FACILITY NODE / 6.4.19',
  'MEMORY INTEGRITY ................. 100%',
  'SECURITY RELAY ................... LINKED',
  'ARCHIVE MIRROR ................... DEGRADED',
  'BIOMETRIC GATE ................... STANDBY',
  'EXTERNAL NETWORK ................. ISOLATED',
  'CREDENTIAL SEED // HORIZON',
];
