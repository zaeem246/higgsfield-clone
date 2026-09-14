#!/usr/bin/env node
/**
 * 8x agent capture.
 *
 * Records every user prompt and every end-of-turn assistant response from this
 * repo's Claude Code sessions into `.agent-logs/`, one markdown file per session.
 *
 * Wired up in `.claude/settings.json`:
 *   UserPromptSubmit -> `capture.mjs prompt`   (payload carries the prompt text)
 *   Stop             -> `capture.mjs stop`     (payload carries transcript_path)
 *
 * Claude Code hands the hook a JSON payload on stdin. The Stop payload points at
 * the session transcript, a JSONL file of every message; the final response is
 * the last assistant message in it carrying text. Thinking blocks, tool calls and
 * intermediate steps are deliberately not recorded - only what the user typed and
 * what the agent finally said.
 *
 * This never throws. A hook that exits non-zero interrupts the session, so all
 * failures are swallowed and appended to `.agent-logs/.state/errors.log` instead.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENV_ROOT = process.env.CLAUDE_PROJECT_DIR;
// Prefer the project dir Claude Code passes, but fall back to the script's own
// location so the hook still works if that variable is unexpanded or unset.
const ROOT =
  ENV_ROOT && !ENV_ROOT.includes("CLAUDE_PROJECT_DIR") && fs.existsSync(ENV_ROOT)
    ? ENV_ROOT
    : path.resolve(HERE, "..");

const LOG_DIR = path.join(ROOT, ".agent-logs");
const STATE_DIR = path.join(LOG_DIR, ".state");

const mode = process.argv[2];

main();

function main() {
  try {
    // Backfill is run by hand, not by a hook, so it takes an argument rather
    // than a stdin payload.
    if (mode === "backfill") {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      onBackfill(process.argv[3]);
      return;
    }

    const payload = readStdinJson();
    if (!payload || !payload.session_id) return;
    fs.mkdirSync(STATE_DIR, { recursive: true });
    if (mode === "prompt") onPrompt(payload);
    else if (mode === "stop") onStop(payload);
  } catch (err) {
    note(err);
    if (mode === "backfill") throw err;
  }
}

/**
 * Strips machine-generated blocks that arrive on the same channel as a typed
 * prompt — background task notifications, system reminders, slash-command
 * echoes. Without this the log fills with events the user never wrote.
 *
 * Content is only dropped when *nothing* human remains, so a real prompt that
 * happens to quote one of these tags is still captured in full.
 */
function stripMachineBlocks(text) {
  return text
    .replace(/<task-notification>[\s\S]*?<\/task-notification>/g, "")
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, "")
    .replace(/<command-(name|message|args)>[\s\S]*?<\/command-\1>/g, "")
    .replace(/^\[SYSTEM NOTIFICATION[^\]]*\][\s\S]*$/m, "")
    .trim();
}

/* ------------------------------------------------------------------ events */

function onPrompt(payload) {
  const prompt = (payload.prompt ?? "").replace(/\r\n/g, "\n");
  // A turn woken by a background task carries no human prompt; logging it would
  // record an exchange the user never had.
  if (!stripMachineBlocks(prompt)) return;

  const state = loadState(payload.session_id);
  const now = new Date().toISOString();

  state.exchanges += 1;
  state.firstPromptTime ||= now;
  state.lastPromptTime = now;
  // A new prompt opens a new exchange, so the previous response is settled.
  state.awaitingResponse = true;

  append(
    state,
    entry("PROMPT", state.exchanges, state.sessionId, now, state.model, prompt)
  );
  saveState(state);
}

function onStop(payload) {
  const state = loadState(payload.session_id);
  // Stop can fire more than once per turn. Only the first firing after a
  // prompt records a response.
  if (!state.awaitingResponse) return;

  const last = awaitResponse(payload.transcript_path, state);
  if (!last || !last.text.trim()) return;
  if (last.uuid && last.uuid === state.lastResponseUuid) return;

  if (last.model) state.model = last.model;
  state.lastResponseUuid = last.uuid;
  state.awaitingResponse = false;

  append(
    state,
    entry(
      "RESPONSE",
      state.exchanges,
      state.sessionId,
      last.timestamp || new Date().toISOString(),
      last.model,
      last.text
    )
  );
  saveState(state);
}

