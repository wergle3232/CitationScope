# CitationScope Architecture

## How It Works

CitationScope uses Node.js scripts for deterministic scoring and Claude for interpretation, synthesis, and recommendations. Scripts do the mechanical work (fetching pages, parsing HTML, counting patterns). Claude does the judgment work (assessing brand authority, evaluating E-E-A-T, writing recommendations).

## Components

### Scripts (tools/)

Zero-dependency Node.js scripts. Each takes a URL or domain, fetches the page, and returns structured JSON.

| Script | Input | What It Does |
|--------|-------|--------------|
| `citability_scorer.js` | URL | Splits page into content blocks at headings, scores each on 5 dimensions |
| `crawler_checker.js` | Domain | Checks robots.txt for 14 AI crawlers, llms.txt, meta robots, JS rendering |
| `schema_checker.js` | URL | Extracts JSON-LD, classifies schema types, scores against page-type expectations |

### Agents (.claude/agents/)

| Agent | Model | Role |
|-------|-------|------|
| `site-analyzer` | Sonnet | Orchestrates scripts, assesses brand authority and E-E-A-T, runs AI Overview spot-check |
| `report-builder` | Opus | Synthesizes all data into GEO Score, generates HTML report with restructuring recommendations |

### Command (.claude/commands/)

| Command | What It Does |
|---------|--------------|
| `/audit [url]` | Full citability audit. Discovers pages, runs all analyses, generates report. |

## Data Flow

```
/audit https://example.com
  |
  v
[Page Discovery] -- auto-detect blog posts + service pages
  |
  v
[site-analyzer agent]
  |-- runs citability_scorer.js on each page --> JSON scores
  |-- runs crawler_checker.js on domain --> JSON access map
  |-- runs schema_checker.js on each page --> JSON schema audit
  |-- DataForSEO SERP queries --> AI Overview spot-check
  |-- WebFetch/SERP searches --> brand authority signals
  |-- WebFetch on about page --> E-E-A-T assessment
  |
  v
[report-builder agent]
  |-- computes GEO Score (weighted average)
  |-- classifies issues by severity
  |-- generates restructuring recommendations
  |-- generates llms.txt for the domain
  |-- builds HTML report
  |
  v
[Output]
  output/audit-{domain}-{date}.html
  output/llms-{domain}.txt
```

## No Persistence Layer

CitationScope does not use Airtable or any database. All output is local files (HTML reports, JSON data). If integration with ContentEngine is needed later, the audit data can be imported.
