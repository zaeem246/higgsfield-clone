/**
 * Deterministic poster art.
 *
 * In demo mode there is no real render to show, and a grid of grey boxes would
 * make the product look broken. Instead every generation derives a stable
 * cinematic colour grade from its seed, so the same generation always looks the
 * same, and a wall of them looks art-directed rather than random.
 *
 * A photographic layer is fetched on top of this; the gradient is what remains
 * if that layer never loads, so the UI degrades to "stylised" and never to
 * "empty".
 */

/** FNV-1a. Small, stable across server and client, good enough for palettes. */
export function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Palette {
  /** Layered CSS gradient for the poster background. */
  background: string;
  /** Dominant hue, reused for glows and hover accents. */
  accent: string;
  /** Muted version for borders. */
  edge: string;
}

/**
 * Film grades rather than arbitrary hues: each entry is a pair of hues that
 * read as a deliberate colour script (teal/orange, indigo/magenta, and so on).
 */
const GRADES: [number, number][] = [
  [16, 195],   // orange / teal
  [262, 320],  // indigo / magenta
  [190, 240],  // cyan / blue
  [340, 28],   // rose / amber
  [150, 190],  // emerald / cyan
  [45, 0],     // gold / red
  [280, 200],  // violet / azure
  [8, 45],     // ember / gold
];

export function palette(seed: string): Palette {
  const h = hash(seed);
  const [a, b] = GRADES[h % GRADES.length];
  const drift = (h >> 8) % 18;
  const h1 = (a + drift) % 360;
  const h2 = (b + drift) % 360;
  const x = 20 + ((h >> 4) % 60);
  const y = 15 + ((h >> 12) % 60);

  return {
    background: [
      `radial-gradient(120% 90% at ${x}% ${y}%, hsl(${h1} 85% 58% / 0.85) 0%, transparent 58%)`,
      `radial-gradient(110% 100% at ${100 - x}% ${100 - y}%, hsl(${h2} 80% 45% / 0.75) 0%, transparent 62%)`,
      `linear-gradient(${(h >> 16) % 360}deg, hsl(${h1} 40% 8%) 0%, hsl(${h2} 45% 12%) 100%)`,
    ].join(","),
    accent: `hsl(${h1} 85% 62%)`,
    edge: `hsl(${h1} 40% 22%)`,
  };
}

/**
 * Photographic layer. Picsum is deterministic per seed and needs no API key, so
 * the demo looks like real media without shipping binaries or holding
 * credentials.
 */
export function photoUrl(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
