'use client';
// AEGIS-NET 내부망 단말 — 원본(Vite+React)을 O.home 페이지로 옮긴 것. 동작은 원본 그대로이고,
// 사이트로 돌아가는 「나가기」 링크만 더했다.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import {
  apps,
  archiveFiles,
  bootLines,
  cameraFeeds,
  incidentReports,
  mailThreads,
  specimenRecords,
  type AppId,
} from './aegisData';

type Screen = 'boot' | 'login' | 'desktop';
type FinaleStage = 'choice' | 'seal' | 'erase';
type WindowState = {
  id: AppId;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};
type DragState = { id: AppId; offsetX: number; offsetY: number } | null;

const windowSizes: Record<AppId, [number, number]> = {
  status: [640, 500],
  archive: [840, 536],
  specimens: [780, 505],
  incidents: [800, 520],
  surveillance: [880, 540],
  mail: [900, 528],
};

const initialWindows: WindowState[] = [
  { id: 'status', x: 108, y: 64, z: 3, minimized: false, maximized: false },
];

const windowPositions: Record<AppId, [number, number]> = {
  status: [108, 64],
  archive: [188, 56],
  specimens: [252, 88],
  incidents: [148, 112],
  surveillance: [236, 44],
  mail: [292, 70],
};

const clampPosition = (id: AppId, x: number, y: number) => {
  const [width, height] = windowSizes[id];
  const maxX = Math.max(88, window.innerWidth - width - 20);
  const maxY = Math.max(20, window.innerHeight - 31 - height - 14);
  return [Math.min(Math.max(88, x), maxX), Math.min(Math.max(14, y), maxY)];
};

const formatClock = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date);

