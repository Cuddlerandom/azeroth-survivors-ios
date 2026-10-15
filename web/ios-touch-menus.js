// Experimental iOS menu input: forward single-finger taps to canvas mouse events.
// The game uses Bevy Button/Interaction for menu and level-up selection.
// Browser-generated mouse compatibility events may already suffice on some devices.
// Only synthesize when the browser does not produce a mouse event for the touch.
export function installTouchMenus(canvas) {
  if (!canvas || !('ontouchstart' in window)) return;
  canvas.style.touchAction = 'none';
  let active = null;
  let last = null;
  let nativeMouseSeen = false;
  canvas.addEventListener('mousedown', e => {
    if (e.isTrusted) nativeMouseSeen = true;
  }, { capture: true });
  const send = (type, point, buttons) => {
    const e = new MouseEvent(type, {
      bubbles: true, cancelable: true, composed: true,
      clientX: point.x, clientY: point.y, button: 0, buttons,
      view: window,
    });
    canvas.dispatchEvent(e);
  };
  canvas.addEventListener('touchstart', e => {
    if (active !== null || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    active = t.identifier;
    last = { x: t.clientX, y: t.clientY };
    nativeMouseSeen = false;
    // Let browsers that already synthesize trusted mouse events handle taps.
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    if (active === null) return;
    const t = [...e.changedTouches].find(t => t.identifier === active);
    if (!t) return;
    const end = { x: t.clientX, y: t.clientY };
    if (!nativeMouseSeen && last && Math.hypot(end.x - last.x, end.y - last.y) < 18) {
      send('mousemove', end, 0);
      send('mousedown', end, 1);
      send('mouseup', end, 0);
      send('click', end, 0);
    }
    active = null;
    last = null;
  }, { passive: true });
  canvas.addEventListener('touchcancel', () => { active = null; last = null; }, { passive: true });
}
