const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const JS = fs.readFileSync(path.join(ROOT, "web-shell/internal/providers/codex-mobile-immersive-layout.js"), "utf8");
const CSS = fs.readFileSync(path.join(ROOT, "web-shell/codex-mobile-immersive-layout.css"), "utf8");
const ASSETS = fs.readFileSync(path.join(ROOT, "gateway/runtime/http/static-assets.cjs"), "utf8");

function harness(mobile = true) {
  function element() {
    const attrs = new Map();
    const listeners = new Map();
    return {
      nodeType: 1, isConnected: true, attrs, listeners, children: [],
      style: { values: {}, setProperty(k,v){ this.values[k]=v; }, removeProperty(k){delete this.values[k];} },
      setAttribute(k,v){attrs.set(k,String(v));},
      getAttribute(k){return attrs.get(k)||null;},
      removeAttribute(k){attrs.delete(k);},
      addEventListener(k,fn){listeners.set(k,fn);},
      appendChild(child){this.children.push(child);child.parentElement=this;return child;},
      remove(){this.isConnected=false;},
      contains(other){return this===other || this.children.some(c=>c.contains(other));},
      closest(){return null;},
      getBoundingClientRect(){return {width:320,height:500,left:0};},
      querySelectorAll(){return [];},
    };
  }
  const root=element(),body=element(),panel=element(),rail=element(),header=element(),main=element();
  const handlers=new Map();
  const document = {
    readyState:"complete",body,documentElement:root,
    createElement(){return element();},
    querySelector(s) {
      if(s===".app-shell-left-panel")return panel;
      if(s==="[data-app-shell-nav-rail]")return rail;
      if(s==="header[data-app-shell-header-edge-scroll]")return header;
      if(s==="[data-app-shell-main-surface],.app-shell-main-content-viewport")return main;
      return null;
    },
    querySelectorAll(){return [];},
    addEventListener(k,fn){handlers.set(k,fn);}
  };
  const media={matches:mobile,addEventListener(){}};
  const window={
    innerWidth:390,document,
    matchMedia:()=>media,
    getComputedStyle:()=>({display:"flex"}),
    requestAnimationFrame(cb){cb();return 1;},
    cancelAnimationFrame(){},
    setTimeout(){return 1;},clearTimeout(){},
  };
  class MutationObserver {observe(){}}
  vm.runInNewContext(JS,{window,document,MutationObserver,Date,Array,Math,Object}, {timeout:2000});
  return {window,document,root,panel,rail,body,handlers,main};
}

test("Mobile Layout V1 is excluded from desktop",()=>{
  const h=harness(false);
  assert.equal(h.window.__OpenCodexMobileLayout.isEnabled(),false);
  assert.equal(h.body.children.length,0);
  assert.equal(h.root.getAttribute("data-opencodex-mobile-immersive"),null);
});

test("Mobile Layout V1 keeps original rail and sidebar mounted, controls overlays",()=>{
  const h=harness(true);
  const api=h.window.__OpenCodexMobileLayout;
  assert.equal(api.isEnabled(),true);
  assert.equal(h.panel.getAttribute("data-oc-mobile-drawer-panel"),"true");
  assert.equal(h.rail.getAttribute("data-oc-mobile-navigation-rail"),"true");
  const controls=h.body.children[0];
  assert.equal(controls.children.length,2);
  const button=controls.children[1];
  button.listeners.get("click")();
  assert.equal(h.root.getAttribute("data-oc-mobile-nav-open"),"true");
  h.handlers.get("click")({target:h.main});
  assert.equal(h.root.getAttribute("data-oc-mobile-nav-open"),"false");
  api.openDrawer();
  assert.equal(h.root.getAttribute("data-oc-mobile-drawer-open"),"true");
  assert.equal(h.panel.style.values["--oc-mobile-drawer-offset"],"0px");
  controls.children[0].listeners.get("click")();
  assert.equal(h.root.getAttribute("data-oc-mobile-drawer-open"),"false");
});

test("Touch gestures open the overlay without resizing main content",()=>{
  const h=harness(true), t=(x,y)=>({identifier:1,clientX:x,clientY:y});
  h.handlers.get("touchstart")({target:h.main,touches:[t(18,180)]});
  h.handlers.get("touchmove")({changedTouches:[t(165,181)],cancelable:true,preventDefault(){}});
  h.handlers.get("touchend")({changedTouches:[t(165,181)]});
  assert.equal(h.root.getAttribute("data-oc-mobile-drawer-open"),"true");
  assert.equal(h.panel.style.values["--oc-mobile-drawer-offset"],"0px");
  assert.match(CSS,/position:fixed !important/);
  assert.match(CSS,/translate3d\(var\(--oc-mobile-drawer-offset/);
  assert.match(CSS,/grid-template-columns:minmax\(0,1fr\)/);
});

test("Both official renderer bootstraps include mobile runtime and stylesheet",()=>{
  assert.match(ASSETS,/CODEX_MOBILE_LAYOUT_SCRIPT_PATH = "\/codex-mobile-immersive-layout\.js"/);
  assert.match(ASSETS,/CODEX_MOBILE_LAYOUT_CSS_PATH = "\/codex-mobile-immersive-layout\.css"/);
  assert.match(ASSETS,/runtimeScript\(CODEX_MOBILE_LAYOUT_SCRIPT_PATH\)/);
  assert.match(ASSETS,/CODEX_BRIDGE_POLYFILL_PATH,\s*CODEX_MOBILE_LAYOUT_SCRIPT_PATH/);
  assert.match(ASSETS,/href="\$\{CODEX_MOBILE_LAYOUT_CSS_PATH\}"/);
});