/* ----------------------------------------------------------------- backfill */

/**
 * Rebuilds a whole session log from its transcript.
 *
 * A project hook only starts firing once it exists, so the part of a session
 * that ran before the hook was installed is missing from `.agent-logs/` even
 * though it is present in the transcript. Backfill reconstructs those exchanges
 * from the same source the Stop hook reads, using the same filters, and rewrites
 * the session's file so the record is complete rather than starting mid-build.
 *
 * Writes the state file too, so the live hook carries on numbering from here.
 */
function onBackfill(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    throw new Error(`No transcript at: ${transcriptPath}`);
  }

  const sessionId = path.basename(transcriptPath, ".jsonl");
  const rows = fs
    .readFileSync(transcriptPath, "utf8")
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((row) => row && !row.isMeta && !row.isSidechain);

  // Walk forward pairing each human prompt with the last assistant text that
  // follows it before the next prompt — the reply actually shown at end of turn.
  const exchanges = [];
  let open = null;

  for (const row of rows) {
    if (row.type === "user" && row.message?.role === "user") {
      const text = stripMachineBlocks(userText(row.message.content));
      if (!text) continue;
      if (open) exchanges.push(open);
      open = { prompt: text, at: row.timestamp, response: null, model: null, respAt: null };
    } else if (row.type === "assistant" && row.message?.role === "assistant" && open) {
      const text = textOf(row.message.content).trim();
      if (!text) continue;
      open.response = text;
      open.model = row.message.model ?? open.model;
      open.respAt = row.timestamp;
    }
  }
  if (open) exchanges.push(open);

  if (exchanges.length === 0) throw new Error("No human exchanges found in transcript.");

  const first = new Date(exchanges[0].at ?? Date.now());
  const state = {
    sessionId,
    date: first.toISOString().slice(0, 10),
    fileName: `${stamp(first)}_${sessionId}.md`,
    author: author(),
    project: path.basename(ROOT),
    model: exchanges.findLast((e) => e.model)?.model ?? null,
    exchanges: exchanges.length,
    firstPromptTime: exchanges[0].at ?? null,
    lastPromptTime: exchanges.at(-1).at ?? null,
    lastResponseUuid: null,
    awaitingResponse: false,
  };

  // Drop any partial file the hook already wrote for this session.
  for (const name of fs.readdirSync(LOG_DIR)) {
    if (name.includes(sessionId) && name.endsWith(".md")) {
      fs.unlinkSync(path.join(LOG_DIR, name));
    }
  }

  let body = "";
  exchanges.forEach((e, i) => {
    body += entry("PROMPT", i + 1, sessionId, e.at ?? "", e.model, e.prompt);
    if (e.response) {
      body += entry("RESPONSE", i + 1, sessionId, e.respAt ?? "", e.model, e.response);
    }
  });

  fs.writeFileSync(path.join(LOG_DIR, state.fileName), frontmatter(state) + body, "utf8");
  saveState(state);

  const withReply = exchanges.filter((e) => e.response).length;
  console.log(
    `Backfilled ${exchanges.length} exchanges (${withReply} with responses) -> .agent-logs/${state.fileName}`
  );
}

/** User content can be a plain string, or blocks mixing text with tool results. */
function userText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n");
}

/* ---------------------------------------------------------------- transcript */

/**
 * Stop can fire before Claude Code has flushed the closing assistant message to
 * the transcript, which silently drops the response. So poll for a message that
 * is both new and plausibly from this exchange rather than trusting one read.
 *
 * "From this exchange" means timestamped at or after the prompt, with a couple
 * of seconds of slack for clock skew between the hook and the transcript writer.
 */
