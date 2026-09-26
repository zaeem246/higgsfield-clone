/**
 * Server bootstrap. Everything it needs is imported dynamically so that a bad
 * environment fails with one readable line instead of a module-load stack.
 */

import type { Server } from "node:http";

async function main(): Promise<void> {
  let env: typeof import("./env.js").env;
  try {
    ({ env } = await import("./env.js"));
  } catch (cause) {
    console.error(cause instanceof Error ? cause.message : String(cause));
    process.exit(1);
  }

  const [{ serve }, { createApp }] = await Promise.all([
    import("@hono/node-server"),
    import("./app.js"),
  ]);

  // Bind every interface: inside a container, listening on loopback makes the
  // service unreachable from the platform's health checks and its router.
  const server = serve(
    { fetch: createApp().fetch, port: env.PORT, hostname: "0.0.0.0" },
    (info) => {
      console.log(
        JSON.stringify({
          level: "info",
          msg: "gateway_listening",
          port: info.port,
          nodeEnv: env.NODE_ENV,
          backendUrl: env.backendOrigin,
          allowedOrigin: env.ALLOWED_ORIGIN,
        }),
      );
    },
  ) as Server;

  const shutdown = (signal: string): void => {
    console.log(JSON.stringify({ level: "info", msg: "gateway_shutdown", signal }));
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

void main();
