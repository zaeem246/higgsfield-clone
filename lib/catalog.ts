/**
 * The product catalog: models, camera moves, effects and output options.
 *
 * Names and groupings mirror the live Higgsfield surface (extracted from the
 * shipped site) so the clone reads as the same product rather than a generic
 * text-to-image toy. Credit costs are our own, but they keep Higgsfield's
 * shape: video costs an order of magnitude more than image, and quality tiers
 * multiply.
 */

export type Mode = "image" | "video";

export interface Model {
  id: string;
  name: string;
  mode: Mode;
  tagline: string;
  /** Credits for one generation at standard quality. */
  cost: number;
  badge?: "new" | "pro";
  /** Shown in the model picker to explain what it is good at. */
  strengths: string[];
}

export const MODELS: Model[] = [
  {
    id: "seedance-2-5",
    name: "Seedance 2.5",
    mode: "video",
    tagline: "The most advanced video model",
    cost: 17,
    badge: "new",
    strengths: ["Physical motion", "Long takes", "Character consistency"],
  },
  {
    id: "seedance-2-0",
    name: "Seedance 2.0",
    mode: "video",
    tagline: "4K output, the proven workhorse",
    cost: 14,
    strengths: ["4K", "Reliable", "Fast"],
  },
  {
    id: "kling-3-0",
    name: "Kling 3.0",
    mode: "video",
    tagline: "Strong physics and character motion",
    cost: 15,
    strengths: ["Physics", "Faces", "Action"],
  },
  {
    id: "sora-2",
    name: "Sora 2",
    mode: "video",
    tagline: "Native audio and long continuous shots",
    cost: 20,
    strengths: ["Native audio", "Long shots", "Coherence"],
  },
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    mode: "video",
    tagline: "Cinematic realism with sound",
    cost: 19,
    strengths: ["Realism", "Sound", "Lighting"],
  },
  {
    id: "wan-2-6",
    name: "WAN 2.6",
    mode: "video",
    tagline: "Fast open-weight video",
    cost: 9,
    strengths: ["Speed", "Cheap", "Stylised"],
  },
  {
    id: "grok-imagine-1-5",
    name: "Grok Imagine 1.5",
    mode: "video",
    tagline: "Fast, stylised motion",
    cost: 8,
    strengths: ["Speed", "Stylised", "Surreal"],
  },
  {
    id: "gemini-omni-flash",
    name: "Gemini Omni Flash",
    mode: "video",
    tagline: "Fastest turnaround of the line-up",
    cost: 7,
    strengths: ["Fastest", "Drafts", "Iteration"],
  },
  {
    id: "cinema-studio-4",
    name: "Cinema Studio 4.0",
    mode: "video",
    tagline: "Create cinematic scenes effortlessly",
    cost: 22,
    badge: "pro",
    strengths: ["Multi-shot scenes", "Lighting control", "Film grain"],
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    mode: "image",
    tagline: "Generate high-quality visuals",
    cost: 2,
    badge: "new",
    strengths: ["Text rendering", "Composition", "Speed"],
  },
  {
    id: "flux-2",
    name: "Flux 2",
    mode: "image",
    tagline: "Sharp detail and tight prompt adherence",
    cost: 3,
    strengths: ["Detail", "Adherence", "Typography"],
  },
  {
    id: "seedream-5",
    name: "Seedream 5",
    mode: "image",
    tagline: "Photoreal composition",
    cost: 3,
    strengths: ["Photoreal", "Composition", "Depth"],
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    mode: "image",
    tagline: "Sharper edits with more natural light and texture",
    cost: 3,
    strengths: ["Editing", "Natural light", "Texture"],
  },
  {
    id: "soul",
    name: "Higgsfield Soul",
    mode: "image",
    tagline: "High-aesthetic photoreal stills",
    cost: 2,
    strengths: ["Fashion", "Editorial", "Skin detail"],
  },
  {
    id: "soul-2",
    name: "Soul 2.0",
    mode: "image",
    tagline: "The next-generation Soul aesthetic",
    cost: 3,
    badge: "new",
    strengths: ["Aesthetic", "Portraits", "Grade"],
  },
];

