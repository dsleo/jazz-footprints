# Post-update prelaunch audit — 28 October 2026

**Revision reviewed:** `74f5589` on `main`. The public GitHub Pages HTML, `listen/listen.js`, and `method.html` matched the local files during this review. This is an audit, not a release approval or a claim of real-instrument accuracy.

## Verdict and score

| Dimension | Score / 4 | Evidence and limit |
| --- | ---: | --- |
| Accessibility | 3 | Axe and scripted dialog journeys pass; Echoes has a 70-stop keyboard path and small recording links. A human screen-reader pass remains open. |
| Performance | 2 | Catalog parsing is in a worker, but the local CPU transcription path takes about 17 seconds for 10 seconds of synthetic audio and 32 seconds for 15 seconds. No physical-device p95 or cold-network budget has been met. |
| Responsive design | 3 | Scripted archive checks cover 320, 390, 768, and 1280 px; Listen has a 390 px check. True 200% text zoom and physical phone checks are missing. |
| Theming and consistency | 3 | The paper, olive, and rust system is coherent. The new Listen stylesheet duplicates several local color tokens; there is no theme switch, which is not a launch requirement. |
| Design anti-patterns | 4 | The turntable and editorial archive are distinctive; no generic AI-style gradient/card system is apparent. |
| **Total** | **15/20** | **Good, with four P1 launch issues.** This is a provisional technical rubric score, not an automated metric. |

**Anti-pattern verdict:** Pass. The design has a recognizable musical object and restrained typographic hierarchy. The main visual weakness is information clarity in the second search flow, not generic styling.

## Findings

### P1 — Real-instrument retrieval quality is unmeasured

**Where:** `docs/listen/MODEL_SPIKE.md` (Outstanding gates), `docs/listen/IMPLEMENTATION_LOG.md` (Measured limitations), `docs/listen/benchmark.md`.

The 12-query symbolic pilot and synthetic audio examples exercise the pipeline but do not estimate recall or false positives for breathy attacks, vibrato, noise, or repeated notes on saxophone and trumpet. A listener may get a convincing-looking false match or no match for a clear played phrase. Before presenting Listen & Find as a dependable discovery tool, build a permission-cleared, held-out real-instrument set including negatives; publish recall and false-positive behavior, then tune thresholds on separate data. Keep a manual listening review of promoted examples.

### P1 — The two percentages describe different quantities without saying so

**Where:** `static/listen/listen.js:87`, `static/listen/retrieval.mjs:102-114,194-197`, `static/app.js:315`, `jazzmine/joint_search.py:45-47`, `static/method.html:48-50,91-106`.

The archive shows `1 - cost / (paired + gaps)` with its own pitch/rhythm weights and an 80% publication floor. Listen & Find shows `1 - cost / query notes` with different weights, a 0.8 skip cost, coverage and score thresholds, and a candidate shortlist. Both read as a percentage of “similarity.” Users can reasonably compare 85% on one screen with 85% on the other although the scales are not comparable, and the method page does not describe the Listen score. Rename the Listen number to a distinct search-fit label, explain what it measures beside results, and document its retrieval, ranking, and threshold logic on the method page. Do not describe either as a probability of quotation.

### P1 — Echoes requires 70 connection tab stops before the musicians

**Where:** `static/app.js:88-106,399`, `static/echoes.css:21-36`.

At the reviewed default graph, the first Tab after selecting Echoes focused an SVG connection path; the DOM exposed 70 `role="button"`/`tabindex="0"` paths before the musician buttons. This is technically operable but makes the primary musician controls exhausting to reach by keyboard or switch input, especially in the horizontally scrolling mobile graph. Use one graph entry point or roving focus, then let a selected musician expose a short, ordinary HTML list of connections. Verify the order in a screen reader and at 200% zoom.

### P1 — Audio processing time is beyond the planned interaction budget

**Where:** `docs/listen/MODEL_SPIKE.md:42-61`, `static/listen/listen.js:28-41,45-69`, `static/listen/transcription-worker.js:13-71`.

