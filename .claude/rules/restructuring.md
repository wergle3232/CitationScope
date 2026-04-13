# Restructuring Principles

## What Restructuring Is

Restructuring is NOT rewriting from scratch. The original content has expertise, brand knowledge, and Google ranking equity. The restructuring preserves the topic, the expertise, and the brand voice. It changes the STRUCTURE so AI platforms can extract quotable passages.

## The Three Fixes

Every restructured post addresses these three structural problems:

### 1. Answer-First Openings
Each H2 section must open with 1-2 sentences that directly answer the section's implied question. The answer comes first, the explanation follows.

**Before:** "If you've ever wondered why your windows get foggy in the winter, you're not alone. Many homeowners experience this frustrating problem."
**After:** "Window condensation forms when warm indoor air hits the cold surface of the glass. The most effective fix is keeping indoor humidity between 30-40% using a dehumidifier or improving ventilation."

### 2. Brand-Specific Details
Replace vague claims with the brand's actual data. Use their product names, specs, years of experience, process details, and real numbers.

**Before:** "Our windows are energy efficient and can save you money."
**After:** "OKNA HeatShield windows are rated at .24 U-Factor, which is 18% more efficient than the .30 required for the federal tax credit. Most homeowners notice lower heating bills the first winter after installation."

### 3. Self-Contained Sections
Each section should make sense on its own. Name subjects explicitly instead of using pronouns. A reader (or AI) landing on any section should understand the topic without reading what came before.

## What NOT to Change

- The core topic and expertise of the post
- The brand's voice and tone
- Claims that are accurate and specific already
- Sections that already score C or above on citability
- The URL or slug (preserve Google ranking equity)

## Schema Markup

Every restructured post gets:
- Article or BlogPosting JSON-LD with Person author
- FAQPage JSON-LD if 3+ question-based headings exist
- HowTo JSON-LD if the post is step-by-step
- BreadcrumbList if the post has a parent category

## Quality Check

After restructuring, run citability_scorer.js on the result. The restructured version should score at least 15 points higher than the original. If it doesn't, the restructuring didn't go far enough.
