# CitationScope

AI citability audit tool. Scores websites on whether AI platforms can extract, understand, and cite their content. Produces a GEO Score (0-100) with specific restructuring recommendations.

**What makes this different:** Most audit tools check robots.txt and schema presence. CitationScope scores the actual content blocks for AI extractability. The headline finding: "You have N blog posts. Zero are structured for AI citation. Here's exactly why, and here's how to fix each one."

## Getting Started

1. Clone this repo
2. `npm install` (if dependencies are added later, currently zero-dep)
3. Configure DataForSEO MCP (for AI Overview spot-check)
4. Run `/audit https://example.com`

See `docs/getting-started.md` for the full walkthrough.

## What CitationScope Does

Examines a website and answers: "Can AI platforms cite your content?" Five dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| AI Citability | 30% | Content block structure, answer-first patterns, self-containment, specificity |
| Brand Authority | 20% | Presence on YouTube, Reddit, Wikipedia, LinkedIn |
| Content E-E-A-T | 20% | Author attribution, credentials, freshness, source citations |
| Technical GEO | 15% | AI crawler access, llms.txt, JS rendering |
| Schema & Structured Data | 15% | JSON-LD quality and completeness for the page type |

## What CitationScope Does NOT Do

- Query AI chatbots for brand mentions (that's visibility tracking, a separate concern)
- Create or publish content
- Manage a content pipeline or Airtable base
- Replace SEO tools (it complements them, doesn't compete)

## Commands

| Command | Purpose | Status |
|---------|---------|--------|
| `/audit [url]` | Full citability audit on a domain | Building |
| `/audit [url] --snapshot` | Quick 3-page snapshot | Planned |

## Architecture

```
CitationScope/
├── CLAUDE.md                    # This file
├── docs/                        # System documentation
│   ├── getting-started.md       # Setup and first audit
│   ├── architecture.md          # How the system works
│   ├── scoring-methodology.md   # Citability scoring in detail
│   └── service-design.md        # Business case and service tiers
├── .claude/
│   ├── commands/
│   │   └── audit.md             # /audit command
│   ├── agents/
│   │   ├── site-analyzer.md     # Crawl, score, assess
│   │   └── report-builder.md    # Generate HTML report
│   └── rules/
│       └── scoring.md           # Scoring conventions
├── tools/
│   ├── citability_scorer.js     # Content block citability scoring
│   ├── crawler_checker.js       # AI crawler access analysis
│   └── schema_checker.js        # JSON-LD validation
├── templates/
│   └── report.html              # Report HTML template
├── output/                      # Generated reports (gitignored)
├── planning/
│   └── audit-definition.md      # Full service definition
├── package.json
└── .gitignore
```

## Core Principles

- **Specificity, not statistics.** Score brand-appropriate specificity. Never fabricate stats. A window company naming product models is as specific as a SaaS company citing user counts.
- **Human-first, AI-extractable.** Write for the person reading, structure so AI can extract. Technical specs wrapped in language the reader cares about.
- **Blog posts are the target.** Homepages are rarely cited. Blog posts and detailed service pages are what AI extracts. Focus scoring there.
- **Business type matters.** Different businesses have different specificity signals, authority platforms, and schema expectations. The audit adapts.
- **Proof over prediction.** The AI Overview spot-check connects citability scores to real consequences the client can verify themselves.
- **Scripts for mechanical work.** Deterministic Node.js scripts for scoring and checking. Claude for interpretation, synthesis, and recommendations.

## Style

- Reduce em dash usage (AI tell). Use periods, commas, colons.
- No fabricated statistics in reports or recommendations.
- Reports are professional and specific. Real findings, real fixes, real examples.
- CitationScope branding on all deliverables.

## Dependencies

- Node.js (scripts use built-in modules only, zero npm dependencies)
- Claude Code (VS Code extension or CLI)
- DataForSEO MCP (for AI Overview spot-check and keyword data)
- No Airtable, no other MCP servers required

## Related

- ContentEngine: the content production system. CitationScope diagnoses, ContentEngine treats.
- geo-seo-claude (github.com/zubair-trabzada/geo-seo-claude): inspiration for citability scoring approach
- Research: Georgia Tech / Princeton / IIT Delhi 2024 GEO study
