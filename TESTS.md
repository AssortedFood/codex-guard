## 1. **`config.js`**

* **Missing or malformed `config.json`**
  Simulate `fs.existsSync` returning `false`, or provide a corrupt JSON file. Assert that the module calls `logger.error` and calls `process.exit(1)`.

* **Valid configuration**
  Provide a well-formed `config.json` in a temp directory. Assert that `DAILY_TOKEN_LIMIT`, `HIGH_WARNING_PERCENT`, `USAGE_INTERVAL`, `IDLE_ALERT` and `SHUTDOWN_TIMEOUT` all match the values in the file (and that defaults apply when fields are omitted).

---

## 2. **`usage.js` (standalone CLI & helper)**

* **`fetchTodayUsage` succeeds**
  Mock `node-fetch` to return a 200 OK with a payload containing multiple `.data` entries. Assert that the returned sum equals the sum of `(n_context_tokens_total + n_generated_tokens_total)`.

* **`fetchTodayUsage` handles HTTP errors**
  Mock a non-200 response (e.g. 401). Assert that `fetchTodayUsage()` throws an error containing the status code and text.

* **CLI invocation without API key**
  Run `node src/usage.js` with `OPENAI_API_KEY` unset. Assert the process exits with code `2` and logs “OPENAI\_API\_KEY environment variable is not set.”

* **CLI invocation under/over thresholds**

  * **Under warning**: Mock `fetchTodayUsage` to return a low number. Assert `logger.info` is called with “Usage: …” and exit code `0`.
  * **Above warning**: Mock to a value ≥ `HIGH_WARNING_PERCENT%` but < limit. Assert `logger.warn` is called.
  * **Over cap**: Mock to ≥ `DAILY_TOKEN_LIMIT`. Assert `logger.error('Over cap!')` and exit code `1`.

---

## 3. **`usageManager.checkUsage` (rate-limit & thresholds)**

* **Rate-limit skipping**
  Use fake timers or manually stub `Date.now()` so you can call `checkUsage()` five times in quick succession. Confirm the fifth call logs a skip warning and does *not* call `fetchTodayUsage`.

* **Under threshold**
  Mock `fetchTodayUsage()` to a small value. Assert `logger.info` is called, and `shutdown.markPendingShutdown` is *not* invoked.

* **Warning threshold**
  Mock to a value ≥ `HIGH_WARNING_PERCENT%` but < limit. Assert `logger.warn` is called, no shutdown scheduled.

* **Over cap**
  Mock to ≥ `DAILY_TOKEN_LIMIT`. Assert `shutdown.markPendingShutdown()` is called once and `logger.error('Over cap!')` logged.

---

## 4. **`shutdown.js`**

* **`markPendingShutdown()` behavior**

  * On first call: `pendingShutdown` flips to `true`, `logger.error('Daily token cap reached…')` is invoked, and a forced‐shutdown timer is scheduled.
  * On second call: no new timer is scheduled (you can spy on `setTimeout` or check that only one timer exists).

* **`performShutdownIfPending()`**

  * **Pending = false**: assert no calls to `codexProcess.kill`.
  * **Pending = true**: with a fake `codexProcess` stub, assert `kill('SIGTERM')` is called immediately.

* **Forced‐shutdown timeout**
  Use fake timers to advance past `shutdownTimeoutS` and confirm that `codexProcess.kill('SIGTERM')` is called and `logger.error('No shutdown prompt…')` is invoked.

---

## 5. **`detectorHandlers.js`**

* **`handleMessageTrigger()`**

  * Stub `checkUsage` and `performShutdownIfPending`.
  * With `IDLE_ALERT=true`, spy on `process.stdout.write` to see the bell character (`'\x07'`).
  * Assert both `checkUsage` and `performShutdownIfPending` are called once.

* **`handleDoneTrigger()`**

  * Stub `performShutdownIfPending` and assert it is called when invoked.

---

## 6. **`notifier.js` & `stripAnsi`**

* **`stripAnsi`**
  Feed strings with various ANSI CSI sequences (e.g. `\x1b[31m`, `\x1b[0m`) and assert the cleaned string has none of those codes.

* **`createDetector`**

  * **Simple detection**: feed chunks that cumulatively contain the target. Assert callback fires once.
  * **Buffer trimming**: feed >200 characters without the target, then append the target. Ensure that detection still works and old buffer contents have been trimmed correctly.
  * **Repeated triggers**: after a detection, feed the target again and assert callback fires a second time (but only once per appearance).

---

## 7. **`guard.js` CLI wiring** *(light integration)*

* Spawn a dummy `codex` script (e.g. a small Node program that prints “send a message” then exits).
* Stub `usageManager.checkUsage` and `shutdown.performShutdownIfPending`.
* Run `guard.js` (via `child_process.spawn`) and assert that upon seeing “send a message” it calls your stubs, and then terminates.

---

## 8. **`logger.js`**

* **`setTitle`**
  Mock `fs.openSync` to return a fake file descriptor. Spy on `fs.writeSync` calls to verify the OSC sequence `\u001b]0;<msg>\u0007` is written.

* **`drawTopBar`**
  Spy on `process.stdout.write` calls to ensure the correct cursor‐save (`\u001b7`), move (`\u001b[1;1H`), clear line (`\u001b[2K`), message, and cursor‐restore (`\u001b8`) sequences are emitted in the right order.

---

### Test organization

* **Directory:**

  ```
  __tests__/
  ├── config.test.js
  ├── usage.test.js
  ├── usageManager.test.js
  ├── shutdown.test.js
  ├── detectorHandlers.test.js
  ├── notifier.test.js
  ├── guard.integration.test.js
  └── logger.test.js
  ```
* **Helpers & fixtures:**

  * Mocking utilities for `fs`, `node-fetch`, timers, and child processes.
  * Shared fake data for usage API responses.
