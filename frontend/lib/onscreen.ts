/**
 * One IntersectionObserver for every plate on the page.
 *
 * There can be twenty or more plates on a contact sheet, each with a resting
 * drift and possibly a camera move running. Anything scrolled out of view is
 * costing frames for nothing, so each plate registers here and the observer
 * writes `data-onscreen` straight onto the element. globals.css parks every
 * animation inside a plate marked `false`.
 *
 * The write is deliberately *not* React state: a scroll past twenty plates
 * would otherwise be twenty renders, and the plate's gradient stack would be
 * rebuilt each time. Setting one attribute is the whole update.
 */

const ATTRIBUTE = "data-onscreen";

/** A margin, so a plate is already moving by the time it is actually seen. */
const ROOT_MARGIN = "250px 0px 250px 0px";

let observer: IntersectionObserver | null = null;

function shared(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.setAttribute(ATTRIBUTE, entry.isIntersecting ? "true" : "false");
      }
    },
    { rootMargin: ROOT_MARGIN },
  );
  return observer;
}

/**
 * Starts watching an element, and returns the function that stops. Without an
 * IntersectionObserver the element is simply marked on screen, so the motion
 * degrades to always-running rather than never-running.
 */
export function watchOnScreen(element: Element): () => void {
  const instance = shared();
  if (!instance) {
    element.setAttribute(ATTRIBUTE, "true");
    return () => {};
  }
  instance.observe(element);
  return () => instance.unobserve(element);
}
