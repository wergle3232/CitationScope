# CitationScope Architecture

## How It Works

CitationScope has two phases: audit (diagnose) and restructure (treat). The audit runs against any domain with no setup. The restructuring requires a light brand onboard and a client Airtable base.

Node.js scripts handle mechanical scoring. Claude handles judgment, brand voice, and writing.

## Two-Tier Data Model

### Prospecting Base (shared)
One Airtable base for all prospects. Configured once during setup. Every `/audit` writes here.

- **Prospects** table: one row per brand audited
- **Audit Results** table: GEO Scores and category breakdowns per run
- **Page Scores** table: per-page citability scores and grades

### Client Base (per client)
Created when a prospect converts via `/onboard`. One base per paying client.

- **Brand Profile** table: voice, products, messaging (single record)
- **Posts** table: URLs, original content, restructured content, before/after scores

## Components

### Scripts (tools/)

Zero-dependency Node.js scripts. Each takes a URL or domain and returns JSON.

| Script | Input | What It Does |
|--------|-------|--------------|
| `citability_scorer.js` | URL | Splits page into content blocks at headings, scores each on 5 dimensions |
| `crawler_checker.js` | Domain | Checks robots.txt for 14 AI crawlers, llms.txt, meta robots, JS rendering |
| `schema_checker.js` | URL | Extracts JSON-LD, classifies schema types, scores against page-type expectations |

### Agents (.claude/agents/)

| Agent | Model | Role |
|-------|-------|------|
| `site-analyzer` | Sonnet | Orchestrates audit scripts, AI Overview spot-check, brand authority, E-E-A-T |
| `report-builder` | Opus | Computes GEO Score, generates HTML report, restructuring recommendations |
| `post-restructurer` | Opus | Rewrites individual posts for citability using brand profile |

### Commands (.claude/commands/)

| Command | Phase | What It Does |
|---------|-------|--------------|
| `/audit [url]` | Diagnose | Score the site, produce report, save to prospecting base |
| `/onboard [prospect]` | Convert | Create client base, light brand profile, import post URLs |
| `/restructure` | Treat | Score and rewrite posts, save to client base |

## Data Flow

### Audit Flow (Phase 1)
```
/audit https://example.com
  |
  v
[Page Discovery] -- auto-detect blog posts + service pages
  |
  v
[site-analyzer agent]
  |-- citability_scorer.js on each content page --> JSON scores
  |-- crawler_checker.js on domain --> JSON access map
  |-- schema_checker.js on each page --> JSON schema audit
  |-- DataForSEO SERP --> AI Overview spot-check (5-10 keywords)
  |-- WebFetch/SERP --> brand authority signals
  |-- WebFetch --> E-E-A-T assessment
  |
  v
[report-builder agent]
  |-- computes GEO Score
  |-- generates restructuring recommendations
  |-- generates llms.txt
  |-- builds HTML report
  |
  v
[Airtable: Prospecting Base]
  |-- Prospect record (brand, domain, status)
  |-- Audit Result record (GEO Score, category scores)
  |-- Page Score records (per-page citability)
  |
  v
[Output]
  output/audit-{domain}-{date}.html
  output/llms-{domain}.txt
```

### Restructuring Flow (Phase 2)
```
/onboard "Brand Name"
  |-- creates client Airtable base (clone from template)
  |-- light brand interview (voice, products, messaging)
  |-- writes brand/profile.md
  |-- imports post URLs from prospecting base
  |-- scores all posts with citability_scorer.js
  |
  v
/restructure
  |-- loads brand profile
  |-- prioritizes posts (by Google rank + citability gap)
  |-- for each post:
  |     |-- load original content
  |     |-- [post-restructurer agent]
  |     |     |-- rewrite with answer-first structure
  |     |     |-- add brand-specific details
  |     |     |-- generate schema JSON-LD
  |     |-- run citability_scorer.js on new content
  |     |-- save to Airtable (restructured content + new score)
  |
  v
[Airtable: Client Base]
  Posts table with before/after scores and restructured content
  Client reviews and publishes to their own platform
```

## Configuration

### config/prospecting.json
```json
{
  "base_id": "app...",
  "tables": {
    "prospects": "tbl...",
    "audit_results": "tbl...",
    "page_scores": "tbl..."
  }
}
```

### config/client.json (per-client, when active)
```json
{
  "base_id": "app...",
  "tables": {
    "brand_profile": "tbl...",
    "posts": "tbl..."
  }
}
```

## No Publishing

CitationScope does not publish content. The restructured content is delivered in Airtable (or as files). The client publishes to their own platform. This keeps CitationScope simple and means it works with any CMS, including custom platforms.