export interface Preset {
  id: string;
  name: string;
  group: string;
  /** Appended to the user's prompt when the preset is applied. */
  promptFragment: string;
}

/**
 * Camera moves are Higgsfield's signature: one click buys a cinematic motion
 * without prompt engineering. Grouped the way a DP would think about them.
 */
export const CAMERA_MOVES: Preset[] = [
  { id: "dolly-in", name: "Dolly In", group: "Push & pull", promptFragment: "camera dollies smoothly in toward the subject" },
  { id: "dolly-out", name: "Dolly Out", group: "Push & pull", promptFragment: "camera dollies steadily away from the subject" },
  { id: "super-dolly-in", name: "Super Dolly In", group: "Push & pull", promptFragment: "extreme fast dolly push straight into the subject" },
  { id: "crash-zoom-in", name: "Crash Zoom In", group: "Push & pull", promptFragment: "violent crash zoom snapping in on the subject" },
  { id: "crash-zoom-out", name: "Crash Zoom Out", group: "Push & pull", promptFragment: "violent crash zoom snapping out from the subject" },
  { id: "dolly-zoom", name: "Dolly Zoom", group: "Push & pull", promptFragment: "vertigo dolly zoom, background warps while subject stays fixed" },

  { id: "orbit-360", name: "360 Orbit", group: "Orbit & arc", promptFragment: "camera orbits a full 360 degrees around the subject" },
  { id: "arc-shot", name: "Arc Shot", group: "Orbit & arc", promptFragment: "camera arcs laterally around the subject" },
  { id: "lazy-susan", name: "Lazy Susan", group: "Orbit & arc", promptFragment: "subject rotates on a turntable, camera locked off" },
  { id: "bullet-time", name: "Bullet Time", group: "Orbit & arc", promptFragment: "bullet time, frozen action with the camera sweeping around" },

  { id: "crane-up", name: "Crane Up", group: "Crane & drone", promptFragment: "camera cranes up and away, revealing the wider scene" },
  { id: "crane-down", name: "Crane Down", group: "Crane & drone", promptFragment: "camera cranes down toward the subject" },
  { id: "fpv-drone", name: "FPV Drone", group: "Crane & drone", promptFragment: "aggressive FPV drone flight weaving through the scene" },
  { id: "overhead", name: "Overhead", group: "Crane & drone", promptFragment: "top-down overhead shot looking straight down" },
  { id: "earth-zoom-out", name: "Earth Zoom Out", group: "Crane & drone", promptFragment: "continuous zoom out from the subject all the way to orbit" },

  { id: "whip-pan", name: "Whip Pan", group: "Pan & tilt", promptFragment: "fast whip pan with motion blur" },
  { id: "tilt-down", name: "Tilt Down", group: "Pan & tilt", promptFragment: "camera tilts down across the subject" },
  { id: "pan-left", name: "Pan Left", group: "Pan & tilt", promptFragment: "slow deliberate pan to the left" },
  { id: "snap-zoom", name: "Snap Zoom", group: "Pan & tilt", promptFragment: "snap zoom punching in one stop" },

  { id: "handheld", name: "Handheld", group: "Rig & feel", promptFragment: "raw handheld camera with natural shake" },
  { id: "snorricam", name: "Snorricam", group: "Rig & feel", promptFragment: "snorricam rig, subject fixed to frame while the world moves" },
  { id: "robo-arm", name: "Robo Arm", group: "Rig & feel", promptFragment: "precise robotic arm move, impossibly smooth" },
  { id: "object-pov", name: "Object POV", group: "Rig & feel", promptFragment: "point of view shot from the object itself" },
  { id: "dutch-angle", name: "Dutch Angle", group: "Rig & feel", promptFragment: "canted dutch angle framing" },

  { id: "focus-change", name: "Focus Change", group: "Lens", promptFragment: "rack focus from foreground to background" },
  { id: "fisheye", name: "Fisheye", group: "Lens", promptFragment: "extreme fisheye lens distortion" },
  { id: "hyperlapse", name: "Hyperlapse", group: "Lens", promptFragment: "hyperlapse with the camera travelling through space" },
  { id: "glam", name: "Glam", group: "Lens", promptFragment: "glossy beauty-campaign move with soft glamour lighting" },
];

