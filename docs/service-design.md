# CitationScope Service Design

## The Problem

Brands invest in content. Blog posts, service pages, guides. They rank in Google. But AI search is growing (527% YoY traffic increase, 4.4x higher conversion than organic). AI platforms need to extract quotable passages to cite them. Most content isn't structured for extraction.

Free audit tools (Semrush, Ahrefs, SE Ranking) check technical health: page speed, broken links, meta tags. That's a solved problem. Nobody needs another tool that checks robots.txt.

## The Differentiator

CitationScope scores the actual content. It answers: "Can AI quote this page?" Not "is this page technically healthy?"

The finding that resonates: "You have 200 blog posts. They rank in Google. Zero are structured for AI citation. Here's exactly why, and here's how to fix each one."

## Why This Works as a Service

1. **The content already exists.** The client doesn't need to create anything new. They need to restructure what they have.
2. **It's measurable.** Citability score goes from D to B on each post. Before/after is provable.
3. **It's faster than content creation.** Restructuring takes a fraction of the time of writing from scratch.
4. **Google benefits too.** Everything that makes content citable by AI (answer-first, specific, self-contained sections, FAQ schema) also earns featured snippets, AI Overviews, and better traditional rankings.
5. **The proof is visible.** Clients can search their own keywords in Google and see the AI Overview citing competitors.

## The Full Service: Diagnose Then Treat

CitationScope is not just an audit tool. It's audit plus restructuring.

### Phase 1: Audit (Diagnose)
- Run on any domain, no setup needed
- Score content for citability, check crawlers, check schema, spot-check AI Overviews
- Produce a client-ready report with GEO Score
- All results saved to the shared prospecting base
- This is the sales tool. Run 3-5 per day on prospects.

### Phase 2: Restructure (Treat)
- Client signs up after seeing the audit findings
- Light brand onboard: capture voice, products, messaging (not full topic/keyword discovery)
- Score all their blog posts and service pages
- Prioritize by Google ranking and citability gap
- Rewrite each post with citability structure using their brand details
- Deliver restructured content with schema markup
- Client publishes to their own platform (we don't need CMS access)

## Data Model: Two Tiers

### Prospecting Base (one base, all prospects)
Configured once. Every audit writes here. This is your sales pipeline.

**Tables:**

| Table | Fields | Purpose |
|-------|--------|---------|
| Prospects | Brand Name, Domain, Contact, Status (audited/pitched/converted/passed), Business Type, Audit Date, Notes | Track every brand you audit |
| Audit Results | Linked Prospect, GEO Score, Citability Score, Brand Authority Score, E-E-A-T Score, Technical Score, Schema Score, Report URL, Run Date | One record per audit run |
| Page Scores | Linked Audit Result, URL, Page Title, Citability Score, Grade, Block Count, Blocks Above 70, Top Issue, Schema Types Found | One record per page audited |

Status flow for Prospects: `audited` > `pitched` > `converted` or `passed`

### Client Base (one base per paying client)
Created when a prospect converts. Contains their brand identity and the restructuring pipeline.

**Tables:**

| Table | Fields | Purpose |
|-------|--------|---------|
| Brand Profile | Brand Name, Domain, Voice & Tone, Audience, Products & Services, Key Specs, Competitors, Visual Identity | Single record. What the writer needs to restructure in their voice. |
| Posts | URL, Title, Status, Original Content, Restructured Content, Schema JSON-LD, Current Citability Score, New Citability Score, Google Rank, Target Keyword, Priority, Notes, Date Scored, Date Restructured | One record per blog post or service page |

Status flow for Posts: `discovered` > `scored` > `queued` > `in progress` > `restructured` > `in review` > `delivered`

## Operational Flow

### Daily Prospecting (Phase 1)
```
Morning: pick 3-5 prospects
  /audit example1.com        --> scores saved to prospecting base
  /audit example2.com        --> scores saved to prospecting base
  /audit example3.com        --> scores saved to prospecting base

Each audit: ~15-20 min, ~$3-8 API cost
Each produces: HTML report ready to share

Afternoon: pitch the most compelling findings
  "You have 150 posts. Zero citable. Your competitor is in AI Overviews for 6 of your keywords."
```

### Client Engagement (Phase 2)
```
Day 1:
  /onboard "Aspen Home Improvements"
    --> creates client Airtable base
    --> brand interview (voice, products, messaging)
    --> imports all blog post URLs
    --> scores every post for citability

Day 2-5:
  /restructure
    --> prioritizes posts (by Google rank + citability gap)
    --> rewrites top priority posts with brand voice + citability structure
    --> generates schema JSON-LD for each
    --> saves to Airtable for review

Day 5+:
  Client reviews in Airtable
  Client publishes to their own website
  Before/after citability scores prove the improvement
```

## Service Tiers

| Tier | What | Price Range |
|------|------|-------------|
| **Snapshot** (lead gen) | 3 pages scored, abbreviated report, 3-keyword AI Overview check | Free or $50 |
| **Full Audit** | 10-15 pages, full GEO Score report, restructuring roadmap, llms.txt | $500-1,500 |
| **Audit + Top 10 Restructure** | Full audit + rewrite the 10 highest-ranking posts for citability | $1,500-3,000 |
| **Full Library Restructure** | Audit + rewrite all posts for citability | $5,000-15,000 |
| **Ongoing Optimization** | Monthly batch of restructured posts + new AI-structured content | $2,000-4,000/mo |

## Target Clients

### Best Fit
- Companies with 50+ existing blog posts that rank in Google
- Marketing teams that have invested in content but see flat or declining AI presence
- Businesses in competitive categories where AI Overviews are appearing
- Companies with custom or unusual CMS platforms (they can't use AI publishing tools, but we don't need CMS access)

### Not a Fit
- Companies with no existing content (they need creation, not restructuring. Refer to ContentEngine.)
- Companies not ranking in Google at all (fix traditional SEO first)
- Companies in categories with no AI Overview presence yet

## The Pitch Variations

**For the marketing director:**
"Your content works for Google. It doesn't work for AI search. We scored your blog and found that zero posts are structured for AI citation. The fix doesn't require new content. We restructure what you have."

**For the business owner:**
"When someone asks ChatGPT about [their category], your competitors show up and you don't. We found out why and we can fix it."

**For the SEO consultant:**
"Your client ranks for 1,000+ keywords. AI Overviews are appearing for 73% of those keywords. Your client is cited in zero of them. Here's the structural gap and the fix."

## Upgrade Path to ContentEngine

CitationScope restructuring leads naturally to ContentEngine:

1. "We fixed your 200 posts. Now let's create new content that's AI-structured from the start." (ContentEngine /plan + /write)
2. "Let's track whether your restructured content is getting cited." (ContentEngine /visibility)
3. "Let's build a content strategy around the topics where you have the biggest gaps." (ContentEngine /research + /plan)
4. "Let's publish directly to your platforms." (ContentEngine /publish)

CitationScope is the entry point. ContentEngine is the ongoing relationship.
