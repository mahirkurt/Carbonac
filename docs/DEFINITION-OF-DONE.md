# Definition of Done (DoD)

This checklist formalizes the minimum acceptance criteria for Carbonac changes.
Source of truth: `docs/PROJE-TALIMATLARI.md` ("Kalite ve DoD (Minimum)").

## Minimum Checklist
- [ ] Manual scenario is tested (record steps + outcome in the PR).
- [ ] Error/edge paths return clear messages and log entries.
- [ ] Documentation is updated (SoT + relevant docs).
- [ ] PDF lint checks run (overflow, widows/orphans, min font).
- [ ] PDF accessibility checks run (heading order, bookmarks, links).

## Evidence To Capture
- Commands executed (tests, smoke, QA, migrations).
- Sample output locations (PDF/PNG/HTML paths).
- Notes on deviations or skipped checks.

## Notes
- If a checklist item is not applicable, mark it "N/A" in the PR and explain why.
- Keep evidence concise; link to logs/artifacts when available.
