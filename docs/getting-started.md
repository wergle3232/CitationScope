# Getting Started with CitationScope

## Prerequisites

- **Claude Code** (VS Code extension or CLI)
- **Node.js** installed
- **Airtable account** with MCP server configured
- **DataForSEO MCP** configured (for AI Overview spot-check and keyword data)

## Step 1: Clone and Setup

```bash
git clone https://github.com/wergle3232/CitationScope.git
cd CitationScope
```

No `npm install` needed. Scripts use built-in Node.js modules only.

## Step 2: Configure MCP Servers

### Airtable MCP (required)
Get an Airtable Personal Access Token. Grant it `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write` scopes.

### DataForSEO MCP (recommended)
Configure for AI Overview spot-checks and keyword data. Without it, the audit skips the AI Overview evidence section.

## Step 3: Set Up the Prospecting Base

Create an Airtable base for prospecting. This is shared across all prospects. You only do this once.

Create three tables:

**Prospects:**
- Brand Name (single line text, primary)
- Domain (URL)
- Contact (single line text)
- Business Type (single select: local business, SaaS, e-commerce, publisher, professional services)
- Status (single select: audited, pitched, converted, passed)
- Audit Date (date)
- Notes (long text)

**Audit Results:**
- Run ID (single line text, primary)
- Prospect (linked record to Prospects)
- GEO Score (number)
- Citability Score (number)
- Brand Authority Score (number)
- EEAT Score (number)
- Technical Score (number)
- Schema Score (number)
- Pages Analyzed (number)
- Report URL (URL)
- Run Date (date)
- Summary (long text)

**Page Scores:**
- Page URL (URL, primary)
- Audit Result (linked record to Audit Results)
- Page Title (single line text)
- Citability Score (number)
- Grade (single select: A, B, C, D, F)
- Block Count (number)
- Blocks Above 70 (number)
- Top Issue (single line text)
- Schema Types Found (single line text)
- Page Type (single select: article, homepage, local_business)

Then run `/setup` with the base ID to configure CitationScope.

## Step 4: Run Your First Audit

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
7. Generate HTML report
8. Save results to the prospecting base

## Step 5: Convert a Prospect to a Client

When a prospect signs up after seeing the audit:

```
/onboard "Brand Name"
```

This will:
1. Create a new Airtable base for the client (or use a template)
2. Run a light brand interview (voice, products, messaging)
3. Import their post URLs from the prospecting base
4. Score every post for citability
5. Write the brand profile locally

## Step 6: Restructure Their Content

```
/restructure
```

This will:
1. Load the brand profile
2. Prioritize posts by Google ranking and citability gap
3. Rewrite each post for citability using the brand's voice
4. Generate schema JSON-LD for each post
5. Save restructured content to the client's Airtable base
6. Score the restructured version to prove improvement

The client reviews in Airtable and publishes to their own platform.

## Test Scripts Individually

Each script works standalone:

```bash
node tools/citability_scorer.js https://example.com/blog-post
node tools/crawler_checker.js example.com
node tools/schema_checker.js https://example.com
```

All return JSON to stdout.