export function AegisTerminal() {
  const [screen, setScreen] = useState<Screen>('boot');
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);
  const [dragging, setDragging] = useState<DragState>(null);
  const [findings, setFindings] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [finale, setFinale] = useState<FinaleStage | null>(null);
  const [clock, setClock] = useState(new Date());
  const latestZ = useRef(3);

  const clearance = findings.has('79') && findings.has('orph') ? 3 : 2;
  const correlations = ['79', 'orph', 'redline', 'node7'].filter((key) => findings.has(key)).length;
  const finalReveal = clearance === 3 && findings.has('redline') && findings.has('node7');
  const topZ = windows.reduce((highest, entry) => Math.max(highest, entry.z), 0);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => {
      setWindows((current) => current.map((entry) => {
        if (entry.id !== dragging.id || entry.maximized) return entry;
        const [x, y] = clampPosition(entry.id, event.clientX - dragging.offsetX, event.clientY - dragging.offsetY);
        return { ...entry, x, y };
      }));
    };
    const stop = () => setDragging(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [dragging]);

  useEffect(() => {
    if (clearance === 3 && !findings.has('tier-notice')) {
      setFindings((current) => new Set([...current, 'tier-notice']));
      setNotice('상호 참조 일치: 임시 L3 조회 권한이 활성화되었습니다. ARCHIVE의 PROJECT ORPHEUS가 열렸습니다.');
    }
  }, [clearance, findings]);

  useEffect(() => {
    if (finalReveal && !findings.has('final-notice')) {
      setFindings((current) => new Set([...current, 'final-notice']));
      setNotice('경보 상관관계가 완성되었습니다. NODE 7은 시설 내부가 아니라, 이 단말을 지시하고 있습니다.');
    }
  }, [finalReveal, findings]);

  const discover = (key: string, message: string) => {
    if (findings.has(key)) return;
    setFindings(new Set([...findings, key]));
    setNotice(message);
  };

  const focus = (id: AppId) => {
    const nextZ = ++latestZ.current;
    setWindows((current) => current.map((entry) => entry.id === id ? { ...entry, z: nextZ, minimized: false } : entry));
  };

  const openApp = (id: AppId) => {
    if (windows.some((entry) => entry.id === id)) {
      focus(id);
      return;
    }
    const [rawX, rawY] = windowPositions[id];
    const [x, y] = clampPosition(id, rawX, rawY);
    const nextZ = ++latestZ.current;
    setWindows((current) => [...current, { id, x, y, z: nextZ, minimized: false, maximized: false }]);
  };

  const closeApp = (id: AppId) => setWindows((current) => current.filter((entry) => entry.id !== id));
  const minimizeApp = (id: AppId) => setWindows((current) => current.map((entry) => entry.id === id ? { ...entry, minimized: true } : entry));
  const toggleMaximize = (id: AppId) => {
    setWindows((current) => current.map((entry) => entry.id === id ? { ...entry, maximized: !entry.maximized, minimized: false } : entry));
    focus(id);
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, entry: WindowState) => {
    if (entry.maximized || (event.target as HTMLElement).closest('button')) return;
    focus(entry.id);
    setDragging({ id: entry.id, offsetX: event.clientX - entry.x, offsetY: event.clientY - entry.y });
  };

  if (screen === 'boot') return <><ExitLink /><BootScreen onContinue={() => setScreen('login')} /></>;
  if (screen === 'login') return <><ExitLink /><LoginScreen onLogin={() => setScreen('desktop')} /></>;

  return (
    <main className="terminal-shell">
      <div className="grid-veil" />
      <header className="top-statusbar">
        <div className="brand-lockup"><span className="brand-mark">A</span><span>AEGIS<span className="dim">//</span>NET</span><span className="node-tag">NODE-06</span></div>
        <div className="top-readouts"><span><i className="live-dot" /> INTERNAL / ISOLATED</span><span>UPTIME 042:17:09</span><span>USR: V-07</span></div>
      </header>

      <section className="desktop-area">
        <aside className="app-dock" aria-label="시스템 앱">
          <span className="dock-caption">APPS</span>
          {apps.map((app) => (
            <button key={app.id} className={`app-icon ${app.accent}`} onClick={() => openApp(app.id)} title={app.description}>
              <span className="icon-glyph">{app.glyph}</span>
              <span>{app.label.split(' ')[0]}</span>
            </button>
          ))}
          <div className="dock-divide" />
          <button className="app-icon dim-icon" onClick={() => setNotice('외부망은 물리적으로 분리되어 있습니다. 이 요청은 보안대응실에 기록되었습니다.')}><span className="icon-glyph">↯</span><span>UPLINK</span></button>
        </aside>

        <div className="ambient-readout ambient-left"><span>ZONE</span><strong>BIO / E-3</strong><small>ATM 100.1 kPa</small><small>RAD 0.01 mSv</small></div>
        <div className="ambient-readout ambient-right"><span>ARCHIVE MIRROR</span><strong className="amber-text">DEGRADED</strong><small>SYNC OFFSET + 03:19</small><small>PACKET LOSS 14.7%</small></div>
        <div className="desktop-watermark">AEGIS<span>FACILITY OS 6.4 / NODE 06</span></div>
        <div className="center-reticle"><span>AEGIS FACILITY</span><i /><b>SESSION AUTHORIZED</b></div>

        {windows.map((entry) => (
          !entry.minimized && <SystemWindow
            key={entry.id}
            entry={entry}
            clearance={clearance}
            correlations={correlations}
            findings={findings}
            onFocus={() => focus(entry.id)}
            onClose={() => closeApp(entry.id)}
            onMinimize={() => minimizeApp(entry.id)}
            onMaximize={() => toggleMaximize(entry.id)}
            onDragStart={(event) => beginDrag(event, entry)}
            onDiscover={discover}
            onOpenApp={openApp}
            notify={setNotice}
            onFinale={() => setFinale('choice')}
          />
        ))}
      </section>

      <footer className="taskbar">
        <div className="taskbar-left"><span className="pulse-square" /><span>SYS READY</span><span className="task-sep">|</span><span>CLR-L{clearance}</span></div>
        <div className="window-tabs">
          {windows.map((entry) => {
            const app = apps.find((candidate) => candidate.id === entry.id)!;
            return <button key={entry.id} className={`task-tab ${entry.minimized ? 'muted' : ''}`} onClick={() => entry.minimized || entry.z !== topZ ? focus(entry.id) : minimizeApp(entry.id)}><span>{app.glyph}</span> {app.label}</button>;
          })}
        </div>
        <div className="taskbar-right"><Link href="/" className="task-exit" title="홈페이지로 돌아가기">⏻ EXIT</Link><span className="signal-bars">▂▄▆█</span><span>{formatClock(clock)}</span><span className="date-stamp">2089.10.21</span></div>
      </footer>

      {notice && !finale && <Notice message={notice} onClose={() => setNotice(null)} />}
      {finale && <FinaleOverlay stage={finale} onChoose={setFinale} onExit={() => window.location.reload()} />}
    </main>
  );
}

function ExitLink() {
  return <Link href="/" className="aegis-exit" title="홈페이지로 돌아가기">← EXIT TO SITE</Link>;
}

