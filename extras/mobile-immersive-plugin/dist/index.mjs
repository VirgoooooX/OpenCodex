/* OpenCodex v2 external plugin: trusted same-origin code, no Gateway patch. */
/* Controller adapted from Mobile Layout V1; original official React DOM stays in place. */
function createMobileController(menuButton, cssText) {
  "use strict";
  var styleNode = document.createElement("style");
  styleNode.setAttribute("data-oc-mobile-plugin-style", "true");
  styleNode.textContent = cssText;
  document.head.appendChild(styleNode);
"use strict";
  var w = window, d = document;
  if (w.__OpenCodexMobileLayout) return;
  var mq = w.matchMedia && w.matchMedia("(max-width: 820px) and (pointer: coarse)");
  var panelSel = ".app-shell-left-panel";
  var railSel = ["[data-app-shell-nav-rail]","[data-app-shell-navigation-rail]",".app-shell-left-rail",".app-shell-nav-rail",".app-shell-navigation-rail","[data-app-shell-focus-area='navigation']"];
  var rowSel = "[data-app-action-sidebar-thread-row],[role='button'].h-token-nav-row,[data-app-action-sidebar-new-chat],[data-app-action-new-thread]";
  var state = { panel:null,rail:null,grid:null,railGrid:null,header:null,button:null,mask:null,controls:null,menu:false,open:false,gesture:null,frame:0,queued:null,scanTimer:0,lastToggle:0,officialOpenRequested:false,suppressNativeUntil:0 };
  var active = function () { return !!(mq && mq.matches); };
  function bySelector(selector) { return d.querySelector(selector); }
  function rootAttr(key,value) { d.documentElement.setAttribute("data-oc-mobile-"+key, String(value)); }
  function isIn(target,selector) { return !!(target && target.closest && target.closest(selector)); }
  function findRail() {
    for (var i=0;i<railSel.length;i++) {
      var n=bySelector(railSel[i]); if (n && !n.closest(panelSel)) return n;
    }
    var candidates=d.querySelectorAll("aside,nav,[class*='rail'],[data-app-shell-focus-area]");
    for (var j=0;j<candidates.length;j++) {
      var c=candidates[j];
      if (c.closest(panelSel) || c.closest("#opencodex-mobile-layout-controls")) continue;
      var r=c.getBoundingClientRect();
      if (r.width>=38 && r.width<=106 && r.height>=190 && r.left>=-8 && r.left<=48 &&
          c.querySelectorAll("button,a,[role='button']").length>=4) return c;
    }
    // Newer official builds can use anonymous wrapper divs for the icon rail.
    // Probe the leftmost painted region as a narrow, tall navigation strip.
    if (typeof d.elementFromPoint === "function") {
      var sampleY=[96,180,270];
      for(var z=0;z<sampleY.length;z++) {
        var leaf=d.elementFromPoint(25,Math.min(sampleY[z],w.innerHeight-8));
        for(var node=leaf;node && node!==d.body;node=node.parentElement) {
          if(node.closest && node.closest(panelSel))break;
          if(!node.getBoundingClientRect || !node.querySelectorAll)continue;
          var box=node.getBoundingClientRect();
          if(box.width>=38 && box.width<=106 && box.height>=190 &&
             box.left>=-8 && box.left<=48 &&
             node.querySelectorAll("button,a,[role='button']").length>=4)return node;
        }
      }
    }
    return null;
  }
  function gridAncestor(node, main, limit) {
    for(var hops=0;node && node!==d.body && hops<limit;hops++,node=node.parentElement) {
      if(node.contains(main) && w.getComputedStyle(node).display==="grid")return node;
    }
    return null;
  }
  function toggleOfficialOpen() {
    var b=bySelector("[data-app-shell-sidebar-trigger]");
    if (!b) {
      b=Array.from(d.querySelectorAll("button")).find(function(el) {
        return w.getComputedStyle(el).viewTransitionName==="sidebar-trigger";
      });
    }
    if (!state.officialOpenRequested && b && b.click && Date.now()-state.lastToggle>2000) {
      // The official React sidebar must stay mounted while visually closed.
      // Do not repeatedly flip the native toggle if the DOM is still loading.
      state.lastToggle=Date.now();
      state.officialOpenRequested=true;
      b.click();
    }
  }
  function putMark(node,old,attribute) {
    if (old && old!==node) old.removeAttribute(attribute);
    if (node) node.setAttribute(attribute,"true");
    return node;
  }
  function scan() {
    if (!active() || !d.body) return;
    var panel=bySelector(panelSel);
    if (panel) state.officialOpenRequested=false;
    if (!panel && bySelector("[data-app-shell-main-surface],.app-shell-main-content-viewport")) toggleOfficialOpen();
    state.panel=putMark(panel,state.panel,"data-oc-mobile-drawer-panel");
    state.rail=putMark(findRail(),state.rail,"data-oc-mobile-navigation-rail");
    rootAttr("rail-found",!!state.rail);
    state.header=bySelector("header[data-app-shell-header-edge-scroll]");
    var main=bySelector("[data-app-shell-main-surface],.app-shell-main-content-viewport");
    var grid=panel && main ? gridAncestor(panel.parentElement,main,7) : null;
    var railGrid=state.rail && main ? gridAncestor(state.rail.parentElement,main,9) : null;
    state.grid=putMark(grid,state.grid,"data-oc-mobile-sidebar-grid");
    state.railGrid=putMark(railGrid,state.railGrid,"data-oc-mobile-rail-grid");
    if (panel && !state.gesture) {
      panel.style.setProperty("--oc-mobile-drawer-offset",state.open?"0px":"-105%");
    }
  }
  function scheduleScan() {
    if (!active() || state.scanTimer) return;
    if (state.panel && state.panel.isConnected && state.rail && state.rail.isConnected) return;
    state.scanTimer=w.setTimeout(function(){ state.scanTimer=0; scan(); },250);
  }
  function setMenu(open) {
    state.menu=!!open && active() && !!state.rail;
    if (state.menu && state.open) setDrawer(false);
    rootAttr("nav-open",state.menu);
    if (state.button) {
      state.button.setAttribute("aria-expanded",String(state.menu));
      state.button.setAttribute("aria-label",state.menu?"收起功能菜单":"展开功能菜单");
    }
  }
  function offset(x,animate) {
    if (!state.panel) return;
    rootAttr("drawer-animate",!!animate);
    state.panel.style.setProperty("--oc-mobile-drawer-offset",x);
  }
  function setDrawer(open) {
    if (!active()) return;
    if (!state.panel) scan();
    state.open=!!open;
    if (state.open) setMenu(false);
    rootAttr("drawer-open",state.open);
    offset(state.open?"0px":"-105%",true);
  }
  function makeControls() {
    state.button = menuButton;
    if (state.controls && state.controls.isConnected) return;
    var mask = d.createElement("button");
    mask.type = "button";
    mask.className = "oc-mobile-drawer-backdrop";
    mask.setAttribute("aria-label","关闭对话列表");
    mask.addEventListener("click",function(){setDrawer(false);});
    d.body.appendChild(mask);
    state.controls = mask;
    state.mask = mask;
  }
  function onClick(e) {
    if (!active()) return;
    // The built-in mobile auto-collapse fires a delayed native toggle after a
    // conversation click. Ignore that synthetic toggle while our overlay closes.
    if (state.suppressNativeUntil > Date.now() &&
        isIn(e.target,"[data-app-shell-sidebar-trigger]") && !e.isTrusted) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (state.menu) {
      if (state.rail && state.rail.contains(e.target)) w.setTimeout(function(){setMenu(false);},0);
      else if (!state.button || !state.button.contains(e.target)) setMenu(false);
    }
    if (state.open && state.panel && state.panel.contains(e.target) && isIn(e.target,rowSel)) {
      state.suppressNativeUntil = Date.now() + 700;
      setDrawer(false);
    }
  }
  function targetExcluded(e) {
    var excluded = state.open && state.panel && state.panel.contains(e.target) ?
      "input,textarea,select,button,a,[role='slider'],[contenteditable='true'],pre,code,[data-oc-mobile-menu-button]" :
      "input,textarea,select,button,a,[role='button'],[role='slider'],[contenteditable='true'],pre,code,[data-oc-mobile-menu-button]";
    return isIn(e.target,excluded) ||
       !!(state.rail && state.rail.contains(e.target));
  }
  function touchStart(e) {
    if (!active() || !state.panel || state.menu || !e.touches || e.touches.length!==1 || targetExcluded(e)) return;
    var t=e.touches[0], within=state.panel.contains(e.target);
    if (state.open && !within) return;
    if (!state.open && t.clientX>46 && t.clientX> w.innerWidth*0.55) return;
    state.gesture={id:t.identifier,x:t.clientX,y:t.clientY,start:Date.now(),width:Math.max(1,state.panel.getBoundingClientRect().width),locked:false,opening:!state.open};
  }
  function currentTouch(e) {
    var list=e.changedTouches || e.touches || [];
    for(var i=0;i<list.length;i++) if(state.gesture && list[i].identifier===state.gesture.id) return list[i];
    return null;
  }
  function drag(x) {
    state.queued=x;
    if (state.frame) return;
    state.frame=w.requestAnimationFrame(function(){
      state.frame=0;
      if (state.queued!==null) offset(state.queued+"px",false);
      state.queued=null;
    });
  }
  function touchMove(e) {
    var g=state.gesture,t=currentTouch(e);
    if(!g||!t)return;
    var dx=t.clientX-g.x,dy=t.clientY-g.y;
    if(!g.locked) {
      if(Math.abs(dy)>12 && Math.abs(dy)>Math.abs(dx)) {state.gesture=null;return;}
      if(Math.abs(dx)<13 || Math.abs(dx)<Math.abs(dy)*1.4 || (g.opening?dx<=0:dx>=0))return;
      g.locked=true;
    }
    if(e.cancelable)e.preventDefault();
    var x=g.opening?Math.min(0,-g.width+Math.max(0,dx)):Math.max(-g.width,Math.min(0,dx));
    drag(x);
  }
  function touchEnd(e,cancel) {
    var g=state.gesture,t=currentTouch(e);
    if(!g)return;
    state.gesture=null;
    if(state.frame)w.cancelAnimationFrame(state.frame);
    state.frame=0;state.queued=null;
    if(!g.locked || !t || cancel) {offset(g.opening?"-105%":"0px",true);return;}
    var dx=t.clientX-g.x,elapsed=Math.max(1,Date.now()-g.start);
    var complete=Math.abs(dx)>=g.width*.27 || (Math.abs(dx)>=26 && Math.abs(dx/elapsed)>=.34);
    setDrawer(complete?g.opening:!g.opening);
  }
  function activate() {
    if(!active()||!d.body)return;
    d.documentElement.setAttribute("data-opencodex-mobile-immersive","true");
    rootAttr("drawer-open",state.open);
    rootAttr("nav-open",state.menu);
    makeControls();scan();
  }
  function deactivate() {
    state.menu=false;state.open=false;state.gesture=null;
    if(state.frame)w.cancelAnimationFrame(state.frame);
    if(state.scanTimer)w.clearTimeout(state.scanTimer);
    state.frame=0;state.scanTimer=0;
    [[state.panel,"data-oc-mobile-drawer-panel"],[state.rail,"data-oc-mobile-navigation-rail"],[state.grid,"data-oc-mobile-sidebar-grid"],[state.railGrid,"data-oc-mobile-rail-grid"]].forEach(function(pair) {
      if(pair[0])pair[0].removeAttribute(pair[1]);
    });
    if(state.panel)state.panel.style.removeProperty("--oc-mobile-drawer-offset");
    state.panel=state.rail=state.grid=state.railGrid=state.header=null;
    ["data-opencodex-mobile-immersive","data-oc-mobile-drawer-open","data-oc-mobile-nav-open","data-oc-mobile-rail-found","data-oc-mobile-drawer-animate"].forEach(function(a){d.documentElement.removeAttribute(a);});
    if(state.controls)state.controls.remove();
    state.controls=state.button=state.mask=null;
  }
  var api=Object.freeze({
    closeDrawer:function(){setDrawer(false);},
    openDrawer:function(){setDrawer(true);},
    toggleMenu:function(){scan();setMenu(!state.menu);},
    isEnabled:function(){return active()&&!!state.panel&&d.documentElement.getAttribute("data-opencodex-mobile-immersive")==="true";}
  });
  if (w.__OpenCodexMobileLayout?.dispose) w.__OpenCodexMobileLayout.dispose();
  w.__OpenCodexMobileLayout=api;
  var observer=null;
  function start(){
    if(!d.body)return;
    if(active())activate();
    observer = new MutationObserver(scheduleScan);
    observer.observe(d.body,{childList:true,subtree:true});
  }
  function onMediaChange(){if(active())activate();else deactivate();}
  function onTouchEnd(e){touchEnd(e,false);}
  function onTouchCancel(e){touchEnd(e,true);}
  function onKeyDown(e){if(e.key==="Escape"&&active()){if(state.menu)setMenu(false);else if(state.open)setDrawer(false);}}
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
  if(mq&&mq.addEventListener)mq.addEventListener("change",onMediaChange);
  d.addEventListener("click",onClick,true);
  d.addEventListener("touchstart",touchStart,{passive:true,capture:true});
  d.addEventListener("touchmove",touchMove,{passive:false,capture:true});
  d.addEventListener("touchend",onTouchEnd,{passive:true,capture:true});
  d.addEventListener("touchcancel",onTouchCancel,{passive:true,capture:true});
  d.addEventListener("keydown",onKeyDown);
  function dispose(){
    observer?.disconnect();
    d.removeEventListener("DOMContentLoaded",start);
    if(mq&&mq.removeEventListener)mq.removeEventListener("change",onMediaChange);
    d.removeEventListener("click",onClick,true);
    d.removeEventListener("touchstart",touchStart,true);
    d.removeEventListener("touchmove",touchMove,true);
    d.removeEventListener("touchend",onTouchEnd,true);
    d.removeEventListener("touchcancel",onTouchCancel,true);
    d.removeEventListener("keydown",onKeyDown);
    deactivate();
    styleNode.remove();
    if(w.__OpenCodexMobileLayout===api) delete w.__OpenCodexMobileLayout;
  }
  return { api, dispose };
}

