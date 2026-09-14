import { composePrompt, type Duration } from "./catalog";
import type { Generation } from "./types";

/**
 * The community feed. Fully deterministic — fixed ids, seeds and timestamps —
 * so the server and client render identically and the grid never reshuffles
 * between loads.
 */

interface SeedRow {
  prompt: string;
  mode: "image" | "video";
  modelId: string;
  cameraMoveId: string | null;
  effectId: string | null;
  aspectId: string;
  author: string;
  likes: number;
  duration?: Duration;
  filmSetupId?: string | null;
  paletteId?: string | null;
  lightingId?: string | null;
}

const ROWS: SeedRow[] = [
  {
    prompt: "A lone figure in a red trench coat crossing a flooded Tokyo intersection at night, neon reflections",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "crash-zoom-in", effectId: null,
    aspectId: "21:9", author: "kaito.mp4", likes: 4820,
  },
  {
    prompt: "Vintage F1 car mid-corner, tyre smoke lit by low afternoon sun",
    mode: "video", modelId: "cinema-studio-4", cameraMoveId: "robo-arm", effectId: "frozen-in-motion",
    aspectId: "16:9", author: "apex.studio", likes: 3910,
  },
  {
    prompt: "Editorial portrait of a woman with freckles, wet hair, harsh single flash against concrete",
    mode: "image", modelId: "soul", cameraMoveId: null, effectId: null,
    aspectId: "3:4", author: "mirodesign", likes: 7240,
  },
  {
    prompt: "Skateboarder ollies over a taxi, pigeons scattering, shot on 16mm",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "whip-pan", effectId: "high-flip",
    aspectId: "9:16", author: "grain.co", likes: 2880,
  },
  {
    prompt: "Brutalist cathedral interior filled with fog, a single shaft of god-ray light",
    mode: "image", modelId: "nano-banana-pro", cameraMoveId: null, effectId: "blue-depth",
    aspectId: "16:9", author: "structure", likes: 5130,
  },
  {
    prompt: "Astronaut removing helmet on a black sand beach, steam rising",
    mode: "video", modelId: "cinema-studio-4", cameraMoveId: "dolly-in", effectId: null,
    aspectId: "21:9", author: "outer.field", likes: 6402,
  },
  {
    prompt: "Sneaker product shot rotating on a wet obsidian plinth, rim light",
    mode: "video", modelId: "kling-3-0", cameraMoveId: "lazy-susan", effectId: null,
    aspectId: "1:1", author: "soleworks", likes: 1940,
  },
  {
    prompt: "A crowded Lagos market at golden hour, fabric colours saturated, handheld documentary feel",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "handheld", effectId: null,
    aspectId: "16:9", author: "adaeze", likes: 3355,
  },
  {
    prompt: "Ballet dancer suspended mid-leap in an abandoned theatre, dust in the air",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "orbit-360", effectId: "bullet-time",
    aspectId: "9:16", author: "pas.de.deux", likes: 8910,
  },
  {
    prompt: "Macro shot of ink dispersing through water, deep indigo and gold",
    mode: "image", modelId: "gpt-image-2", cameraMoveId: null, effectId: null,
    aspectId: "1:1", author: "fluid.lab", likes: 2210,
  },
  {
    prompt: "1970s diner at 3am, a single waitress refilling coffee, Hopper lighting",
    mode: "image", modelId: "soul", cameraMoveId: null, effectId: null,
    aspectId: "16:9", author: "nighthawks", likes: 4470,
  },
  {
    prompt: "Drone chase through a narrow Moroccan medina, washing lines overhead",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "fpv-drone", effectId: null,
    aspectId: "21:9", author: "riadflight", likes: 5688,
  },
  {
    prompt: "A man made of stained glass shattering into light",
    mode: "video", modelId: "kling-3-0", cameraMoveId: "crane-up", effectId: "vanish",
    aspectId: "9:16", author: "prism.ai", likes: 7120,
  },
  {
    prompt: "Tokyo salaryman waiting on an empty platform, rain streaking the window",
    mode: "image", modelId: "soul", cameraMoveId: null, effectId: "blue-depth",
    aspectId: "3:4", author: "yamanote", likes: 3040,
  },
  {
    prompt: "Giant jellyfish drifting between skyscrapers at dusk",
    mode: "video", modelId: "cinema-studio-4", cameraMoveId: "tilt-down", effectId: "world-morphing",
    aspectId: "16:9", author: "drift.state", likes: 6790,
  },
  {
    prompt: "Close-up of hands throwing clay on a wheel, clay slip everywhere",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "focus-change", effectId: null,
    aspectId: "1:1", author: "kiln", likes: 1560,
  },
  {
    prompt: "Cyberpunk street food vendor, steam and holographic signage, anamorphic flare",
    mode: "image", modelId: "nano-banana-pro", cameraMoveId: null, effectId: null,
    aspectId: "21:9", author: "noodle.exe", likes: 5240,
  },
  {
    prompt: "Herd of horses running through shallow water, backlit spray",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "arc-shot", effectId: null,
    aspectId: "21:9", author: "wildlands", likes: 4110,
  },
  {
    prompt: "A woman's silhouette dissolving into a flock of starlings over a wheat field",
    mode: "video", modelId: "kling-3-0", cameraMoveId: "crane-up", effectId: "particles",
    aspectId: "9:16", author: "murmuration", likes: 9340,
  },
  {
    prompt: "Retro sci-fi control room, CRT glow, analogue switches, operator in profile",
    mode: "image", modelId: "gpt-image-2", cameraMoveId: null, effectId: null,
    aspectId: "16:9", author: "cold.war.fi", likes: 2870,
  },
  {
    prompt: "Surfer inside a barrel wave, sun refracting through the lip",
    mode: "video", modelId: "cinema-studio-4", cameraMoveId: "object-pov", effectId: null,
    aspectId: "9:16", author: "swell", likes: 6030,
  },
  {
    prompt: "Antique globe cracking open to reveal a miniature ocean storm",
    mode: "video", modelId: "kling-3-0", cameraMoveId: "super-dolly-in", effectId: "world-morphing",
    aspectId: "1:1", author: "cartograph", likes: 3720,
  },
  {
    prompt: "Fashion editorial: model in liquid chrome against a sandstorm",
    mode: "image", modelId: "soul", cameraMoveId: null, effectId: null,
    aspectId: "3:4", author: "chrome.issue", likes: 8150,
  },
  {
    prompt: "Old fisherman mending nets at dawn, weathered hands, Portuguese harbour",
    mode: "image", modelId: "soul", cameraMoveId: null, effectId: null,
    aspectId: "3:4", author: "nazare", likes: 2390,
  },
  {
    prompt: "Neon-lit boxing gym, fighter shadowboxing in slow motion, sweat catching light",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "snorricam", effectId: null,
    aspectId: "16:9", author: "southpaw", likes: 4960,
  },
  {
    prompt: "Library where the books are slowly floating off the shelves",
    mode: "video", modelId: "cinema-studio-4", cameraMoveId: "dolly-in", effectId: "stop-world",
    aspectId: "16:9", author: "quietfloor", likes: 5580,
  },
  {
    prompt: "Portrait of a Maasai elder in traditional beadwork, shallow depth of field",
    mode: "image", modelId: "gpt-image-2", cameraMoveId: null, effectId: null,
    aspectId: "3:4", author: "serengeti", likes: 6220,
  },
  {
    prompt: "A city street where every building folds into origami",
    mode: "video", modelId: "kling-3-0", cameraMoveId: "overhead", effectId: "architecture-wave",
    aspectId: "9:16", author: "fold.city", likes: 7460,
  },
  {
    prompt: "Espresso pour in extreme macro, crema swirling, warm tungsten",
    mode: "video", modelId: "seedance-2-5", cameraMoveId: "focus-change", effectId: null,
    aspectId: "1:1", author: "ristretto", likes: 1820,
  },
  {
    prompt: "Mountaineer on a knife-edge ridge above a cloud inversion at sunrise",
    mode: "image", modelId: "nano-banana-pro", cameraMoveId: null, effectId: null,
    aspectId: "21:9", author: "altitude", likes: 5910,
  },
  {
    prompt: "Two dancers in a single spotlight, bodies made of smoke",
    mode: "video", modelId: "kling-3-0", cameraMoveId: "orbit-360", effectId: "melting",
    aspectId: "9:16", author: "vapour", likes: 8630,
  },
  {
    prompt: "Vintage motorbike parked outside a desert motel, heat haze rising",
    mode: "image", modelId: "soul", cameraMoveId: null, effectId: null,
    aspectId: "16:9", author: "route.66", likes: 3180,
  },
];