function BootScreen({ onContinue }: { onContinue: () => void }) {
  const [lineCount, setLineCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (lineCount >= bootLines.length) {
      const timer = window.setTimeout(() => setReady(true), 400);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setLineCount((count) => count + 1), lineCount === 0 ? 450 : 310);
    return () => window.clearTimeout(timer);
  }, [lineCount]);

  return <main className="boot-screen">
    <div className="boot-noise" />
    <section className="boot-panel">
      <div className="boot-corner top-left" /><div className="boot-corner top-right" /><div className="boot-corner bottom-left" /><div className="boot-corner bottom-right" />
      <div className="boot-heading"><span className="brand-mark large">A</span><div><span className="eyebrow">AEGIS RESEARCH FACILITY</span><h1>INTERNAL<br /><em>NETWORK</em></h1></div></div>
      <div className="boot-log" aria-live="polite">
        {bootLines.slice(0, lineCount).map((line, index) => <p key={line} className={line.includes('HORIZON') ? 'credential-line' : ''}><span>{String(index + 1).padStart(2, '0')}</span>{line}</p>)}
        {lineCount < bootLines.length && <p className="cursor-line"><span>··</span>_</p>}
      </div>
      <div className="boot-bottom"><span>BUILD 6.4.19 / COLD START</span>{ready ? <button className="enter-button" onClick={onContinue}>[ ENTER ] AUTHENTICATE</button> : <span>INITIALIZING</span>}</div>
    </section>
  </main>;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const correctUser = userId.trim().toUpperCase() === 'V-07';
    const correctPass = ['HORIZON', 'ECHO-1979'].includes(password.trim().toUpperCase());
    if (correctUser && correctPass) onLogin();
    else setError('인증 거부: 사번 또는 액세스 시드가 일치하지 않습니다.');
  };
  return <main className="login-screen">
    <div className="login-grid" />
    <section className="login-card">
      <div className="login-topline"><span>AEGIS / IDENTITY GATE</span><span><i className="live-dot" /> LINKED</span></div>
      <div className="login-body">
        <div className="login-seal"><span className="brand-mark huge">A</span><div className="orbit orbit-one" /><div className="orbit orbit-two" /></div>
        <div className="login-copy"><p className="eyebrow">RESTRICTED FACILITY NETWORK</p><h2>IDENTITY<br /><em>VERIFICATION</em></h2><p className="muted-copy">권한 없는 접속 시도는 보안대응실에 자동 통보됩니다.</p><p className="credential-hint">열람자 사번과 액세스 시드가 필요합니다.<span>사번은 배정 단말 표기에서, 시드는 COLD BOOT LOG의 마지막 줄에서 확인하십시오.</span></p></div>
        <form onSubmit={submit}>
          <label>EMPLOYEE IDENTIFIER<input autoFocus value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="예: V-07" autoComplete="off" /></label>
          <label>ACCESS SEED<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="BOOT LOG에서 확인" autoComplete="off" /></label>
          {error && <p className="login-error">! {error}</p>}
          <button type="submit" className="login-button">REQUEST ACCESS <span>→</span></button>
        </form>
      </div>
      <div className="login-footer"><span>SECURITY CHANNEL 01 / ENCRYPTED</span><span>NO EXTERNAL RELAY</span></div>
    </section>
  </main>;
}

type SystemWindowProps = {
  entry: WindowState;
  clearance: number;
  correlations: number;
  findings: Set<string>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onDragStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDiscover: (key: string, message: string) => void;
  onOpenApp: (id: AppId) => void;
  notify: (message: string) => void;
  onFinale: () => void;
};

function SystemWindow({ entry, clearance, correlations, findings, onFocus, onClose, onMinimize, onMaximize, onDragStart, onDiscover, onOpenApp, notify, onFinale }: SystemWindowProps) {
  const app = apps.find((candidate) => candidate.id === entry.id)!;
  const style = entry.maximized
    ? { zIndex: entry.z }
    : { zIndex: entry.z, left: `${entry.x}px`, top: `${entry.y}px` };
  return <section className={`system-window ${entry.maximized ? 'maximized' : ''} module-${entry.id}`} style={style} onPointerDown={onFocus}>
    <div className="window-titlebar" onPointerDown={onDragStart}>
      <div className="window-title"><span className={`title-glyph ${app.accent}`}>{app.glyph}</span><span>{app.code}</span><b>{app.label}</b></div>
      <div className="window-controls"><button onClick={onMinimize} aria-label="최소화">—</button><button onClick={onMaximize} aria-label="최대화">□</button><button className="close" onClick={onClose} aria-label="닫기">×</button></div>
    </div>
    <div className="window-body">{renderModule(entry.id, { clearance, correlations, findings, onDiscover, onOpenApp, notify, onFinale })}</div>
    <div className="window-footer"><span>{entry.id === 'status' ? `SYSTEM PROCESS / ${correlations} CORRELATIONS` : `READ ACCESS / L${clearance}`}</span><span>◈ ACTIVE</span></div>
  </section>;
}

function renderModule(id: AppId, props: ModuleProps) {
  if (id === 'status') return <StatusModule {...props} />;
  if (id === 'archive') return <ArchiveModule {...props} />;
  if (id === 'specimens') return <SpecimenModule {...props} />;
  if (id === 'incidents') return <IncidentModule {...props} />;
  if (id === 'surveillance') return <SurveillanceModule {...props} />;
  return <MailModule {...props} />;
}

type ModuleProps = {
  clearance: number;
  correlations: number;
  findings: Set<string>;
  onDiscover: (key: string, message: string) => void;
  onOpenApp: (id: AppId) => void;
  notify: (message: string) => void;
  onFinale: () => void;
};

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className="metric"><span>{label}</span><b className={`${tone}-text`}>{value}</b></div>; }

