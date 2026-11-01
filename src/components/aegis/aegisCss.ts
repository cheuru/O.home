// AEGIS-NET 스타일 — 원본 styles.css를 .aegis-root 아래로 옮긴 것 (사이트 스타일과 섞이지 않도록 전부 범위를 좁히고, 애니메이션 이름에는 aegis- 를 붙였다)
export const AEGIS_FONTS = "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Rajdhani:wght@500;600;700&display=swap');";
export const AEGIS_CSS = String.raw`.aegis-root{ color: #d3f7eb; background: #050b0c; font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-synthesis: none; }
.aegis-root *{ box-sizing: border-box; }
.aegis-root{ width: 100%; min-width: 320px; min-height: 100%; margin: 0; }
.aegis-root{ min-height: 100vh; overflow: hidden; background: #050b0c; }
.aegis-root button, .aegis-root input{ font: inherit; }
.aegis-root button{ cursor: pointer; }
.aegis-root button:focus-visible, .aegis-root input:focus-visible{ outline: 1px solid #62ffe1; outline-offset: 2px; }
/* Shared */
.aegis-root .eyebrow{ color: #5d9088; font-size: 9px; letter-spacing: .18em; margin: 0 0 6px; }
.aegis-root em{ font-style: normal; color: #74f4d1; }
.aegis-root .dim{ color: #47837a; padding: 0 3px; }
.aegis-root .cyan-text{ color: #6feeff !important; }
.aegis-root .mint-text{ color: #7cf4b9 !important; }
.aegis-root .amber-text{ color: #f4ba61 !important; }
.aegis-root .red-text{ color: #ff7474 !important; }
.aegis-root .live-dot{ display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #7dffcb; box-shadow: 0 0 9px #44ffc5; margin-right: 6px; animation: aegis-blink 1.7s infinite; }
.aegis-root .brand-mark{ display: inline-flex; align-items: center; justify-content: center; width: 25px; height: 25px; border: 1px solid #6ae0c4; color: #92ffe0; font-family: Rajdhani, sans-serif; font-size: 20px; font-weight: 700; line-height: 1; clip-path: polygon(50% 0, 100% 23%, 100% 77%, 50% 100%, 0 77%, 0 23%); text-shadow: 0 0 12px #46f6ca; }
.aegis-root .brand-mark.large{ width: 67px; height: 67px; font-size: 53px; }
.aegis-root .brand-mark.huge{ width: 102px; height: 102px; font-size: 84px; }
@keyframes aegis-blink{ 50% { opacity: .38; } }
/* Boot */
.aegis-root .boot-screen, .aegis-root .login-screen{ min-height: 100vh; display: grid; place-items: center; position: relative; overflow: hidden; background: radial-gradient(circle at 50% 48%, #0d2d2b 0, #071314 27%, #040a0b 68%); }
.aegis-root .boot-screen::before, .aegis-root .login-screen::before{ content: ''; position: absolute; inset: 0; opacity: .42; background-image: linear-gradient(90deg, rgba(85, 248, 214, .055) 1px, transparent 1px), linear-gradient(0deg, rgba(85, 248, 214, .04) 1px, transparent 1px); background-size: 44px 44px; mask-image: radial-gradient(ellipse, #000, transparent 78%); }
.aegis-root .boot-noise{ position: absolute; inset: 0; pointer-events: none; opacity: .18; background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(170,255,238,.11) 4px); animation: aegis-scan 7s linear infinite; }
@keyframes aegis-scan{ from { transform: translateY(-8px) } to { transform: translateY(8px) } }
.aegis-root .boot-panel{ position: relative; width: min(710px, calc(100vw - 48px)); padding: 48px 54px 32px; border: 1px solid rgba(116,244,209,.32); background: linear-gradient(135deg, rgba(8,32,32,.94), rgba(3,11,13,.9)); box-shadow: 0 0 0 6px rgba(42, 207, 177, .025), 0 28px 80px rgba(0,0,0,.62), inset 0 0 48px rgba(53, 230, 196, .035); }
.aegis-root .boot-panel::after{ content: ''; position: absolute; left: 0; right: 0; top: 24%; height: 1px; background: linear-gradient(90deg, transparent, rgba(114,255,221,.45), transparent); }
.aegis-root .boot-corner{ position: absolute; width: 18px; height: 18px; border-color: #76ffe0; }
.aegis-root .top-left{ left: -1px; top: -1px; border-top: 2px solid; border-left: 2px solid; }
.aegis-root .top-right{ right: -1px; top: -1px; border-top: 2px solid; border-right: 2px solid; }
.aegis-root .bottom-left{ left: -1px; bottom: -1px; border-bottom: 2px solid; border-left: 2px solid; }
.aegis-root .bottom-right{ right: -1px; bottom: -1px; border-bottom: 2px solid; border-right: 2px solid; }
.aegis-root .boot-heading{ display: flex; align-items: center; gap: 19px; padding-bottom: 45px; }
.aegis-root .boot-heading h1{ font-family: Rajdhani, sans-serif; font-size: 39px; font-weight: 600; line-height: .77; letter-spacing: .06em; margin: 0; color: #c8fbed; }
.aegis-root .boot-heading h1 em{ color: #71f3cf; }
.aegis-root .boot-heading .eyebrow{ color: #8aaea8; font-size: 10px; }
.aegis-root .boot-log{ min-height: 190px; margin: 0 0 26px; padding: 15px 0; border-top: 1px solid rgba(111,237,209,.15); border-bottom: 1px solid rgba(111,237,209,.15); color: #86bcb1; font-size: 11px; line-height: 1.84; }
.aegis-root .boot-log p{ margin: 0; }
.aegis-root .boot-log p > span{ display: inline-block; width: 38px; color: #416e68; }
.aegis-root .credential-line{ color: #e9ca78; }
.aegis-root .credential-line span{ color: #917638 !important; }
.aegis-root .cursor-line{ color: #71f3cf; }
.aegis-root .boot-bottom{ display: flex; justify-content: space-between; align-items: center; color: #54827b; font-size: 9px; letter-spacing: .11em; }
.aegis-root .enter-button{ border: 1px solid rgba(110,250,215,.48); background: rgba(76,238,198,.08); color: #9bffe5; padding: 10px 14px; font-size: 10px; letter-spacing: .11em; transition: .2s ease; }
.aegis-root .enter-button:hover{ background: #6af4d2; color: #061111; box-shadow: 0 0 22px rgba(102,255,215,.4); }
/* Login */
.aegis-root .login-screen{ background: radial-gradient(circle at 70% 40%, #12333a 0, #07161a 29%, #04090c 72%); }
.aegis-root .login-grid{ position: absolute; width: 120vw; height: 120vh; background-image: linear-gradient(rgba(91,255,227,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(91,255,227,.05) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(520px) rotateX(63deg) translateY(25%); transform-origin: bottom; opacity: .55; }
.aegis-root .login-card{ position: relative; width: min(850px, calc(100vw - 48px)); border: 1px solid rgba(107,242,221,.3); background: rgba(5,18,22,.88); box-shadow: 0 30px 100px #000a, inset 0 0 70px rgba(52, 233, 195,.035); }
.aegis-root .login-topline, .aegis-root .login-footer{ height: 35px; display: flex; align-items: center; justify-content: space-between; padding: 0 19px; border-bottom: 1px solid rgba(105,240,213,.17); color: #689d95; font-size: 9px; letter-spacing: .1em; }
.aegis-root .login-footer{ border-top: 1px solid rgba(105,240,213,.17); border-bottom: 0; }
.aegis-root .login-body{ display: grid; grid-template-columns: 192px 1fr 280px; gap: 35px; padding: 48px 52px; align-items: center; }
.aegis-root .login-seal{ height: 170px; display: grid; place-items: center; position: relative; border-right: 1px solid rgba(112,244,216,.18); }
.aegis-root .login-seal .brand-mark{ position: relative; z-index: 2; }
.aegis-root .orbit{ position: absolute; border: 1px solid rgba(113,253,221,.35); border-radius: 50%; }
.aegis-root .orbit-one{ width: 145px; height: 145px; border-right-color: transparent; transform: rotate(30deg); animation: aegis-orbit 10s linear infinite; }
.aegis-root .orbit-two{ width: 104px; height: 104px; border-left-color: transparent; transform: rotate(-43deg); animation: aegis-orbit 7s linear infinite reverse; }
@keyframes aegis-orbit{ to { transform: rotate(390deg); } }
.aegis-root .login-copy h2{ font: 600 33px/.82 Rajdhani, sans-serif; letter-spacing: .06em; margin: 0; }
.aegis-root .muted-copy{ color: #65928b; font-size: 10px; line-height: 1.7; margin: 16px 0 0; }
.aegis-root .login-card form{ display: grid; gap: 16px; }
.aegis-root .login-card label{ display: block; color: #649d94; font-size: 9px; line-height: 1.3; letter-spacing: .14em; }
.aegis-root .login-card input{ display: block; width: 100%; margin-top: 7px; background: #07191b; border: 1px solid #275a55; color: #c9fff0; padding: 12px 11px; font-size: 12px; line-height: 1.2; transition: .2s; }
.aegis-root .login-card input::placeholder{ color: #45716b; }
.aegis-root .login-card input:focus{ border-color: #71f8d4; box-shadow: 0 0 0 3px rgba(102,244,211,.08); }
.aegis-root .login-error{ color: #ff8980; font-size: 10px; line-height: 1.5; margin: -4px 0 0; }
.aegis-root .login-button{ margin-top: 7px; display: flex; justify-content: space-between; padding: 13px 14px; border: 1px solid #68eac9; background: #155448; color: #e1fff4; font-size: 10px; letter-spacing: .1em; }
.aegis-root .login-button:hover{ background: #6cf2d0; color: #071411; }
.aegis-root .login-button span{ font-size: 16px; line-height: 9px; }
/* Desktop */
.aegis-root .terminal-shell{ height: 100vh; position: relative; overflow: hidden; background: radial-gradient(ellipse at 54% 44%, #12302e 0, #0a1c1e 36%, #040a0c 92%); color: #c7eee4; }
.aegis-root .terminal-shell::before{ content: ''; pointer-events: none; position: absolute; inset: 0; z-index: 90; opacity: .11; background: repeating-linear-gradient(0deg, transparent 0 2px, rgba(181,255,240,.22) 3px 4px); mix-blend-mode: screen; }
.aegis-root .grid-veil{ position: absolute; inset: 40px 0 31px; opacity: .38; background-image: linear-gradient(90deg, rgba(111,252,219,.052) 1px, transparent 1px), linear-gradient(0deg, rgba(111,252,219,.05) 1px, transparent 1px); background-size: 72px 72px; mask-image: radial-gradient(ellipse at 50% 48%, #000 25%, transparent 78%); }
.aegis-root .top-statusbar{ height: 40px; position: relative; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid rgba(102,232,201,.25); background: linear-gradient(90deg, #081b1c, #0d2927 45%, #081619); box-shadow: 0 1px 13px rgba(81,255,212,.08); font-size: 10px; letter-spacing: .09em; }
.aegis-root .brand-lockup{ display: flex; align-items: center; gap: 7px; font-family: Rajdhani, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: .1em; }
.aegis-root .brand-lockup .brand-mark{ width: 20px; height: 20px; font-size: 15px; }
.aegis-root .node-tag{ margin-left: 7px; padding: 3px 6px; border: 1px solid #386e67; color: #77aaa2; font: 9px 'DM Mono'; }
.aegis-root .top-readouts{ display: flex; gap: 18px; color: #7dafa6; font-size: 9px; }
.aegis-root .top-readouts span{ white-space: nowrap; }
.aegis-root .desktop-area{ position: absolute; top: 40px; bottom: 31px; left: 0; right: 0; overflow: hidden; }
.aegis-root .app-dock{ position: absolute; z-index: 2; top: 24px; left: 18px; display: flex; flex-direction: column; align-items: stretch; width: 66px; padding: 8px 5px; gap: 6px; border: 1px solid rgba(100,235,207,.18); background: linear-gradient(180deg, rgba(7,25,27,.77), rgba(5,17,20,.38)); backdrop-filter: blur(7px); }
.aegis-root .dock-caption{ padding: 0 5px 6px; color: #527c76; font-size: 8px; letter-spacing: .14em; }
.aegis-root .app-icon{ display: grid; place-items: center; gap: 2px; min-height: 51px; padding: 4px 2px; border: 1px solid transparent; background: transparent; color: #82b7ad; font-size: 7px; letter-spacing: .03em; transition: .17s ease; }
.aegis-root .app-icon .icon-glyph{ color: #9adbd0; font-size: 20px; line-height: 17px; text-shadow: 0 0 12px rgba(112,255,218,.5); }
.aegis-root .app-icon:hover{ border-color: rgba(111,254,218,.6); background: rgba(93,245,207,.1); color: #cefff2; }
.aegis-root .app-icon.amber .icon-glyph{ color: #ffca79; }
.aegis-root .app-icon.red .icon-glyph{ color: #ff897e; }
.aegis-root .dock-divide{ height: 1px; margin: 2px 5px; background: rgba(110,244,214,.19); }
.aegis-root .dim-icon{ opacity: .57; }
.aegis-root .ambient-readout{ position: absolute; z-index: 1; color: #508078; font-size: 9px; line-height: 1.9; letter-spacing: .08em; }
.aegis-root .ambient-readout span{ display: block; color: #395c59; }
.aegis-root .ambient-readout strong{ display: block; color: #8abcb2; font-size: 11px; letter-spacing: .13em; }
.aegis-root .ambient-readout small{ display: block; font-size: 8px; }
.aegis-root .ambient-left{ left: 104px; bottom: 24px; border-left: 1px solid #386b65; padding-left: 9px; }
.aegis-root .ambient-right{ right: 28px; top: 24px; width: 170px; text-align: right; border-right: 1px solid #386b65; padding-right: 9px; }
.aegis-root .center-reticle{ position: absolute; left: 51%; top: 42%; display: grid; place-items: center; width: 240px; height: 240px; transform: translate(-50%, -50%); color: rgba(137,225,208,.22); text-align: center; font-size: 9px; letter-spacing: .18em; border: 1px solid rgba(101,232,205,.11); border-radius: 50%; }
.aegis-root .center-reticle::before, .aegis-root .center-reticle::after{ content: ''; position: absolute; border: 1px solid rgba(101,232,205,.1); border-radius: 50%; }
.aegis-root .center-reticle::before{ inset: 19px; }
.aegis-root .center-reticle::after{ inset: 52px; }
.aegis-root .center-reticle i{ position: absolute; width: 1px; height: 280px; background: rgba(99,235,203,.12); }
.aegis-root .center-reticle b{ color: rgba(166,255,235,.2); font-size: 7px; font-weight: 400; }
/* Window chrome */
.aegis-root .system-window{ position: absolute; display: flex; flex-direction: column; width: 660px; height: 515px; min-width: 460px; min-height: 300px; border: 1px solid rgba(109,239,207,.45); background: rgba(5,20,23,.965); box-shadow: 0 22px 48px rgba(0,0,0,.48), 0 0 0 1px rgba(66,178,160,.12), inset 0 0 30px rgba(50,212,182,.025); backdrop-filter: blur(13px); }
.aegis-root .system-window::before{ content: ''; pointer-events: none; position: absolute; inset: 30px 0 0; z-index: 10; opacity: .08; background: repeating-linear-gradient(0deg, transparent 0 3px, #b7fff0 4px); }
.aegis-root .system-window.maximized{ width: calc(100% - 102px); height: calc(100% - 30px); left: 88px !important; top: 15px !important; }
.aegis-root .module-archive{ width: 855px; height: 552px; }
.aegis-root .module-specimens{ width: 790px; height: 515px; }
.aegis-root .module-incidents{ width: 820px; height: 535px; }
.aegis-root .module-surveillance{ width: 900px; height: 560px; }
.aegis-root .module-mail{ width: 930px; height: 554px; }
.aegis-root .window-titlebar{ position: relative; z-index: 12; height: 31px; flex: 0 0 31px; display: flex; align-items: center; justify-content: space-between; padding-left: 9px; border-bottom: 1px solid rgba(104,236,205,.31); background: linear-gradient(90deg, rgba(24,73,67,.94), rgba(8,30,33,.96)); user-select: none; cursor: move; }
.aegis-root .window-title{ display: flex; gap: 8px; align-items: center; color: #80afa7; font-size: 8px; letter-spacing: .1em; }
.aegis-root .window-title b{ color: #d2f6ed; font-size: 9px; font-weight: 500; }
.aegis-root .title-glyph{ color: #7af7d3; font-size: 15px; line-height: 1; }
.aegis-root .title-glyph.amber{ color: #ffd071; }
.aegis-root .title-glyph.red{ color: #ff8a80; }
.aegis-root .window-controls{ align-self: stretch; display: flex; }
.aegis-root .window-controls button{ width: 33px; border: 0; border-left: 1px solid rgba(104,236,205,.16); background: transparent; color: #8fbbb3; font-size: 15px; line-height: 1; }
.aegis-root .window-controls button:hover{ background: rgba(95,247,209,.15); color: #d6fff2; }
.aegis-root .window-controls button.close:hover{ background: #9a3937; color: #fff; }
.aegis-root .window-body{ position: relative; z-index: 2; min-height: 0; flex: 1; overflow: auto; }
.aegis-root .window-footer{ position: relative; z-index: 12; flex: 0 0 21px; display: flex; justify-content: space-between; align-items: center; padding: 0 9px; border-top: 1px solid rgba(96,225,198,.18); background: #071719; color: #57857e; font-size: 8px; letter-spacing: .08em; }
/* Status module */
.aegis-root .status-module{ height: 100%; padding: 22px 24px; }
.aegis-root .module-heading{ display: flex; justify-content: space-between; align-items: flex-start; }
.aegis-root .module-heading h3{ margin: 0; font: 600 23px/.9 Rajdhani, sans-serif; letter-spacing: .07em; }
.aegis-root .module-heading.compact{ padding: 18px 20px 13px; }
.aegis-root .access-badge{ padding: 7px 9px; border: 1px solid rgba(119,245,213,.3); color: #75a99f; font-size: 8px; letter-spacing: .1em; }
.aegis-root .access-badge b{ margin-left: 5px; color: #80ffd8; font-size: 11px; }
.aegis-root .status-figure{ display: grid; grid-template-columns: 1.2fr 1fr; gap: 28px; align-items: center; margin-top: 21px; }
.aegis-root .facility-drawing{ position: relative; height: 185px; display: grid; place-items: center; overflow: hidden; border: 1px solid rgba(111,244,212,.16); background: radial-gradient(circle, rgba(73,245,199,.1), transparent 58%); }
.aegis-root .facility-drawing .ring{ position: absolute; border: 1px solid rgba(109,246,209,.35); border-radius: 50%; }
.aegis-root .ring-a{ width: 132px; height: 132px; border-left-color: transparent !important; transform: rotate(31deg); }
.aegis-root .ring-b{ width: 83px; height: 83px; border-right-color: transparent !important; transform: rotate(-42deg); }
.aegis-root .core-dot{ position: absolute; width: 11px; height: 11px; border-radius: 50%; background: #84ffd9; box-shadow: 0 0 18px #64f5cb; }
.aegis-root .facility-drawing b{ position: relative; z-index: 2; margin-top: 145px; color: #8dcfc0; font-size: 8px; line-height: 1.3; letter-spacing: .12em; text-align: center; }
.aegis-root .vector{ position: absolute; height: 1px; transform-origin: left; background: linear-gradient(90deg, #72f0d0, transparent); }
.aegis-root .v-one{ width: 98px; transform: rotate(20deg) translateX(8px); }
.aegis-root .v-two{ width: 73px; transform: rotate(185deg) translateX(12px); }
.aegis-root .v-three{ width: 63px; transform: rotate(-78deg) translateX(7px); }
.aegis-root .readout-stack{ display: grid; gap: 11px; }
.aegis-root .metric{ display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid rgba(103,222,196,.12); padding: 6px 0; color: #6d9991; font-size: 8px; letter-spacing: .07em; }
.aegis-root .metric b{ font-size: 10px; font-weight: 500; }
.aegis-root .system-log{ margin-top: 21px; border: 1px solid rgba(106,234,204,.18); background: rgba(8,37,37,.45); padding: 10px 12px; color: #719a93; font-size: 9px; line-height: 1.8; }
.aegis-root .system-log p{ margin: 0; }
.aegis-root .system-log i{ display: inline-block; width: 4px; height: 4px; margin: 0 7px 1px 0; background: #61e8c4; }
.aegis-root .log-title{ display: flex; justify-content: space-between; margin-bottom: 4px; color: #86beb4; font-size: 8px; }
.aegis-root .highlight-log{ color: #9affdc; }
.aegis-root .danger-log{ color: #ffc17a; }
.aegis-root .sealed-disclosure{ display: flex; gap: 10px; margin-top: 11px; padding: 9px 10px; border-left: 2px solid #e8a25c; background: rgba(193,105,36,.09); color: #d6b788; font-size: 9px; line-height: 1.55; }
.aegis-root .sealed-disclosure p{ margin: 0; }
.aegis-root .sealed-disclosure span{ color: #ffba67; font-size: 17px; }
/* Archive */
.aegis-root .archive-module{ height: 100%; display: flex; flex-direction: column; }
.aegis-root .file-toolbar{ display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgba(107,237,205,.14); background: rgba(8,32,35,.76); color: #85bcb0; font-size: 9px; }
.aegis-root .file-toolbar button, .aegis-root .mail-list-title button, .aegis-root .reader-actions button{ border: 0; background: transparent; color: #83beb1; }
.aegis-root .file-toolbar button:hover{ color: #c8fff0; }
.aegis-root .archive-layout{ min-height: 0; flex: 1; display: grid; grid-template-columns: 164px 1fr 235px; }
.aegis-root .folder-tree{ padding: 14px 8px; border-right: 1px solid rgba(104,229,199,.17); background: rgba(5,19,23,.6); }
.aegis-root .folder-tree p{ margin: 0 7px 8px; color: #5b8880; font-size: 8px; letter-spacing: .1em; }
.aegis-root .folder-tree button{ display: block; width: 100%; padding: 6px 7px; border: 0; background: transparent; color: #77a69d; text-align: left; font-size: 9px; white-space: nowrap; }
.aegis-root .folder-tree button:hover, .aegis-root .folder-tree .tree-active{ background: rgba(87,230,196,.12); color: #b5ffea; }
.aegis-root .folder-tree .locked-tree{ color: #966b5e; }
.aegis-root .folder-tree .unlocked-tree{ color: #88ecca; }
.aegis-root .tree-note{ margin: 20px 7px 0; padding-top: 9px; border-top: 1px solid rgba(96,223,192,.16); color: #5d8d84; font-size: 8px; }
.aegis-root .tree-note span{ display: block; }
.aegis-root .tree-note b{ color: #eca95c; font-size: 10px; }
.aegis-root .file-list{ border-right: 1px solid rgba(104,229,199,.17); }
.aegis-root .list-head, .aegis-root .file-row{ display: grid; grid-template-columns: 1fr 48px 77px; gap: 10px; align-items: center; padding: 8px 10px; }
.aegis-root .list-head{ border-bottom: 1px solid rgba(104,229,199,.14); color: #4c786f; font-size: 8px; }
.aegis-root .file-row{ width: 100%; border: 0; border-bottom: 1px solid rgba(104,229,199,.075); background: transparent; color: #8ebdb4; text-align: left; font-size: 9px; }
.aegis-root .file-row:hover, .aegis-root .file-row.selected{ background: rgba(85,235,200,.11); color: #d2fff1; }
.aegis-root .file-row span{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aegis-root .file-row i{ margin-right: 7px; color: #72e8cb; font-style: normal; }
.aegis-root .file-row small{ color: #638e86; font-size: 8px; }
.aegis-root .file-locked{ color: #986c64 !important; }
.aegis-root .file-locked i{ color: #c9796d !important; }
.aegis-root .file-preview{ padding: 15px; background: rgba(8,27,29,.38); }
.aegis-root .file-preview h4{ margin: 7px 0 11px; color: #d3f8ec; font: 600 15px Rajdhani, sans-serif; letter-spacing: .05em; }
.aegis-root .preview-line{ height: 1px; background: rgba(103,235,203,.22); }
.aegis-root .file-content{ padding-top: 14px; color: #91bfb5; font-size: 10px; line-height: 1.65; }
.aegis-root .file-content p{ margin: 0 0 13px; }
.aegis-root .mono-note{ color: #69bbae; font-size: 8px; }
.aegis-root mark{ padding: 1px 3px; background: rgba(255,190,93,.22); color: #ffcd84; }
.aegis-root .file-stamp{ color: #5c8f86; font-size: 8px; }
.aegis-root .locked-preview{ padding: 32px 6px; color: #a37167; text-align: center; font-size: 9px; line-height: 1.65; }
.aegis-root .locked-preview span{ display: block; margin-bottom: 10px; color: #d17e71; font-size: 33px; }
.aegis-root .locked-preview b{ display: block; color: #db998a; letter-spacing: .1em; }
.aegis-root .redacted-content{ color: #d9a96d; }
.aegis-root .blackout{ margin: 10px 0; color: #0a0c0d; background: #08090a; letter-spacing: -1px; }
.aegis-root .mini-map{ position: relative; height: 162px; margin-top: 13px; overflow: hidden; border: 1px solid #356a62; background: linear-gradient(135deg, transparent 49%, #1f625b 50% 51%, transparent 52%), repeating-linear-gradient(90deg, transparent 0 25px, rgba(101,236,205,.16) 26px); }
.aegis-root .mini-map i{ position: absolute; background: #438a7c; }
.aegis-root .mini-map i:nth-child(1){ left: 20%; top: 17%; width: 48%; height: 1px; }
.aegis-root .mini-map i:nth-child(2){ left: 50%; top: 17%; width: 1px; height: 55%; }
.aegis-root .mini-map i:nth-child(3){ left: 32%; top: 71%; width: 38%; height: 1px; }
.aegis-root .mini-map span, .aegis-root .mini-map b{ position: absolute; color: #90d9c9; font-size: 8px; }
.aegis-root .mini-map span{ top: 24%; left: 53%; }
.aegis-root .mini-map b{ bottom: 13%; left: 10%; }
/* Specimens */
.aegis-root .specimen-module{ height: 100%; }
.aegis-root .record-count{ padding: 7px 9px; border: 1px solid rgba(109,235,203,.25); color: #6f9a92; font-size: 8px; }
.aegis-root .specimen-layout{ height: calc(100% - 75px); display: grid; grid-template-columns: 270px 1fr; border-top: 1px solid rgba(107,236,205,.16); }
.aegis-root .specimen-list{ border-right: 1px solid rgba(104,230,200,.18); padding: 7px; }
.aegis-root .specimen-row{ display: grid; grid-template-columns: 12px 1fr auto; gap: 8px; align-items: center; width: 100%; padding: 11px 8px; border: 0; border-bottom: 1px solid rgba(103,224,196,.1); background: transparent; color: #9bc4ba; text-align: left; }
.aegis-root .specimen-row:hover, .aegis-root .specimen-row.selected{ background: rgba(79,226,192,.1); }
.aegis-root .specimen-row b, .aegis-root .specimen-row small{ display: block; }
.aegis-root .specimen-row b{ font-size: 10px; font-weight: 500; }
.aegis-root .specimen-row small{ margin-top: 4px; color: #5e8d84; font-size: 8px; }
.aegis-root .specimen-row strong{ color: #d19e6c; font-size: 8px; font-weight: 400; }
.aegis-root .bio-pip{ width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
.aegis-root .bio-pip.mint{ color: #7cf4b9; background: #7cf4b9; }
.aegis-root .bio-pip.amber{ color: #f4ba61; background: #f4ba61; }
.aegis-root .bio-pip.red{ color: #ff7474; background: #ff7474; }
.aegis-root .bio-pip.cyan{ color: #6feeff; background: #6feeff; }
.aegis-root .specimen-detail{ padding: 20px; }
.aegis-root .specimen-header{ display: flex; gap: 12px; align-items: center; border-bottom: 1px solid rgba(105,232,202,.16); padding-bottom: 17px; }
.aegis-root .bio-orb{ position: relative; width: 43px; height: 43px; border: 1px solid currentColor; border-radius: 50%; color: #77f2bd; box-shadow: inset 0 0 16px currentColor, 0 0 12px rgba(92,255,188,.13); }
.aegis-root .bio-orb i{ position: absolute; left: 12px; top: 12px; width: 17px; height: 17px; border-radius: 50%; background: currentColor; opacity: .4; }
.aegis-root .bio-orb.amber{ color: #f4ba61; }
.aegis-root .bio-orb.red{ color: #ff7474; }
.aegis-root .bio-orb.cyan{ color: #6feeff; }
.aegis-root .specimen-header h4{ margin: 1px 0 0; color: #e0fff5; font: 600 19px Rajdhani, sans-serif; letter-spacing: .1em; }
.aegis-root .specimen-header > b{ margin-left: auto; font-size: 9px; }
.aegis-root .bio-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; padding: 9px 0; }
.aegis-root .observation-note{ margin-top: 13px; padding: 12px; border: 1px solid rgba(111,235,205,.16); background: rgba(16,51,48,.33); }
.aegis-root .observation-note span{ color: #69a398; font-size: 8px; letter-spacing: .1em; }
.aegis-root .observation-note p{ margin: 8px 0 0; color: #b4d9d0; font-size: 10px; line-height: 1.7; }
.aegis-root .specimen-secret{ margin-top: 9px; border-left: 2px solid #f1a75d; padding: 9px 11px; color: #e1bd86; background: rgba(149,80,28,.1); font-size: 9px; line-height: 1.6; }
.aegis-root .big-lock{ padding-top: 85px; }
/* Incidents */
.aegis-root .incident-module{ height: 100%; display: flex; flex-direction: column; }
.aegis-root .incident-filter{ display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-bottom: 1px solid rgba(106,233,203,.16); color: #83b2a9; font-size: 9px; }
.aegis-root .incident-filter > span:first-child{ margin-right: 9px; }
.aegis-root .incident-filter button{ padding: 4px 7px; border: 1px solid #315f5a; background: transparent; color: #749f97; font-size: 8px; }
.aegis-root .incident-filter .filter-on{ border-color: #dbab61; color: #ffd18b; }
.aegis-root .log-total{ margin-left: auto; color: #5a8880; }
.aegis-root .incident-layout{ min-height: 0; flex: 1; display: grid; grid-template-columns: 355px 1fr; }
.aegis-root .incident-list{ border-right: 1px solid rgba(106,233,203,.17); }
.aegis-root .incident-row{ display: grid; grid-template-columns: 8px 1fr auto; gap: 8px; align-items: center; width: 100%; padding: 12px 11px; border: 0; border-bottom: 1px solid rgba(104,229,199,.08); background: transparent; color: #9fc8be; text-align: left; }
.aegis-root .incident-row:hover, .aegis-root .incident-row.selected{ background: rgba(92,233,200,.1); }
.aegis-root .incident-row b, .aegis-root .incident-row small{ display: block; }
.aegis-root .incident-row b{ font-size: 9px; font-weight: 500; }
.aegis-root .incident-row small{ margin-top: 5px; color: #5d8e85; font-size: 8px; }
.aegis-root .incident-row em{ color: #bb9871; font-size: 7px; }
.aegis-root .severity{ width: 6px; height: 30px; background: #83eabf; }
.aegis-root .severity.high{ background: #f1bc67; }
.aegis-root .severity.critical{ background: #f3736d; box-shadow: 0 0 8px rgba(255,101,88,.5); }
.aegis-root .severity.medium{ background: #6cd8ef; }
.aegis-root .severity.closed{ background: #5d8680; }
.aegis-root .report-detail{ padding: 20px 22px; }
.aegis-root .report-top{ display: flex; justify-content: space-between; }
.aegis-root .severity-label{ padding: 4px 6px; font-size: 8px; border: 1px solid currentColor; }
.aegis-root .severity-label.critical{ color: #ff7d74; }
.aegis-root .severity-label.high{ color: #f4bd69; }
.aegis-root .severity-label.medium{ color: #6ce2f4; }
.aegis-root .severity-label.closed{ color: #79a79f; }
.aegis-root .report-detail h4{ margin: 10px 0 17px; color: #defcf3; font: 600 22px Rajdhani, sans-serif; letter-spacing: .04em; }
.aegis-root .report-meta{ display: flex; gap: 28px; padding: 9px 0; border-top: 1px solid rgba(105,231,202,.15); border-bottom: 1px solid rgba(105,231,202,.15); color: #5c9087; font-size: 8px; }
.aegis-root .report-meta b{ display: block; margin-top: 5px; color: #a5d2c7; font-size: 9px; font-weight: 400; }
.aegis-root .report-detail > p{ max-width: 420px; margin: 21px 0; color: #aed1c8; font-size: 11px; line-height: 1.8; }
.aegis-root .attachment{ display: flex; justify-content: space-between; width: 100%; padding: 11px; border: 1px solid rgba(109,237,206,.24); background: rgba(25,72,68,.34); color: #83beb1; font-size: 9px; text-align: left; }
.aegis-root .attachment:hover{ border-color: #74efd1; color: #d6fff3; }
.aegis-root .attachment span{ color: #78e9ca; }
/* Surveillance */
.aegis-root .surveillance-module{ height: 100%; display: grid; grid-template-columns: 1fr 225px; }
.aegis-root .camera-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 1px; padding: 1px; background: rgba(108,234,205,.22); }
.aegis-root .camera-tile{ position: relative; display: flex; flex-direction: column; min-height: 0; padding: 0; border: 0; background: #081a1e; color: #abd8cc; text-align: left; overflow: hidden; }
.aegis-root .camera-tile.selected{ outline: 1px solid #76f6d4; outline-offset: -1px; }
.aegis-root .cam-label, .aegis-root .cam-foot{ position: relative; z-index: 3; flex: 0 0 26px; display: flex; justify-content: space-between; align-items: center; padding: 0 8px; background: rgba(5,20,24,.94); font-size: 8px; letter-spacing: .05em; }
.aegis-root .cam-label{ color: #9ccac0; }
.aegis-root .cam-foot{ border-top: 1px solid rgba(105,236,205,.15); color: #6fa59b; }
.aegis-root .cam-foot b{ font-size: 8px; font-weight: 400; }
.aegis-root .camera-tile.anomaly .cam-foot b{ color: #f59a83; }
.aegis-root .rec-dot{ display: inline-block; width: 5px; height: 5px; margin-right: 4px; border-radius: 50%; background: #ef6f69; box-shadow: 0 0 6px #ed5d58; }
.aegis-root .camera-image{ position: relative; min-height: 0; flex: 1; overflow: hidden; background: linear-gradient(130deg, #112a2c, #081416 64%); }
.aegis-root .camera-image::before{ content: ''; position: absolute; inset: -20%; background: radial-gradient(ellipse at 20% 86%, rgba(139,255,225,.17), transparent 29%), linear-gradient(90deg, transparent 49%, rgba(111,242,212,.12) 50%, transparent 51%); transform: rotate(-19deg); }
.aegis-root .camera-image::after{ content: ''; position: absolute; inset: 0; opacity: .22; background: repeating-linear-gradient(0deg, transparent 0 4px, rgba(200,255,240,.4) 5px); }
.aegis-root .camera-structure{ position: absolute; z-index: 1; border: 2px solid rgba(126,244,212,.31); }
.aegis-root .structure-C-01{ left: 28%; bottom: 0; width: 43%; height: 72%; border-bottom: 0; transform: perspective(80px) rotateX(6deg); }
.aegis-root .structure-C-04{ left: 42%; top: -15%; width: 23%; height: 135%; border-color: rgba(245,160,118,.36); }
.aegis-root .structure-C-09{ left: 15%; bottom: 17%; width: 63%; height: 38%; border-radius: 50%; }
.aegis-root .structure-C-12{ left: 0; top: 49%; width: 100%; height: 1px; border: 0; background: #e06e66; transform: rotate(-14deg); box-shadow: 0 0 30px #da655d; }
.aegis-root .scanline{ position: absolute; z-index: 2; left: 0; right: 0; height: 2px; top: 37%; background: rgba(142,255,229,.32); box-shadow: 0 0 12px #72ebd0; animation: aegis-cameraScan 3.5s ease-in-out infinite; }
.aegis-root .camera-tile.anomaly .scanline{ background: rgba(255,122,99,.45); box-shadow: 0 0 13px #f15f50; animation-duration: 1.2s; }
.aegis-root .camera-image small{ position: absolute; z-index: 3; right: 8px; bottom: 6px; color: #b1ebdc; font-size: 9px; }
.aegis-root .signal-break{ position: absolute; z-index: 3; left: 13px; top: 14px; color: #f09a83; font-size: 9px; letter-spacing: .15em; animation: aegis-flicker .8s steps(2) infinite; }
.aegis-root .camera-detail{ padding: 17px 14px; border-left: 1px solid rgba(106,235,204,.22); background: #07181b; }
.aegis-root .camera-detail h4{ margin: 6px 0 12px; color: #d4f9ef; font: 600 16px Rajdhani, sans-serif; letter-spacing: .05em; }
.aegis-root .feed-stats{ margin: 13px 0; }
.aegis-root .camera-detail > p{ color: #89b6ad; font-size: 9px; line-height: 1.65; }
.aegis-root .camera-alert{ margin: 16px 0; padding: 9px; border-left: 2px solid #f0786d; background: rgba(188,62,43,.12); color: #e3a192; font-size: 9px; line-height: 1.6; }
.aegis-root .playback-button{ width: 100%; margin-top: 12px; padding: 9px; border: 1px solid #3a776e; background: rgba(41,116,104,.2); color: #9fe6d7; font-size: 8px; letter-spacing: .08em; }
.aegis-root .playback-button:hover{ border-color: #75f5d2; }
.aegis-root .camera-tile:hover .camera-image::before{ filter: brightness(1.4); }
@keyframes aegis-cameraScan{ 50% { transform: translateY(70px); opacity: .45; } }
@keyframes aegis-flicker{ 50% { opacity: .28; } }
/* Mail */
.aegis-root .mail-module{ height: 100%; display: grid; grid-template-columns: 144px 280px 1fr; }
.aegis-root .mail-sidebar{ padding: 12px 8px; border-right: 1px solid rgba(105,233,203,.18); background: rgba(6,23,27,.72); }
.aegis-root .compose-button{ width: 100%; margin-bottom: 16px; padding: 8px; border: 1px solid #4a9789; background: rgba(57,165,145,.18); color: #9ef1df; font-size: 8px; letter-spacing: .08em; }
.aegis-root .compose-button:hover{ background: #58e2c3; color: #071614; }
.aegis-root .mail-sidebar p{ margin: 0 6px 7px; color: #58877f; font-size: 8px; }
.aegis-root .mail-sidebar > button:not(.compose-button){ display: flex; justify-content: space-between; width: 100%; padding: 7px 6px; border: 0; background: transparent; color: #719e95; font-size: 8px; text-align: left; }
.aegis-root .mail-sidebar .folder-active{ background: rgba(80,226,194,.11); color: #b8f8e8; }
.aegis-root .mail-sync{ position: absolute; bottom: 30px; color: #56857d; font-size: 7px; line-height: 1.7; }
.aegis-root .mail-sync span{ display: block; }
.aegis-root .mail-sync b{ color: #77c6b6; font-size: 8px; }
.aegis-root .mail-list{ overflow: auto; border-right: 1px solid rgba(105,233,203,.18); }
.aegis-root .mail-list-title{ display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid rgba(105,233,203,.14); color: #81afa5; font-size: 8px; }
.aegis-root .mail-row{ display: grid; grid-template-columns: 7px 1fr auto; gap: 8px; width: 100%; padding: 11px 9px; border: 0; border-bottom: 1px solid rgba(105,233,203,.08); background: transparent; color: #afd9cd; text-align: left; }
.aegis-root .mail-row:hover, .aegis-root .mail-row.selected{ background: rgba(83,229,197,.1); }
.aegis-root .mail-flag{ width: 5px; height: 5px; margin-top: 4px; border-radius: 50%; background: #6ee7c2; }
.aegis-root .mail-flag.system{ background: #71dcef; }
.aegis-root .mail-flag.flagged{ background: #f4b76d; }
.aegis-root .mail-flag.deleted{ background: #c6766b; }
.aegis-root .mail-row b, .aegis-root .mail-row strong, .aegis-root .mail-row small{ display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aegis-root .mail-row b{ color: #80a69f; font-size: 8px; font-weight: 400; }
.aegis-root .mail-row strong{ margin: 3px 0; color: #b6dfd4; font-size: 9px; font-weight: 500; }
.aegis-root .mail-row small{ color: #5f8c83; font-size: 8px; }
.aegis-root .mail-row time{ color: #5d897f; font-size: 8px; }
.aegis-root .deleted-mail{ opacity: .68; }
.aegis-root .mail-reader{ padding: 14px 17px; }
.aegis-root .reader-actions{ display: flex; justify-content: space-between; align-items: center; color: #62958c; font-size: 8px; }
.aegis-root .mail-reader h4{ margin: 23px 0 16px; color: #dcfff4; font: 600 19px Rajdhani, sans-serif; letter-spacing: .04em; }
.aegis-root .mail-from{ display: flex; align-items: center; gap: 9px; padding: 9px 0; border-top: 1px solid rgba(106,233,204,.17); border-bottom: 1px solid rgba(106,233,204,.17); }
.aegis-root .mail-avatar{ display: grid; place-items: center; width: 25px; height: 25px; border: 1px solid #58a795; color: #95ddce; font: 600 14px Rajdhani, sans-serif; }
.aegis-root .mail-from b, .aegis-root .mail-from small{ display: block; }
.aegis-root .mail-from b{ color: #aad2c8; font-size: 9px; font-weight: 400; }
.aegis-root .mail-from small{ margin-top: 3px; color: #5e8f85; font-size: 7px; }
.aegis-root .mail-from time{ margin-left: auto; color: #618e86; font-size: 8px; }
.aegis-root .mail-body{ color: #b2d6cd; font-size: 11px; line-height: 1.8; }
.aegis-root .mail-body p{ max-width: 395px; }
.aegis-root .recovered-block{ margin-top: 18px; padding: 10px; border-left: 2px solid #f1ae68; background: rgba(168,99,37,.1); color: #e9c189; }
.aegis-root .recovered-block span{ display: block; margin-bottom: 4px; color: #a77d4e; font-size: 8px; }
.aegis-root .recovered-block b{ font-size: 10px; }
.aegis-root .deleted-strip{ margin-top: 20px; border-top: 1px solid rgba(226,115,96,.28); padding-top: 10px; color: #c18275; font-size: 9px; line-height: 1.6; }
/* Taskbar & notice */
.aegis-root .taskbar{ position: absolute; z-index: 100; bottom: 0; left: 0; right: 0; height: 31px; display: flex; align-items: center; border-top: 1px solid rgba(103,232,202,.27); background: #071617; color: #78a69e; font-size: 8px; letter-spacing: .05em; }
.aegis-root .taskbar-left{ display: flex; gap: 7px; align-items: center; width: 152px; padding-left: 11px; }
.aegis-root .pulse-square{ width: 7px; height: 7px; background: #76f1bb; box-shadow: 0 0 8px #5ff3bb; }
.aegis-root .task-sep{ color: #3d6d65; }
.aegis-root .window-tabs{ display: flex; gap: 2px; min-width: 0; flex: 1; align-self: stretch; }
.aegis-root .task-tab{ max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 11px; border: 0; border-left: 1px solid rgba(102,231,201,.14); background: rgba(41,104,92,.2); color: #9fc8bf; font-size: 8px; }
.aegis-root .task-tab:hover{ background: rgba(82,221,190,.18); color: #dbfff4; }
.aegis-root .task-tab.muted{ opacity: .52; background: transparent; }
.aegis-root .taskbar-right{ display: flex; align-items: center; justify-content: flex-end; gap: 9px; width: 204px; padding-right: 12px; }
.aegis-root .signal-bars{ color: #70e5ca; font-size: 10px; }
.aegis-root .date-stamp{ color: #56847c; }
.aegis-root .notice-pop{ position: absolute; z-index: 140; right: 24px; bottom: 47px; width: 350px; border: 1px solid #dca06b; background: #151815; box-shadow: 0 18px 46px #000b, 0 0 30px rgba(223,160,101,.12); }
.aegis-root .notice-bar{ display: flex; align-items: center; justify-content: space-between; padding: 7px 9px; border-bottom: 1px solid rgba(237,172,106,.35); background: #3b2c20; color: #f4c58f; font-size: 8px; letter-spacing: .08em; }
.aegis-root .notice-bar button{ border: 0; background: transparent; color: #f8c695; font-size: 15px; }
.aegis-root .notice-content{ display: flex; gap: 11px; padding: 14px 13px 10px; color: #d9c1a1; font-size: 10px; line-height: 1.65; }
.aegis-root .notice-content span{ color: #ffc278; font-size: 18px; }
.aegis-root .notice-content p{ margin: 0; }
.aegis-root .notice-ack{ width: calc(100% - 26px); margin: 2px 13px 13px; padding: 8px; border: 1px solid #865f3c; background: transparent; color: #edbd87; font-size: 8px; letter-spacing: .1em; }
.aegis-root .notice-ack:hover{ background: #d49b60; color: #1c140c; }
@media (max-width: 900px){.aegis-root .top-readouts span:not(:first-child), .aegis-root .ambient-readout, .aegis-root .center-reticle{ display: none; }
.aegis-root .system-window, .aegis-root .module-archive, .aegis-root .module-specimens, .aegis-root .module-incidents, .aegis-root .module-surveillance, .aegis-root .module-mail{ width: calc(100vw - 95px); height: min(560px, calc(100vh - 104px)); left: 80px !important; top: 18px !important; }
.aegis-root .system-window.maximized{ width: calc(100vw - 86px); left: 76px !important; }
.aegis-root .app-dock{ left: 8px; }
.aegis-root .taskbar-left{ width: 85px; }
.aegis-root .taskbar-left span:not(.pulse-square){ display: none; }
.aegis-root .taskbar-right{ width: 90px; }
.aegis-root .date-stamp{ display: none; }
.aegis-root .task-tab{ max-width: 105px; }
.aegis-root .login-body{ grid-template-columns: 125px 1fr; }
.aegis-root .login-card form{ grid-column: 2; }
.aegis-root .login-seal{ border-right: 0; }
.aegis-root .archive-layout{ grid-template-columns: 125px 1fr; }
.aegis-root .file-preview{ display: none; }
.aegis-root .mail-module{ grid-template-columns: 110px 220px 1fr; }
.aegis-root .surveillance-module{ grid-template-columns: 1fr 170px; }}
@media (max-width: 620px){.aegis-root{ overflow: auto; }
.aegis-root .boot-panel{ padding: 34px 25px 25px; }
.aegis-root .boot-heading h1{ font-size: 31px; }
.aegis-root .boot-bottom{ display: grid; gap: 15px; }
.aegis-root .login-card{ width: calc(100vw - 26px); }
.aegis-root .login-body{ display: block; padding: 32px 26px; }
.aegis-root .login-seal{ height: 115px; }
.aegis-root .login-seal .brand-mark{ transform: scale(.66); }
.aegis-root .login-copy{ margin: 15px 0 26px; }
.aegis-root .system-window, .aegis-root .module-archive, .aegis-root .module-specimens, .aegis-root .module-incidents, .aegis-root .module-surveillance, .aegis-root .module-mail, .aegis-root .system-window.maximized{ width: calc(100vw - 20px); min-width: 0; height: calc(100vh - 85px); left: 10px !important; top: 10px !important; }
.aegis-root .window-title b{ max-width: 105px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aegis-root .app-dock{ display: none; }
.aegis-root .taskbar-left{ width: 36px; }
.aegis-root .taskbar-right{ width: 72px; }
.aegis-root .taskbar-right .signal-bars{ display: none; }
.aegis-root .window-tabs{ overflow: hidden; }
.aegis-root .task-tab{ min-width: 42px; max-width: 88px; padding: 0 5px; font-size: 0; }
.aegis-root .task-tab span{ font-size: 11px; }
.aegis-root .status-module{ padding: 15px; }
.aegis-root .status-figure{ grid-template-columns: 1fr; gap: 9px; }
.aegis-root .facility-drawing{ display: none; }
.aegis-root .archive-layout{ grid-template-columns: 1fr; }
.aegis-root .folder-tree{ display: none; }
.aegis-root .specimen-layout, .aegis-root .incident-layout{ grid-template-columns: 1fr; }
.aegis-root .specimen-list, .aegis-root .incident-list{ max-height: 145px; overflow: auto; border-right: 0; border-bottom: 1px solid rgba(105,233,203,.18); }
.aegis-root .specimen-detail, .aegis-root .report-detail{ overflow: auto; }
.aegis-root .surveillance-module{ grid-template-columns: 1fr; }
.aegis-root .camera-detail{ display: none; }
.aegis-root .mail-module{ grid-template-columns: 1fr; }
.aegis-root .mail-sidebar, .aegis-root .mail-list{ display: none; }
.aegis-root .mail-reader{ overflow: auto; }
.aegis-root .notice-pop{ right: 10px; bottom: 39px; width: calc(100vw - 20px); }}
/* ── Refinement layer ───────────────────────────────────────────── */
.aegis-root .system-window{ width: 640px; height: 500px; }
.aegis-root .module-archive{ width: 840px; height: 536px; }
.aegis-root .module-specimens{ width: 780px; height: 505px; }
.aegis-root .module-incidents{ width: 800px; height: 520px; }
.aegis-root .module-surveillance{ width: 880px; height: 540px; }
.aegis-root .module-mail{ width: 900px; height: 528px; }
.aegis-root .window-body{ overflow-y: auto; overflow-x: hidden; }
.aegis-root .status-module{ padding: 19px 22px; }
.aegis-root .status-figure{ gap: 24px; margin-top: 15px; }
.aegis-root .facility-drawing{ height: 148px; }
.aegis-root .facility-drawing b{ margin-top: 116px; }
.aegis-root .ring-a{ width: 112px; height: 112px; }
.aegis-root .ring-b{ width: 71px; height: 71px; }
.aegis-root .v-one{ width: 88px; }
.aegis-root .v-two{ width: 63px; }
.aegis-root .v-three{ width: 53px; }
.aegis-root .metric{ padding: 5px 0; }
.aegis-root .readout-stack{ gap: 8px; }
.aegis-root .system-log{ margin-top: 13px; padding: 8px 11px; line-height: 1.7; }
.aegis-root .module-heading.compact{ padding: 16px 20px 12px; }
.aegis-root .specimen-layout{ height: calc(100% - 70px); grid-template-columns: 258px minmax(0, 1fr); }
.aegis-root .specimen-detail{ padding: 17px 19px; overflow: auto; }
.aegis-root .specimen-header{ padding-bottom: 13px; }
.aegis-root .specimen-header h4{ font-size: 18px; }
.aegis-root .bio-grid{ padding: 6px 0; gap: 0 22px; }
.aegis-root .observation-note{ margin-top: 9px; padding: 10px 11px; }
.aegis-root .specimen-secret{ margin-top: 8px; padding: 8px 10px; line-height: 1.55; }
.aegis-root .archive-layout{ grid-template-columns: 156px minmax(0, 1fr) 230px; }
.aegis-root .file-toolbar{ padding: 8px 12px; }
.aegis-root .folder-tree{ padding: 12px 8px; }
.aegis-root .folder-tree button{ padding: 5px 7px; }
.aegis-root .tree-note{ margin: 14px 7px 0; padding-top: 8px; }
.aegis-root .list-head, .aegis-root .file-row{ grid-template-columns: minmax(0,1fr) 44px 74px; gap: 8px; padding: 7px 10px; }
.aegis-root .file-preview{ padding: 14px; }
.aegis-root .file-preview h4{ margin: 7px 0 10px; }
.aegis-root .file-content{ padding-top: 12px; }
.aegis-root .incident-layout{ grid-template-columns: 340px minmax(0,1fr); }
.aegis-root .incident-row{ padding: 10px 11px; }
.aegis-root .report-detail{ padding: 17px 20px; overflow: auto; }
.aegis-root .report-detail h4{ margin: 9px 0 14px; font-size: 21px; }
.aegis-root .report-detail > p{ margin: 15px 0; font-size: 10px; line-height: 1.75; }
.aegis-root .surveillance-module{ grid-template-columns: minmax(0,1fr) 232px; grid-template-rows: minmax(0,1fr) 21px; }
.aegis-root .camera-grid{ grid-template-rows: 1fr 1fr; min-height: 0; }
.aegis-root .cam-label, .aegis-root .cam-foot{ flex-basis: 23px; font-size: 7px; }
.aegis-root .camera-detail{ padding: 15px 12px; overflow-y: auto; }
.aegis-root .mail-module{ grid-template-columns: 140px 268px minmax(0, 1fr); overflow: hidden; }
.aegis-root .mail-module > *{ min-width: 0; }
.aegis-root .mail-sidebar{ position: relative; display: flex; flex-direction: column; padding: 11px 8px; }
.aegis-root .mail-sync{ margin-top: auto; padding: 7px 4px 0; border-top: 1px solid rgba(105,233,203,.14); }
.aegis-root .mail-list{ overflow-y: auto; overflow-x: hidden; }
.aegis-root .mail-list-title{ position: sticky; top: 0; z-index: 2; background: #071a1d; padding: 9px 10px; }
.aegis-root .mail-row{ grid-template-columns: 7px minmax(0,1fr) auto; padding: 9px 8px; }
.aegis-root .mail-reader{ padding: 13px 16px; overflow-y: auto; overflow-x: hidden; }
.aegis-root .mail-reader h4{ margin: 16px 0 12px; }
.aegis-root .mail-body{ font-size: 10px; line-height: 1.75; }
.aegis-root .mail-body p{ margin: 12px 0; }
.aegis-root .mail-from{ padding: 8px 0; }
.aegis-root .avatar-fix, .aegis-root .mail-avatar{ flex: 0 0 25px; }
.aegis-root .credential-hint{ margin: 19px 0 0; padding: 9px 10px; border-left: 1px solid #b58a4a; background: rgba(181,138,74,.08); color: #b9985d; font-size: 9px; line-height: 1.7; letter-spacing: .04em; }
.aegis-root .credential-hint b{ color: #f0c883; font-weight: 500; }
.aegis-root .credential-hint span{ display: block; color: #786a51; font-size: 8px; }
.aegis-root .desktop-watermark{ position: absolute; right: 34px; bottom: 19px; color: rgba(133,224,206,.055); font: 700 92px/.75 Rajdhani, sans-serif; letter-spacing: .08em; text-align: right; pointer-events: none; }
.aegis-root .desktop-watermark span{ display: block; margin-top: 13px; color: rgba(133,224,206,.1); font: 400 8px 'DM Mono', monospace; letter-spacing: .3em; }
.aegis-root .module-directory{ margin-top: 13px; }
.aegis-root .module-directory > span{ display: block; margin-bottom: 6px; color: #5e8b83; font-size: 8px; letter-spacing: .1em; }
.aegis-root .module-directory > div{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; }
.aegis-root .module-directory button{ position: relative; display: grid; gap: 3px; padding: 7px 6px; border: 1px solid rgba(103,231,201,.2); background: rgba(21,60,57,.28); color: #b4ddd3; text-align: left; }
.aegis-root .module-directory button:hover{ border-color: #74f2d2; background: rgba(74,214,184,.16); }
.aegis-root .module-directory b{ font-size: 7px; font-weight: 500; letter-spacing: .02em; }
.aegis-root .module-directory small{ color: #5c8c82; font-size: 7px; }
.aegis-root .module-directory i{ position: absolute; right: 5px; top: 4px; color: #6ce7c8; font-size: 9px; font-style: normal; }
.aegis-root .quarantine{ margin: 12px 10px; padding: 9px 10px; border: 1px dashed rgba(191,137,98,.38); background: rgba(110,68,38,.08); color: #8d7461; font-size: 8px; line-height: 1.7; }
.aegis-root .quarantine span{ display: block; margin-bottom: 3px; color: #b08b64; letter-spacing: .06em; }
.aegis-root .quarantine p{ margin: 0; }
.aegis-root .lock-requirements{ display: grid; gap: 5px; margin-top: 14px; text-align: left; }
.aegis-root .lock-requirements i{ padding: 5px 7px; border: 1px solid rgba(201,121,109,.32); color: #b58b7f; font-size: 8px; font-style: normal; }
.aegis-root .lock-requirements i::before{ content: '⊘ '; }
.aegis-root .lock-requirements i.met{ border-color: rgba(114,236,196,.3); color: #8fd9c4; }
.aegis-root .lock-requirements i.met::before{ content: '◈ '; }
.aegis-root .preview-meta{ margin-top: 16px; padding-top: 9px; border-top: 1px solid rgba(104,229,199,.14); display: grid; gap: 4px; color: #4f7c74; font-size: 7px; }
.aegis-root .preview-meta b{ display: block; margin-top: 2px; color: #8ab6ac; font-size: 8px; font-weight: 400; }
.aegis-root .tree-note small{ color: #4f7a73; font-size: 7px; }
.aegis-root .specimen-footnote{ margin: 13px 8px 0; padding-top: 9px; border-top: 1px solid rgba(103,224,196,.14); color: #4f7c74; font-size: 8px; line-height: 1.75; }
.aegis-root .specimen-footnote span{ display: block; color: #6c9a90; letter-spacing: .08em; }
.aegis-root .specimen-footnote p{ margin: 2px 0; }
.aegis-root .vital-trace{ margin: 9px 0 11px; padding: 8px 9px 5px; border: 1px solid rgba(102,231,201,.15); background: rgba(8,35,35,.45); }
.aegis-root .vital-trace > span{ color: #639288; font-size: 7px; letter-spacing: .1em; }
.aegis-root .vital-trace svg{ display: block; width: 100%; height: 30px; margin: 4px 0 2px; color: #7cf4b9; }
.aegis-root .vital-trace svg.amber{ color: #f4ba61; }
.aegis-root .vital-trace svg.red{ color: #e07a6c; }
.aegis-root .vital-trace svg.cyan{ color: #6feeff; }
.aegis-root .vital-trace > div{ display: flex; justify-content: space-between; color: #4f7c74; font-size: 7px; }
.aegis-root .big-lock{ padding-top: 70px; }
.aegis-root .incident-legend{ margin: 15px 11px; padding-top: 9px; border-top: 1px solid rgba(105,231,202,.14); color: #547f77; font-size: 8px; line-height: 1.8; }
.aegis-root .incident-legend span{ display: block; margin-bottom: 3px; letter-spacing: .08em; }
.aegis-root .incident-legend p{ margin: 0; display: flex; align-items: center; gap: 6px; }
.aegis-root .incident-legend i{ width: 5px; height: 5px; background: #6cd8ef; }
.aegis-root .incident-legend i.critical{ background: #f3736d; }
.aegis-root .incident-legend i.high{ background: #f1bc67; }
.aegis-root .attachment-preview{ margin-top: 8px; padding: 8px; border: 1px solid rgba(105,231,202,.15); background: rgba(4,16,18,.65); }
.aegis-root .frame-strip{ display: flex; gap: 3px; margin-bottom: 6px; }
.aegis-root .frame-strip i{ flex: 1; height: 32px; border: 1px solid rgba(113,235,205,.16); background: repeating-linear-gradient(125deg, rgba(88,208,180,.12) 0 6px, rgba(9,28,30,.9) 7px 13px); }
.aegis-root .frame-strip i:nth-child(3){ background: repeating-linear-gradient(125deg, rgba(220,133,104,.22) 0 6px, rgba(25,20,18,.9) 7px 13px); }
.aegis-root .attachment-preview > span{ display: block; color: #7eaea3; font-size: 8px; }
.aegis-root .attachment-preview button{ margin-top: 6px; border: 0; background: transparent; color: #6ce7c8; font-size: 8px; padding: 0; }
.aegis-root .evidence-chain{ margin-top: 12px; border-top: 1px solid rgba(105,231,202,.15); padding-top: 9px; }
.aegis-root .evidence-chain > span{ color: #5d8e85; font-size: 8px; letter-spacing: .1em; }
.aegis-root .evidence-chain p{ margin: 4px 0; color: #7ca99f; font-size: 8px; }
.aegis-root .evidence-chain > div{ display: flex; gap: 6px; margin-top: 7px; }
.aegis-root .evidence-chain button{ padding: 4px 6px; border: 1px solid rgba(104,230,199,.25); background: transparent; color: #8bd7c3; font-size: 7px; }
.aegis-root .evidence-chain button:hover{ border-color: #6ce7c8; }
.aegis-root .timeline{ margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(105,233,203,.18); }
.aegis-root .timeline > span{ color: #5e8c83; font-size: 7px; }
.aegis-root .timeline-track{ display: flex; justify-content: space-between; margin: 6px 0; }
.aegis-root .timeline-track button{ padding: 3px 2px; border: 0; background: transparent; color: #6b9c92; font-size: 7px; }
.aegis-root .timeline-track button.on{ color: #071614; background: #7cf4d3; }
.aegis-root .timeline-frame{ height: 40px; display: grid; place-items: center; border: 1px solid rgba(112,236,206,.2); background: repeating-linear-gradient(135deg, rgba(71,190,168,.14) 0 5px, rgba(6,20,22,.9) 6px 12px); }
.aegis-root .timeline-frame b{ color: #a8e9da; font-size: 8px; font-weight: 400; }
.aegis-root .timeline p{ margin: 5px 0 0; color: #d3a57f; font-size: 8px; }
.aegis-root .camera-scan{ grid-column: 1; grid-row: 2; display: flex; justify-content: space-between; align-items: center; padding: 0 9px; border-top: 1px solid rgba(105,233,203,.16); background: rgba(5,20,23,.7); color: #5d8c83; font-size: 7px; letter-spacing: .08em; }
.aegis-root .timeline-note{ grid-column: 2; grid-row: 2; border: 0; border-top: 1px solid rgba(105,233,203,.16); border-left: 1px solid rgba(105,233,203,.16); background: rgba(5,20,23,.7); color: #7ba79d; font-size: 7px; letter-spacing: .04em; }
.aegis-root .timeline-note:hover{ color: #9fe6d7; }
.aegis-root .deleted-strip button{ display: block; margin-top: 7px; padding: 5px 7px; border: 1px solid rgba(221,133,112,.35); background: transparent; color: #d99a89; font-size: 7px; }
.aegis-root .mail-attachments{ margin-top: 16px; padding-top: 9px; border-top: 1px solid rgba(105,233,203,.14); }
.aegis-root .mail-attachments span{ display: block; margin-bottom: 6px; color: #5b8a80; font-size: 8px; letter-spacing: .08em; }
.aegis-root .mail-attachments button{ padding: 6px 8px; border: 1px solid rgba(105,233,203,.22); background: rgba(24,65,62,.3); color: #a2d3c8; font-size: 8px; }
@media (max-width: 900px){.aegis-root .module-directory > div{ grid-template-columns: repeat(3, 1fr); }
.aegis-root .surveillance-module{ grid-template-columns: minmax(0,1fr) 185px; }
.aegis-root .desktop-watermark{ display: none; }}
/* ── Protocol finale ───────────────────────────────────────────── */
.aegis-root .login-card form{ gap: 18px; }
.aegis-root .login-card label{ line-height: 1.5; }
.aegis-root .login-card input{ margin-top: 8px; }
.aegis-root .sealed-disclosure.armed{ border-left-color: #ff7d6c; background: rgba(180, 45, 30, .14); color: #f0bbb0; align-items: flex-start; }
.aegis-root .sealed-disclosure.armed b{ display: block; margin-bottom: 3px; color: #ffa08e; font-size: 9px; letter-spacing: .08em; }
.aegis-root .sealed-disclosure.armed p{ margin: 0; }
.aegis-root .sealed-disclosure.armed button{ margin-top: 7px; border: 1px solid rgba(255, 130, 110, .5); background: transparent; color: #ffb6a5; padding: 5px 8px; font-size: 8px; }
.aegis-root .sealed-disclosure.armed button:hover{ background: #ff8f78; color: #200d09; }
.aegis-root .finale-overlay{ position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 50% 38%, rgba(66, 10, 9, .6), rgba(3, 7, 8, .97) 62%); backdrop-filter: blur(7px); }
.aegis-root .finale-stripes{ position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(135deg, rgba(255, 86, 72, .07) 0 14px, transparent 14px 28px); animation: aegis-stripeShift 18s linear infinite; }
@keyframes aegis-stripeShift{ to { background-position: 420px 0; } }
.aegis-root .finale-panel{ position: relative; width: min(690px, 100%); padding: 21px 28px 24px; border: 1px solid rgba(255, 110, 92, .5); background: rgba(9, 16, 17, .95); box-shadow: 0 0 0 1px rgba(255, 120, 100, .07), 0 30px 90px #000, inset 0 0 60px rgba(255, 80, 60, .05); }
.aegis-root .finale-top{ display: flex; justify-content: space-between; gap: 12px; padding-bottom: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255, 110, 92, .25); color: #c98d80; font-size: 8px; letter-spacing: .12em; }
.aegis-root .alarm-dot{ display: inline-block; width: 6px; height: 6px; margin-right: 6px; background: #ff6a5c; box-shadow: 0 0 10px #ff5b4a; animation: aegis-blink 1s infinite; }
.aegis-root .finale-panel h2{ margin: 8px 0 16px; color: #ffe9e2; font: 600 46px/.86 Rajdhani, sans-serif; letter-spacing: .04em; }
.aegis-root .finale-panel h2 em{ color: #ff8e79; }
.aegis-root .finale-copy{ max-width: 525px; margin: 14px 0 0; color: #c7b0a9; font-size: 11px; line-height: 1.9; }
.aegis-root .finale-options{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 22px; }
.aegis-root .finale-options button{ display: grid; grid-template-columns: auto 1fr; gap: 3px 9px; padding: 13px; border: 1px solid rgba(255, 127, 105, .35); background: rgba(96, 30, 24, .18); color: #f0d3ca; text-align: left; }
.aegis-root .finale-options button:hover{ border-color: #ff9d86; background: rgba(160, 52, 38, .3); }
.aegis-root .finale-options span{ grid-row: span 2; display: grid; place-items: center; width: 24px; height: 24px; border: 1px solid #b96a59; color: #ffb4a1; font: 600 13px Rajdhani, sans-serif; }
.aegis-root .finale-options b{ font-size: 11px; font-weight: 500; }
.aegis-root .finale-options small{ color: #a98a80; font-size: 8px; }
.aegis-root .epilogue{ display: grid; gap: 10px; padding: 14px 0; border-top: 1px solid rgba(255, 120, 100, .2); border-bottom: 1px solid rgba(255, 120, 100, .2); }
.aegis-root .epilogue p{ margin: 0; color: #cbb2aa; font-size: 11px; line-height: 1.85; }
.aegis-root .finale-foot{ display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 20px; color: #8d6f67; font-size: 8px; letter-spacing: .1em; }
.aegis-root .finale-foot button{ padding: 9px 12px; border: 1px solid rgba(255, 126, 105, .5); background: transparent; color: #ffb3a2; font-size: 8px; letter-spacing: .1em; }
.aegis-root .finale-foot button:hover{ background: #ff8f78; color: #1a0b08; }
@media (max-width: 620px){.aegis-root .finale-panel{ padding: 18px; }
.aegis-root .finale-panel h2{ font-size: 33px; }
.aegis-root .finale-options{ grid-template-columns: 1fr; }
.aegis-root .finale-top{ font-size: 7px; }}
/* ── CCTV scene layer ──────────────────────────────────────────── */
.aegis-root .cam-scene{ position: absolute; inset: 0; z-index: 1; }
.aegis-root .cam-light{ position: absolute; left: 50%; top: 3%; width: 26%; height: 2px; transform: translateX(-50%); background: rgba(196, 255, 240, .55); box-shadow: 0 0 24px 6px rgba(120, 255, 225, .16); }
.aegis-root .cam-wall{ position: absolute; top: 0; bottom: 0; width: 47%; opacity: .9; }
.aegis-root .cam-wall.left{ left: 0; background: linear-gradient(90deg, rgba(150, 232, 214, .16), rgba(20, 60, 62, .05)); clip-path: polygon(0 0, 100% 31%, 100% 73%, 0 100%); border-left: 1px solid rgba(140, 240, 220, .12); }
.aegis-root .cam-wall.right{ right: 0; background: linear-gradient(270deg, rgba(150, 232, 214, .13), rgba(20, 60, 62, .04)); clip-path: polygon(100% 0, 0 31%, 0 73%, 100% 100%); border-right: 1px solid rgba(140, 240, 220, .1); }
.aegis-root .cam-floor{ position: absolute; left: 0; right: 0; bottom: 0; height: 42%; background: linear-gradient(180deg, rgba(130, 226, 206, .02), rgba(120, 210, 192, .16)); clip-path: polygon(0 100%, 100% 100%, 69% 21%, 31% 21%); }
.aegis-root .cam-floor::after{ content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 38px, rgba(140, 245, 224, .09) 39px); clip-path: inherit; }
.aegis-root .cam-door{ position: absolute; left: 50%; top: 30%; width: 15%; height: 44%; transform: translateX(-50%); border: 1px solid rgba(154, 245, 224, .4); background: linear-gradient(180deg, rgba(143, 240, 218, .09), rgba(4, 15, 17, .72)); box-shadow: inset 0 0 18px rgba(80, 215, 190, .1), 0 0 22px rgba(75, 214, 188, .08); }
.aegis-root .cam-door::after{ content: ''; position: absolute; left: 50%; top: 46%; width: 1px; height: 10%; background: rgba(170, 255, 236, .4); }
.aegis-root .cam-figure{ position: absolute; left: 55%; bottom: 25%; width: 5%; min-width: 9px; height: 23%; background: linear-gradient(180deg, rgba(3, 9, 10, .9), rgba(6, 17, 18, .96)); border-radius: 46% 46% 12% 12%; box-shadow: 0 0 22px rgba(0, 0, 0, .65); animation: aegis-figureShift 9s ease-in-out infinite; }
.aegis-root .cam-figure::before{ content: ''; position: absolute; left: 50%; top: -22%; width: 78%; aspect-ratio: 1; transform: translateX(-50%); border-radius: 50%; background: rgba(3, 9, 10, .95); }
.aegis-root .cam-tank{ position: absolute; bottom: 20%; width: 16%; height: 32%; border: 1px solid rgba(140, 240, 220, .35); border-radius: 50% 50% 8% 8%; background: linear-gradient(180deg, rgba(127, 240, 214, .12), rgba(8, 25, 27, .5)); }
.aegis-root .cam-tank.one{ left: 19%; }
.aegis-root .cam-tank.two{ right: 18%; height: 27%; }
.aegis-root .camera-tile.anomaly .cam-scene{ filter: hue-rotate(-26deg) saturate(1.35) contrast(1.1); }
.aegis-root .camera-tile.anomaly .cam-figure{ animation-duration: 3.4s; }
@keyframes aegis-figureShift{ 0%, 100% { transform: translateX(-4px); opacity: .82; } 50% { transform: translateX(5px); opacity: 1; } }
.aegis-root .camera-image::after{ background: repeating-linear-gradient(0deg, transparent 0 4px, rgba(200, 255, 240, .34) 5px), radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, .05), transparent 55%); }
.aegis-root{position:fixed;inset:0;z-index:9000;width:100%;height:100%;overflow:hidden;}
.aegis-root .aegis-exit{position:absolute;top:10px;left:12px;z-index:50;padding:4px 9px;border:1px solid #2f5d56;background:rgba(5,11,12,.7);color:#6fb8a8;font-size:10px;letter-spacing:.12em;text-decoration:none;}
.aegis-root .aegis-exit:hover{color:#92ffe0;border-color:#6ae0c4;}
.aegis-root .task-exit{white-space:nowrap;color:#6fb8a8;text-decoration:none;font-size:10px;letter-spacing:.12em;padding:0 8px;border:1px solid #2f5d56;margin-right:8px;}
.aegis-root .task-exit:hover{color:#92ffe0;border-color:#6ae0c4;}
`;