/** Fixed clock so timestamps are stable across server and client renders. */
const BASE = Date.parse("2026-09-14T09:00:00.000Z");

export const COMMUNITY: Generation[] = ROWS.map((row, i) => {
  const duration: Duration = row.duration ?? 5;
  const settings = {
    mode: row.mode,
    modelId: row.modelId,
    prompt: row.prompt,
    cameraMoveId: row.cameraMoveId,
    effectId: row.effectId,
    filmSetupId: row.filmSetupId ?? null,
    paletteId: row.paletteId ?? null,
    lightingId: row.lightingId ?? null,
    aspectId: row.aspectId,
    resolutionId: "1080p",
    duration,
    sound: row.mode === "video",
    quality: "standard" as const,
    batch: 1,
  };
  return {
    id: `c${String(i + 1).padStart(3, "0")}`,
    prompt: row.prompt,
    composedPrompt: composePrompt(settings),
    mode: row.mode,
    modelId: row.modelId,
    cameraMoveId: row.cameraMoveId,
    effectId: row.effectId,
    aspectId: row.aspectId,
    duration,
    quality: "standard",
    status: "ready",
    seed: `${row.author}-${i}`,
    mediaUrl: null,
    createdAt: BASE - i * 37 * 60 * 1000,
    credits: 0,
    author: row.author,
    likes: row.likes,
  } satisfies Generation;
});