function StatusModule({ clearance, correlations, findings, onOpenApp, onFinale }: ModuleProps) {
  const modules: { id: AppId; note: string }[] = [
    { id: 'archive', note: '문서 · 손상 인덱스' },
    { id: 'specimens', note: '생체 자산 04' },
    { id: 'incidents', note: '미결 보고 03' },
    { id: 'surveillance', note: '채널 04 / 2 이상' },
    { id: 'mail', note: '미확인 수신 04' },
  ];
  return <div className="status-module">
    <div className="module-heading"><div><span className="eyebrow">FACILITY OVERVIEW</span><h3>OPERATIONS <em>NOMINAL</em></h3></div><div className="access-badge">CLEARANCE <b>L{clearance}</b></div></div>
    <div className="status-figure"><div className="facility-drawing"><span className="ring ring-a" /><span className="ring ring-b" /><span className="core-dot" /><span className="vector v-one" /><span className="vector v-two" /><span className="vector v-three" /><b>NODE<br />06</b></div><div className="readout-stack"><Metric label="SECTOR LOCKS" value="11 / 12" tone="mint" /><Metric label="ARCHIVE SYNC" value="85.3%" tone="amber" /><Metric label="LIFE SUPPORT" value="ONLINE" tone="mint" /><Metric label="PERIMETER" value="SEALED" tone="cyan" /></div></div>
    <div className="module-directory"><span>MODULE DIRECTORY / OPEN</span><div>{modules.map((item) => <button key={item.id} onClick={() => onOpenApp(item.id)}><b>{apps.find((app) => app.id === item.id)!.label}</b><small>{item.note}</small><i>→</i></button>)}</div></div>
    <div className="system-log"><div className="log-title"><span>LIVE EVENT TRACE</span><span>{correlations}/4 CORRELATIONS</span></div><p><i /> 10:42:11 · Terminal session accepted: V-07</p><p><i /> 10:42:18 · Archive mirror reports time drift</p>{clearance === 3 && <p className="highlight-log"><i /> 10:42:33 · Temporary L3 lookup token issued</p>}{findings.has('redline') && <p className="danger-log"><i /> 10:42:50 · REDLINE token observed in incident relay</p>}</div>
    {clearance === 3 && correlations === 4 && <div className="sealed-disclosure armed"><span>△</span><div><b>ORPHEUS PROTOCOL / ARMED</b><p>4/4 상관관계가 일치했습니다. 시설 운영체제가 당신의 결정을 요구합니다.</p><button onClick={onFinale}>OPEN PROTOCOL CONSOLE →</button></div></div>}
  </div>;
}

function ArchiveModule({ clearance, onDiscover, notify }: ModuleProps) {
  const [selected, setSelected] = useState('root');
  const file = archiveFiles.find((item) => item.id === selected)!;
  const locked = file.id === 'redacted' && clearance < 3;
  const select = (id: string) => {
    if (id === 'ops-note') onDiscover('79', '단서 확보: OPS_NOTE_79의 숫자 조각 79. 메일의 ORPH 신호와 결합하십시오.');
    if (id === 'redacted' && clearance < 3) notify('접근 거부: PROJECT ORPHEUS는 L3 조회 권한이 필요합니다. 상호 참조 단서 2건을 확보하십시오.');
    setSelected(id);
  };
  return <div className="archive-module">
    <div className="file-toolbar"><span>▾ /AEGIS/ARCHIVE</span><div><button onClick={() => notify('이전 디렉터리 기록이 손상되었습니다. 탐색 경로는 고정됩니다.')}>↶</button><button onClick={() => notify('색인 검색은 운영 등급에서 비활성화되어 있습니다.')}>⌕</button><button onClick={() => notify('보관 정책: 삭제 요청은 정보보존실 승인 후 72시간 내 처리됩니다.')}>⋮</button></div></div>
    <div className="archive-layout">
      <nav className="folder-tree"><p>DIRECTORIES</p><button onClick={() => select('root')} className={selected === 'root' ? 'tree-active' : ''}>▾ ROOT</button><button onClick={() => select('operations')} className={selected === 'operations' ? 'tree-active' : ''}>　├ 01_OPERATIONS</button><button onClick={() => select('bio')} className={selected === 'bio' ? 'tree-active' : ''}>　├ 02_BIOLOGICAL</button><button onClick={() => select('incident')} className={selected === 'incident' ? 'tree-active' : ''}>　├ 03_INCIDENTS</button><button onClick={() => select('redacted')} className={`${selected === 'redacted' ? 'tree-active ' : ''}${clearance === 3 ? 'unlocked-tree' : 'locked-tree'}`}>　└ {clearance === 3 ? '◇ ORPHEUS' : '⊘ RESTRICTED'}</button><div className="tree-note"><span>INDEX HEALTH</span><b>85.3%</b><small>3 DAMAGED BUNDLES</small></div><div className="tree-note"><span>STORAGE</span><b>1.42 TB</b><small>RETENTION 12 Y</small></div></nav>
      <div className="file-list"><div className="list-head"><span>NAME</span><span>LEVEL</span><span>MODIFIED</span></div>{archiveFiles.slice(1).map((item) => <button key={item.id} onClick={() => select(item.id)} className={`file-row ${selected === item.id ? 'selected' : ''} ${item.id === 'redacted' && clearance < 3 ? 'file-locked' : ''}`}><span><i>{item.type === 'folder' ? '▰' : item.type === 'sealed' ? '◇' : item.type === 'map' ? '⌘' : '▤'}</i>{item.name}</span><small>{item.level}</small><small>{item.date}</small></button>)}<div className="quarantine"><span>◇ QUARANTINE / INDEX 03</span><p>BUNDLE_07 · checksum mismatch</p><p>OPS_NOTE_79 · recovered fragment</p><p>PROJECT_ORPHEUS · sealed by NODE 7</p></div></div>
      <aside className="file-preview"><span className="eyebrow">INSPECTOR</span><h4>{file.name}</h4><div className="preview-line" />{locked ? <div className="locked-preview"><span>⊘</span><b>ACCESS RESTRICTED</b><p>필요 인가 등급: L3<br />상호 참조 단서를 찾으십시오.</p><div className="lock-requirements"><i className={clearance === 3 ? 'met' : ''}>ORPHEUS 명칭 확보</i><i>상호 참조 2/2</i></div></div> : <FileContent id={file.id} />}<div className="preview-meta"><span>OWNER <b>OPS / NODE 7</b></span><span>CHECKSUM <b>79:AF:03</b></span><span>RETAIN <b>12 Y</b></span></div></aside>
    </div>
  </div>;
}