/**
 * Effects are the viral one-click transformations. These are the real preset
 * names from the shipped Effects library.
 */
export const EFFECTS: Preset[] = [
  { id: "vanish", name: "Vanish", group: "Transformation", promptFragment: "the subject disintegrates and vanishes into particles" },
  { id: "melting", name: "Melting", group: "Transformation", promptFragment: "the subject melts and deforms like hot wax" },
  { id: "world-morphing", name: "World Morphing", group: "Transformation", promptFragment: "the entire world morphs into a different environment" },
  { id: "cutout", name: "Cutout", group: "Transformation", promptFragment: "the subject becomes a paper cutout lifted out of the scene" },
  { id: "clones", name: "Clones", group: "Transformation", promptFragment: "the subject splits into multiple synchronized clones" },
  { id: "infinite-clones", name: "Infinite Clones", group: "Transformation", promptFragment: "endless recursive clones receding into the distance" },

  { id: "burning-man", name: "Burning Man", group: "Spectacle", promptFragment: "the subject ignites in controlled cinematic flame" },
  { id: "smash-and-grab", name: "Smash and Grab", group: "Spectacle", promptFragment: "glass shatters as the subject smashes through" },
  { id: "street-colossus", name: "Street Colossus", group: "Spectacle", promptFragment: "the subject becomes a colossal giant towering over the street" },
  { id: "particles", name: "Particles", group: "Spectacle", promptFragment: "the subject is swept through a storm of glowing particles" },
  { id: "architecture-wave", name: "Architecture Wave", group: "Spectacle", promptFragment: "buildings ripple and wave like liquid" },

  { id: "frozen-in-motion", name: "Frozen in Motion", group: "Time", promptFragment: "everything freezes mid-motion while the camera keeps moving" },
  { id: "stop-world", name: "Stop World", group: "Time", promptFragment: "the world stops while the subject keeps moving freely" },
  { id: "lidar-transition", name: "Lidar Transition", group: "Time", promptFragment: "the scene resolves from a lidar point cloud into full image" },

  { id: "moonwalk", name: "Moonwalk", group: "Performance", promptFragment: "the subject moonwalks with effortless control" },
  { id: "act-natural", name: "Act Natural", group: "Performance", promptFragment: "the subject moves with relaxed, unposed naturalism" },
  { id: "superstar", name: "Superstar", group: "Performance", promptFragment: "the subject walks a flashbulb-lit red carpet like a superstar" },
  { id: "wild-ride", name: "Wild Ride", group: "Performance", promptFragment: "chaotic high-speed ride with the subject hanging on" },
  { id: "high-flip", name: "High Flip", group: "Performance", promptFragment: "the subject launches into a high acrobatic flip" },

  { id: "comic", name: "Comic", group: "Style", promptFragment: "rendered as inked comic book panels with halftone" },
  { id: "lsd", name: "LSD", group: "Style", promptFragment: "saturated kaleidoscopic psychedelic distortion" },
  { id: "pearl-earring", name: "Pearl Earring", group: "Style", promptFragment: "reimagined as a Dutch golden age oil portrait" },
  { id: "scrapbook-collage", name: "Scrapbook Collage", group: "Style", promptFragment: "torn paper scrapbook collage with tape and handwriting" },
  { id: "blue-depth", name: "Blue Depth", group: "Style", promptFragment: "deep monochrome blue grade with heavy atmospheric depth" },
];

/**
 * The three "look" families the live generator exposes alongside Camera, each
 * defaulting to Auto. They shape the image rather than the motion, so they
 * apply to stills as well as video.
 */
