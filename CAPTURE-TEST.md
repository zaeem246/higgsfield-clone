# CAPTURE-TEST.md

Proof that automatic prompt/response capture works, run before any product code was written.

## Setup (step 1)

- **Tool:** Claude Code (CLI `claude` v2.1.269) on Windows 11, Node v24.16.0.
- **Model:** `claude-opus-5` (Opus 5, 1M context) both plans and executes. One model
  throughout; no planner/executor split.
- **Automatic mechanism available?** Yes. Claude Code fires hooks declared in
  `.claude/settings.json`. `UserPromptSubmit` fires on every submitted prompt and
  receives the prompt text; `Stop` fires at end of turn and receives the path to the
  session transcript on stdin.

Because the hook lives in the project's `.claude/settings.json` rather than in one
session's config, it applies to every Claude Code session opened in this repo,
including headless `claude -p` runs.

## Mechanism used (step 2)

**Config changed:** `.claude/settings.json` wires both events to a single script:

| Event | Command |
| --- | --- |
| `UserPromptSubmit` | `node "$CLAUDE_PROJECT_DIR/scripts/capture.mjs" prompt` |
| `Stop` | `node "$CLAUDE_PROJECT_DIR/scripts/capture.mjs" stop` |

**Script:** [`scripts/capture.mjs`](scripts/capture.mjs).

- On `prompt` it appends the user's prompt verbatim.
- On `stop` it parses the JSONL transcript and takes the **last assistant message
  containing text** — the end-of-turn reply. Thinking blocks, tool calls and
  intermediate steps are filtered out, so the log holds what the user typed and what
  the agent actually said back, nothing else.
- The script never exits non-zero. A failing hook would interrupt the session, so
  errors are swallowed and recorded in `.agent-logs/.state/errors.log` instead.

**Output:** one markdown file per session in `.agent-logs/`, named
`YYYY-MM-DD_HH-MM-SS_<session-id>.md`, using the assignment's `[LOG_ENTRY ...]`
format with frontmatter (`total_exchanges`, `first_prompt_time`, `last_prompt_time`
are rewritten on every append, so they stay correct mid-session).

`.agent-logs/` is committed on purpose and ships publicly. Only `.agent-logs/.state/`
— the hook's own bookkeeping — is gitignored.

## What I tried first, and what broke

**1. Dry run against a synthetic transcript.** Before spending real sessions I fed
`capture.mjs` a hand-built transcript and synthetic stdin payloads covering quotes,
`<angle brackets>`, `&`, `%`, emoji, multi-line bodies, a thinking block, and a
tool-only assistant turn arriving *after* the real text reply. Verified: thinking
never logged, tool calls never logged, special characters verbatim, duplicate `Stop`
firings deduped, frontmatter counters live. Passed, and the dry-run output was written
to a scratch directory so it never touched the repo.

**2. First real canary run — found a genuine race.** Two headless sessions. Session 2
logged prompt *and* response; session 1 logged only the prompt. Cause: `Stop` can fire
before Claude Code has flushed the closing assistant message to the transcript file, so
a single read finds nothing and the response is silently dropped. Session 2 happened to
win the race; session 1 lost it.

**Fix:** `awaitResponse()` polls the transcript for up to 8s (150ms interval) for an
assistant message that is both new (uuid differs from the last one logged) and
plausibly from this exchange (timestamped at or after the prompt, with 2s of slack for
clock skew). It returns as soon as one appears, so the common case costs one read.

This is the failure worth reporting: a capture hook that works most of the time looks
identical to one that works, until you check the logs and find responses missing.

## Verification (steps 3-4)

Three **separate** headless `claude -p` sessions run inside the repo after the fix —
each a distinct session id, each captured by the project hook with no per-session
setup:

| Session | File | Prompts | Responses |
| --- | --- | --- | --- |
| `d6ce0582` | `.agent-logs/2026-09-14_09-41-14_d6ce0582-....md` | 1 | 1 |
| `19064f6e` | `.agent-logs/2026-09-14_09-41-19_19064f6e-....md` | 1 | 1 |
| `ab43abf8` | `.agent-logs/2026-09-14_09-41-23_ab43abf8-....md` | 1 | 1 |

3 sessions, 3 files, every one with a matched prompt and response, and
`.agent-logs/.state/errors.log` never created. **Capture test passed.**

### Canary 1 — raw file