function FileContent({ id }: { id: string }) {
  if (id === 'ops-note') return <div className="file-content"><p className="mono-note">FROM: D. HAN / OPS<br />SUBJECT: shelf 7</p><p>수면 기록을 파기하지 마세요. 파일명 끝의 <mark>79</mark>는 날짜가 아닙니다. 누군가 단어 조각과 합쳐 읽도록 남긴 값입니다.</p><span className="file-stamp">RECOVERED / 09:17</span></div>;
  if (id === 'redacted') return <div className="file-content redacted-content"><p>PROJECT <mark>ORPHEUS</mark></p><p>수신 대상: NODE 7<br />발신 주체: 미확인</p><div className="blackout">████████████████</div><p>프로토콜이 단말을 먼저 관찰합니다.</p></div>;
  if (id === 'floor-plan') return <div className="mini-map"><i /><i /><i /><span>B2 / SHAFT</span><b>LOWER<br />E-3</b></div>;
  return <div className="file-content"><p>선택된 디렉터리에는 14개의 보관 묶음과 3개의 손상된 인덱스가 있습니다.</p><p>탐색할 문서를 선택하십시오.</p><span className="file-stamp">SCAN COMPLETE / 03 BUNDLES UNREADABLE</span></div>;
}

function VitalTrace({ id, color }: { id: string; color: string }) {
  const pattern = id === 'S-07' ? '2,4 7,12 12,2 18,26 23,6 29,20 35,3 41,17 47,7 53,23 59,4 65,14 71,2 78,20 84,7 90,13 96,4 103,19 110,6 116,11' : id === 'S-04' ? '2,20 9,20 16,19 23,21 30,18 37,20 44,19 51,21 58,18 65,20 72,19 79,20 86,18 93,21 100,19 107,20 114,20 120,19' : '2,20 12,19 22,20 32,18 42,20 52,19 62,20 72,18 82,20 92,19 102,20 112,19 120,20';
  return <div className="vital-trace"><span>VITAL OSCILLATION / 24H</span><svg viewBox="0 0 122 28" preserveAspectRatio="none" className={color}><polyline points={pattern} fill="none" stroke="currentColor" strokeWidth="1" /><line x1="0" y1="24" x2="122" y2="24" stroke="currentColor" strokeOpacity=".18" /></svg><div><small>00:00</small><small>12:00</small><small>NOW</small></div></div>;
}

