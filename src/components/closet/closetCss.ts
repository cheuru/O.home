// 옷장 화면 스타일 — 원본(우초맨 제작) CSS를 .cl-root 아래로 옮긴 것. 사이드바는 고정 배치 대신 페이지 안에 놓는다.
export const CLOSET_CSS = String.raw`
.cl-root *{box-sizing:border-box;}
.cl-root .dressup-container{position:relative;width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;user-select:none;font-family:var(--mf);margin-top:5px;}
.cl-root .ribbon-wrapper{position:relative;display:inline-block;margin-bottom:4px;padding:0 40px;z-index:1;filter:drop-shadow(0 5px 5px rgba(0,0,0,.15));}
.cl-root .ribbon-wrapper::before,.cl-root .ribbon-wrapper::after{content:'';position:absolute;top:12px;width:60px;height:60px;background:var(--rm);z-index:-2;}
.cl-root .ribbon-wrapper::before{right:100%;margin-right:-12px;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,20% 50%);}
.cl-root .ribbon-wrapper::after{left:100%;margin-left:-12px;clip-path:polygon(0 0,100% 0,80% 50%,100% 100%,0 100%);}
.cl-root .ribbon-bg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:60px;background:linear-gradient(to bottom,var(--pc) 0%,var(--rm) 50%,var(--rm) 100%);border-radius:4px;z-index:2;}
.cl-root .ribbon-bg::before,.cl-root .ribbon-bg::after{content:'';position:absolute;bottom:-12px;width:0;height:0;z-index:-1;filter:brightness(.7);}
.cl-root .ribbon-bg::before{left:0;border-top:12px solid var(--rm);border-left:12px solid transparent;}
.cl-root .ribbon-bg::after{right:0;border-top:12px solid var(--rm);border-right:12px solid transparent;}
.cl-root #cl-title{position:relative;z-index:3;font-size:42px;color:var(--tc);height:60px;display:flex;align-items:center;justify-content:center;letter-spacing:2px;font-family:var(--tf);white-space:nowrap;padding:0 10px;text-shadow:0 1px 1px rgba(255,255,255,.4);}
.cl-root #cl-title span{display:inline-block;font-family:var(--tf);}
@keyframes titleWagle{0%{transform:rotate(0) translateY(0)}25%{transform:rotate(-5deg) translateY(-2px)}50%{transform:rotate(5deg) translateY(2px)}75%{transform:rotate(-3deg) translateY(-1px)}100%{transform:rotate(0) translateY(0)}}
.cl-root .title-save-btn{display:flex;justify-content:center;gap:10px;margin-top:2px;}
.cl-root .dual-stage{display:flex;gap:20px;align-items:flex-start;justify-content:center;flex-wrap:wrap;}
.cl-root .wardrobe-sidebar{position:relative;width:410px;max-width:100%;display:flex;flex-direction:column;}
.cl-root .char-name-label{font-size:32px;color:var(--pc);font-family:var(--mf);font-weight:bold;letter-spacing:1px;text-align:center;margin-bottom:10px;}
.cl-root .char-btn-row{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;}
.cl-root .character-stage{position:relative;z-index:5;cursor:pointer;}
.cl-root .char-visuals{width:100%;height:100%;position:relative;}
.cl-root .base-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;}
.cl-root .dropped-item{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}
.cl-root .speech-bubble{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #333;border-radius:15px;padding:8px 15px;font-size:16px;font-family:var(--mf);color:#333;z-index:100;opacity:0;pointer-events:none;box-shadow:2px 2px 5px rgba(0,0,0,.1);white-space:nowrap;text-align:center;transition:opacity 0.4s ease;}
.cl-root .speech-bubble.bvis{opacity:1;pointer-events:auto;}
.cl-root .speech-bubble::after{content:'';position:absolute;bottom:-10px;left:50%;margin-left:-6px;border-width:10px 6px 0;border-style:solid;border-color:#333 transparent;display:block;width:0;}
.cl-root .speech-bubble::before{content:'';position:absolute;bottom:-7px;left:50%;margin-left:-4px;border-width:8px 4px 0;border-style:solid;border-color:#fff transparent;display:block;width:0;z-index:1;}
.cl-root .blush-overlay{position:absolute;background:radial-gradient(ellipse at center,rgba(255,0,0,.3) 0%,transparent 70%);z-index:15;opacity:0;transition:opacity 1s ease-in;pointer-events:none;}
.cl-root .active-blush{opacity:1!important;}
.cl-root .sweat-drop{position:absolute;width:12px;height:12px;background:#8ED6FF;border-radius:0 50% 50% 50%;transform:rotate(45deg);opacity:0;z-index:100;pointer-events:none;}
@keyframes sweatAnim{0%{opacity:0;top:8.3%}20%{opacity:1;top:8.3%}80%{opacity:1;top:15%}100%{opacity:0;top:16.7%}}
.cl-root .dark-cloud{position:absolute;background:#999;border-radius:50px;z-index:90;opacity:0;pointer-events:none;filter:drop-shadow(2px 2px 0 #666);animation:floatCloud 4s infinite ease-in-out;}
.cl-root .dark-cloud::after,.cl-root .dark-cloud::before{content:'';position:absolute;background:inherit;border-radius:50%;}
.cl-root .dark-cloud::after{width:50%;height:120%;top:-50%;left:15%;}
.cl-root .dark-cloud::before{width:50%;height:110%;top:-40%;right:15%;}
@keyframes floatCloud{0%{transform:translateY(0);opacity:0}20%{opacity:.9}50%{transform:translateY(-8px);opacity:.9}100%{transform:translateY(0);opacity:.9}}
@keyframes flyUpOff{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-60px);opacity:0}}
@keyframes flyDownOff{0%{transform:translateY(0);opacity:1}100%{transform:translateY(60px);opacity:0}}
@keyframes flyInDown{0%{transform:translateY(-30px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes flyInUp{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}
.cl-root .anim-fly-up{animation:flyUpOff .5s ease-in forwards;}
.cl-root .anim-fly-down{animation:flyDownOff .5s ease-in forwards;}
.cl-root .anim-fly-in-down{animation:flyInDown .5s ease-out forwards;}
.cl-root .anim-fly-in-up{animation:flyInUp .5s ease-out forwards;}
@keyframes bounceEffect{0%{transform:scale(1) translateY(0)}40%{transform:scale(1.1,.9) translateY(5px)}60%{transform:scale(.95,1.05) translateY(-10px)}80%{transform:scale(1.02,.98) translateY(2px)}100%{transform:scale(1) translateY(0)}}
.cl-root .anim-bounce{animation:bounceEffect .5s ease-in-out;transform-origin:bottom center;}
@keyframes jumpEffect{0%{transform:translateY(0)}30%{transform:translateY(-20px)}50%{transform:translateY(0)}70%{transform:translateY(-10px)}100%{transform:translateY(0)}}
.cl-root .anim-jump{animation:jumpEffect .8s ease-out;}
@keyframes shakeEffect{0%{transform:translate(1px,1px) rotate(0)}10%{transform:translate(-1px,-2px) rotate(-1deg)}20%{transform:translate(-3px,0) rotate(1deg)}30%{transform:translate(3px,2px)}40%{transform:translate(1px,-1px) rotate(1deg)}50%{transform:translate(-1px,2px) rotate(-1deg)}60%{transform:translate(-3px,1px)}70%{transform:translate(3px,1px) rotate(-1deg)}80%{transform:translate(-1px,-1px) rotate(1deg)}90%{transform:translate(1px,2px)}100%{transform:translate(1px,-2px) rotate(-1deg)}}
.cl-root .anim-shake{animation:shakeEffect .5s;}
@keyframes weakShake{0%{transform:translate(0,0)}25%{transform:translate(1px,1px)}50%{transform:translate(-1px,-1px)}75%{transform:translate(-1px,1px)}100%{transform:translate(0,0)}}
.cl-root .anim-weak-shake{animation:weakShake .2s infinite;}
@keyframes gloomAnim{0%{transform:scale(1);filter:grayscale(0%)}50%{transform:scale(1.02,.96) translateY(3px);filter:grayscale(60%) brightness(.95)}100%{transform:scale(1);filter:grayscale(0%)}}
.cl-root .anim-gloom{animation:gloomAnim 3s infinite ease-in-out;transform-origin:bottom center;}
@keyframes heavyEffect{0%{transform:scale(1)}50%{transform:scale(1.05,.92) translateY(5px)}100%{transform:scale(1)}}
.cl-root .anim-heavy{animation:heavyEffect .6s ease-in-out;transform-origin:bottom center;}
.cl-root .anim-heavy-slow{animation:heavyEffect 2.5s ease-in-out;transform-origin:bottom center;}
@keyframes peepEffect{0%{transform:scale(1)}50%{transform:scale(.95,1.08) translateY(-3px)}100%{transform:scale(1)}}
.cl-root .anim-peep{animation:peepEffect 2s ease-in-out;transform-origin:bottom center;}
@keyframes attentionBounce{0%{transform:translateY(0)}30%{transform:translateY(-5px)}50%{transform:translateY(0)}80%{transform:translateY(-5px)}100%{transform:translateY(0)}}
.cl-root .anim-attention{animation:attentionBounce .6s ease-out;}
@keyframes bubblePop{0%{transform:translateX(-50%) scale(0);opacity:0}60%{transform:translateX(-50%) scale(1.15);opacity:1}80%{transform:translateX(-50%) scale(.95);opacity:1}100%{transform:translateX(-50%) scale(1);opacity:1}}
.cl-root .anim-pop{display:block;transform-origin:bottom center;animation:bubblePop .4s cubic-bezier(.175,.885,.32,1.275) forwards;}
.cl-root .btn_custom{background:#555;color:#fff;border:none;height:30px;padding:0 12px;border-radius:15px;cursor:pointer;font-size:13px;font-family:var(--mf);transition:all .3s;display:flex;align-items:center;justify-content:center;}
.cl-root .btn_custom:hover{background:var(--pc);transform:translateY(-1px);}
.cl-root .btn_reset:hover{background:#d9534f!important;animation:btnStartle .4s;transform:none!important;}
@keyframes btnStartle{0%{transform:scale(1) rotate(0)}40%{transform:scale(1.15) rotate(-5deg)}60%{transform:scale(1.15) rotate(5deg)}80%{transform:scale(1.05) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
.cl-root .worn-panel-wrap{margin-top:5px;}
.cl-root .worn-panel-title{font-size:11px;color:#bbb;font-family:var(--mf);margin-bottom:4px;}
.cl-root .worn-panel{display:flex;flex-wrap:wrap;gap:5px;min-height:52px;padding:5px;background:rgba(255,255,255,.65);border:1px dashed #ddd;border-radius:10px;align-content:flex-start;}
.cl-root .worn-chip{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;}
.cl-root .worn-chip img{width:46px;height:46px;object-fit:contain;border:2px solid var(--pc);border-radius:8px;background:#fff;}
.cl-root .worn-chip .chip-lbl{font-size:8px;color:#aaa;font-family:var(--mf);max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;}
.cl-root .worn-x{position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:50%;background:#d9534f;color:#fff;border:none;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.cl-root .worn-x:hover{background:#a02020;}
.cl-root .zi-row{display:flex;gap:2px;align-items:center;margin-top:1px;}
.cl-root .zi-btn{width:14px;height:14px;border:1px solid #ddd;background:#f5f5f5;border-radius:3px;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;color:#666;padding:0;}
.cl-root .zi-btn:hover{background:var(--pc);color:#fff;border-color:var(--pc);}
.cl-root .zi-val{font-size:8px;color:#888;min-width:16px;text-align:center;}
.cl-root .worn-empty{font-size:11px;color:#ccc;font-family:var(--mf);padding:4px;align-self:center;}
.cl-root .wardrobe-top-bar{display:flex;gap:6px;align-items:center;margin-bottom:4px;padding:0 2px;}
.cl-root .search-box{flex:1;min-width:110px;max-width:200px;height:30px;padding:0 10px;border:2px solid #ddd;border-radius:15px;font-family:var(--mf);font-size:13px;outline:none;transition:border-color .2s;}
.cl-root .search-box:focus{border-color:var(--pc);}
.cl-root .tab-nav{display:flex;gap:0;margin-bottom:-2px;padding:0;position:relative;z-index:5;}
.cl-root .tab-btn{background:#e8e8e8;border:2px solid #ccc;border-bottom:none;border-radius:9px 9px 0 0;padding:5px 3px;white-space:nowrap;font-family:var(--mf);font-size:13px;color:#999;cursor:pointer;transition:background .15s,color .15s;flex:1;text-align:center;min-width:0;overflow:hidden;}
.cl-root .tab-btn:hover{background:#f0f0f0;color:#666;}
.cl-root .tab-btn.active{background:rgba(255,255,255,.92);border-color:#ccc;color:var(--pc);font-weight:bold;}
.cl-root .wardrobe-wrapper{position:relative;}
.cl-root .wardrobe{background:rgba(255,255,255,.88);border:2px dashed #bbb;border-radius:0 0 12px 12px;box-shadow:0 5px 15px rgba(0,0,0,.05);padding:8px;overflow:hidden;height:400px;position:relative;}
.cl-root .tab-panel{position:absolute;top:0;left:0;width:100%;height:100%;overflow-y:auto;flex-wrap:wrap;align-content:flex-start;gap:6px;padding:8px;visibility:hidden;opacity:0;pointer-events:none;display:flex;}
.cl-root .tab-panel.active{visibility:visible;opacity:1;pointer-events:auto;}
.cl-root .tab-panel::-webkit-scrollbar-thumb{background:rgba(0,0,0,.2);border-radius:10px;}
.cl-root .clothes-item{width:60px;height:60px;cursor:grab;transition:transform .2s,border-color .2s;background:#fff;border:2px solid #eee;border-radius:10px;object-fit:contain;flex-shrink:0;}
.cl-root .clothes-item:hover{transform:translateY(-3px);border-color:#bbb;box-shadow:0 4px 8px rgba(0,0,0,.1);}
.cl-root .clothes-item.item-worn{visibility:hidden;pointer-events:none;}
.cl-root .clothes-item{touch-action:manipulation;}
.cl-root .dbl-bar{display:flex;align-items:center;gap:4px;margin-top:6px;flex-wrap:wrap;}
.cl-root .dbl-hint{font-size:11px;color:#999;margin-right:2px;}
.cl-root .dbl-btn{background:#eee;border:1px solid #ddd;border-radius:11px;padding:2px 9px;font-family:var(--mf);font-size:11px;color:#999;cursor:pointer;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cl-root .dbl-btn.active{background:var(--pc);border-color:var(--pc);color:#fff;font-weight:bold;}
.cl-root .clothes-item.dbl-flash{outline:3px solid var(--pc);outline-offset:-2px;}
.cl-root .clothes-item.item-hidden{display:none;}
.cl-root .clothes-item[data-type="bg"]{cursor:pointer;border-style:dashed;}
.cl-root .clothes-item[data-type="bg"]:hover{border-style:solid;border-color:var(--pc);}
.cl-root .bg-remove-btn{width:60px;height:60px;background:#f8f8f8;border:2px dashed #ccc;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;color:#aaa;cursor:pointer;transition:all .2s;font-family:var(--mf);text-align:center;gap:2px;}
.cl-root .bg-remove-btn:hover{border-color:#d9534f;color:#d9534f;background:#fff0f0;}
.cl-root .tab-empty{width:100%;text-align:center;color:#ccc;font-size:13px;margin-top:18px;font-family:var(--mf);}
.cl-root .item-tooltip{position:absolute;background:rgba(255,255,255,.95);border:2px solid #888;border-radius:8px;padding:4px 10px;font-family:var(--mf);font-size:14px;color:#444;pointer-events:none;z-index:10000;display:none;box-shadow:2px 2px 5px rgba(0,0,0,.1);white-space:nowrap;}
.cl-root .footer-credit{margin-top:6px;display:flex;align-items:center;gap:10px;font-size:12px;color:#aaa;font-family:var(--mf);}
.cl-root .footer-credit a{color:#aaa;text-decoration:none;transition:color .2s;}
.cl-root .footer-credit a:hover{color:#555;}
.cl-root .guide-box{position:fixed;top:130px;left:10px;width:275px;background:rgba(255,255,255,.98);border:2px dashed var(--pc);border-radius:15px;padding:14px 17px;z-index:999;box-shadow:0 5px 15px rgba(0,0,0,.05);font-family:var(--mf)!important;color:#666;font-size:13px;line-height:1.5;transition:opacity .5s,transform .5s;}
.cl-root .guide-box *{font-family:var(--mf)!important;}
.cl-root .guide-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed #eee;padding-bottom:7px;margin-bottom:9px;font-size:16px;color:var(--pc);cursor:move;touch-action:none;user-select:none;-webkit-user-select:none;}
.cl-root .guide-header .guide-grip{color:#ccc;font-size:12px;letter-spacing:2px;cursor:move;}
.cl-root .guide-box.is-dragging{transition:none!important;opacity:.9;box-shadow:0 10px 26px rgba(0,0,0,.16);}
.cl-root .guide-header span{font-family:var(--mf)!important;}
.cl-root .btn-close-guide{background:none;border:none;font-size:17px;cursor:pointer;color:#ccc;}
.cl-root .guide-list{list-style:none;padding:0;margin:0;}
.cl-root .guide-list li{margin-bottom:4px;position:relative;padding-left:14px;font-size:12px;}
.cl-root .guide-list li::before{content:'✔';position:absolute;left:0;top:1px;color:var(--pc);font-size:10px;}
.cl-root .guide-list li b{color:var(--pc);}
.cl-root .guide-details{display:none;padding-top:8px;border-top:1px dashed #eee;}
.cl-root .btn-toggle-detail{width:100%;margin-top:6px;padding:2px 0;background:transparent;border:none;color:#aaa;cursor:pointer;font-family:var(--mf)!important;font-size:12px;transition:color .3s;}
.cl-root .btn-toggle-detail:hover{color:var(--pc);text-decoration:underline;}
@media(max-width:1000px){.cl-root .dual-stage{flex-direction:column;align-items:center;gap:24px;transform:none;}
.cl-root .guide-box{display:none;}
.cl-root .wardrobe-sidebar{position:static;width:95vw;max-width:640px;margin:0 auto;max-height:none;}
.cl-root .wardrobe{height:300px!important;}}
@media(max-width:750px){.cl-root .tab-btn{font-size:10px;padding:3px 5px;}
.cl-root #cl-title{font-size:30px;}}

.cl-root .cl-main{display:flex;gap:28px;justify-content:center;align-items:flex-start;flex-wrap:wrap;width:100%;}
.cl-root .cl-ghost{position:fixed;pointer-events:none;z-index:9999;object-fit:contain;background:transparent;border:none;}
.cl-root .item-tooltip{position:fixed;display:block;}
.cl-root .cl-adminlink{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 24px;background:var(--pc);color:#fff;border-radius:20px;text-decoration:none;font-size:14px;box-shadow:0 3px 10px rgba(0,0,0,.15);}
.cl-root .guide-box{position:fixed;}
.cl-root .guide-details.open{display:block;}
.cl-root .bg-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;}
.cl-root .bg-modal-box{background:#fff;border-radius:16px;padding:28px 32px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.25);font-family:var(--mf);min-width:260px;}
.cl-root .char-col{display:flex;flex-direction:column;align-items:center;}
.cl-root .clothes-item{touch-action:pan-y;-webkit-user-drag:none;}
/* ── 사이트 톤 맞춤 — 색·모서리·그림자·글꼴을 O.home 설정값(--ink, --line, --panel …)에서 가져온다 ── */
.cl-root #cl-title{font-size:calc(30px*var(--fs,1));font-weight:300;letter-spacing:.16em;color:var(--tc);font-family:var(--tf);text-shadow:none;}
.cl-root .ribbon-wrapper{filter:none;padding:0 6px;margin:0;}
.cl-root .ribbon-wrapper::before,.cl-root .ribbon-wrapper::after,.cl-root .ribbon-bg{display:none;}
.cl-root .dressup-container{gap:16px;margin-top:0;}
.cl-root .btn_custom{background:var(--btn-dark,var(--ink));color:var(--btn-dark-fg,#fff);height:34px;padding:0 16px;border-radius:var(--radius-s);font-size:calc(12px*var(--fs,1));letter-spacing:.03em;font-family:var(--sans);font-weight:400;transition:background .2s,color .2s,border-color .2s;}
.cl-root .btn_custom:hover{background:var(--btn-dark-hv,#33373e);transform:none;}
.cl-root .btn_custom.ghost{background:transparent;color:var(--sub);border:1.5px solid var(--line);}
.cl-root .btn_custom.ghost:hover{background:transparent;color:var(--ink);border-color:var(--steel-3);}
.cl-root .btn_custom.accent{background:var(--accent);color:#fff;}
.cl-root .btn_custom.accent:hover{background:var(--accent-soft);}
.cl-root .btn_reset{background:transparent;color:var(--sub);border:1.5px solid var(--line);}
.cl-root .btn_reset:hover{background:transparent!important;color:var(--accent);border-color:var(--accent);animation:none;}
.cl-root .char-name-label{font-size:calc(19px*var(--fs,1));font-weight:500;color:var(--page-title,var(--ink));letter-spacing:.08em;font-family:var(--mf);margin-bottom:12px;}
.cl-root .char-btn-row{gap:6px;margin-bottom:2px;}
.cl-root .character-stage{background:transparent;border:none;border-radius:var(--radius);box-shadow:none;}
.cl-root .speech-bubble{top:6px;border:1.5px solid var(--ink);border-radius:12px;color:var(--ink);font-size:14px;font-family:var(--mf);box-shadow:var(--sh-sm);padding:7px 14px;}
.cl-root .speech-bubble::after{border-color:var(--ink) transparent;}
.cl-root .worn-panel-title{color:var(--faint);font-size:11px;letter-spacing:.03em;margin-bottom:6px;font-family:var(--mf);}
.cl-root .worn-panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-s);padding:7px;}
.cl-root .worn-chip img{border:1px solid var(--line);border-radius:var(--radius-s);}
.cl-root .worn-chip .chip-lbl{color:var(--faint);}
.cl-root .worn-x{background:var(--ink);color:var(--panel-solid);}
.cl-root .worn-x:hover{background:var(--accent);}
.cl-root .zi-btn{border-color:var(--line);background:#fff;color:var(--sub);}
.cl-root .zi-btn:hover{background:var(--ink);border-color:var(--ink);color:#fff;}
.cl-root .zi-val{color:var(--faint);}
.cl-root .worn-empty{color:var(--faint);}
.cl-root .wardrobe-sidebar{background:var(--panel);border-radius:var(--radius);box-shadow:var(--sh-md);padding:16px;}
.cl-root .wardrobe-top-bar{flex-direction:column;align-items:stretch;gap:8px;margin-bottom:10px;padding:0;}
.cl-root .search-box{max-width:none;height:34px;border:1px solid var(--line);border-radius:var(--radius-s);background:#fff;color:var(--ink);font-family:var(--sans);font-size:calc(12.5px*var(--fs,1));padding:0 12px;}
.cl-root .search-box:focus{border-color:var(--steel-3);box-shadow:0 0 0 3px rgba(60,67,77,.1);}
.cl-root .dbl-bar{margin-top:0;gap:5px;}
.cl-root .dbl-hint{color:var(--faint);font-size:11px;margin-right:4px;}
.cl-root .dbl-btn{background:transparent;border:1px solid var(--line);border-radius:7px;padding:3px 10px;color:var(--sub);font-family:var(--sans);}
.cl-root .dbl-btn:hover{color:var(--ink);border-color:var(--steel-3);}
.cl-root .dbl-btn.active{background:var(--btn-dark,var(--ink));border-color:var(--btn-dark,var(--ink));color:var(--btn-dark-fg,#fff);font-weight:500;}
.cl-root .tab-nav{flex-wrap:wrap;gap:2px;margin:0 0 10px;}
.cl-root .tab-btn{flex:0 0 auto;background:transparent;border:1px solid transparent;border-radius:7px;padding:6px 9px;font-size:calc(12px*var(--fs,1));color:var(--sub);font-family:var(--sans);}
.cl-root .tab-btn:hover{background:rgba(127,127,127,.12);color:var(--ink);}
.cl-root .tab-btn.active{background:var(--btn-dark,var(--ink));color:var(--btn-dark-fg,#fff);font-weight:500;}
.cl-root .wardrobe{background:#fff;border:1px solid var(--line);border-radius:var(--radius-s);box-shadow:none;height:380px;}
.cl-root .clothes-item{border:1px solid var(--line);border-radius:var(--radius-s);}
.cl-root .clothes-item:hover{border-color:var(--steel-3);box-shadow:var(--sh-sm);}
.cl-root .clothes-item[data-type="bg"]{border-style:solid;}
.cl-root .clothes-item[data-type="bg"]:hover{border-color:var(--accent);}
.cl-root .bg-remove-btn{border:1px dashed var(--line);border-radius:var(--radius-s);background:transparent;color:var(--faint);font-family:var(--sans);}
.cl-root .bg-remove-btn:hover{border-color:var(--accent);color:var(--accent);background:transparent;}
.cl-root .tab-empty{color:var(--faint);font-family:var(--sans);}
.cl-root .footer-credit,.cl-root .footer-credit a{color:var(--faint);font-family:var(--sans);}
.cl-root .footer-credit{margin-top:12px;font-size:11px;}
.cl-root .footer-credit a:hover{color:var(--ink);}
.cl-root .item-tooltip{background:var(--btn-dark,var(--ink));color:var(--btn-dark-fg,#fff);border:none;border-radius:7px;font-size:12px;padding:5px 10px;box-shadow:var(--sh-sm);font-family:var(--sans);}
.cl-root .guide-box{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--sh-md);color:var(--sub);padding:14px 16px;}
.cl-root .guide-header{border-bottom:1px solid var(--line);color:var(--ink);font-size:13px;letter-spacing:.04em;}
.cl-root .guide-header .guide-grip{color:var(--faint);}
.cl-root .guide-list li::before{content:'·';color:var(--accent);font-size:18px;top:-4px;}
.cl-root .guide-list li b{color:var(--ink);font-weight:600;}
.cl-root .guide-details{border-top:1px solid var(--line);}
.cl-root .btn-toggle-detail,.cl-root .btn-close-guide{color:var(--faint);}
.cl-root .btn-toggle-detail:hover,.cl-root .btn-close-guide:hover{color:var(--ink);}
.cl-root .cl-adminlink{background:transparent;color:var(--sub);border:1.5px solid var(--line);border-radius:var(--radius-s);height:36px;padding:0 20px;font-size:calc(12px*var(--fs,1));box-shadow:none;}
.cl-root .cl-adminlink:hover{color:var(--ink);border-color:var(--steel-3);}
.cl-root .bg-modal-box{background:var(--panel);border-radius:var(--radius);box-shadow:var(--sh-lg);}
.cl-root .item-detail{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:var(--radius-s);background:#fff;width:100%;box-sizing:border-box;}
.cl-root .item-detail>img{width:56px;height:56px;object-fit:contain;flex:none;border-radius:6px;background:#fff;}
.cl-root .item-detail-form{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
.cl-root .item-detail-line{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.cl-root .item-detail-name{font-size:13px;color:var(--ink);font-family:var(--sans);}
.cl-root .item-detail .k-input{height:32px;font-size:12.5px;}
.cl-root .btn-toggle-detail{display:block;margin:8px auto 0;background:none;border:none;cursor:pointer;font-size:12px;font-family:var(--sans);text-decoration:none;}
.cl-root .cl-fold{display:grid;grid-template-rows:0fr;opacity:0;visibility:hidden;transition:grid-template-rows .3s ease,opacity .25s ease,visibility 0s .3s;}
.cl-root .cl-fold.open{grid-template-rows:1fr;opacity:1;visibility:visible;transition:grid-template-rows .3s ease,opacity .25s ease,visibility 0s;}
.cl-root .cl-fold-inner{overflow:hidden;min-height:0;}
.cl-root .cl-fold.open .cl-fold-inner{margin-top:8px;}
.cl-root .item-edit-head{width:100%;margin:10px 0 2px;padding-top:10px;border-top:1px solid var(--line);font-size:11px;color:var(--faint);font-family:var(--sans);}
.cl-root .btn-toggle-detail{margin-top:2px;text-decoration:none!important;}
.cl-root .cl-main{justify-content:center;}
.cl-root .cl-float{box-sizing:border-box;max-height:calc(100vh - 20px);overflow-y:auto;}
.cl-root .cl-float.is-dragging,.cl-root .is-dragging .cl-float-icon{cursor:grabbing;}
.cl-root .cl-float-head{display:flex;align-items:center;gap:8px;margin:-4px -4px 12px;padding:2px 4px 10px;border-bottom:1px solid var(--line);cursor:grab;user-select:none;touch-action:none;}
.cl-root .cl-float-title{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--ink);letter-spacing:.08em;font-family:var(--sans);}
.cl-root .cl-float-grip{flex:1;text-align:center;color:var(--faint);font-size:13px;}
.cl-root .cl-float-min{width:26px;height:26px;border:none;border-radius:50%;background:transparent;color:var(--faint);font-size:18px;line-height:1;cursor:pointer;}
.cl-root .cl-float-min:hover{background:rgba(127,127,127,.15);color:var(--ink);}
.cl-root .cl-float-icon{width:46px;height:46px;border-radius:50%;border:none;background:var(--btn-dark,var(--ink));color:var(--btn-dark-fg,#fff);box-shadow:var(--sh-md);cursor:grab;display:flex;align-items:center;justify-content:center;touch-action:none;transition:transform .2s;}
.cl-root .cl-float-icon:hover{transform:scale(1.06);}
.cl-root .cl-credit{text-align:center;margin-top:34px;font-size:11px;color:var(--faint);font-family:var(--sans);letter-spacing:.03em;}
.cl-root .cl-credit a{color:var(--faint);text-decoration:none;border-bottom:1px solid transparent;}
.cl-root .cl-credit a:hover{color:var(--ink);border-bottom-color:var(--line);}
@media(max-width:1000px){.cl-root .cl-float{max-height:none;overflow:visible;}}
.cl-root .item-lines{font-size:11.5px;color:var(--sub);font-family:var(--sans);}
.cl-root .item-lines summary{cursor:pointer;padding:2px 0;color:var(--sub);}
.cl-root .item-lines-row{display:flex;flex-direction:column;gap:2px;margin-top:6px;}
.cl-root .item-lines-row span{font-size:11px;color:var(--faint);}
.cl-root .item-lines textarea{min-height:0;height:auto;padding:5px 8px;font-size:12px;resize:vertical;}
.cl-root .cl-lookbook{width:100%;max-width:760px;margin:30px auto 0;padding:18px 20px;background:var(--panel);border-radius:var(--radius);box-shadow:var(--sh-sm);box-sizing:border-box;}
.cl-root .cl-lookbook-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:13px;letter-spacing:.1em;color:var(--ink);font-family:var(--sans);}
.cl-root .cl-lookbook-empty{margin:0;font-size:12.5px;color:var(--faint);font-family:var(--sans);}
.cl-root .cl-lookbook-list{display:flex;flex-wrap:wrap;gap:12px;}
.cl-root .cl-look{position:relative;}
.cl-root .cl-look-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 10px 8px;background:#fff;border:1px solid var(--line);border-radius:var(--radius-s);cursor:pointer;font-family:var(--sans);transition:border-color .2s,box-shadow .2s,transform .2s;}
.cl-root .cl-look-card:hover{border-color:var(--steel-3);box-shadow:var(--sh-sm);transform:translateY(-2px);}
.cl-root .cl-look-pair{display:flex;gap:4px;}
.cl-root .cl-look-name{font-size:12px;color:var(--ink);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cl-root .cl-look-del{position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(30,33,38,.7);color:#fff;font-size:11px;cursor:pointer;opacity:0;transition:opacity .2s;}
.cl-root .cl-look:hover .cl-look-del{opacity:1;}
`;
