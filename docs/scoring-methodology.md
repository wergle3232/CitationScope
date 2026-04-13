# CitationScope Scoring Methodology

## GEO Score (0-100)

The composite score that represents a website's readiness for AI citation.

| Category | Weight | Source |
|----------|--------|--------|
| AI Citability | 30% | Average of per-page citability scores |
| Brand Authority | 20% | Platform presence (YouTube, Reddit, Wikipedia, LinkedIn) |
| Content E-E-A-T | 20% | Author attribution, credentials, freshness, trust signals |
| Technical GEO | 15% | AI crawler access, llms.txt, JS rendering |
| Schema & Structured Data | 15% | JSON-LD quality and completeness per page type |

## Citability Scoring (Per Content Block)

Each page is split into content blocks at H2/H3 headings. Each block is scored on 5 dimensions.

### Answer Block Quality (30%)

Does the passage open with a direct answer that AI can extract?

**High scoring patterns:**
- Definition: "X is [definition]." or "X refers to [explanation]."
- Answer-first: the core answer appears in the first 60 words
- Question-based heading followed by direct answer
- Clear, short sentences (5-25 words each)
- Quotable claims with named sources

**Low scoring patterns:**
- Build-up openings: "If you've ever wondered..." or "Before we dive in..."
- Answer buried in the middle or end of the passage
- Narrative-driven without a clear extractable answer

### Self-Containment (25%)

Can the passage be extracted without surrounding context?

**Optimal:** 134-167 words. This is the length range most frequently cited by AI platforms (based on Georgia Tech/Princeton/IIT Delhi 2024 research).

**Scoring factors:**
- Word count (134-167 optimal, 100-200 good, <80 or >400 poor)
- Pronoun density (fewer pronouns = more self-contained)
- Named entities (proper nouns, brand names, product names)

### Structural Readability (20%)

Is the content structured for parsing?

- Clean heading hierarchy (H1 > H2 > H3, no skipped levels)
- Short paragraphs (2-4 sentences)
- Tables for comparisons
- Lists for sequential steps or feature sets
- Question-based headings that match search queries

### Specificity Density (15%)

Does the content contain specific, verifiable details?

**This is NOT "Statistical Density."** The dimension measures brand-appropriate specificity, not just percentages and dollar amounts.

| Business Type | What Counts as Specific |
|---------------|------------------------|
| Local business | Product names, model numbers, warranty terms, service area, cost ranges, years experience |
| SaaS/tech | Feature names, integration counts, performance metrics, API specifics |
| Food/lifestyle | Temperatures, times, measurements, ingredient specifics, technique names |
| E-commerce | Product dimensions, materials, price points, comparison specs |
| Professional services | Case outcomes, client counts, methodology names, credentials |

**Never fabricate statistics.** If a real number doesn't exist, be specific through product names, concrete examples, and clear instructions instead.

### Uniqueness Signals (10%)

Does the content provide information AI can't find elsewhere?

- Original research or data ("Our analysis found...")
- Case studies with specific outcomes
- First-hand experience indicators
- Proprietary frameworks or methodologies
- Specific tool/product mentions from practice

## Brand Authority Scoring

| Platform | Weight | Why |
|----------|--------|-----|
| YouTube | 25% | Strongest correlation with AI citation (~0.737) |
| Reddit | 25% | Critical for recommendations; heavily indexed in AI training data |
| Wikipedia/Wikidata | 20% | Foundation for AI entity recognition |
| LinkedIn | 15% | Professional authority signals |
| Other (BBB, Yelp, industry forums, news) | 15% | Supplementary authority signals |

## Schema Scoring (Page-Type-Aware)

The schema checker detects the page type and scores against appropriate expectations:

| Page Type | Critical Schema | Important Schema |
|-----------|----------------|-----------------|
| Homepage | Organization, WebSite | BreadcrumbList, FAQ |
| Blog post | Article, Organization | BreadcrumbList, FAQ |
| Local business page | LocalBusiness, Organization | FAQ, BreadcrumbList, WebSite |

An article page is not penalized for missing LocalBusiness schema. A homepage is not penalized for missing Article schema.

## Calibration Notes

Scoring should be calibrated so that:
- A genuinely well-structured, specific, authoritative article scores B or above
- A typical corporate blog post (vague, no stats, build-up openings) scores C or D
- A thin page with minimal content scores F
- No page should score A without having real specificity and self-contained answer blocks