function SpecimenModule({ clearance }: ModuleProps) {
  const [selected, setSelected] = useState('S-01');
  const record = specimenRecords.find((item) => item.id === selected)!;
  const locked = record.id === 'S-07' && clearance < 3;
  return <div className="specimen-module">
    <div className="module-heading compact"><div><span className="eyebrow">BIOLOGICAL ASSET REGISTRY</span><h3>SPECIMEN <em>INDEX</em></h3></div><span className="record-count">04 RECORDS</span></div>
    <div className="specimen-layout"><div className="specimen-list">{specimenRecords.map((item) => <button key={item.id} className={`specimen-row ${selected === item.id ? 'selected' : ''} ${item.id === 'S-07' && clearance < 3 ? 'file-locked' : ''}`} onClick={() => setSelected(item.id)}><span className={`bio-pip ${item.color}`} /><div><b>{item.id} · {item.name}</b><small>{item.state}</small></div><strong>{item.risk}</strong></button>)}<div className="specimen-footnote"><span>OBSERVATION CAMPAIGN</span><p>42일 / 3 교대조</p><p>격리 해제 요청 0</p></div></div><article className="specimen-detail">{locked ? <div className="locked-preview big-lock"><span>◉</span><b>RECORD QUARANTINED</b><p>S-07의 관찰 주석은 L3 조회 토큰에 격리되어 있습니다.</p><div className="lock-requirements"><i>상호 참조 2/2</i><i>ORPHEUS 명칭 확보</i></div></div> : <><div className="specimen-header"><span className={`bio-orb ${record.color}`}><i /></span><div><span className="eyebrow">ASSET // {record.id}</span><h4>{record.name}</h4></div><b className={`${record.color}-text`}>{record.state}</b></div><div className="bio-grid"><Metric label="RISK CLASS" value={record.risk} tone={record.color} /><Metric label="VITAL OSC." value={record.vital} tone="cyan" /><Metric label="CONTAINMENT" value={record.id === 'S-07' ? 'UNVERIFIED' : 'NOMINAL'} tone={record.id === 'S-07' ? 'red' : 'mint'} /><Metric label="LAST CHECK" value="10:31:08" tone="cyan" /></div><VitalTrace id={record.id} color={record.color} /><div className="observation-note"><span>OBSERVATION NOTE</span><p>{record.note}</p></div>{record.id === 'S-07' && <div className="specimen-secret">오디오 자극에 대해 반응하지 않는다. 다만 시설의 스피커가 꺼진 뒤에도, 응답은 계속된다. 기록자: E. KIM (부재)</div>}</>}</article></div>
  </div>;
}

function IncidentModule({ onDiscover, notify }: ModuleProps) {
  const [selected, setSelected] = useState('INC-44');
  const [attachment, setAttachment] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'SEALED'>('ALL');
  const report = incidentReports.find((item) => item.id === selected)!;
  const visibleReports = incidentReports.filter((item) => filter === 'ALL' || (filter === 'SEALED' ? item.level === 'CLOSED' : item.level !== 'CLOSED'));
  const select = (id: string) => { if (id === 'INC-44') onDiscover('redline', '사건 토큰 확보: REDLINE. CCTV의 B2 승강기 기록과 연결할 수 있습니다.'); setSelected(id); };
  const setLogFilter = (next: 'ALL' | 'OPEN' | 'SEALED') => { setFilter(next); setSelected(next === 'SEALED' ? 'INC-29' : 'INC-44'); setAttachment(false); };
  return <div className="incident-module"><div className="incident-filter"><span>EVENT REPORTS</span>{(['ALL', 'OPEN', 'SEALED'] as const).map((item) => <button key={item} onClick={() => setLogFilter(item)} className={filter === item ? 'filter-on' : ''}>{item}</button>)}<span className="log-total">{String(visibleReports.length).padStart(2, '0')} ENTRIES</span></div><div className="incident-layout"><div className="incident-list">{visibleReports.map((item) => <button key={item.id} className={`incident-row ${selected === item.id ? 'selected' : ''}`} onClick={() => select(item.id)}><span className={`severity ${item.level.toLowerCase()}`} /><div><b>{item.id} · {item.title}</b><small>{item.time} / {item.dept}</small></div><em>{item.level}</em></button>)}<div className="incident-legend"><span>SEVERITY KEY</span><p><i className="critical" /> CRITICAL / 즉시 격리</p><p><i className="high" /> HIGH / 24H 보고</p><p><i className="medium" /> MEDIUM / 관찰</p></div></div><article className="report-detail"><div className="report-top"><span className="eyebrow">REPORT {report.id}</span><span className={`severity-label ${report.level.toLowerCase()}`}>{report.level}</span></div><h4>{report.title}</h4><div className="report-meta"><span>DEPARTMENT <b>{report.dept}</b></span><span>STAMP <b>{report.time}</b></span></div><p>{report.body}</p><button className="attachment" onClick={() => setAttachment((current) => !current)}>▤ &nbsp; ATTACHMENT / {report.attachment}<span>OPEN →</span></button>{attachment && <div className="attachment-preview"><div className="frame-strip"><i /><i /><i /><i /></div><span>FRAME 03:14 / FLOOR 07 · 4 FRAMES RECOVERED</span><button onClick={() => notify('어태치먼트는 읽기 전용입니다. 원본은 감시통제실 마스터에 보관됩니다.')}>REQUEST MASTER →</button></div>}<div className="evidence-chain"><span>EVIDENCE CHAIN</span><p>03:11 · 승강기 호출 / B2</p><p>03:14 · 제어반 REDLINE 표시</p><p>03:15 · 07층 카메라 프레임 생성</p><div><button onClick={() => notify('연결 기록: CCTV C-04 (ELEVATOR SHAFT B2)에서 동일 좌표가 확인됩니다.')}>LINK C-04</button><button onClick={() => notify('연결 기록: OPS_NOTE_79의 숫자 조각 79와 상호 참조됩니다.')}>LINK OPS-79</button></div></div></article></div></div>;
}

function SurveillanceModule({ onDiscover, notify }: ModuleProps) {
  const [selected, setSelected] = useState('C-01');
  const [timeline, setTimeline] = useState(false);
  const [marker, setMarker] = useState('03:14');
  const feed = cameraFeeds.find((item) => item.id === selected)!;
  const select = (id: string) => { const next = cameraFeeds.find((item) => item.id === id)!; if (next.id === 'C-04') onDiscover('node7', '감시 단서 확보: C-04가 존재하지 않는 NODE 7 좌표를 기록합니다. 사건 보고서와 대조하십시오.'); setSelected(id); };
  return <div className="surveillance-module"><div className="camera-grid">{cameraFeeds.map((item) => <button key={item.id} onClick={() => select(item.id)} className={`camera-tile ${selected === item.id ? 'selected' : ''} ${item.anomaly ? 'anomaly' : ''}`}><span className="cam-label"><i className="rec-dot" /> {item.id} / {item.zone}</span><div className="camera-image"><div className="cam-scene"><span className="cam-light" /><span className="cam-wall left" /><span className="cam-wall right" /><span className="cam-floor" /><span className="cam-door" />{(item.id === 'C-04' || item.id === 'C-12') && <span className="cam-figure" />}{(item.id === 'C-09') && <><span className="cam-tank one" /><span className="cam-tank two" /></>}</div><span className="scanline" />{item.anomaly && <b className="signal-break">SIGNAL<br />OFFSET</b>}<small>{item.time}</small></div><span className="cam-foot"><b>{item.status}</b><i>{item.anomaly ? '!' : '◌'}</i></span></button>)}</div><aside className="camera-detail"><span className="eyebrow">ACTIVE FEED</span><h4>{feed.id} / {feed.zone}</h4><div className="feed-stats"><Metric label="STATUS" value={feed.status} tone={feed.anomaly ? 'red' : 'mint'} /><Metric label="FRAME RATE" value={feed.anomaly ? '11.2 fps' : '29.9 fps'} tone="cyan" /><Metric label="CHANNEL" value="ENCRYPTED" tone="cyan" /></div><p>{feed.note}</p>{feed.id === 'C-04' && <div className="camera-alert">△ 03:14 프레임에 존재하지 않는 07층 좌표가 포함되어 있습니다.</div>}<button className="playback-button" onClick={() => setTimeline((current) => !current)}>▸ {timeline ? 'CLOSE' : 'OPEN'} TIMELINE</button>{timeline && <div className="timeline"><span>RECORDED / 02:40 — 03:20</span><div className="timeline-track">{['02:40', '03:02', '03:14', '03:20'].map((stamp) => <button key={stamp} className={marker === stamp ? 'on' : ''} onClick={() => setMarker(stamp)}>{stamp}</button>)}</div><div className="timeline-frame"><i /><b>FRAME {marker}</b></div><p>{marker === '03:14' ? '격리동 인원 계수 07 / 승인 기록 없음' : '기록 프레임 정상 / 대상 없음'}</p></div>}</aside><div className="camera-scan"><span>SCANNING 04 CHANNELS</span><span>LOSS 14.7%</span></div><button className="timeline-note" onClick={() => notify('감시 마스터는 NODE 7에서 관리됩니다. 현재 단말은 미러만 열람합니다.')}>MIRROR SOURCE / NODE 7</button></div>;
}

function MailModule({ onDiscover, notify }: ModuleProps) {
  const [selected, setSelected] = useState('m-1');
  const mail = mailThreads.find((item) => item.id === selected)!;
  const select = (id: string) => { if (id === 'm-3') onDiscover('orph', '단서 확보: 삭제된 메일에서 ORPH 신호명을 복구했습니다. 아카이브의 79와 결합하십시오.'); setSelected(id); };
  return <div className="mail-module"><aside className="mail-sidebar"><button className="compose-button" onClick={() => notify('발신 권한이 없습니다. 이 계정은 읽기 전용 토큰으로 발급되었습니다.')}>＋ COMPOSE</button><p>MAILBOXES</p><button className="folder-active">▾ INBOX <b>04</b></button><button onClick={() => notify('보낸 편지함은 NODE 7 정책에 따라 비어 있습니다.')}>　SENT</button><button onClick={() => select('m-3')}>　FLAGGED <b>01</b></button><button onClick={() => select('m-4')}>　DELETED</button><div className="mail-sync"><span>SYNC STATUS</span><b>LOCAL MIRROR</b><span>LAST 10:39:02</span></div></aside><div className="mail-list"><div className="mail-list-title"><span>INBOX / INTERNAL</span><button onClick={() => notify('메일 검색 인덱스는 동기화 중입니다. (14.7% 손실)')}>⌕</button></div>{mailThreads.map((item) => <button key={item.id} onClick={() => select(item.id)} className={`mail-row ${selected === item.id ? 'selected' : ''} ${item.deleted ? 'deleted-mail' : ''}`}><span className={`mail-flag ${item.tag.toLowerCase()}`} /> <div><b>{item.from}</b><strong>{item.subject}</strong><small>{item.tag === 'DELETED' ? 'CONTENT PURGED' : item.body.slice(0, 54)}</small></div><time>{item.time}</time></button>)}</div><article className="mail-reader"><div className="reader-actions"><span>✉ SECURE MESSAGE</span><div><button onClick={() => notify('회신은 발신 전용 채널로 제한됩니다.')}>↩</button><button onClick={() => notify('플래그가 지정되었습니다. 보안대응실에 통보됩니다.')}>⌁</button><button onClick={() => notify('첨부 메타데이터: 3개 참조 / 1개 소거')}>⋮</button></div></div><h4>{mail.subject}</h4><div className="mail-from"><span className="mail-avatar">{mail.from[0]}</span><div><b>{mail.from}</b><small>TO: V-07 / INTERNAL ONLY</small></div><time>{mail.time}</time></div><div className="mail-body"><p>{mail.body}</p>{mail.id === 'm-3' && <div className="recovered-block"><span>RECOVERED FRAGMENT</span><b>ORPH // [pair with archive value]</b></div>}{mail.id === 'm-2' && <div className="recovered-block"><span>POLICY NOTICE</span><b>CORRELATION 2/2 → L3 TEMPORARY TOKEN</b></div>}</div>{mail.deleted && <div className="deleted-strip">△ 메시지 본문이 소거되었습니다. 남은 메타데이터에는 3개의 미확인 참조가 있습니다.<button onClick={() => notify('복구 요청이 접수되었습니다. 정보보존실 승인 대기.')}>REQUEST RECOVERY</button></div>}<div className="mail-attachments"><span>ATTACHMENTS / 01</span><button onClick={() => notify('첨부 파일은 아카이브 미러에서 열람하십시오.')}>▤ index-diff.csv</button></div></article></div>;
}

function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  return <aside className="notice-pop"><div className="notice-bar"><span>AEGIS / SYSTEM NOTICE</span><button onClick={onClose}>×</button></div><div className="notice-content"><span>△</span><p>{message}</p></div><button onClick={onClose} className="notice-ack">ACKNOWLEDGE</button></aside>;
}

function FinaleOverlay({ stage, onChoose, onExit }: { stage: FinaleStage; onChoose: (stage: FinaleStage) => void; onExit: () => void }) {
  const epilogues: Record<Exclude<FinaleStage, 'choice'>, { tag: string; title: string; lines: string[] }> = {
    seal: {
      tag: 'CONTAINMENT / COMPLETE',
      title: '문은 안쪽에서 닫힌다',
      lines: [
        '수문이 낮은 진동과 함께 순차적으로 잠깁니다. B2, E-3, 아카이브. 마지막으로 NODE 7.',
        '2089.10.21 04:07. 시설은 외부와 분리되었습니다. 구조 요청은 발신되지 않습니다.',
        '관측자 신호는 계속 수신됩니다. 당신은 방 안에 있고, 방은 당신을 기억합니다.',
      ],
    },
    erase: {
      tag: 'MIRROR / REVERSED',
      title: '기록은 남지 않는다',
      lines: [
        '아카이브 미러가 역방향으로 동기화됩니다. 색인, 사건, 관찰, 사번. 순서대로 사라집니다.',
        '마지막으로 남은 것은 03:14의 프레임 한 장과, 그 안의 열람자 한 명입니다.',
        '다음 교대조가 도착했을 때, 이 단말에는 이미 로그인된 사용자가 있었습니다.',
      ],
    },
  };
  const result = stage === 'choice' ? null : epilogues[stage];
  return <div className={`finale-overlay stage-${stage}`}>
    <div className="finale-stripes" />
    <section className="finale-panel">
      <div className="finale-top"><span><i className="alarm-dot" /> AEGIS / ORPHEUS PROTOCOL</span><span>NODE 7 · PRIORITY 00</span></div>
      {stage === 'choice' ? <>
        <span className="eyebrow">4 / 4 CORRELATIONS CONFIRMED</span>
        <h2>LAST<br /><em>DECISION</em></h2>
        <p className="finale-copy">ORPHEUS는 실험이 아니라 관측 프로토콜입니다. 이 시설의 모든 기록은 관측자 V-07의 반응을 수집하기 위해 편집되었습니다. NODE 7은 이 단말입니다. 이제 당신이 마지막 문을 결정합니다.</p>
        <div className="finale-options">
          <button onClick={() => onChoose('seal')}><span>A</span><b>격리 프로토콜 실행</b><small>시설을 봉쇄하고 표본을 남긴다.</small></button>
          <button onClick={() => onChoose('erase')}><span>B</span><b>기록 말소 및 탈출</b><small>모든 기록을 지우고 단말을 떠난다.</small></button>
        </div>
      </> : <>
        <span className="eyebrow">{result!.tag}</span>
        <h2>{result!.title}</h2>
        <div className="epilogue">{result!.lines.map((line) => <p key={line}>{line}</p>)}</div>
        <div className="finale-foot"><span>SESSION V-07 / LOG CLOSED</span><button onClick={onExit}>SESSION TERMINATE →</button></div>
      </>}
    </section>
  </div>;
}