```
---
session_id: d6ce0582-bcb8-4971-bedb-5bdd737bb791
date: 2026-09-14
author: Muhammad Zaeem Mohzar
model: claude-opus-5
tool: claude-code
project: higgsfield_clone
total_exchanges: 1
first_prompt_time: 2026-09-14T09:41:14.670Z
last_prompt_time: 2026-09-14T09:41:14.670Z
---

# Session Log - 2026-09-14

Session: `d6ce0582` | Project: `higgsfield_clone` | Author: `Muhammad Zaeem Mohzar`

---

[LOG_ENTRY type=PROMPT num=1 session=d6ce0582]
timestamp: 2026-09-14T09:41:14.670Z
model: unknown

CAPTURE TEST 1 - 8x assignment, higgsfield clone, independent session. Reply with one short line only.

[LOG_ENTRY type=RESPONSE num=1 session=d6ce0582]
timestamp: 2026-09-14T09:41:16.312Z
model: claude-opus-5

Acknowledged — capture test 1 received, no changes made.
```

### Canary 2 — raw file

```
---
session_id: 19064f6e-07df-467c-9f54-4ca83e57d397
date: 2026-09-14
author: Muhammad Zaeem Mohzar
model: claude-opus-5
tool: claude-code
project: higgsfield_clone
total_exchanges: 1
first_prompt_time: 2026-09-14T09:41:19.374Z
last_prompt_time: 2026-09-14T09:41:19.374Z
---

# Session Log - 2026-09-14

Session: `19064f6e` | Project: `higgsfield_clone` | Author: `Muhammad Zaeem Mohzar`

---

[LOG_ENTRY type=PROMPT num=1 session=19064f6e]
timestamp: 2026-09-14T09:41:19.374Z
model: unknown

CAPTURE TEST 2 - 8x assignment, higgsfield clone, independent session. Reply with one short line only.

[LOG_ENTRY type=RESPONSE num=1 session=19064f6e]
timestamp: 2026-09-14T09:41:21.085Z
model: claude-opus-5

Capture test 2 acknowledged — independent session, no changes made.
```

### Canary 3 — raw file

```
---
session_id: ab43abf8-97c1-4fcc-a942-15c07a888010
date: 2026-09-14
author: Muhammad Zaeem Mohzar
model: claude-opus-5
tool: claude-code
project: higgsfield_clone
total_exchanges: 1
first_prompt_time: 2026-09-14T09:41:23.565Z
last_prompt_time: 2026-09-14T09:41:23.565Z
---

# Session Log - 2026-09-14

Session: `ab43abf8` | Project: `higgsfield_clone` | Author: `Muhammad Zaeem Mohzar`

---

[LOG_ENTRY type=PROMPT num=1 session=ab43abf8]
timestamp: 2026-09-14T09:41:23.565Z
model: unknown

CAPTURE TEST 3 - 8x assignment, higgsfield clone, independent session. Reply with one short line only.

[LOG_ENTRY type=RESPONSE num=1 session=ab43abf8]
timestamp: 2026-09-14T09:41:25.216Z
model: claude-opus-5

Test 3 captured — no changes made.
```

## Note on the main session log

The hook stores prompts verbatim, and the canaries above are raw. The one
exception is this build's own session log
(`2026-09-14_09-35-49_879e1b52-....md`): its prompts were copy-edited for
readability after the fact, on request, during what was a practice run. The
assignment brief inside exchange 1 is untouched, and the unedited original is
kept outside the repo. Flagged here rather than left implicit, because the
mechanism's whole value is that the record is trustworthy.

## Defects found in the hook itself

Two bugs surfaced later in the build, both found by reading the logs back rather
than by the hook reporting anything — which is the point worth keeping: a capture
hook that fails does so silently.

1. **Prompts carrying an attachment were dropped.** A message whose text arrived
   alongside a screenshot reached `UserPromptSubmit` with an empty `prompt`
   field. The exchange counter still advanced, so the log gained an entry header
   with nothing beneath it, and one prompt vanished entirely. Guarded now: an
   entry is never written for an empty prompt.

2. **Entries could run together.** One response body reached the file without its
   trailing newlines, so the next entry's header was glued to the end of it and
   no parser could read the pair apart. `append()` now normalises the join
   before writing.

A structural check over every log in `.agent-logs/` — headers preceded by a blank
line, no empty bodies, prompts and responses paired — passes for all files.

## Known limitation

`model:` on the PROMPT line reads `unknown` for the first exchange of a session: at
prompt time the transcript holds no assistant message yet, so there is nothing to read
the model from. The RESPONSE line always records the real model, and from the second
exchange onward the PROMPT line carries the last known model — so a mid-build model
switch stays visible in the log. Left as-is rather than back-filled, so the log
reflects what was actually known at write time.
