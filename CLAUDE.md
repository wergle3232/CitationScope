# CitationScope

AI citability audit and content restructuring service. Two phases: diagnose (audit) and treat (restructure). Scores websites on whether AI platforms can cite their content, then restructures existing posts for citability.

**The pitch:** "You have 200 blog posts. They rank in Google. Zero are structured for AI citation. We scored every one and found the specific structural reasons why. We can fix them without creating anything new."

## Getting Started

1. Clone this repo
2. Configure MCP servers (Airtable required, DataForSEO recommended)
3. Set up the prospecting Airtable base (one-time, shared across all prospects)
4. Run `/audit https://example.com` to audit a prospect
5. When a prospect converts: `/onboard [prospect]` to create their client base
6. Run `/restructure` to rewrite their posts for citability

See `docs/getting-started.md` for the full walkthrough.

## What CitationScope Does

### Phase 1: Audit (Diagnose)
Scores a website's content for AI citability. Produces a GEO Score (0-100) across five dimensions with a client-ready report. Results saved to the shared prospecting base.

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| AI Citability | 30% | Content block structure, answer-first patterns, self-containment, specificity |
| Brand Authority | 20% | Presence on YouTube, Reddit, Wikipedia, LinkedIn |
| Content E-E-A-T | 20% | Author attribution, credentials, freshness, source citations |
| Technical GEO | 15% | AI crawler access, llms.txt, JS rendering |
| Schema & Structured Data | 15% | JSON-LD quality and completeness for the page type |

### Phase 2: Restructure (Treat)
Rewrites existing blog posts and service pages for AI citability using the brand's voice, product details, and messaging. Each post is scored before and after. Results tracked in the client's own Airtable base.

## What CitationScope Does NOT Do

- Ongoing visibility tracking (that's ContentEngine /visibility)
- New content creation or planning (that's ContentEngine /plan and /write)
- Social media content (no Twitter, LinkedIn posts)
- Publishing to the client's website (client handles their own publishing)
- Video production
- DailySignals

If a client wants these capabilities after restructuring, they upgrade to a ContentEngine engagement.

## Commands

| Command | Purpose | Status |
|---------|---------|--------|
| `/audit [url]` | Full citability audit on a domain. Saves to prospecting base. | Building |
| `/audit [url] --snapshot` | Quick 3-page snapshot for lead gen | Planned |
| `/onboard [prospect]` | Convert prospect to client. Create client base, light brand profile. | Planned |
| `/restructure` | Score and rewrite posts for a client | Planned |

## Two-Tier Data Model

### Prospecting Base (shared, one for all prospects)
Run 3-5 audits a day, all results in one base. This is the sales pipeline.

| Table | What It Holds |
|-------|--------------|
| Prospects | Brand name, domain, contact info, status, audit date |
| Audit Results | GEO Score and category scores per audit run, linked to Prospect |
| Page Scores | Per-page citability scores and grades, linked to Audit Result |

### Client Base (one per converted client)
When a prospect converts, they get their own base for restructuring work.

| Table | What It Holds |
|-------|--------------|
| Brand Profile | Voice, audience, products, messaging (single record) |
| Posts | URLs, original content, restructured content, before/after scores, status |

## Architecture

```
CitationScope/
├── CLAUDE.md                    # This file
├── docs/
│   ├── getting-started.md       # Setup and first audit
│   ├── architecture.md          # How the system works
│   ├── scoring-methodology.md   # Citability scoring in detail
│   └── service-design.md        # Business case and service tiers
├── .claude/
│   ├── commands/
│   │   ├── audit.md             # /audit command (prospecting base)
│   │   ├── onboard.md           # /onboard command (create client base)
│   │   └── restructure.md       # /restructure command (client base)
│   ├── agents/
│   │   ├── site-analyzer.md     # Crawl, score, assess
│   │   ├── report-builder.md    # Generate HTML report
│   │   └── post-restructurer.md # Rewrite posts for citability
│   └── rules/
│       ├── scoring.md           # Scoring conventions
│       └── restructuring.md     # Restructuring principles
├── tools/
│   ├── citability_scorer.js     # Content block citability scoring
│   ├── crawler_checker.js       # AI crawler access analysis
│   └── schema_checker.js        # JSON-LD validation
├── templates/
│   └── report.html              # Audit report HTML template
├── brand/                       # Client brand profile (gitignored, per-client)
│   └── profile.md
├── config/                      # Configuration (gitignored)
│   ├── prospecting.json         # Prospecting base ID and table IDs
│   └── client.json              # Current client base ID and table IDs
├── output/                      # Generated reports (gitignored)
├── planning/
│   └── audit-definition.md      # Full service definition
├── package.json
└── .gitignore
```

## Core Principles

- **Specificity, not statistics.** Score brand-appropriate specificity. Never fabricate stats.
- **Human-first, AI-extractable.** Write for the person reading, structure so AI can extract.
- **Blog posts are the target.** Homepages are rarely cited. Blog posts and service pages are.
- **Business type matters.** Different businesses have different specificity signals and schema expectations.
- **Proof over prediction.** The AI Overview spot-check shows real consequences the client can verify.
- **Scripts for mechanical work.** Node.js scripts for scoring. Claude for judgment and writing.
- **Two-tier data.** Prospects share one base. Clients get their own.

## Service Flow

```
/audit example.com          Prospect: score the site, produce report (shared base)
        |
   [client signs up]
        |
/onboard "Example Co"       Create client base, build light brand profile
        |
/restructure                 Score all posts, prioritize, rewrite for citability (client base)
        |
   [deliver restructured content]
        |
   [optional: upgrade to ContentEngine for new content + visibility]
```

## Style

- Reduce em dash usage (AI tell). Use periods, commas, colons.
- No fabricated statistics in reports or recommendations.
- Reports are professional and specific. Real findings, real fixes, real examples.
- CitationScope branding on all deliverables.

## Dependencies

- Node.js (scripts use built-in modules only)
- Claude Code (VS Code extension or CLI)
- Airtable MCP (for prospecting base and client bases)
- DataForSEO MCP (for AI Overview spot-check and keyword data)

## Related

- ContentEngine: full content production system. CitationScope clients upgrade to ContentEngine for new content creation, visibility tracking, and publishing.
- geo-seo-claude (github.com/zubair-trabzada/geo-seo-claude): inspiration for citability scoring
- Research: Georgia Tech / Princeton / IIT Delhi 2024 GEO study
