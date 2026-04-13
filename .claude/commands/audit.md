# /audit — CitationScope Citability Audit

**Status:** Building. See planning/audit-definition.md for the full design.

**Arguments:** $ARGUMENTS

Parse arguments:
- `[url]` — Run full audit on the domain
- `[url] --snapshot` — Quick 3-page snapshot
- `(no args)` — Ask for the URL

---

## TODO: Build out the full command following the audit flow in planning/audit-definition.md

The flow:
1. Page discovery (auto-detect, present to operator for approval)
2. Crawler check (crawler_checker.js)
3. Schema audit (schema_checker.js per page)
4. Citability scoring (citability_scorer.js per page, skip homepage)
5. AI Overview spot-check (DataForSEO SERP for top 5-10 keywords)
6. Brand authority assessment (YouTube, Reddit, Wikipedia, LinkedIn)
7. E-E-A-T assessment
8. GEO Score computation
9. Report generation (HTML)
10. llms.txt generation
