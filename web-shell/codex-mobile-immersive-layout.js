/* Mobile Layout V1: keep official React components mounted, change presentation only. */
(function () {
  "use strict";
  var w = window, d = document;
  if (w.__OpenCodexMobileLayout) return;
  var mq = w.matchMedia && w.matchMedia("(max-width: 820px) and (pointer: coarse)");
  var panelSel = ".app-shell-left-panel";
  var railSel = ["[data-app-shell-nav-rail]","[data-app-shell-navigation-rail]",".app-shell-left-rail",".app-shell-nav-rail",".app-shell-navigation-rail","[data-app-shell-focus-area='navigation']"];
  var rowSel = "[data-app-action-sidebar-thread-row],[role='button'].h-token-nav-row,[data-app-action-sidebar-new-chat],[data-app-action-new-thread]";
  var state = { panel:null,rail:null,grid:null,header:null,button:null,mask:null,controls:null,menu:false,open:false,gesture:null,frame:0,queued:null,scanTimer:0,lastToggle:0 };
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
    return null;
  }
  function toggleOfficialOpen() {
    var b=bySelector("[data-app-shell-sidebar-trigger]");
    if (!b) {
      b=Array.from(d.querySelectorAll("button")).find(function(el) {
        return w.getComputedStyle(el).viewTransitionName==="sidebar-trigger";
      });
    }
    if (b && b.click && Date.now()-state.lastToggle>2000) {
      state.lastToggle=Date.now();
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
    if (!panel && bySelector("[data-app-shell-main-surface],.app-shell-main-content-viewport")) toggleOfficialOpen();
    state.panel=putMark(panel,state.panel,"data-oc-mobile-drawer-panel");
    state.rail=putMark(findRail(),state.rail,"data-oc-mobile-navigation-rail");
    rootAttr("rail-found",!!state.rail);
    state.header=bySelector("header[data-app-shell-header-edge-scroll]");
    var main=bySelector("[data-app-shell-main-surface],.app-shell-main-content-viewport");
    var parent=panel && panel.parentElement;
    var grid=parent && main && parent.contains(main) && w.getComputedStyle(parent).display==="grid" ? parent : null;
    state.grid=putMark(grid,state.grid,"data-oc-mobile-sidebar-grid");
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
    if (state.controls && state.controls.isConnected) return;
    var controls=d.createElement("div");
    controls.id="opencodex-mobile-layout-controls";
    var mask=d.createElement("button");
    mask.type="button";
    mask.className="oc-mobile-drawer-backdrop";
    mask.setAttribute("aria-label","关闭对话列表");
    mask.addEventListener("click",function(){setDrawer(false);});
    var button=d.createElement("button");
    button.type="button";
    button.className="oc-mobile-menu-button";
    button.setAttribute("data-oc-mobile-menu-button","true");
    button.setAttribute("aria-label","展开功能菜单");
    button.setAttribute("aria-expanded","false");
    button.setAttribute("aria-haspopup","true");
    button.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>';
    button.addEventListener("click",function(){scan();setMenu(!state.menu);});
    controls.appendChild(mask); controls.appendChild(button); d.body.appendChild(controls);
    state.controls=controls;state.mask=mask;state.button=button;
  }
  function onClick(e) {
    if (!active()) return;
    if (state.menu) {
      if (state.rail && state.rail.contains(e.target)) w.setTimeout(function(){setMenu(false);},0);
      else if (!state.button || !state.button.contains(e.target)) setMenu(false);
    }
    if (state.open && state.panel && state.panel.contains(e.target) && isIn(e.target,rowSel)) setDrawer(false);
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
    [[state.panel,"data-oc-mobile-drawer-panel"],[state.rail,"data-oc-mobile-navigation-rail"],[state.grid,"data-oc-mobile-sidebar-grid"]].forEach(function(pair) {
      if(pair[0])pair[0].removeAttribute(pair[1]);
    });
    if(state.panel)state.panel.style.removeProperty("--oc-mobile-drawer-offset");
    state.panel=state.rail=state.grid=state.header=null;
    ["data-opencodex-mobile-immersive","data-oc-mobile-drawer-open","data-oc-mobile-nav-open","data-oc-mobile-rail-found","data-oc-mobile-drawer-animate"].forEach(function(a){d.documentElement.removeAttribute(a);});
    if(state.controls)state.controls.remove();
    state.controls=state.button=state.mask=null;
  }
  w.__OpenCodexMobileLayout=Object.freeze({
    closeDrawer:function(){setDrawer(false);},
    openDrawer:function(){setDrawer(true);},
    isEnabled:function(){return active()&&!!state.panel&&d.documentElement.getAttribute("data-opencodex-mobile-immersive")==="true";}
  });
  function start(){
    if(!d.body)return;
    if(active())activate();
    new MutationObserver(scheduleScan).observe(d.body,{childList:true,subtree:true});
  }
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true}); else start();
  if(mq && mq.addEventListener)mq.addEventListener("change",function(){if(active())activate();else deactivate();});
  d.addEventListener("click",onClick,true);
  d.addEventListener("touchstart",touchStart,{passive:true,capture:true});
  d.addEventListener("touchmove",touchMove,{passive:false,capture:true});
  d.addEventListener("touchend",function(e){touchEnd(e,false);},{passive:true,capture:true});
  d.addEventListener("touchcancel",function(e){touchEnd(e,true);},{passive:true,capture:true});
  d.addEventListener("keydown",function(e){if(e.key==="Escape" && active()){if(state.menu)setMenu(false);else if(state.open)setDrawer(false);}});
})();