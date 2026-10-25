// Pointer capture that never throws. setPointerCapture throws for a pointer the browser no longer knows (a
// synthetic event from a test or the bridge, or a finger already lifted or cancelled), which would stop the
// pointerdown handler half way. Without the capture the drag still works while the pointer stays over the element.
//
//   el.addEventListener('pointerdown', (e) => { drag = { id: e.pointerId }; capturePointer(el, e.pointerId); … });
//   function endDrag() { releasePointer(el, drag.id); drag = null; }

/**
 * Sends the pointer's moves to `el` even when it leaves it. Returns whether the browser took the capture.
 * @param {Element} el
 * @param {number} pointerId
 */
export function capturePointer(el, pointerId) {
  try {
    el.setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lets go of a capture taken with capturePointer (nothing happens if there is none).
 * @param {Element} el
 * @param {number} pointerId
 */
export function releasePointer(el, pointerId) {
  try {
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  } catch {
    // the pointer is already gone
  }
}
