import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Load .env before the schema runs, so a fresh checkout that copied
// .env.example gets validated rather than silently falling back to defaults.
loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  BACKEND_URL: z.string().url(),
  GATEWAY_KEY: z.string().min(16, "GATEWAY_KEY must be at least 16 characters"),
  SESSION_COOKIE_NAME: z.string().min(1).default("kg_session"),
  ALLOWED_ORIGIN: z.string().url(),
});

export type Env = Readonly<z.infer<typeof envSchema>> & {
  readonly isProduction: boolean;
  /** BACKEND_URL without a trailing slash, so path joining is unambiguous. */
  readonly backendOrigin: string;
};

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Names only — values may be secrets and this is printed to stderr/logs.
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid gateway environment:\n${problems}\n\nSee .env.example.`);
  }

  const value = parsed.data;
  return Object.freeze({
    ...value,
    isProduction: value.NODE_ENV === "production",
    backendOrigin: value.BACKEND_URL.replace(/\/+$/, ""),
  });
}

export const env: Env = parseEnv();