export const FILM_SETUPS: Preset[] = [
  { id: "35mm", name: "35mm Film", group: "Format", promptFragment: "shot on 35mm film with natural grain" },
  { id: "anamorphic", name: "Anamorphic", group: "Format", promptFragment: "anamorphic lenses with horizontal flares and oval bokeh" },
  { id: "super-8", name: "Super 8", group: "Format", promptFragment: "Super 8 home-movie texture, soft and grainy" },
  { id: "imax", name: "IMAX", group: "Format", promptFragment: "IMAX large-format clarity and depth" },
  { id: "vhs", name: "VHS", group: "Format", promptFragment: "degraded VHS tape with scanlines and colour bleed" },
  { id: "documentary", name: "Documentary", group: "Treatment", promptFragment: "observational documentary realism" },
  { id: "studio-clean", name: "Studio Clean", group: "Treatment", promptFragment: "clean studio capture, seamless backdrop" },
  { id: "archival", name: "Archival", group: "Treatment", promptFragment: "archival footage, faded and time-worn" },
];

export const COLOR_PALETTES: Preset[] = [
  { id: "teal-orange", name: "Teal & Orange", group: "Graded", promptFragment: "teal and orange blockbuster grade" },
  { id: "bleach-bypass", name: "Bleach Bypass", group: "Graded", promptFragment: "bleach bypass, desaturated with crushed blacks" },
  { id: "neon-noir", name: "Neon Noir", group: "Graded", promptFragment: "neon noir palette, magenta and cyan against black" },
  { id: "golden", name: "Golden", group: "Graded", promptFragment: "warm golden palette, amber highlights" },
  { id: "monochrome", name: "Monochrome", group: "Minimal", promptFragment: "black and white with deep contrast" },
  { id: "pastel", name: "Pastel", group: "Minimal", promptFragment: "soft pastel palette, low saturation" },
  { id: "earth", name: "Earth", group: "Minimal", promptFragment: "muted earth tones, ochre and moss" },
  { id: "technicolor", name: "Technicolor", group: "Saturated", promptFragment: "vivid three-strip Technicolor saturation" },
];

export const LIGHTING: Preset[] = [
  { id: "natural", name: "Natural", group: "Daylight", promptFragment: "soft natural daylight" },
  { id: "golden-hour", name: "Golden Hour", group: "Daylight", promptFragment: "low golden-hour sun, long shadows" },
  { id: "overcast", name: "Overcast", group: "Daylight", promptFragment: "flat overcast light, no hard shadows" },
  { id: "hard-flash", name: "Hard Flash", group: "Artificial", promptFragment: "harsh direct on-camera flash" },
  { id: "neon", name: "Neon", group: "Artificial", promptFragment: "coloured neon practical lighting" },
  { id: "candlelit", name: "Candlelit", group: "Artificial", promptFragment: "warm candlelight, deep falloff" },
  { id: "rembrandt", name: "Rembrandt", group: "Studio", promptFragment: "Rembrandt key light with a triangle on the cheek" },
  { id: "rim-light", name: "Rim Light", group: "Studio", promptFragment: "strong rim light separating subject from background" },
  { id: "silhouette", name: "Silhouette", group: "Studio", promptFragment: "backlit silhouette against a bright field" },
];

export interface Resolution {
  id: string;
  label: string;
  /** Multiplies the credit cost. */
  multiplier: number;
}

export const RESOLUTIONS: Resolution[] = [
  { id: "720p", label: "720p", multiplier: 0.6 },
  { id: "1080p", label: "1080p", multiplier: 1 },
  { id: "4k", label: "4K", multiplier: 2.2 },
];

export interface AspectRatio {
  id: string;
  label: string;
  ratio: number;
  use: string;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: "16:9", label: "16:9", ratio: 16 / 9, use: "YouTube, landscape" },
  { id: "9:16", label: "9:16", ratio: 9 / 16, use: "Reels, TikTok" },
  { id: "1:1", label: "1:1", ratio: 1, use: "Feed" },
  { id: "4:3", label: "4:3", ratio: 4 / 3, use: "Classic" },
  { id: "3:4", label: "3:4", ratio: 3 / 4, use: "Portrait" },
  { id: "21:9", label: "21:9", ratio: 21 / 9, use: "Anamorphic" },
];

