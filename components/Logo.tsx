/**
 * Mark: an aperture blade ring around a field point — camera control plus the
 * "field" in the name, in one glyph that survives being drawn at 20px.
 *
 * Deliberately gradient-free. The mark renders more than once per page (rail
 * and mobile header), and an SVG <linearGradient> needs a document-unique id;
 * two copies collide and the instance inside the hidden rail wins, leaving the
 * visible one unpainted. Flat fills cannot collide.
 */
export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="#d3fc3f" strokeWidth="1.6" />
      <path
        d="M12 2.75L18.5 7v10L12 21.25 5.5 17V7z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <circle cx="12" cy="12" r="3.1" fill="#d3fc3f" />
    </svg>
  );
}