const MOBILE_STYLES = "/* Overlay-only mobile layout; original React navigation and conversation components remain mounted. */\n@media (max-width:820px) and (pointer:coarse) {\n  html[data-opencodex-mobile-immersive=\"true\"] header[data-app-shell-header-edge-scroll] {\n    display:none !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] [data-oc-mobile-navigation-rail=\"true\"] {\n    position:fixed !important;\n    inset:calc(58px + env(safe-area-inset-top,0px)) auto auto 10px !important;\n    width:54px !important;\n    min-width:54px !important;\n    max-width:54px !important;\n    height:auto !important;\n    min-height:0 !important;\n    max-height:calc(100dvh - 72px - env(safe-area-inset-bottom,0px)) !important;\n    flex:none !important;\n    margin:0 !important;\n    padding:4px 0 !important;\n    overflow-x:hidden !important;\n    overflow-y:auto !important;\n    overscroll-behavior:contain;\n    -webkit-overflow-scrolling:touch;\n    border-radius:14px;\n    background:var(--color-background-primary,var(--background-primary,#fff));\n    box-shadow:0 7px 28px rgba(0,0,0,.16);\n    z-index:2147483002 !important;\n    opacity:0;\n    visibility:hidden;\n    pointer-events:none;\n    transform:translate3d(0,-8px,0) !important;\n    transition:opacity 150ms ease,transform 150ms ease,visibility 150ms !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-nav-open=\"true\"] [data-oc-mobile-navigation-rail=\"true\"] {\n    opacity:1;\n    visibility:visible;\n    pointer-events:auto;\n    transform:translate3d(0,0,0) !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] [data-oc-mobile-drawer-panel=\"true\"] {\n    position:fixed !important;\n    inset:0 auto 0 0 !important;\n    width:min(85vw,360px) !important;\n    min-width:0 !important;\n    max-width:min(85vw,360px) !important;\n    height:100dvh !important;\n    min-height:0 !important;\n    margin:0 !important;\n    display:flex !important;\n    flex:none !important;\n    opacity:1 !important;\n    visibility:visible !important;\n    pointer-events:none;\n    z-index:2147483001 !important;\n    background:var(--color-background-primary,var(--background-primary,#fff));\n    box-shadow:4px 0 22px rgba(0,0,0,.12);\n    transform:translate3d(var(--oc-mobile-drawer-offset,-105%),0,0) !important;\n    transition:none !important;\n    will-change:transform;\n    view-transition-name:none !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-drawer-animate=\"true\"] [data-oc-mobile-drawer-panel=\"true\"] {\n    transition:transform 220ms cubic-bezier(.22,.82,.24,1) !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-drawer-open=\"true\"] [data-oc-mobile-drawer-panel=\"true\"] {\n    pointer-events:auto;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] [data-oc-mobile-sidebar-grid=\"true\"],\n  html[data-opencodex-mobile-immersive=\"true\"] [data-oc-mobile-rail-grid=\"true\"] {\n    /* The original grid may reserve a column even after its rail is fixed. */\n    grid-template-columns:minmax(0,1fr) !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] [data-app-shell-main-surface],\n  html[data-opencodex-mobile-immersive=\"true\"] .app-shell-main-content-viewport {\n    min-width:0 !important;\n    max-width:100% !important;\n    flex:1 1 auto !important;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] #opencodex-mobile-layout-controls {\n    display:contents;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] .oc-mobile-menu-button {\n    position:fixed;\n    top:calc(8px + env(safe-area-inset-top,0px));\n    left:10px;\n    width:42px;\n    height:42px;\n    display:grid;\n    place-items:center;\n    z-index:2147483003;\n    border-radius:12px;\n    border:1px solid rgba(127,127,127,.16);\n    background:var(--color-background-primary,var(--background-primary,#fff));\n    color:var(--color-text-primary,var(--text-primary,#252525));\n    box-shadow:0 2px 10px rgba(0,0,0,.09);\n    touch-action:manipulation;\n    cursor:pointer;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-drawer-open=\"true\"] .oc-mobile-menu-button {\n    opacity:0;\n    pointer-events:none;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-rail-found=\"false\"] .oc-mobile-menu-button {\n    display:none;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"] .oc-mobile-drawer-backdrop {\n    position:fixed;\n    inset:0;\n    width:100%;\n    height:100dvh;\n    border:0;\n    margin:0;\n    padding:0;\n    border-radius:0;\n    background:rgba(0,0,0,.25);\n    opacity:0;\n    visibility:hidden;\n    pointer-events:none;\n    z-index:2147483000;\n    transition:opacity 180ms ease,visibility 180ms;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-drawer-open=\"true\"] .oc-mobile-drawer-backdrop {\n    opacity:1;\n    visibility:visible;\n    pointer-events:auto;\n  }\n}\n@media (prefers-reduced-motion:reduce) {\n  html[data-opencodex-mobile-immersive=\"true\"] [data-oc-mobile-drawer-panel=\"true\"],\n  html[data-opencodex-mobile-immersive=\"true\"] [data-oc-mobile-navigation-rail=\"true\"],\n  html[data-opencodex-mobile-immersive=\"true\"] .oc-mobile-drawer-backdrop {\n    transition-duration:0ms !important;\n  }\n}\n/* The SDK owns the button. Never expose it on desktop or before initialization. */\n.oc-mobile-menu-button[data-oc-mobile-plugin-button=\"true\"] { display:none !important; }\n@media (max-width:820px) and (pointer:coarse) {\n  html[data-opencodex-mobile-immersive=\"true\"] .oc-mobile-menu-button[data-oc-mobile-plugin-button=\"true\"] {\n    display:grid !important;\n    font-size:23px;\n    line-height:1;\n    font-weight:400;\n  }\n  html[data-opencodex-mobile-immersive=\"true\"][data-oc-mobile-rail-found=\"false\"] .oc-mobile-menu-button[data-oc-mobile-plugin-button=\"true\"] { display:none !important; }\n}\n";

export default function mobileImmersivePlugin(sdk) {
  const buttonLocator = sdk.view.locators.css("user.mobile-immersive.anchor", "body");
  const button = sdk.view.ui.element({
    tag: "button",
    text: "▦",
    attributes: {
      class: "oc-mobile-menu-button",
      "data-oc-mobile-plugin-button": "true",
      "data-oc-mobile-menu-button": "true",
      "aria-label": "展开功能菜单",
      "aria-expanded": "false",
      title: "功能菜单"
    },
    onPress: () => activeController?.api.toggleMenu()
  });
  sdk.points.register({
    id: "user.mobile-immersive.layout",
    description: "Floating navigation and touch-driven overlay conversation drawer",
    group: sdk.groups.mobileInteraction,
    contributions: [sdk.adapters.semanticView.mount({
      locator: buttonLocator,
      placement: sdk.view.placements.append,
      content: button
    })]
  });

  // The v2 SDK owns button placement and enable/disable lifecycle. The rich
  // overlay gesture interactions currently exceed its declarative event APIs.
  // Observe the SDK-owned button and cleanly attach/detach those interactions.
  let activeController = null;
  let alive = true;
  const ownerDocument = document;
  const buttonSelector = '.oc-mobile-menu-button[data-oc-mobile-plugin-button="true"]';
  function sync() {
    if (!alive) return;
    const anchor = ownerDocument.querySelector(buttonSelector);
    if (anchor && anchor.isConnected && !activeController) {
      activeController = createMobileController(anchor, MOBILE_STYLES);
    } else if ((!anchor || !anchor.isConnected) && activeController) {
      activeController.dispose();
      activeController = null;
    }
  }
  // SDK mounts the button directly under body. Observe only direct children:
  // streaming chat DOM updates must not wake this plugin's lifecycle observer.
  const observer = new MutationObserver(sync);
  observer.observe(ownerDocument.body, {childList:true});
  sync();
  window.addEventListener("pagehide", () => {
    alive = false;
    observer.disconnect();
    activeController?.dispose();
    activeController = null;
  }, {once:true});
}