function awaitResponse(transcriptPath, state) {
  const floor = state.lastPromptTime
    ? new Date(Date.parse(state.lastPromptTime) - 2000).toISOString()
    : null;
  const deadline = Date.now() + 8000;

  for (;;) {
    const found = lastAssistantText(transcriptPath);
    const isNew = found && found.uuid !== state.lastResponseUuid;
    const isFresh = found && (!floor || !found.timestamp || found.timestamp >= floor);
    if (isNew && isFresh) return found;

    if (Date.now() >= deadline) return isNew ? found : null;
    sleep(150);
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Walks the JSONL transcript backwards for the newest assistant message that
 * contains text. Assistant turns that only hold tool calls or thinking are
 * skipped, so what lands in the log is the reply the user actually read.
 */
function lastAssistantText(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;

  const lines = fs.readFileSync(transcriptPath, "utf8").split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = lines[i].trim();
    if (!raw) continue;

    let row;
    try {
      row = JSON.parse(raw);
    } catch {
      continue;
    }

    const msg = row.message;
    if (row.type !== "assistant" || !msg || msg.role !== "assistant") continue;
    if (row.isMeta || row.isSidechain) continue;

    const text = textOf(msg.content);
    if (!text.trim()) continue;

    return {
      text: text.replace(/\r\n/g, "\n").trim(),
      model: msg.model || null,
      uuid: row.uuid || null,
      timestamp: row.timestamp || null,
    };
  }
  return null;
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n");
}

/* --------------------------------------------------------------- log format */

function entry(type, num, sessionId, timestamp, model, body) {
  return [
    `[LOG_ENTRY type=${type} num=${num} session=${short(sessionId)}]`,
    `timestamp: ${timestamp}`,
    `model: ${model || "unknown"}`,
    "",
    body,
    "",
    "",
  ].join("\n");
}

function frontmatter(state) {
  return [
    "---",
    `session_id: ${state.sessionId}`,
    `date: ${state.date}`,
    `author: ${state.author}`,
    `model: ${state.model || "unknown"}`,
    "tool: claude-code",
    `project: ${state.project}`,
    `total_exchanges: ${state.exchanges}`,
    `first_prompt_time: ${state.firstPromptTime || ""}`,
    `last_prompt_time: ${state.lastPromptTime || ""}`,
    "---",
    "",
    `# Session Log - ${state.date}`,
    "",
    `Session: \`${short(state.sessionId)}\` | Project: \`${state.project}\` | Author: \`${state.author}\``,
    "",
    "---",
    "",
    "",
  ].join("\n");
}

/** Appends an entry, rewriting the frontmatter so the counters stay current. */
function append(state, text) {
  const file = path.join(LOG_DIR, state.fileName);
  fs.mkdirSync(LOG_DIR, { recursive: true });

  let body = "";
  if (fs.existsSync(file)) {
    body = stripHeader(fs.readFileSync(file, "utf8"));
  }
  fs.writeFileSync(file, frontmatter(state) + body + text, "utf8");
}

/** Drops the frontmatter + title block, keeping only the accumulated entries. */
function stripHeader(contents) {
  const marker = contents.indexOf("\n[LOG_ENTRY ");
  return marker === -1 ? "" : contents.slice(marker + 1);
}

/* -------------------------------------------------------------------- state */

function loadState(sessionId) {
  const file = path.join(STATE_DIR, `${sessionId}.json`);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      /* corrupt state: fall through and rebuild */
    }
  }
  const now = new Date();
  return {
    sessionId,
    date: now.toISOString().slice(0, 10),
    fileName: `${stamp(now)}_${sessionId}.md`,
    author: author(),
    project: path.basename(ROOT),
    model: null,
    exchanges: 0,
    firstPromptTime: null,
    lastPromptTime: null,
    lastResponseUuid: null,
    awaitingResponse: false,
  };
}

function saveState(state) {
  fs.writeFileSync(
    path.join(STATE_DIR, `${state.sessionId}.json`),
    JSON.stringify(state, null, 2),
    "utf8"
  );
}

/* ------------------------------------------------------------------- helpers */

function readStdinJson() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch {
    return null;
  }
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function stamp(d) {
  return d.toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
}

function short(id) {
  return String(id).slice(0, 8);
}

function author() {
  try {
    const name = execFileSync("git", ["config", "user.name"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (name) return name;
  } catch {
    /* git missing or unconfigured */
  }
  return os.userInfo().username || "unknown";
}

function note(err) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(STATE_DIR, "errors.log"),
      `${new Date().toISOString()} [${mode}] ${err && err.stack ? err.stack : err}\n`
    );
  } catch {
    /* nothing left to do */
  }
}
