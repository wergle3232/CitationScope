# Getting Started with CitationScope

## Prerequisites

- **Claude Code** (VS Code extension or CLI)
- **Node.js** installed
- **DataForSEO MCP** configured (for AI Overview spot-check and keyword data)

No Airtable, no database, no other services needed.

## Setup

```bash
git clone https://github.com/wergle3232/CitationScope.git
cd CitationScope
```

No `npm install` needed. Scripts use built-in Node.js modules only.

## Configure DataForSEO MCP

Add the DataForSEO MCP server to your Claude Code configuration for AI Overview spot-checks and keyword data. Without it, the audit still runs but skips the AI Overview evidence section.

## Run Your First Audit

```
/audit https://example.com
```

The audit will:
1. Discover key pages (blog posts, service pages)
2. Present the page list for your approval
3. Run citability scoring, crawler check, and schema audit
4. Check AI Overviews for top keywords
5. Assess brand authority and E-E-A-T
6. Compute GEO Score (0-100)
7. Generate HTML report with restructuring recommendations

## Test the Scripts Individually

Each script works standalone:

```bash
node tools/citability_scorer.js https://example.com/blog-post
node tools/crawler_checker.js example.com
node tools/schema_checker.js https://example.com
```

All return JSON to stdout.
