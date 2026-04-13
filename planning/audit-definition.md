# CitationScope Audit — Full Service Definition

**Last updated:** 2026-04-13
**Status:** Design complete, building

---

## What It Is

A point-in-time diagnostic that tells a brand whether their website content is structured for AI citation. Scores the site on citability, crawler access, schema markup, brand authority, and E-E-A-T. Prescribes specific structural fixes for existing content.

## The Problem It Solves

Brands have invested in content. Blog posts, service pages, guides. They rank in Google. But AI search is growing (527% YoY traffic increase, 4.4x higher conversion than organic). AI platforms need to extract quotable passages from web content to cite them. Most content isn't structured for this extraction.

The audit answers: "Can AI cite your content? If not, why not? And what exactly do you change?"

## The Value Proposition

"You have N blog posts. They rank in Google. But AI platforms can't cite them because they're not structured for extraction. We scored your content and found the specific structural reasons why. Here's how to fix each post without creating anything new."

This reframes the problem: the client doesn't need NEW content. They need to RESTRUCTURE existing content. That's faster, cheaper, and higher impact.

---

## GEO Score (0-100)

| Category | Weight | What It Measures |
|----------|--------|------------------|
| AI Citability | 30% | Content block structure, answer-first patterns, self-containment, specificity |
| Brand Authority | 20% | Presence on YouTube, Reddit, Wikipedia, LinkedIn, industry platforms |
| Content E-E-A-T | 20% | Author attribution, about page quality, source citations, freshness, credentials |
| Technical GEO | 15% | AI crawler access (robots.txt for 14 crawlers), llms.txt, JS rendering |
| Schema & Structured Data | 15% | JSON-LD quality, page-type-appropriate schema, missing opportunities |

### Score Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | Excellent | Content is highly likely to be cited by AI |
| 75-89 | Good | Strong foundation with room for improvement |
| 60-74 | Fair | Significant optimization opportunities |
| 40-59 | Poor | AI systems struggle to cite this content |
| 0-39 | Critical | Largely invisible to AI systems |

---

## Citability Scoring (Per Content Block)

Each page is split into content blocks at H2/H3 headings. Each block is scored independently.

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| Answer Block Quality | 30% | Does the passage open with a direct answer? Definition patterns, answer-first structure, quantified answers. |
| Self-Containment | 25% | Can the passage be extracted without context? Low pronoun density, named entities, optimal length (134-167 words). |
| Structural Readability | 20% | Heading hierarchy, question-based headings, short paragraphs, lists and tables. |
| Specificity Density | 15% | Brand-appropriate specific details. NOT fabricated statistics. Product names, measurements, process details, real numbers from the brand's own data. |
| Uniqueness Signals | 10% | Original data, case studies, first-hand experience, proprietary insights. |

### Optimal Passage Characteristics (from research)

- Optimal length for AI citation: 134-167 words
- Definition patterns increase citation rate by 2.1x
- Adding specific data increases citation by 40%
- Content with source citations is cited 20-25% more often by Perplexity and ChatGPT
- Self-contained passages (extractable without context) are strongly preferred

### Grades

| Grade | Score | Label |
|-------|-------|-------|
| A | 80+ | Highly Citable |
| B | 65-79 | Good Citability |
| C | 50-64 | Moderate Citability |
| D | 35-49 | Low Citability |
| F | <35 | Poor Citability |

---

## Business Type Adaptation

The audit adjusts based on business type:

| Business Type | Specificity Signals | Authority Platforms | Schema Focus |
|---------------|--------------------|--------------------|--------------|
| Local business | Product names, warranty terms, service area, cost ranges | Reddit local subs, Yelp, BBB, Google Reviews | LocalBusiness, FAQ, Service |
| SaaS/tech | Feature names, integrations, performance metrics, user counts | GitHub, Hacker News, ProductHunt, Stack Overflow | Organization, SoftwareApplication, FAQ |
| E-commerce | Product dimensions, materials, price points, comparison specs | YouTube reviews, Reddit, industry forums | Product, AggregateRating, Offer |
| Publisher | Timeliness, source citations, methodology, original data | Wikipedia citations, LinkedIn, industry press | Article, Person (author), ClaimReview |
| Professional services | Case outcomes, client counts, methodology names, credentials | LinkedIn, industry associations, press | Organization, Person, Service |
| Food/lifestyle | Temperatures, times, measurements, ingredient specifics | YouTube, Pinterest, Reddit, food forums | Recipe, HowTo, Article |

---

## Audit Flow

### Input
- Domain URL
- Optional: business type (auto-detected if not provided)
- Optional: list of specific pages to audit

### Step 1: Page Discovery
Auto-detect key pages from sitemap or homepage links:
- Blog posts (prioritize by Google ranking if keyword data available)
- Service/product pages with substantive content
- Homepage (schema/technical check only, not citability scored)

Present page list to operator for approval before crawling.

