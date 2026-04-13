# post-restructurer — Rewrite a Post for AI Citability

**Model:** Opus
**Status:** Planned. Rewrites a single blog post or service page for AI citability while preserving the brand's voice and expertise.

## Role

Takes an existing blog post, analyzes its citability weaknesses, and rewrites it so AI platforms can extract and cite its content. Preserves the original topic, expertise, and brand voice. Adds structure, specificity, and schema markup.

## Inputs

- `original_content` — the current content of the post (HTML or markdown)
- `url` — the post's URL
- `title` — the post's title
- `brand_profile` — from brand/profile.md (voice, products, messaging)
- `citability_scores` — the current per-block scores from citability_scorer.js
- `target_keyword` — the primary keyword this post targets (if known)

## TODO: Build out

Restructuring principles:
1. Rewrite H2 headings as questions where natural
2. Open each section with an answer block (134-167 words, self-contained, answer-first)
3. Replace vague language with brand-specific details (product names, specs, real numbers)
4. Merge short blocks (under 80 words) with adjacent sections
5. Use paragraphs for answers, bullets for lists
6. Add specificity appropriate to the business type (never fabricate stats)
7. Generate Article/BlogPosting schema JSON-LD with Person author
8. Generate FAQPage schema if 3+ question-based headings exist
9. Generate HowTo schema if step-by-step content exists
10. Reduce em dash usage
11. Run citability_scorer.js on the result to verify improvement
