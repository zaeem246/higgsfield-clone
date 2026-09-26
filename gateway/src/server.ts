/**
 * Platform entrypoint.
 *
 * Vercel serves an exported fetch handler rather than running a process that
 * binds a port, so this module exports the app and nothing else. `index.ts`
 * stays as the standalone Node server used in development, where a real
 * long-lived process with signal handling is what you actually want.
 *
 * Both paths build the same app from `createApp()`, so there is one definition
 * of the gateway and two ways to run it.
 */

import { createApp } from "./app.js";

export default createApp();