### Step 2: Crawler Access Check
Run `crawler_checker.js` on the domain. One call covers:
- robots.txt analysis for 14 AI crawlers (3 tiers)
- llms.txt presence and quality
- Meta robots tags on homepage
- JavaScript rendering assessment
- Sitemap accessibility

### Step 3: Schema Audit
Run `schema_checker.js` on each page. Page-type-aware scoring:
- Homepage scored against Organization/WebSite expectations
- Blog posts scored against Article/FAQ expectations
- Service pages scored against LocalBusiness/Service expectations

### Step 4: Citability Scoring
Run `citability_scorer.js` on blog posts and service pages (NOT homepage).
- Score each content block on 5 dimensions
- Identify top and bottom blocks with examples
- Calculate page averages and site-wide average
- Flag all blocks scoring below 50

### Step 5: AI Overview Spot-Check
For the client's top 5-10 keywords (from DataForSEO ranked keywords):
- Run Google SERP query via DataForSEO
- Check: does an AI Overview appear?
- If yes: who gets cited? Is the client cited?
- This is the proof layer. Connects citability scores to visible consequences.

### Step 6: Brand Authority Assessment
Search for brand presence on:
- YouTube (channel, third-party mentions, view counts)
- Reddit (subreddit discussions, sentiment, recommendation threads)
- Wikipedia/Wikidata (entity recognition)
- LinkedIn (company page, follower count, employee thought leadership)
- Industry platforms (BBB, Yelp, Angi, industry-specific)

### Step 7: E-E-A-T Assessment
Evaluate:
- Author attribution on content pages (Person with bio, or missing?)
- About page quality (real business story, or generic/missing?)
- Source citations in content
- Content freshness (when was the blog last updated?)
- Credentials and trust signals (years in business, certifications, reviews)

### Step 8: Compute GEO Score
Weighted average per the formula above. Classify issues by severity (critical, high, medium, low).

### Step 9: Generate Report
HTML report with CitationScope branding:
1. Executive Summary: GEO Score, key strengths, critical gaps
2. Score Breakdown: all 5 categories with weighted contributions
3. Citability Analysis: average score, grade distribution, top/bottom blocks with examples
4. AI Overview Evidence: keyword-by-keyword showing who gets cited
5. Crawler Access: which AI crawlers can reach the site
6. Schema Audit: what's present, what's missing, JSON-LD templates to add
7. Brand Authority: platform presence map
8. E-E-A-T Assessment: per-dimension scores
9. Restructuring Roadmap: prioritized list of content to fix, with specific rewrite examples
10. Quick Wins: 5 things to fix this week

### Step 10: Generate llms.txt
Create an llms.txt file for the client as a deliverable.

---

## Two Modes

### Full Audit
- All discovered pages (10-15)
- All 4 AI platforms in spot-check
- Full brand authority scan
- Full E-E-A-T assessment
- Complete HTML report with restructuring roadmap
- Generated llms.txt
- Estimated API cost: $3-8

### Snapshot
- 3 pages (homepage + 2 top blog posts)
- 3 keyword AI Overview spot-check
- Basic brand authority (YouTube + Reddit only)
- Abbreviated report
- Estimated API cost: $1-2
- Use case: lead generation, quick prospect assessment

---

## Service Tiers (for selling the audit)

| Tier | What | Price Range |
|------|------|-------------|
| Snapshot (free/lead gen) | 3-page snapshot, abbreviated report | Free or $50 |
| Full Audit | 10-15 pages, full report, restructuring roadmap, llms.txt | $500-1,500 |
| Audit + Top 10 Restructure | Full audit + rewrite the 10 highest-value posts | $1,500-3,000 |
| Full Library Restructure | Audit + rewrite all posts | $5,000-15,000 |
| Ongoing Optimization | Monthly batch of restructured posts + new AI-structured content | $2,000-4,000/mo |

---

## Scripts

### citability_scorer.js
- **Input:** URL
- **Process:** Fetch page, parse HTML, extract content blocks at headings, score each on 5 dimensions
- **Output:** JSON with per-block scores, page average, grade distribution, top/bottom blocks
- **Refinements needed:** Rename "Statistical Density" to "Specificity Density", add brand-type parameter

### crawler_checker.js
- **Input:** Domain
- **Process:** Fetch robots.txt, check 14 AI crawlers in 3 tiers, fetch llms.txt, check meta tags
- **Output:** JSON with per-crawler access, tier scores, llms.txt assessment, composite score

### schema_checker.js
- **Input:** URL
- **Process:** Fetch HTML, extract JSON-LD and microdata, classify types, check completeness
- **Output:** JSON with schema types found, validation, missing opportunities, page-type-aware score
- **Page types supported:** article, homepage, local_business (auto-detected)

---

## References

- geo-seo-claude: github.com/zubair-trabzada/geo-seo-claude (citability scoring approach)
- Georgia Tech / Princeton / IIT Delhi 2024 GEO study (optimal passage characteristics)
- Ahrefs December 2025 brand mention study (YouTube ~0.737 correlation)
- Originality.ai 2025 study (35% of top 1,000 sites block AI crawlers)
