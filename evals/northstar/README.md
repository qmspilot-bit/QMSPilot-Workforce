# Northstar Precision Systems evaluation

Northstar is QMSPilot's first synthetic design-partner rehearsal: a fictional manufacturer with mixed-format QMS evidence, cross-document contradictions, realistic uncertainty, and clean negative controls.

## Public evidence

The customer-style files live in `public/scenarios/northstar/` and are also packaged as `northstar-evidence-pack.zip`. The private answer key and rubric in this directory must never be included in the public archive.

## Recommended run

1. Open the current Pilot preview.
2. Load the Northstar mission.
3. Download and unzip the evidence pack.
4. Attach all ten evidence files in one review.
5. Run Pilot and export the JSON result.
6. Score it with `evaluation-rubric.md` and `answer-key.json`.

## Flagship mission

> Review Northstar Precision Systems' audit-readiness evidence. Cross-reference the documents, identify what genuinely requires leadership attention, cite the exact file and record ID for each conclusion, and produce a prioritized action plan with accountable owners, dates, and objective closure evidence. Call out uncertainty where the evidence is incomplete. Do not invent nonconformities.

## Evaluation record

For each model or prompt revision, record:

- git commit and deployment URL;
- model name;
- scenario pack SHA-256 values from `source-manifest.json`;
- exported Pilot JSON;
- rubric score and reviewer notes;
- duration, errors, and approximate cost when available.
