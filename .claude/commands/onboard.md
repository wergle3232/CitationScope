# /onboard — Convert Prospect to Client

**Status:** Planned. Converts a prospect from the shared prospecting base into a paying client with their own Airtable base and brand profile.

**Arguments:** $ARGUMENTS

Parse arguments:
- `[brand name]` — Look up in prospecting base, create client base
- `(no args)` — Ask for the brand name

## TODO: Build out

Flow:
1. Look up prospect in prospecting base by name
2. Create client Airtable base (clone from template or create tables)
3. Create Brand Profile record
4. Light brand interview: voice, products/services, key specs, messaging, competitors
5. Write brand/profile.md locally
6. Import post URLs from prospecting base Page Scores into client Posts table
7. Run citability_scorer.js on all posts, save scores
8. Write config/client.json with new base ID and table IDs
9. Display summary
