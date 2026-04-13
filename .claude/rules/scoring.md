# Scoring Conventions

## Specificity, Not Statistics

The citability scorer measures brand-appropriate specificity. It does not require fabricated statistics.

What counts as specific depends on the business type:
- Local business: product names, model numbers, warranty terms, cost ranges
- SaaS: feature names, integration counts, performance metrics
- Food/lifestyle: temperatures, times, measurements
- E-commerce: product dimensions, materials, price points
- Professional services: case outcomes, methodology names, credentials

Never generate fake statistics to fill a scoring gap. Real specificity from the brand's own data is always better.

## Page Type Awareness

Schema scoring adjusts based on detected page type:
- Article pages are not penalized for missing LocalBusiness schema
- Homepage is not penalized for missing Article schema
- Service pages are scored against their appropriate expectations

## Em Dash Usage

Reduce em dash usage in all generated reports and recommendations. LLMs overuse them. Use periods, commas, or colons instead.
