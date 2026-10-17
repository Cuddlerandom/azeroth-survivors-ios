// Mobile-only virtual joystick. Uses the existing wasm command bridge rather than
// synthetic keyboard events, which Safari/winit may ignore.
export function installMobileJoystick(wenilla) {
  if (!matchMedia('(pointer: coarse)').matches || !wenilla) return;
  const style = document.createElement('style');
  style.textContent = `
    #mobile-stick { position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));width:132px;height:132px;border-radius:50%;z-index:1000;touch-action:none;user-select:none;-webkit-user-select:none;background:#2229;border:2px solid #ffffff66;display:grid;place-items:center; }
    #mobile-stick-knob {width:54px;height:54px;border-radius:50%;background:#ddd9;border:2px solid white;transform:translate(0,0);pointer-events:none;}
    @media (pointer:fine) {#mobile-stick{display:none}}
  `;
  document.head.append(style);
  const stick = document.createElement('div');
  stick.id = 'mobile-stick';
  stick.setAttribute('aria-label', 'Bewegungsjoystick');
  stick.innerHTML = '<div id="mobile-stick-knob"></div>';
  document.body.append(stick);
  const knob = stick.firstElementChild;
  const names = { up:'MOVEFORWARD',down:'MOVEBACKWARD',left:'STRAFELEFT',right:'STRAFERIGHT' };
  const held = new Set();
  let pointer = null;
  function set(dx,dy) {
    const radius = 42, length = Math.hypot(dx,dy), scale = length > radius ? radius/length : 1;
    dx *= scale; dy *= scale;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const next = new Set();
    if (dy < -15) next.add('up');
    if (dy > 15) next.add('down');
    if (dx < -15) next.add('left');
    if (dx > 15) next.add('right');
    for (const k of held) if (!next.has(k)) wenilla.release(names[k]);
    for (const k of next) if (!held.has(k)) wenilla.hold(names[k],true);
    held.clear();for (const k of next) held.add(k);
  }
  function move(e) {
    const r = stick.getBoundingClientRect();
    set(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));
  }
  stick.addEventListener('pointerdown',e=>{if(pointer!==null)return;pointer=e.pointerId;stick.setPointerCapture(pointer);move(e);e.preventDefault()});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===pointer){move(e);e.preventDefault()}});
  function end(e){if(e.pointerId!==pointer)return;pointer=null;set(0,0)}
  stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
  window.addEventListener('blur',()=>{pointer=null;set(0,0)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;set(0,0)}});
}
