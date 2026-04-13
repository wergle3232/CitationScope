# /restructure — Rewrite Posts for AI Citability

**Status:** Planned. Scores and rewrites existing blog posts and service pages for AI citability using the client's brand profile.

**Arguments:** $ARGUMENTS

Parse arguments:
- `(no args)` — Process all queued posts
- `[number]` — Process the top N priority posts
- `[url]` — Restructure a specific post

## TODO: Build out

Flow:
1. Load brand/profile.md for voice, products, messaging
2. Load config/client.json for Airtable base and table IDs
3. Load posts from Airtable Posts table
4. If no posts are scored yet, run citability_scorer.js on all
5. Prioritize by: Google rank (higher rank = higher priority) + citability gap (lower score = more room for improvement)
6. Present prioritized list to operator for approval
7. For each post:
   a. Fetch original content
   b. Spawn post-restructurer agent with original content + brand profile
   c. Agent rewrites with citability structure
   d. Agent generates schema JSON-LD (Article, FAQ, HowTo as appropriate)
   e. Run citability_scorer.js on restructured version
   f. Save to Airtable: restructured content, new score, schema, status update
   g. Display before/after score
8. Display summary: posts restructured, average score improvement