export const DURATIONS = [3, 5, 8, 10] as const;
export type Duration = (typeof DURATIONS)[number];

export type Quality = "standard" | "high";

export const QUALITY_MULTIPLIER: Record<Quality, number> = {
  standard: 1,
  high: 2,
};

export interface GenerationSettings {
  mode: Mode;
  modelId: string;
  prompt: string;
  cameraMoveId: string | null;
  effectId: string | null;
  filmSetupId: string | null;
  paletteId: string | null;
  lightingId: string | null;
  aspectId: string;
  resolutionId: string;
  duration: Duration;
  /** Generated audio bed. Video only; the toolbar hides it for stills. */
  sound: boolean;
  quality: Quality;
  batch: number;
}

/** Every look family, in the order they are appended to the prompt. */
export const PRESET_FAMILIES = [
  { key: "filmSetupId", label: "Film setup", presets: FILM_SETUPS, videoOnly: false },
  { key: "cameraMoveId", label: "Camera", presets: CAMERA_MOVES, videoOnly: true },
  { key: "paletteId", label: "Color palette", presets: COLOR_PALETTES, videoOnly: false },
  { key: "lightingId", label: "Lighting", presets: LIGHTING, videoOnly: false },
  { key: "effectId", label: "Effect", presets: EFFECTS, videoOnly: false },
] as const;

export type PresetFamilyKey = (typeof PRESET_FAMILIES)[number]["key"];

/** Credits for a whole batch, so the UI can quote a price before committing. */
export function creditCost(settings: GenerationSettings): number {
  const model = MODELS.find((m) => m.id === settings.modelId);
  if (!model) return 0;

  const resolution =
    RESOLUTIONS.find((r) => r.id === settings.resolutionId)?.multiplier ?? 1;

  let unit = model.cost * QUALITY_MULTIPLIER[settings.quality] * resolution;
  if (settings.mode === "video") {
    // Duration scales cost; 5s is the reference length.
    unit = unit * (settings.duration / 5);
    // A generated audio bed is billed as a surcharge, as on the original.
    if (settings.sound) unit *= 1.15;
  }
  return Math.round(unit) * settings.batch;
}

export function modelsForMode(mode: Mode): Model[] {
  return MODELS.filter((m) => m.mode === mode);
}

export function findModel(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id);
}

const ALL_PRESETS: Preset[] = [
  ...CAMERA_MOVES,
  ...EFFECTS,
  ...FILM_SETUPS,
  ...COLOR_PALETTES,
  ...LIGHTING,
];

export function findPreset(id: string | null): Preset | undefined {
  if (!id) return undefined;
  return ALL_PRESETS.find((p) => p.id === id);
}

/** Builds the full prompt actually sent to the model, presets included. */
export function composePrompt(settings: GenerationSettings): string {
  const parts = [settings.prompt.trim()];

  // Subject first, then the look, then motion last — closest to how a shot is
  // actually built, and it keeps the camera instruction next to the action.
  const look = [
    FILM_SETUPS.find((p) => p.id === settings.filmSetupId),
    COLOR_PALETTES.find((p) => p.id === settings.paletteId),
    LIGHTING.find((p) => p.id === settings.lightingId),
    EFFECTS.find((p) => p.id === settings.effectId),
  ];
  for (const preset of look) if (preset) parts.push(preset.promptFragment);

  // A camera move on a still says nothing, so it is only applied to video.
  if (settings.mode === "video") {
    const camera = CAMERA_MOVES.find((p) => p.id === settings.cameraMoveId);
    if (camera) parts.push(camera.promptFragment);
  }

  return parts.filter(Boolean).join(", ");
}

export function groupBy<T extends { group: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.group) ?? [];
    list.push(item);
    map.set(item.group, list);
  }
  return [...map.entries()];
}