The tested worker uses the TensorFlow.js CPU backend. The recorded warm timings are about 17 seconds for a 10-second synthetic clip and 32 seconds for 15 seconds on a Mac; the UI request timeout is 60 seconds. A slower phone or a near-20-second upload may exceed the timeout, after the user has already waited through recording or upload. The progress state helps, but it does not make the wait short. Measure cold load and p95 end-to-end time on a named mid-range phone and mobile network; then reduce maximum duration, use a faster backend, or segment audio according to measured results. Make the accepted duration match the reliable budget.

### P2 — New result actions are too small on touch screens

**Where:** `static/listen/listen.css:70,74-81`; `browser-tests/listen.spec.js:60-61`.

The recording arrow is 28 × 28 CSS px and the score play controls are deliberately asserted at 32 × 32 px in tests. These small isolated targets are harder to hit on a phone, especially inside a scrolling comparison. Preserve the visual icon size if desired but increase the actual hit area to about 44 × 44 px and test that neighboring controls remain distinct.

### P2 — Listen documentation promises an inaccessible continuous mode

**Where:** `README.md:25`, `static/listen/listen.js:9,101-135`, `browser-tests/listen.spec.js:16`.

The README says a separate continuous mode updates suggestions, while the current interface has no entry for that mode; the browser test explicitly checks that its control is absent. The live-mode code and worker still ship. Update the README to match the released product, then remove or clearly isolate dormant live-mode code and its assets so maintenance and release checks target actual features.

### P2 — A small compressed upload can consume substantial decode memory

**Where:** `static/listen/listen.js:136`.

Upload rejects files above 20 MB, but it fully decodes accepted files before checking the 20-second duration. A long compressed audio file under 20 MB can allocate a much larger decoded buffer. Inspect duration before full decode when possible, cap decoded frames and channels, and give a clear error for oversized inputs. Include a long compressed fixture in resilience tests.

### P2 — Promotion assets still lack item-level clearance

**Where:** `static/ASSET_RIGHTS.md:15-23`.

The register records source types for covers, portraits, and linked recordings but no approval for specific third-party images or audio in paid creative. Keep promotion to the project-authored card and generated/synthesized materials until each selected third-party asset has an explicit use record. This is a launch operations gate, separate from the technical score.

### P3 — Product name differs in the landing headline

**Where:** `static/index.html:72`.

The page title, metadata, and footer say “Stolen Moments,” while the visible H1 says “Stolen Moment.” This weakens recognition when visitors move between a shared link and the page. Make the display name intentional and consistent.

## Systemic observations

- The pair archive and Listen & Find use separate matchers and distinct score formulas. Their UI and method copy need separate names and explanations.
- The browser release gate covers Chromium, synthetic examples, and a fake microphone. It does not substitute for cross-browser, physical microphone, real-instrument, screen-reader, or cold-network evidence.
- The base archive is static and worker-owned, but Listen starts another corpus worker and a local model. Startup and memory budgets should be measured for both journeys, including a second attempt in one session.
- The Echoes timeline counts matched solo pairs and sorts them by recording year. It cannot establish influence or authorship; any “who echoes whom” launch story should state that distinction close to the visualization.

## Positive findings

- The public HTML and two critical feature files matched the reviewed local revision.
- The GitHub Pages deploy depends on validation; the local run passed 15 Chromium browser tests, 17 Listen JavaScript tests, 23 Python tests, both catalog validators, and model-asset integrity verification.
- Pair deep links, worker-based catalog loading, synthesized playback labeling, accessible dialog naming, keyboard close/focus restoration, reduced-motion handling, and responsive archive reflow are materially stronger than the previous baseline.
- Audio transcription and search run locally in workers; the app does not need to upload the user's audio to a backend.

## Release order

1. Validate Listen on held-out, real saxophone/trumpet recordings and negatives; decide whether its quality supports a general release or an explicitly experimental preview.
2. Distinguish the Listen score and document its method; simplify Echoes keyboard order.
3. Set and meet a phone latency budget; cap the audio input to a duration that reliably finishes.
4. Increase mobile hit areas and test long compressed uploads, 200% text zoom, screen-reader flow, Safari and Firefox, and a physical phone microphone.
5. Align README/landing wording, review three promoted pairs by ear, clear chosen campaign assets, and rerun the full gate on the exact publish revision.

**Launch call:** The archive is suitable for a limited, clearly exploratory preview. Do not frame Listen & Find accuracy as established, or run a broad paid campaign, until the P1 findings and item-level campaign clearance are resolved.
